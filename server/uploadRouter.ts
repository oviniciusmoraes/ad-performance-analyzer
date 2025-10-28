import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { files } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { deleteFile, getSignedUploadUrl } from "./storage";

export const uploadRouter = router({
  getUploadUrl: protectedProcedure
    .input(z.object({ fileName: z.string(), fileType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { fileName, fileType } = input;
      const userId = ctx.user.id;
      const s3Key = `${userId}/${Date.now()}-${fileName}`;

      const { url, fields } = await getSignedUploadUrl(s3Key, fileType);

      return { url, fields, s3Key };
    }),

  completeUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        s3Key: z.string(),
        mimeType: z.string(),
        size: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { fileName, s3Key, mimeType, size } = input;
      const userId = ctx.user.id;

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [newFile] = await db
        .insert(files)
        .values({
          userId,
          fileName,
          s3Key,
          mimeType,
          size,
        })
        .returning();

      return newFile;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userFiles = await db.select().from(files).where(eq(files.userId, userId));
    return userFiles;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.user.id;

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const fileToDelete = await db.select().from(files).where(eq(files.id, id)).limit(1);

      if (fileToDelete.length === 0 || fileToDelete[0].userId !== userId) {
        throw new Error("File not found or unauthorized");
      }

      // Delete from S3
      await deleteFile(fileToDelete[0].s3Key);

      // Delete from database
      await db.delete(files).where(eq(files.id, id));

      return { success: true };
    }),
});
