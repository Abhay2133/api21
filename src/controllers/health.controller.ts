import type { Request, Response, NextFunction } from "express";
import { getHealthStatus } from "../services/health.service";

export async function healthCheck(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getHealthStatus();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
