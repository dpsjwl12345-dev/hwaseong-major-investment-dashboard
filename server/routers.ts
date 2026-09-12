import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { createAdminSessionToken } from "./_core/adminSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { ENV } from "./_core/env";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getProjectContentOverrides, getProjectContentRevisions, saveProjectContentOverride } from "./db";

function isCorrectPassword(candidate: string): boolean {
  if (!ENV.adminPassword) return false;
  const candidateBuf = Buffer.from(candidate);
  const expectedBuf = Buffer.from(ENV.adminPassword);
  // timingSafeEqual throws on length mismatch, so pad the comparison instead
  // of short-circuiting on `.length !==` (which would leak length via timing).
  if (candidateBuf.length !== expectedBuf.length) {
    timingSafeEqual(candidateBuf, candidateBuf);
    return false;
  }
  return timingSafeEqual(candidateBuf, expectedBuf);
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ password: z.string().min(1).max(256) }))
      .mutation(async ({ input, ctx }) => {
        if (!isCorrectPassword(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "비밀번호가 올바르지 않습니다." });
        }
        const token = await createAdminSessionToken();
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { role: "admin" } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  projectContent: router({
    list: publicProcedure.query(() => getProjectContentOverrides()),
    save: adminProcedure
      .input(z.object({ projectId: z.string().min(1).max(128), payload: z.record(z.string(), z.unknown()) }))
      .mutation(({ input }) => saveProjectContentOverride(input.projectId, input.payload, "admin")),
    revisions: adminProcedure
      .input(z.object({ projectId: z.string().min(1).max(128) }))
      .query(({ input }) => getProjectContentRevisions(input.projectId)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
