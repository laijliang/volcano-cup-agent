import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// 必需认证 — 无有效 token 返回 401
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "请先登录" });
  }

  const token = header.slice(7);
  const record = db.select().from(schema.authTokens)
    .where(eq(schema.authTokens.token, token)).get();

  if (!record) {
    return res.status(401).json({ error: "登录已过期，请重新登录" });
  }

  req.userId = record.user_id;
  next();
}

// 可选认证 — 有 token 就解析，没有也放行（用于向后兼容）
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    const record = db.select().from(schema.authTokens)
      .where(eq(schema.authTokens.token, token)).get();
    if (record) {
      req.userId = record.user_id;
    }
  }
  // 向后兼容：无 token 时默认用户 "1"
  if (!req.userId) {
    req.userId = "1";
  }
  next();
}
