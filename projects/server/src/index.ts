import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { eq, and, desc } from "drizzle-orm";
import { config } from "./config";
import { db, schema } from "./db";
import { seed } from "./db/seed";
import { chatWithAsui, chatWithNpc, type ChatMessage } from "./services/agent";
import { optionalAuth } from "./middleware/auth";
import { validate, loginSchema, updateUserSchema, chatSchema, npcChatSchema } from "./middleware/validate";
import { afterCheckin, getConsecutiveDays } from "./services/engine";

const app = express();
const port = config.port;

// ── 上传目录 ──
const uploadsDir = path.join(import.meta.dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── 健康检查 ──
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ==================== 认证 ====================

// 注册 / 登录（手机号 + 昵称）
app.post("/api/v1/auth/login", validate(loginSchema), (req, res) => {
  const { phone, name } = req.body;
  if (!phone?.trim()) {
    return res.status(400).json({ error: "手机号不能为空" });
  }

  // 查找或创建用户
  let user = db.select().from(schema.users).where(eq(schema.users.id, phone)).get();

  if (!user) {
    const now = new Date().toISOString();
    db.insert(schema.users).values({
      id: phone,
      name: name?.trim() || `旅行者${phone.slice(-4)}`,
      avatar: "",
      level: 1,
      exp: 0,
      created_at: now,
    }).run();
    user = db.select().from(schema.users).where(eq(schema.users.id, phone)).get()!;
  }

  // 生成 token
  const token = uuidv4();
  db.insert(schema.authTokens).values({
    user_id: phone,
    token,
    created_at: new Date().toISOString(),
  }).run();

  res.json({ token, user });
});

// 登出
app.post("/api/v1/auth/logout", (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    db.delete(schema.authTokens).where(eq(schema.authTokens.token, header.slice(7))).run();
  }
  res.json({ ok: true });
});

// 所有业务路由使用可选认证（向后兼容）
app.use("/api/v1/", optionalAuth);

// ==================== 用户 ====================

app.get("/api/v1/user/me", (req, res) => {
  const user = db.select().from(schema.users).where(eq(schema.users.id, req.userId!)).get();
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.put("/api/v1/user/me", validate(updateUserSchema), (req, res) => {
  const { name, avatar } = req.body;
  db.update(schema.users).set({
    ...(name ? { name } : {}),
    ...(avatar ? { avatar } : {}),
  }).where(eq(schema.users.id, req.userId!)).run();
  const user = db.select().from(schema.users).where(eq(schema.users.id, req.userId!)).get();
  res.json(user);
});

// ==================== 区域 ====================

app.get("/api/v1/regions", (_req, res) => {
  const regions = db.select().from(schema.regions).all();
  res.json(regions);
});

// ==================== 锚点 ====================

app.get("/api/v1/anchors", (req, res) => {
  const allAnchors = db.select().from(schema.anchors).all();
  const userProgress = db.select().from(schema.userAnchors)
    .where(eq(schema.userAnchors.user_id, req.userId!)).all();
  const progressMap = new Map(userProgress.map(p => [p.anchor_id, p]));

  const result = allAnchors.map(a => ({
    ...a,
    unlocked: progressMap.get(a.id)?.unlocked ?? false,
    checked: progressMap.get(a.id)?.checked ?? false,
  }));
  res.json(result);
});

app.get("/api/v1/anchors/:regionId", (req, res) => {
  const { regionId } = req.params;
  const regionAnchors = db.select().from(schema.anchors)
    .where(eq(schema.anchors.region_id, regionId)).all();
  const userProgress = db.select().from(schema.userAnchors)
    .where(eq(schema.userAnchors.user_id, req.userId!)).all();
  const progressMap = new Map(userProgress.map(p => [p.anchor_id, p]));

  const result = regionAnchors.map(a => ({
    ...a,
    unlocked: progressMap.get(a.id)?.unlocked ?? false,
    checked: progressMap.get(a.id)?.checked ?? false,
  }));
  res.json(result);
});

// ==================== 打卡 ====================

app.get("/api/v1/checkins", (req, res) => {
  const userCheckins = db.select().from(schema.checkins)
    .where(eq(schema.checkins.user_id, req.userId!))
    .orderBy(desc(schema.checkins.created_at)).all();
  res.json(userCheckins);
});

app.get("/api/v1/checkins/:date", (req, res) => {
  const { date } = req.params;
  const dayCheckins = db.select().from(schema.checkins)
    .where(and(
      eq(schema.checkins.user_id, req.userId!),
      eq(schema.checkins.created_at, date),
    )).all();
  res.json(dayCheckins);
});

app.post("/api/v1/checkins", upload.single("image"), (req, res) => {
  const { anchor_id, location, latitude, longitude } = req.body;

  // 查找锚点
  const anchor = db.select().from(schema.anchors).where(eq(schema.anchors.id, anchor_id)).get();
  if (!anchor) {
    return res.status(404).json({ error: "锚点不存在" });
  }

  // GPS 距离验证（50m 阈值）
  if (latitude !== undefined && longitude !== undefined) {
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      const dist = haversineDistance(userLat, userLng, anchor.latitude, anchor.longitude);
      const MAX_DISTANCE = parseFloat(process.env.CHECKIN_MAX_DISTANCE || "50");
      if (dist > MAX_DISTANCE) {
        return res.status(400).json({
          error: `距离锚点太远（${Math.round(dist)}m > ${MAX_DISTANCE}m）`,
          distance: Math.round(dist),
        });
      }
    }
  }

  const filename = req.file?.filename;
  const image_url = filename ? `${config.origin}/uploads/${filename}` : "";
  const today = new Date().toISOString().split("T")[0];

  const newCheckin = {
    id: Date.now().toString(),
    anchor_id,
    user_id: req.userId!,
    image_url,
    created_at: today,
    location: location || "",
  };

  db.insert(schema.checkins).values(newCheckin).run();

  // 更新锚点打卡状态
  const existing = db.select().from(schema.userAnchors)
    .where(and(
      eq(schema.userAnchors.user_id, req.userId!),
      eq(schema.userAnchors.anchor_id, anchor_id),
    )).get();

  if (existing) {
    db.update(schema.userAnchors).set({ checked: true })
      .where(eq(schema.userAnchors.id, existing.id)).run();
  } else {
    db.insert(schema.userAnchors).values({
      user_id: req.userId!, anchor_id, checked: true, unlocked: true,
    }).run();
  }

  // 触发业务引擎：任务进度、成就、区域解锁
  try {
    afterCheckin(req.userId!, anchor_id);
  } catch (e) {
    console.error("Engine error:", e);
  }

  res.status(201).json(newCheckin);
});

// 替换打卡照片
app.put("/api/v1/checkins/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const checkin = db.select().from(schema.checkins).where(eq(schema.checkins.id, id)).get();
  if (!checkin) return res.status(404).json({ error: "打卡记录不存在" });

  const filename = req.file?.filename;
  if (!filename) return res.status(400).json({ error: "请选择图片" });

  const image_url = `${config.origin}/uploads/${filename}`;
  db.update(schema.checkins).set({ image_url }).where(eq(schema.checkins.id, id)).run();
  res.json({ ...checkin, image_url });
});

