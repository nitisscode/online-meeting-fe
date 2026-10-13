"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { AUTH_LIMITS, OTP_LIMITS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordForm() {
  const [requestState, requestAction, requestPending] = useActionState(requestPasswordReset, null);
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [handledRequest, setHandledRequest] = useState<typeof requestState>(null);
  const sentEmail = requestState?.email ?? resetState?.email ?? email;

  if (requestState?.otpSent && requestState.email && requestState !== handledRequest) {
    setHandledRequest(requestState);
    setEmail(requestState.email);
    setCodeSent(true);
    setOtp("");
    setCooldown(OTP_LIMITS.resendCooldownSeconds);
  }

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  return (
    <div className="flex flex-col gap-4">
      {codeSent ? (
        <>
          <form action={resetAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="email" value={sentEmail} />
            <Alert message={resetState?.message ?? (requestState && !requestState.otpSent ? requestState.message : undefined)} />
            <p className="text-sm text-ink-soft">
              Code sent to <span className="font-medium text-ink">{sentEmail}</span>
            </p>
            <OtpInput value={otp} disabled={resetPending} onChange={setOtp} errors={resetState?.fieldErrors?.otp} />
            <Field
              label="New password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
              maxLength={AUTH_LIMITS.passwordMax}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              errors={resetState?.fieldErrors?.new_password}
            />
            <Field
              label="Confirm password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              maxLength={AUTH_LIMITS.passwordMax}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              errors={resetState?.fieldErrors?.confirm_password}
            />
            <Button type="submit" pending={resetPending}>
              Update password
            </Button>
          </form>
          <div className="flex items-center justify-between gap-3 text-sm">
            <button type="button" className="font-medium text-ink" onClick={() => setCodeSent(false)}>
              Use a different email
            </button>
            <form action={requestAction}>
              <input type="hidden" name="email" value={sentEmail} />
              <button
                type="submit"
                disabled={requestPending || cooldown > 0}
                className="font-medium text-pine disabled:cursor-not-allowed disabled:pointer-events-none disabled:text-ink-soft"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </form>
          </div>
        </>
      ) : (
        <form action={requestAction} className="flex flex-col gap-4" noValidate>
          <Alert message={requestState?.message && !requestState.otpSent ? requestState.message : undefined} />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={AUTH_LIMITS.emailMax}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            errors={requestState?.fieldErrors?.email}
          />
          <Button type="submit" pending={requestPending} disabled={cooldown > 0}>
            {cooldown > 0 ? `Send code in ${cooldown}s` : "Send code"}
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-soft">
        <Link href={ROUTES.login} className="font-medium text-pine">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
