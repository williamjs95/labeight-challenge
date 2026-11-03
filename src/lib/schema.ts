import { z } from "zod";
import type { CarrierForm } from "./types/carrierForm";

/**
 * Runtime schema for a carrier's form definition.
 *
 * Objects are strict on purpose: if a carrier ships a rule we don't support yet
 * (e.g. `validation.maxAge`), loading fails instead of silently ignoring it.
 */
const showIfSchema = z.strictObject({
  field: z.string().min(1),
  includes: z.string().min(1),
});

const base = {
  key: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean(),
  showIf: showIfSchema.optional(),
};

export const fieldSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...base,
    type: z.literal("text"),
    pattern: z.string().optional(),
  }),
  z.strictObject({ ...base, type: z.literal("email") }),
  z.strictObject({ ...base, type: z.literal("tel") }),
  z.strictObject({
    ...base,
    type: z.literal("date"),
    format: z.string().optional(),
    validation: z
      .strictObject({ minAge: z.number().int().nonnegative().optional() })
      .optional(),
  }),
  z.strictObject({
    ...base,
    type: z.literal("select"),
    options: z.array(z.union([z.string(), z.number()])).min(1),
  }),
  z.strictObject({
    ...base,
    type: z.literal("multiselect"),
    options: z.array(z.string()).min(1),
  }),
  z.strictObject({
    ...base,
    type: z.literal("number"),
    min: z.number().optional(),
  }),
  z.strictObject({ ...base, type: z.literal("boolean") }),
]);

export const carrierFormSchema = z
  .strictObject({
    carrier: z.string().min(1),
    product: z.string().min(1),
    fields: z.array(fieldSchema).min(1),
  })
  .superRefine((form, ctx) => {
    const keys = new Set<string>();
    form.fields.forEach((field, index) => {
      if (keys.has(field.key)) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", index, "key"],
          message: `Duplicate field key "${field.key}"`,
        });
      }
      keys.add(field.key);

      if (field.type === "text" && field.pattern !== undefined) {
        try {
          new RegExp(field.pattern);
        } catch {
          ctx.addIssue({
            code: "custom",
            path: ["fields", index, "pattern"],
            message: "Invalid regular expression",
          });
        }
      }
    });

    form.fields.forEach((field, index) => {
      if (field.showIf && !keys.has(field.showIf.field)) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", index, "showIf", "field"],
          message: `showIf references unknown field "${field.showIf.field}"`,
        });
      }
    });
  });

export function parseCarrierForm(json: unknown): CarrierForm {
  return carrierFormSchema.parse(json);
}
