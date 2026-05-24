import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── 用户 ──
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("羊城探索者"),
  avatar: text("avatar").default(""),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  created_at: text("created_at").notNull(),
});

// ── 区域 ──
export const regions = sqliteTable("regions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull(),
  color: text("color").notNull().default("#8B4513"),
  icon: text("icon").notNull().default("landmark"),
  unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
});

// ── 用户区域解锁进度 ──
export const userRegionProgress = sqliteTable("user_region_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull().references(() => users.id),
  region_id: text("region_id").notNull().references(() => regions.id),
  unlocked_at: text("unlocked_at").notNull(),
});

// ── 锚点 ──
export const anchors = sqliteTable("anchors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region_id: text("region_id").notNull().references(() => regions.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  type: text("type", { enum: ["landmark", "food", "secret"] }).notNull().default("landmark"),
  description: text("description").default(""),
});

// ── 用户锚点打卡 ──
export const userAnchors = sqliteTable("user_anchors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull().references(() => users.id),
  anchor_id: text("anchor_id").notNull().references(() => anchors.id),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
});

// ── 打卡记录 ──
export const checkins = sqliteTable("checkins", {
  id: text("id").primaryKey(),
  anchor_id: text("anchor_id").notNull().references(() => anchors.id),
  user_id: text("user_id").notNull().references(() => users.id),
  image_url: text("image_url").default(""),
  location: text("location").default(""),
  created_at: text("created_at").notNull(),
});

// ── 主线任务 ──
export const mainQuests = sqliteTable("main_quests", {
  id: text("id").primaryKey(),
  chapter: text("chapter").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
  progress: integer("progress").notNull().default(0),
  total: integer("total").notNull().default(5),
  status: text("status", { enum: ["active", "locked", "completed"] }).notNull().default("locked"),
  region: text("region").default(""),
  reward: text("reward").default(""),
});

// ── 支线任务 ──
export const sideQuests = sqliteTable("side_quests", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["food", "culture", "secret"] }).notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
  progress: integer("progress").notNull().default(0),
  total: integer("total").notNull().default(1),
  status: text("status", { enum: ["active", "locked", "completed", "hidden"] }).notNull().default("locked"),
  reward: integer("reward").notNull().default(0),
  locations: text("locations").default("[]"), // JSON array
});

// ── 用户主线任务进度 ──
export const userMainQuestProgress = sqliteTable("user_main_quest_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull().references(() => users.id),
  quest_id: text("quest_id").notNull().references(() => mainQuests.id),
  progress: integer("progress").notNull().default(0),
  status: text("status", { enum: ["active", "locked", "completed"] }).notNull().default("locked"),
});

// ── 用户支线任务进度 ──
export const userSideQuestProgress = sqliteTable("user_side_quest_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull().references(() => users.id),
  quest_id: text("quest_id").notNull().references(() => sideQuests.id),
  progress: integer("progress").notNull().default(0),
  status: text("status", { enum: ["active", "locked", "completed", "hidden"] }).notNull().default("locked"),
});

// ── 成就 ──
export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("star"),
  unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
  color: text("color").notNull().default("#FFD700"),
});

// ── 聊天历史 ──
export const chatHistory = sqliteTable("chat_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  created_at: text("created_at").notNull(),
});

// ── 认证令牌 ──
export const authTokens = sqliteTable("auth_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  created_at: text("created_at").notNull(),
});
