import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side helper to record sensitive actions to `audit_log` via the
 * `log_audit` SECURITY DEFINER RPC. Fails silently (audit must never break UX)
 * but logs to console for observability.
 */
export async function logAudit(params: {
  businessId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabase.rpc("log_audit" as any, {
      _business_id: params.businessId,
      _action: params.action,
      _entity_type: params.entityType ?? null,
      _entity_id: params.entityId ?? null,
      _details: params.details ?? {},
    });
    if (error) console.warn("[audit] insert failed:", error.message);
  } catch (err) {
    console.warn("[audit] unexpected error:", err);
  }
}

/** Canonical action names — keep them stable, we query the audit log by these. */
export const AUDIT = {
  DEVICE_PAIRED: "device.paired",
  DEVICE_UNPAIRED: "device.unpaired",
  SCHEDULE_PUBLISHED: "schedule.published",
  SCHEDULE_UPDATED: "schedule.updated",
  USER_INVITED: "user.invited",
  USER_ROLE_CHANGED: "user.role_changed",
  AI_GENERATED: "ai.generated",
  PLAN_CHANGED: "billing.plan_changed",
} as const;
