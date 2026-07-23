import { db } from "@/db";
import { adminLogs } from "@/db/schema";

export async function logAdminAction(params: {
  adminId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: string;
}) {
  await db.insert(adminLogs).values({
    adminId: params.adminId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    details: params.details,
  });
}
