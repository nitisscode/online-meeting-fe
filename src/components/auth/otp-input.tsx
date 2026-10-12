"use client";

import { useEffect, useRef } from "react";

import { OTP_LIMITS } from "@/constants/auth";

type OtpInputProps = {
  name?: string;
  value: string;
  errors?: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function OtpInput({ name = "otp", value, errors, disabled = false, onChange }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LIMITS.length }, (_, index) => value[index] ?? "");
  const errorId = errors && errors.length > 0 ? `${name}-error` : undefined;
  const labelId = `${name}-label`;

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function commit(next: string[]) {
    onChange(next.join("").replace(/\D/g, "").slice(0, OTP_LIMITS.length));
  }

  function focusAt(index: number) {
    const input = inputs.current[index];
    input?.focus();
    input?.select();
  }

  function fillFrom(raw: string, start: number) {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) {
      return;
    }
    const next = [...digits];
    for (let offset = 0; offset < incoming.length && start + offset < OTP_LIMITS.length; offset += 1) {
      next[start + offset] = incoming[offset] ?? "";
    }
    commit(next);
    focusAt(Math.min(start + incoming.length, OTP_LIMITS.length - 1));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium text-ink">
        {OTP_LIMITS.length}-digit code
      </span>
      <div
        className="flex justify-center gap-3"
        role="group"
        aria-labelledby={labelId}
        aria-describedby={errorId}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digit}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${OTP_LIMITS.length}`}
            aria-invalid={Boolean(errorId)}
            className={`h-14 w-12 rounded-xl border bg-sand text-center font-mono text-xl text-ink outline-none ring-pine/30 focus:ring-2 disabled:opacity-60 sm:w-14 ${errorId ? "border-danger" : "border-line"}`}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => fillFrom(event.target.value, index)}
            onPaste={(event) => {
              event.preventDefault();
              fillFrom(event.clipboardData.getData("text"), index);
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace") {
                event.preventDefault();
                const next = [...digits];
                if (digit) {
                  next[index] = "";
                  commit(next);
                  return;
                }
                if (index > 0) {
                  next[index - 1] = "";
                  commit(next);
                  focusAt(index - 1);
                }
              }
              if (event.key === "ArrowLeft" && index > 0) {
                event.preventDefault();
                focusAt(index - 1);
              }
              if (event.key === "ArrowRight" && index < OTP_LIMITS.length - 1) {
                event.preventDefault();
                focusAt(index + 1);
              }
            }}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
      {errorId ? (
        <p id={errorId} className="text-sm text-danger">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
