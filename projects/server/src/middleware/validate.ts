import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";

// ── Schemas ──

export const loginSchema = z.object({
  phone: z.string({ message: "手机号不能为空" }).min(1, "手机号不能为空").max(20),
  name: z.string().max(30).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().max(30).optional(),
  avatar: z.string().url("头像需为有效URL").optional().or(z.literal("")),
});

export const chatSchema = z.object({
  message: z.string({ message: "消息不能为空" }).min(1, "消息不能为空").max(2000),
  context: z.object({
    userId: z.string().optional(),
    userName: z.string().optional(),
    currentRegion: z.string().optional(),
    nearestAnchor: z.string().optional(),
    questProgress: z.string().optional(),
    unlockedRegions: z.array(z.string()).optional(),
    recentCheckins: z.array(z.string()).optional(),
    consecutiveDays: z.number().optional(),
    timeOfDay: z.string().optional(),
  }).optional(),
});

export const npcChatSchema = z.object({
  message: z.string({ message: "消息不能为空" }).min(1, "消息不能为空").max(2000),
  npcId: z.string().optional(),
  context: z.object({}).passthrough().optional(),
});

// ── 中间件工厂 ──

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      return res.status(400).json({ error: "输入校验失败", details: errors });
    }
    req.body = result.data;
    next();
  };
}
