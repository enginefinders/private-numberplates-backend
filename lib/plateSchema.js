// lib/plateSchema.js
import { z } from "zod";

// Keep it flexible but safe; passthrough allows future fields without breaking
export const plateConfigSchema = z.object({
  text: z.string().min(1).max(8).regex(/^[A-Z0-9 ]+$/i, "Only letters, numbers, space"),
  font: z.string().default("UK-Regular"),
  legal_type: z.enum(["road_legal", "show_only"]).default("road_legal"),
  plate_size: z.enum(["standard", "short", "short7", "short6", "short5", "short4", "short3", "square", "motorcycle"]).default("standard"),
  colors: z.object({
    background: z.string().default("#FFFF00"),
    text: z.string().default("#000000"),
    border: z.string().optional()
  }).partial().default({}),
  badge: z.enum(["none","uk","sco","eng","custom","ev"]).default("none"),
  effects: z.object({
    gel3d: z.boolean().default(false),
    raised4d: z.boolean().default(false),
    gloss: z.boolean().default(false),
    shadow: z.boolean().default(false)
  }).default({}),
  border: z.object({
    borderSelected: z.boolean().default(false),
    borderColor: z.string().default("")
  }).default({})
}).passthrough(); // allow extra future fields

export function normalizePlateConfig(input) {
  const parsed = plateConfigSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    const err = new Error(`Invalid plate_config: ${msg}`);
    err.status = 400;
    throw err;
  }
  return parsed.data;
}
