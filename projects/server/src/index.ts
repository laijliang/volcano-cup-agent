import express from "express";
import cors from "cors";
import multer from "multer";
import { config } from "./config";
import { chatWithAsui, chatWithNpc, type ChatMessage } from "./services/agent";

const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// 健康检查
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ==================== 用户相关 ====================
interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  exp: number;
  created_at: string;
}

let users: User[] = [
  {
    id: "1",
    name: "羊城探索者",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
    level: 5,
    exp: 1250,
    created_at: "2026-05-01",
  },
];

app.get("/api/v1/user/me", (_req, res) => {
  res.json(users[0]);
});

app.put("/api/v1/user/me", (req, res) => {
  const { name, avatar } = req.body;
  if (name) users[0].name = name;
  if (avatar) users[0].avatar = avatar;
  res.json(users[0]);
});

// ==================== 区域相关 ====================
interface Region {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  icon: string;
  unlocked: boolean;
}

const regions: Region[] = [
  { id: "yuexiu", name: "越秀", subtitle: "五羊圣地", color: "#8B4513", icon: "landmark", unlocked: true },
  { id: "liwan", name: "荔湾", subtitle: "西关风华", color: "#DAA520", icon: "store", unlocked: true },
  { id: "haizhu", name: "海珠", subtitle: "珠水映城", color: "#4682B4", icon: "water", unlocked: false },
  { id: "tianhe", name: "天河", subtitle: "都市新核", color: "#9370DB", icon: "building", unlocked: false },
  { id: "panyu", name: "番禺", subtitle: "古邑新章", color: "#228B22", icon: "tree", unlocked: false },
  { id: "baiyun", name: "白云", subtitle: "云山叠翠", color: "#87CEEB", icon: "mountain", unlocked: false },
  { id: "huangpu", name: "黄埔", subtitle: "海丝古港", color: "#CD853F", icon: "ship", unlocked: false },
];

app.get("/api/v1/regions", (_req, res) => {
  res.json(regions);
});

// ==================== 锚点相关 ====================
interface Anchor {
  id: string;
  name: string;
  region_id: string;
  latitude: number;
  longitude: number;
  type: "landmark" | "food" | "secret";
  unlocked: boolean;
  checked: boolean;
  description: string;
}

const anchors: Anchor[] = [
  { id: "1", name: "五羊石像", region_id: "yuexiu", latitude: 23.1291, longitude: 113.2644, type: "landmark", unlocked: true, checked: true, description: "广州城市标志，五羊传说的发源地" },
  { id: "2", name: "镇海楼", region_id: "yuexiu", latitude: 23.135, longitude: 113.261, type: "landmark", unlocked: true, checked: true, description: "岭南第一楼，始建于明朝" },
  { id: "3", name: "陈家祠", region_id: "liwan", latitude: 23.1295, longitude: 113.242, type: "landmark", unlocked: true, checked: false, description: "广东民间工艺博物馆，建筑艺术瑰宝" },
  { id: "4", name: "点都德", region_id: "yuexiu", latitude: 23.1275, longitude: 113.258, type: "food", unlocked: true, checked: false, description: "老字号茶楼，早茶必去" },
  { id: "5", name: "沙面岛", region_id: "liwan", latitude: 23.1195, longitude: 113.244, type: "secret", unlocked: true, checked: false, description: "隐秘角落，充满历史感的欧式建筑群" },
  { id: "6", name: "永庆坊", region_id: "liwan", latitude: 23.118, longitude: 113.24, type: "landmark", unlocked: false, checked: false, description: "恩宁路历史文化街区，活化更新典范" },
];

app.get("/api/v1/anchors", (_req, res) => {
  res.json(anchors);
});

app.get("/api/v1/anchors/:regionId", (req, res) => {
  const { regionId } = req.params;
  const regionAnchors = anchors.filter((a) => a.region_id === regionId);
  res.json(regionAnchors);
});

// ==================== 打卡相关 ====================
interface Checkin {
  id: string;
  anchor_id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  location: string;
}