// ==================== 文件上传 ====================

app.post("/api/v1/upload", upload.single("image"), (req, res) => {
  const filename = req.file?.filename;
  if (!filename) return res.status(400).json({ error: "请选择图片" });
  res.json({ url: `${config.origin}/uploads/${filename}` });
});

// ==================== 任务 ====================

app.get("/api/v1/quests/main", (req, res) => {
  const userId = req.userId!;
  const quests = db.select().from(schema.mainQuests).all();
  const result = quests.map(q => {
    const up = db.select().from(schema.userMainQuestProgress)
      .where(and(
        eq(schema.userMainQuestProgress.user_id, userId),
        eq(schema.userMainQuestProgress.quest_id, q.id),
      )).get();
    return {
      ...q,
      progress: up?.progress ?? 0,
      status: up?.status ?? q.status,
    };
  });
  res.json(result);
});

app.get("/api/v1/quests/side", (req, res) => {
  const userId = req.userId!;
  const quests = db.select().from(schema.sideQuests).all();
  const result = quests.map(q => {
    const up = db.select().from(schema.userSideQuestProgress)
      .where(and(
        eq(schema.userSideQuestProgress.user_id, userId),
        eq(schema.userSideQuestProgress.quest_id, q.id),
      )).get();
    return {
      ...q,
      progress: up?.progress ?? 0,
      status: up?.status ?? q.status,
      locations: JSON.parse(q.locations || "[]"),
    };
  });
  res.json(result);
});

// ==================== 成就 ====================

app.get("/api/v1/achievements", (_req, res) => {
  const all = db.select().from(schema.achievements).all();
  res.json(all);
});

// ==================== AI 对话 ====================

app.get("/api/v1/chat/history", (req, res) => {
  const userId = req.userId!;
  const history = db.select().from(schema.chatHistory)
    .where(eq(schema.chatHistory.user_id, userId))
    .orderBy(desc(schema.chatHistory.created_at))
    .limit(40).all();
  res.json(history.reverse().map(h => ({
    id: String(h.id),
    role: h.role,
    content: h.content,
    created_at: h.created_at,
  })));
});

