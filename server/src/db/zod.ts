import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { media } from "./schema";
import { z } from "zod";

export const insertMediaSchema = createInsertSchema(media).omit({
    id: true
});

export const patchMediaSchema = insertMediaSchema.partial();

export const selectMediaSchema = createSelectSchema(media);

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type PatchMedia = z.infer<typeof patchMediaSchema>;
export type Media = z.infer<typeof selectMediaSchema>;
