import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, projectContentOverrides, projectContentRevisions, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type ProjectContentPayload = Record<string, unknown>;
let projectContentTablesReady: Promise<boolean> | null = null;

export async function ensureProjectContentTables() {
  const db = await getDb();
  if (!db) return false;
  if (!projectContentTablesReady) {
    projectContentTablesReady = (async () => {
      try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS project_content_overrides (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId VARCHAR(128) NOT NULL UNIQUE,
          payload LONGTEXT NOT NULL,
          updatedBy INT NOT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
        await db.execute(sql`CREATE TABLE IF NOT EXISTS project_content_revisions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId VARCHAR(128) NOT NULL,
          payload LONGTEXT NOT NULL,
          changedBy INT NOT NULL,
          changedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`);
        return true;
      } catch (error) {
        projectContentTablesReady = null;
        console.error("[Database] Failed to ensure project content tables:", error);
        return false;
      }
    })();
  }
  return projectContentTablesReady;
}

export async function getProjectContentOverrides() {
  const db = await getDb();
  if (!db || !(await ensureProjectContentTables())) return [];
  const rows = await db.select().from(projectContentOverrides);
  return rows.flatMap((row) => {
    try {
      return [{ projectId: row.projectId, payload: JSON.parse(row.payload) as ProjectContentPayload, updatedAt: row.updatedAt }];
    } catch {
      return [];
    }
  });
}

export async function saveProjectContentOverride(projectId: string, payload: ProjectContentPayload, userId: number) {
  const db = await getDb();
  if (!db || !(await ensureProjectContentTables())) throw new Error("데이터베이스를 사용할 수 없습니다.");
  const serialized = JSON.stringify(payload);
  await db.insert(projectContentOverrides).values({ projectId, payload: serialized, updatedBy: userId }).onDuplicateKeyUpdate({
    set: { payload: serialized, updatedBy: userId, updatedAt: new Date() },
  });
  await db.insert(projectContentRevisions).values({ projectId, payload: serialized, changedBy: userId });
  return { projectId, payload };
}

export async function getProjectContentRevisions(projectId: string) {
  const db = await getDb();
  if (!db || !(await ensureProjectContentTables())) return [];
  return db.select({ id: projectContentRevisions.id, projectId: projectContentRevisions.projectId, payload: projectContentRevisions.payload, changedBy: projectContentRevisions.changedBy, changedAt: projectContentRevisions.changedAt }).from(projectContentRevisions).where(eq(projectContentRevisions.projectId, projectId));
}
