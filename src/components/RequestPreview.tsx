import { serialize } from "@/lib/engine/serialize";
import { visibleFields } from "@/lib/engine/visibility";
import type { CarrierForm } from "@/lib/types/carrierForm";
import type { FormValues } from "@/lib/types/formValues";

interface Props {
  form: CarrierForm;
  values: FormValues;
  carrierName: string;
}

/** The request as it stands right now, in the carrier's exact format. */
export function RequestPreview({ form, values, carrierName }: Readonly<Props>) {
  const request = serialize(form, values);
  const stillNeeded = visibleFields(form, values)
    .filter((field) => field.required && !(field.key in request))
    .map((field) => field.key);

  return (
    <div className="stack">
      <p className="hint">
        Updates as you type. Values stay in a neutral format inside the app.{" "}
        {carrierName}&apos;s formats (dates as MM/DD/YYYY, full state names,
        10-digit phones) are only applied here, at the very end.
      </p>
      {stillNeeded.length > 0 ? (
        <p className="hint" data-testid="still-needed">
          Still needed:{" "}
          {stillNeeded.map((key, index) => (
            <span key={key}>
              {index > 0 && ", "}
              <code>{key}</code>
            </span>
          ))}
        </p>
      ) : (
        <p className="hint" data-testid="still-needed">
          Every required field has a value.
        </p>
      )}
      <pre className="code-block" data-testid="live-request">
        {JSON.stringify(request, null, 2)}
      </pre>
    </div>
  );
}
