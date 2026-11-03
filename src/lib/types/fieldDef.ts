import type { z } from "zod";
import type { fieldSchema } from "../schema";

/** One field of a carrier form (discriminated by `type`). */
export type FieldDef = z.infer<typeof fieldSchema>;
