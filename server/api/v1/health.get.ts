import { getHealthStatus } from "../../services/health.service";

// GET /api/v1/health
export default defineEventHandler(async () => {
  try {
    const data = await getHealthStatus();
    return { success: true, data };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      message: err?.message ?? "Internal Server Error",
    });
  }
});
