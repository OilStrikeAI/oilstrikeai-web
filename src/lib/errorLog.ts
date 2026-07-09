// Lightweight production error visibility — writes to error_log via the
// admin client so the founder can see what broke from the /admin page,
// without wiring up a third-party error-monitoring vendor for this stage.
// Never throws itself: a logging failure must never break the real response.
import { createAdminClient } from "@/lib/supabase/admin";

export async function logError(route: string, err: unknown, companyId?: string): Promise<void> {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    await createAdminClient()
      .from("error_log")
      .insert({ route, message, stack, company_id: companyId ?? null });
  } catch (loggingError) {
    console.error(`[errorLog] failed to record error for ${route}:`, loggingError);
  }
}
