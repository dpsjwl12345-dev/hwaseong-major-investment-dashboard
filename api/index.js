// server/_core/vercelEntry.ts
import "dotenv/config";

// server/_core/app.ts
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { timingSafeEqual } from "crypto";
import { z as z2 } from "zod";

// server/_core/adminSession.ts
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/adminSession.ts
var ADMIN_SESSION_SUBJECT = "admin";
function getSecretKey() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}
async function createAdminSessionToken() {
  const issuedAt = Date.now();
  return new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(ADMIN_SESSION_SUBJECT).setIssuedAt().setExpirationTime(Math.floor((issuedAt + ONE_YEAR_MS) / 1e3)).sign(getSecretKey());
}
async function verifyAdminSessionToken(token) {
  if (!token || !ENV.cookieSecret) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return payload.sub === ADMIN_SESSION_SUBJECT && payload.role === "admin";
  } catch {
    return false;
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/db.ts
import { createClient } from "@supabase/supabase-js";
var OVERRIDES_TABLE = "hwaseong_project_content_overrides";
var REVISIONS_TABLE = "hwaseong_project_content_revisions";
var _client = null;
function getClient() {
  if (!_client && ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    _client = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return _client;
}
async function getProjectContentOverrides() {
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
  return (data ?? []).map((row) => ({
    projectId: row.project_id,
    payload: row.payload,
    updatedAt: row.updated_at
  }));
}
async function saveProjectContentOverride(projectId, payload, updatedBy) {
  const client = getClient();
  if (!client) throw new Error("\uB370\uC774\uD130\uBCA0\uC774\uC2A4\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  const { error: upsertError } = await client.from(OVERRIDES_TABLE).upsert({
    project_id: projectId,
    payload,
    updated_by: updatedBy,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (upsertError) throw new Error(upsertError.message);
  const { error: revisionError } = await client.from(REVISIONS_TABLE).insert({
    project_id: projectId,
    payload,
    changed_by: updatedBy
  });
  if (revisionError) {
    console.error("[Supabase] Failed to record revision:", revisionError);
  }
  return { projectId, payload };
}
async function getProjectContentRevisions(projectId) {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client.from(REVISIONS_TABLE).select("id, project_id, payload, changed_by, changed_at").eq("project_id", projectId).order("changed_at", { ascending: false });
  if (error) {
    console.error("[Supabase] Failed to load revisions:", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    payload: row.payload,
    changedBy: row.changed_by,
    changedAt: row.changed_at
  }));
}

// server/routers.ts
function isCorrectPassword(candidate) {
  if (!ENV.adminPassword) return false;
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(ENV.adminPassword);
  if (candidateBuf.length !== expectedBuf.length) {
    timingSafeEqual(candidateBuf, candidateBuf);
    return false;
  }
  return timingSafeEqual(candidateBuf, expectedBuf);
}
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z2.object({ password: z2.string().min(1).max(256) })).mutation(async ({ input, ctx }) => {
      if (!isCorrectPassword(input.password)) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      }
      const token = await createAdminSessionToken();
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { role: "admin" };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  projectContent: router({
    list: publicProcedure.query(() => getProjectContentOverrides()),
    save: adminProcedure.input(z2.object({ projectId: z2.string().min(1).max(128), payload: z2.record(z2.string(), z2.unknown()) })).mutation(({ input }) => saveProjectContentOverride(input.projectId, input.payload, "admin")),
    revisions: adminProcedure.input(z2.object({ projectId: z2.string().min(1).max(128) })).query(({ input }) => getProjectContentRevisions(input.projectId))
  })
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

// server/_core/context.ts
import { parse as parseCookieHeader } from "cookie";
async function createContext(opts) {
  const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
  const isAdmin = await verifyAdminSessionToken(cookies[COOKIE_NAME]);
  return {
    req: opts.req,
    res: opts.res,
    user: isAdmin ? { role: "admin" } : null
  };
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/app.ts
function createApp() {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app2);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}

// server/_core/vercelEntry.ts
var app = createApp();
var vercelEntry_default = app;
export {
  vercelEntry_default as default
};