let checkins: Checkin[] = [
  { id: "1", anchor_id: "1", user_id: "1", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200", created_at: "2026-05-20", location: "越秀区" },
  { id: "2", anchor_id: "2", user_id: "1", image_url: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=200", created_at: "2026-05-18", location: "越秀区" },
  { id: "3", anchor_id: "4", user_id: "1", image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=200", created_at: "2026-05-18", location: "荔湾区" },
];

app.get("/api/v1/checkins", (_req, res) => {
  const userCheckins = checkins.filter((c) => c.user_id === "1");
  res.json(userCheckins);
});

app.get("/api/v1/checkins/:date", (req, res) => {
  const { date } = req.params;
  const dayCheckins = checkins.filter((c) => c.created_at === date);
  res.json(dayCheckins);
});

app.post("/api/v1/checkins", upload.single("image"), (req, res) => {
  const { anchor_id, location } = req.body;
  const newCheckin: Checkin = {
    id: Date.now().toString(),
    anchor_id,
    user_id: "1",
    image_url: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` : "",
    created_at: new Date().toISOString().split("T")[0],
    location: location || "",
  };
  checkins.push(newCheckin);

  const anchor = anchors.find((a) => a.id === anchor_id);
  if (anchor) anchor.checked = true;

  res.status(201).json(newCheckin);
});

// ==================== 任务相关 ====================
interface MainQuest {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  status: "active" | "locked" | "completed";
  region: string;
  reward: string;
}

interface SideQuest {
  id: string;
  type: "food" | "culture" | "secret";
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  status: "active" | "locked" | "completed" | "hidden";
  reward: number;
  locations: string[];
}

const mainQuests: MainQuest[] = [
  { id: "1", chapter: "第一章", title: "寻穗之旅", subtitle: "初到广州，探索五羊圣地", progress: 3, total: 5, status: "active", region: "yuexiu", reward: "解锁镇海楼区域" },
  { id: "2", chapter: "第二章", title: "西关风情", subtitle: "走进荔湾，感受岭南韵味", progress: 0, total: 6, status: "locked", region: "liwan", reward: "解锁永庆坊" },
  { id: "3", chapter: "第三章", title: "珠江夜游", subtitle: "跨越珠水，眺望小蛮腰", progress: 0, total: 5, status: "locked", region: "haizhu", reward: "解锁广州塔" },
];

const sideQuests: SideQuest[] = [
  { id: "s1", type: "food", title: "早茶达人", subtitle: "品尝3家地道茶楼", progress: 1, total: 3, status: "active", reward: 50, locations: ["点都德", "陶陶居", "莲香楼"] },
  { id: "s2", type: "culture", title: "博物馆探索", subtitle: "参观2家博物馆", progress: 2, total: 2, status: "completed", reward: 80, locations: ["南越王博物院", "广东省博物馆"] },
  { id: "s3", type: "food", title: "肠粉寻味", subtitle: "寻找最正宗的布拉肠", progress: 0, total: 4, status: "locked", reward: 30, locations: [] },
  { id: "s4", type: "secret", title: "隐藏任务：老广的记忆", subtitle: "发现沙面岛的秘密...", progress: 0, total: 1, status: "hidden", reward: 200, locations: [] },
];

app.get("/api/v1/quests/main", (_req, res) => {
  res.json(mainQuests);
});

app.get("/api/v1/quests/side", (_req, res) => {
  res.json(sideQuests);
});

// ==================== 成就相关 ====================
interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

const achievements: Achievement[] = [
  { id: "1", name: "初来乍到", icon: "star", unlocked: true, color: "#FFD700" },
  { id: "2", name: "五羊探索者", icon: "map", unlocked: true, color: "#8B4513" },
  { id: "3", name: "美食猎人", icon: "utensils", unlocked: true, color: "#E85D4C" },
  { id: "4", name: "连续7天", icon: "fire", unlocked: true, color: "#FF6B35" },
  { id: "5", name: "西关漫步", icon: "walking", unlocked: false, color: "#DAA520" },
  { id: "6", name: "博物馆迷", icon: "landmark", unlocked: false, color: "#2D7D46" },
  { id: "7", name: "夜景达人", icon: "moon", unlocked: false, color: "#4682B4" },
  { id: "8", name: "隐藏成就", icon: "question", unlocked: false, color: "#999" },
];

app.get("/api/v1/achievements", (_req, res) => {
  res.json(achievements);
});

// ==================== AI 对话 ====================

// 对话历史（内存存储，MVP 阶段）
const chatHistories = new Map<string, ChatMessage[]>();

app.post("/api/v1/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    const userId = context?.userId || "1";
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, []);
    }
    const history = chatHistories.get(userId)!;

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

    // 保存对话历史（保留最近 20 条）
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: reply });
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    res.json({
      reply,
      agent: "阿穗",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "阿穗暂时无法回复，请稍后再试" });
  }
});

// NPC 对话（支线任务触发）
app.post("/api/v1/chat/npc", async (req, res) => {
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

// ==================== 统计相关 ====================
app.get("/api/v1/stats", (_req, res) => {
  const unlockedRegions = regions.filter((r) => r.unlocked).length;
  const checkedAnchors = anchors.filter((a) => a.checked).length;
  const completedQuests = sideQuests.filter((q) => q.status === "completed").length;

  res.json({
    total_regions: regions.length,
    unlocked_regions: unlockedRegions,
    total_anchors: anchors.length,
    checked_anchors: checkedAnchors,
    total_checkins: checkins.length,
    total_achievements: achievements.length,
    unlocked_achievements: achievements.filter((a) => a.unlocked).length,
    total_quests: sideQuests.length,
    completed_quests: completedQuests,
    total_side_quests: sideQuests.length,
    completed_side_quests: completedQuests,
    user_level: users[0].level,
    user_exp: users[0].exp,
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
