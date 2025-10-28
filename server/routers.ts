import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { uploadRouter } from "./uploadRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { processExcelFile, generateMarkdownReport, generateChartData } from "./utils/dataProcessor";
import * as fs from "fs";
import * as path from "path";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  upload: uploadRouter,
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

  analysis: router({
    processFile: protectedProcedure
      .input(
        z.object({
          filePath: z.string(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const processedData = await processExcelFile(
            input.filePath,
            input.startDate,
            input.endDate
          );

          const markdownReport = generateMarkdownReport(processedData);
          const chartData = generateChartData(processedData);

          return {
            success: true,
            data: processedData,
            report: markdownReport,
            charts: chartData,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
