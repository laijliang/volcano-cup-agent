import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "../db";

const { anchors, userAnchors, mainQuests, sideQuests, achievements, checkins, users, userMainQuestProgress, userSideQuestProgress, userAchievements, userRegionProgress } = schema;

interface NewAchievement {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 打卡后触发所有业务逻辑，返回新解锁的成就和区域
export function afterCheckin(userId: string, anchorId: string) {
  updateMainQuestProgress(userId, anchorId);
  updateSideQuestProgress(userId, anchorId);
  const newAchievements = checkAchievements(userId);
  const newRegions = checkRegionUnlock(userId);
  return { newAchievements, newRegions };
}

// ── 主线任务进度更新（按用户） ──
function updateMainQuestProgress(userId: string, anchorId: string) {
  const checkedCount = db.select().from(userAnchors)
    .where(and(eq(userAnchors.user_id, userId), eq(userAnchors.checked, true)))
    .all().length;

  // 从模板读取所有主线任务
  const quests = db.select().from(mainQuests).all();

  for (const q of quests) {
    // 读取或初始化该用户的主线进度
    let up = db.select().from(userMainQuestProgress)
      .where(and(
        eq(userMainQuestProgress.user_id, userId),
        eq(userMainQuestProgress.quest_id, q.id),
      )).get();

    if (!up) {
      // 首次：根据 quest 模板的 status 决定初始状态
      const initialStatus = q.status === "active" ? "active" : "locked";
      db.insert(userMainQuestProgress).values({
        user_id: userId,
        quest_id: q.id,
        progress: 0,
        status: initialStatus,
      }).run();
      up = db.select().from(userMainQuestProgress)
        .where(and(
          eq(userMainQuestProgress.user_id, userId),
          eq(userMainQuestProgress.quest_id, q.id),
        )).get()!;
    }

    // 只更新 active 状态的任务
    if (up.status !== "active") continue;

    const newProgress = Math.min(checkedCount, q.total);
    if (newProgress !== up.progress) {
      const newStatus = newProgress >= q.total ? "completed" : "active";
      db.update(userMainQuestProgress)
        .set({ progress: newProgress, status: newStatus })
        .where(eq(userMainQuestProgress.id, up.id)).run();

      // 解锁下一章
      if (newStatus === "completed") {
        const nextChapterId = String(parseInt(q.id) + 1);
        const nextUp = db.select().from(userMainQuestProgress)
          .where(and(
            eq(userMainQuestProgress.user_id, userId),
            eq(userMainQuestProgress.quest_id, nextChapterId),
          )).get();
        if (nextUp && nextUp.status === "locked") {
          db.update(userMainQuestProgress)
            .set({ status: "active" })
            .where(eq(userMainQuestProgress.id, nextUp.id)).run();
        }
      }
    }
  }
}

// ── 支线任务进度更新（按用户） ──
function updateSideQuestProgress(userId: string, anchorId: string) {
  const anchor = db.select().from(anchors).where(eq(anchors.id, anchorId)).get();
  if (!anchor) return;

  const allSideQuests = db.select().from(sideQuests).all();

  for (const q of allSideQuests) {
    // 跳过隐藏任务
    if (q.status === "hidden") continue;

    const locations: string[] = JSON.parse(q.locations || "[]");
    if (locations.length === 0) continue;

    // 检查锚点名称是否匹配任务地点
    const anchorNameClean = anchor.name.replace(/[（(].*[）)]/, "").trim();
    const matches = locations.some(loc => anchorNameClean.includes(loc.replace(/[（(].*[）)]/, "").trim()));

    if (!matches) continue;

    // 读取或初始化该用户的支线进度
    let up = db.select().from(userSideQuestProgress)
      .where(and(
        eq(userSideQuestProgress.user_id, userId),
        eq(userSideQuestProgress.quest_id, q.id),
      )).get();

    if (!up) {
      const initialStatus = q.status === "active" ? "active" : "locked";
      db.insert(userSideQuestProgress).values({
        user_id: userId,
        quest_id: q.id,
        progress: 0,
        status: initialStatus,
      }).run();
      up = db.select().from(userSideQuestProgress)
        .where(and(
          eq(userSideQuestProgress.user_id, userId),
          eq(userSideQuestProgress.quest_id, q.id),
        )).get()!;
    }

    if (up.status !== "active") continue;

    const newProgress = up.progress + 1;
    const newStatus = newProgress >= q.total ? "completed" : "active";
    db.update(userSideQuestProgress)
      .set({ progress: newProgress, status: newStatus })
      .where(eq(userSideQuestProgress.id, up.id)).run();
  }
}

// ── 成就判定 ──
function checkAchievements(userId: string): NewAchievement[] {
  const checkedUA = db.select().from(userAnchors)
    .where(and(eq(userAnchors.user_id, userId), eq(userAnchors.checked, true)))
    .all();
  const checkedCount = checkedUA.length;
  const checkedAnchorIds = checkedUA.map(ua => ua.anchor_id);
  const allAnchors = db.select().from(anchors).all();
  const consecutiveDays = getConsecutiveDays(userId);

  const newlyUnlockedIds: string[] = [];

  // 探索类成就
  if (checkedCount >= 1 && unlockAchievement(userId, "1")) newlyUnlockedIds.push("1"); // 初来乍到
  if (checkedCount >= 5 && unlockAchievement(userId, "2")) newlyUnlockedIds.push("2"); // 五羊探索者
  if (consecutiveDays >= 7 && unlockAchievement(userId, "4")) newlyUnlockedIds.push("4"); // 连续7天

  // 美食类成就：打卡3个以上food类型锚点
  const foodAnchors = allAnchors.filter(a => checkedAnchorIds.includes(a.id) && a.type === "food");
  if (foodAnchors.length >= 3 && unlockAchievement(userId, "3")) newlyUnlockedIds.push("3"); // 美食猎人

  // 荔湾探索：荔湾区打卡3个以上
  const liwanAnchors = allAnchors.filter(a => checkedAnchorIds.includes(a.id) && a.region_id === "liwan");
  if (liwanAnchors.length >= 3 && unlockAchievement(userId, "5")) newlyUnlockedIds.push("5"); // 西关漫步

  // 博物馆迷：打卡南越王博物院 + 广东省博物馆
  const museumIds = ["9", "22"];
  if (museumIds.every(id => checkedAnchorIds.includes(id)) && unlockAchievement(userId, "6")) newlyUnlockedIds.push("6");

  // 夜景达人：打卡广州塔
  if (checkedAnchorIds.includes("17") && unlockAchievement(userId, "7")) newlyUnlockedIds.push("7");

  // 隐藏成就：打卡沙面岛（secret类型锚点）
  const secretAnchors = allAnchors.filter(a => checkedAnchorIds.includes(a.id) && a.type === "secret");
  if (secretAnchors.length >= 1 && unlockAchievement(userId, "8")) newlyUnlockedIds.push("8");

  // 羊城百事通：完成5个以上支线任务
  const completedSide = db.select().from(userSideQuestProgress)
    .where(and(
      eq(userSideQuestProgress.user_id, userId),
      eq(userSideQuestProgress.status, "completed"),
    )).all();
  if (completedSide.length >= 5 && unlockAchievement(userId, "9")) newlyUnlockedIds.push("9");

  // 珠江夜话：打卡天河区3个核心地标（广州塔 + 花城广场 + 海心沙）
  const riversideIds = ["17", "21", "23"];
  if (riversideIds.every(id => checkedAnchorIds.includes(id)) && unlockAchievement(userId, "10")) newlyUnlockedIds.push("10");

  // 人情味：完成3个温馨剧情支线（s5-s10中任意3个）
  const heartwarmingIds = ["s5", "s6", "s7", "s8", "s9", "s10"];
  const completedHeartwarming = completedSide.filter(q => heartwarmingIds.includes(q.quest_id));
  if (completedHeartwarming.length >= 3 && unlockAchievement(userId, "11")) newlyUnlockedIds.push("11");

  // 广州通：完成全部7个主线任务
  const completedMain = db.select().from(userMainQuestProgress)
    .where(and(
      eq(userMainQuestProgress.user_id, userId),
      eq(userMainQuestProgress.status, "completed"),
    )).all();
  if (completedMain.length >= 7 && unlockAchievement(userId, "12")) newlyUnlockedIds.push("12");

  if (newlyUnlockedIds.length === 0) return [];

  const allAchs = db.select().from(achievements).all();
  const achMap = new Map(allAchs.map(a => [a.id, a]));
  return newlyUnlockedIds.map(id => {
    const ach = achMap.get(id)!;
    return { id: ach.id, name: ach.name, icon: ach.icon, color: ach.color };
  });
}

function unlockAchievement(userId: string, achId: string): boolean {
  const existing = db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.user_id, userId),
      eq(userAchievements.achievement_id, achId),
    )).get();
  if (!existing) {
    db.insert(userAchievements).values({
      user_id: userId,
      achievement_id: achId,
      unlocked_at: new Date().toISOString(),
    }).run();
    return true;
  }
  return false;
}

