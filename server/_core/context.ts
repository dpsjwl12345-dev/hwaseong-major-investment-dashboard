import { COOKIE_NAME } from "@shared/const";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import { verifyAdminSessionToken } from "./adminSession";

export type SessionUser = { role: "admin" };

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: SessionUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
  const isAdmin = await verifyAdminSessionToken(cookies[COOKIE_NAME]);

  return {
    req: opts.req,
    res: opts.res,
    user: isAdmin ? { role: "admin" } : null,
  };
}