app.post("/api/v1/chat", validate(chatSchema), async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    const userId = req.userId!;

    // 从数据库加载最近 20 条对话历史
    const dbHistory = db.select().from(schema.chatHistory)
      .where(eq(schema.chatHistory.user_id, userId))
      .orderBy(desc(schema.chatHistory.created_at))
      .limit(20).all();
    const history: ChatMessage[] = dbHistory.reverse().map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }));

    const userContext = {
      userName: context?.userName || "旅行者",
      currentRegion: context?.currentRegion || "越秀·五羊圣地",
      nearestAnchor: context?.nearestAnchor,
      questProgress: context?.questProgress || "主线第一幕·进行中",
      unlockedRegions: context?.unlockedRegions || ["越秀"],
      recentCheckins: context?.recentCheckins || [],
      consecutiveDays: context?.consecutiveDays || 0,
      timeOfDay: context?.timeOfDay || getTimeOfDay(),
    };

    const reply = await chatWithAsui(message, userContext, history);

    // 持久化对话到数据库
    const now = new Date().toISOString();
    db.insert(schema.chatHistory).values({ user_id: userId, role: "user", content: message, created_at: now }).run();
    db.insert(schema.chatHistory).values({ user_id: userId, role: "assistant", content: reply, created_at: now }).run();

    // 保留最近 20 条（删除旧记录）
    const allHistory = db.select({ id: schema.chatHistory.id })
      .from(schema.chatHistory)
      .where(eq(schema.chatHistory.user_id, userId))
      .orderBy(desc(schema.chatHistory.created_at)).all();
    if (allHistory.length > 40) {
      const idsToDelete = allHistory.slice(40).map(h => h.id);
      for (const id of idsToDelete) {
        db.delete(schema.chatHistory).where(eq(schema.chatHistory.id, id)).run();
      }
    }

    res.json({
      reply,
      agent: "阿穗",
      timestamp: now,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "阿穗暂时无法回复，请稍后再试" });
  }
});

// NPC 对话
app.post("/api/v1/chat/npc", validate(npcChatSchema), async (req, res) => {
  try {
    const { message, npcId, context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    const userContext = {
      userName: context?.userName || "旅行者",
      currentRegion: context?.currentRegion || "",
      questProgress: context?.questProgress || "",
      unlockedRegions: context?.unlockedRegions || [],
      recentCheckins: context?.recentCheckins || [],
      consecutiveDays: context?.consecutiveDays || 0,
      timeOfDay: getTimeOfDay(),
    };

    const reply = await chatWithNpc(npcId || config.npc.oldGuangzhou, message, userContext);

    res.json({
      reply,
      agent: npcId || "老广阿伯",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("NPC chat error:", error);
    res.status(500).json({ error: "NPC暂时无法回复，请稍后再试" });
  }
});

// ==================== 统计 ====================

app.get("/api/v1/stats", (req, res) => {
  const userId = req.userId!;
  const allRegions = db.select().from(schema.regions).all();
  const allAnchors = db.select().from(schema.anchors).all();
  const checkedAnchors = db.select().from(schema.userAnchors)
    .where(and(
      eq(schema.userAnchors.user_id, userId),
      eq(schema.userAnchors.checked, true),
    )).all();
  const checkins = db.select().from(schema.checkins)
    .where(eq(schema.checkins.user_id, userId)).all();
  const achievements = db.select().from(schema.achievements).all();
  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();

  const mainQuestProgress = db.select().from(schema.userMainQuestProgress)
    .where(eq(schema.userMainQuestProgress.user_id, userId)).all();
  const sideQuestProgress = db.select().from(schema.userSideQuestProgress)
    .where(eq(schema.userSideQuestProgress.user_id, userId)).all();

  res.json({
    total_regions: allRegions.length,
    unlocked_regions: allRegions.filter(r => r.unlocked).length,
    total_anchors: allAnchors.length,
    checked_anchors: checkedAnchors.length,
    total_checkins: checkins.length,
    total_achievements: achievements.length,
    unlocked_achievements: achievements.filter(a => a.unlocked).length,
    total_main_quests: mainQuestProgress.length,
    completed_main_quests: mainQuestProgress.filter(q => q.status === "completed").length,
    active_main_quests: mainQuestProgress.filter(q => q.status === "active").length,
    total_side_quests: sideQuestProgress.length,
    completed_side_quests: sideQuestProgress.filter(q => q.status === "completed").length,
    active_side_quests: sideQuestProgress.filter(q => q.status === "active").length,
    user_level: user?.level || 1,
    user_exp: user?.exp || 0,
    consecutive_days: getConsecutiveDays(userId),
  });
});

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 9) return "早上";
  if (hour < 12) return "上午";
  if (hour < 14) return "中午";
  if (hour < 18) return "下午";
  return "傍晚";
}

// Haversine 公式计算两点间距离（米）
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── 启动 ──
seed().then(() => {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
  });
});
