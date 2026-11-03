import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { subscribeEmail } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const emailInput = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  email: router({
    subscribe: publicProcedure.input(emailInput).mutation(async ({ input }) => subscribeEmail(input.email)),
  }),
});

export type AppRouter = typeof appRouter;
