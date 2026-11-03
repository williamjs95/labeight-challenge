import type { Resolver } from "./resolver";

/** Per-carrier mapping: one resolver per carrier field key. Unmapped fields are asked. */
export type CarrierMapping = Partial<Record<string, Resolver>>;
