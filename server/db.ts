import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

// Persistence for admin content edits. Backed by a Supabase Postgres project
// (shared org, dedicated tables — see the `hwaseong_` prefix) rather than the
// MySQL database this project's drizzle schema was written for, since no
// MySQL instance has ever actually been provisioned/connected for this repo.

type ProjectContentPayload = Record<string, unknown>;

const OVERRIDES_TABLE = "hwaseong_project_content_overrides";
const REVISIONS_TABLE = "hwaseong_project_content_revisions";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!_client && ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    _client = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export async function getProjectContentOverrides() {
  const client = getClient();
  if (!client) {
    console.warn("[Supabase] Not configured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    return [];
  }

  const { data, error } = await client.from(OVERRIDES_TABLE).select("project_id, payload, updated_at");
  if (error) {
    console.error("[Supabase] Failed to load project content overrides:", error);
    return [];
  }

  return (data ?? []).map(row => ({
    projectId: row.project_id as string,
    payload: row.payload as ProjectContentPayload,
    updatedAt: row.updated_at as string,
  }));
}

export async function saveProjectContentOverride(
  projectId: string,
  payload: ProjectContentPayload,
  updatedBy: string
) {
  const client = getClient();
  if (!client) throw new Error("데이터베이스를 사용할 수 없습니다.");

  const { error: upsertError } = await client.from(OVERRIDES_TABLE).upsert({
    project_id: projectId,
    payload,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) throw new Error(upsertError.message);

  const { error: revisionError } = await client.from(REVISIONS_TABLE).insert({
    project_id: projectId,
    payload,
    changed_by: updatedBy,
  });
  if (revisionError) {
    // Non-fatal: the override itself saved fine, only the audit trail failed.
    console.error("[Supabase] Failed to record revision:", revisionError);
  }

  return { projectId, payload };
}

export async function getProjectContentRevisions(projectId: string) {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from(REVISIONS_TABLE)
    .select("id, project_id, payload, changed_by, changed_at")
    .eq("project_id", projectId)
    .order("changed_at", { ascending: false });
  if (error) {
    console.error("[Supabase] Failed to load revisions:", error);
    return [];
  }

  return (data ?? []).map(row => ({
    id: row.id as number,
    projectId: row.project_id as string,
    payload: row.payload as ProjectContentPayload,
    changedBy: row.changed_by as string,
    changedAt: row.changed_at as string,
  }));
}
