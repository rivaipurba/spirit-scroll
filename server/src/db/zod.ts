import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { media } from "./schema";
import { z } from "zod";

export const insertMediaSchema = createInsertSchema(media).omit({
    id: true,
    totalChapters: true,
    currentChapter: true,
}).extend({
    totalChapters: z.union([z.string(), z.number(), z.null()])
        .transform((val: any) => (val === "" || val === 0 ? null : Number(val)))
        .optional(),
    currentChapter: z.union([z.string(), z.number()])
        .transform((val: any) => Number(val) || 0)
        .optional(),
    sourceUrl: z.string().optional().nullable().transform((val: any) => val === "" ? null : val),
    latestReleasedChapter: z.number().optional().nullable(),
    isPinned: z.boolean().optional(),
});

export const patchMediaSchema = insertMediaSchema.partial();

export const selectMediaSchema = createSelectSchema(media);

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type PatchMedia = z.infer<typeof patchMediaSchema>;
export type Media = z.infer<typeof selectMediaSchema>;

