import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getProjectContentOverrides, getProjectContentRevisions, saveProjectContentOverride } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
      .mutation(({ input, ctx }) => saveProjectContentOverride(input.projectId, input.payload, ctx.user.id)),
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
