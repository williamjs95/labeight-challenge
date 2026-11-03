import type { z } from "zod";
import type { carrierFormSchema } from "../schema";

/** A carrier's form definition, as validated by `carrierFormSchema`. */
export type CarrierForm = z.infer<typeof carrierFormSchema>;
