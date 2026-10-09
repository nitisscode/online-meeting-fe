import type { ChangeEvent } from "react";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  errors?: string[];
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = false,
  errors,
  value,
  onChange,
}: FieldProps) {
  const errorId = errors && errors.length > 0 ? `${name}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(errorId)}
        aria-describedby={errorId}
        className="h-11 rounded-xl border border-line bg-sand px-3 text-ink outline-none ring-pine/30 placeholder:text-ink-soft focus:ring-2"
      />
      {errorId ? (
        <p id={errorId} className="text-sm text-danger">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
