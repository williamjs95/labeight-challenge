import { serializeValue } from "@/lib/engine/serialize";
import { displayStatus } from "@/lib/engine/status";
import { isEmpty } from "@/lib/engine/visibility";
import type { CarrierForm } from "@/lib/types/carrierForm";
import type { FormValues } from "@/lib/types/formValues";
import type { Resolution } from "@/lib/types/resolution";
import { StatusChip } from "./StatusChip";

interface Props {
  form: CarrierForm;
  values: FormValues;
  resolutions: Readonly<Record<string, Resolution>>;
  confirmed: ReadonlySet<string>;
}

/** Every carrier field: where its answer came from, its status, and what will be sent. */
export function FieldMapTable({
  form,
  values,
  resolutions,
  confirmed,
}: Readonly<Props>) {
  return (
    <div className="table-scroll">
      <table className="field-map">
        <caption className="visually-hidden">
          How each Harbor field is answered
        </caption>
        <thead>
          <tr>
            <th scope="col">Harbor field</th>
            <th scope="col">From our profile</th>
            <th scope="col">Status</th>
            <th scope="col">Sent as</th>
          </tr>
        </thead>
        <tbody>
          {form.fields.map((field) => {
            const resolution = resolutions[field.key];
            const status = displayStatus(
              form,
              field,
              values,
              resolution,
              confirmed,
            );
            const value = values[field.key];
            const sent =
              status === "hidden" || value === undefined || isEmpty(value)
                ? undefined
                : JSON.stringify(serializeValue(field, value));
            return (
              <tr
                key={field.key}
                data-testid={`map-${field.key}`}
                data-status={status}
              >
                <th scope="row">
                  <code>{field.key}</code>
                  <span className="cell-sub">{field.label}</span>
                </th>
                <td>
                  {resolution?.source ? (
                    <>
                      <code>{resolution.source.key}</code>
                      <span className="cell-sub mono">
                        {resolution.source.value}
                      </span>
                    </>
                  ) : (
                    <span className="cell-sub">Not in profile</span>
                  )}
                </td>
                <td>
                  <StatusChip status={status} />
                  {status === "hidden" && field.showIf && (
                    <span className="cell-sub">
                      Shown when <code>{field.showIf.field}</code> includes{" "}
                      {field.showIf.includes}
                    </span>
                  )}
                </td>
                <td>
                  {sent === undefined ? (
                    <span className="cell-sub">Not sent</span>
                  ) : (
                    <code>{sent}</code>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