// ── 区域自动解锁 ──
function checkRegionUnlock(userId: string): string[] {
  const checkedCount = db.select().from(userAnchors)
    .where(and(eq(userAnchors.user_id, userId), eq(userAnchors.checked, true)))
    .all().length;

  const newlyUnlocked: string[] = [];

  // 打卡5个锚点 → 解锁海珠
  if (checkedCount >= 5 && unlockRegion(userId, "haizhu")) newlyUnlocked.push("haizhu");
  // 打卡8个锚点 → 解锁天河
  if (checkedCount >= 8 && unlockRegion(userId, "tianhe")) newlyUnlocked.push("tianhe");
  // 打卡12个锚点 → 解锁番禺 + 白云
  if (checkedCount >= 12) {
    if (unlockRegion(userId, "panyu")) newlyUnlocked.push("panyu");
    if (unlockRegion(userId, "baiyun")) newlyUnlocked.push("baiyun");
  }
  // 打卡18个锚点 → 解锁黄埔
  if (checkedCount >= 18 && unlockRegion(userId, "huangpu")) newlyUnlocked.push("huangpu");

  return newlyUnlocked;
}

function unlockRegion(userId: string, regionId: string): boolean {
  // 检查该用户是否已解锁此区域
  const existingProgress = db.select().from(userRegionProgress)
    .where(and(
      eq(userRegionProgress.user_id, userId),
      eq(userRegionProgress.region_id, regionId),
    )).get();

  if (!existingProgress) {
    db.insert(userRegionProgress).values({
      user_id: userId,
      region_id: regionId,
      unlocked_at: new Date().toISOString(),
    }).run();

    // 解锁该区域所有锚点
    const regionAnchors = db.select().from(anchors)
      .where(eq(anchors.region_id, regionId)).all();

    for (const a of regionAnchors) {
      const existing = db.select().from(userAnchors)
        .where(and(eq(userAnchors.user_id, userId), eq(userAnchors.anchor_id, a.id))).get();
      if (existing) {
        db.update(userAnchors).set({ unlocked: true })
          .where(eq(userAnchors.id, existing.id)).run();
      } else {
        db.insert(userAnchors).values({
          user_id: userId, anchor_id: a.id, checked: false, unlocked: true,
        }).run();
      }
    }
    return true;
  }
  return false;
}

// ── 连续打卡天数 ──
export function getConsecutiveDays(userId: string): number {
  const records = db.select().from(checkins)
    .where(eq(checkins.user_id, userId))
    .orderBy(desc(checkins.created_at)).all();

  if (records.length === 0) return 0;

  let consecutive = 1;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (let i = 0; i < records.length; i++) {
    const recordDate = new Date(records[i].created_at);
    recordDate.setHours(0, 0, 0, 0);

    if (i === 0) {
      const diffDays = Math.floor((current.getTime() - recordDate.getTime()) / 86400000);
      if (diffDays > 1) return 0;
      if (diffDays === 1) consecutive = 1;
    } else {
      const prevDate = new Date(records[i - 1].created_at);
      prevDate.setHours(0, 0, 0, 0);
      const diff = Math.floor((prevDate.getTime() - recordDate.getTime()) / 86400000);
      if (diff === 1) consecutive++;
      else break;
    }
  }

  return consecutive;
}


