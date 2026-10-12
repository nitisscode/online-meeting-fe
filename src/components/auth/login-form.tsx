"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { login, requestLoginOtp, verifyLoginOtp } from "@/app/actions/auth";
import { OtpInput } from "@/components/auth/otp-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { OTP_LIMITS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";

type SignInMethod = "password" | "otp";

export function LoginForm() {
  const [method, setMethod] = useState<SignInMethod>("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(login, null);
  const [requestState, requestAction, requestPending] = useActionState(requestLoginOtp, null);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyLoginOtp, null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [handledRequest, setHandledRequest] = useState<typeof requestState>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const sentEmail = requestState?.email ?? verifyState?.email ?? email;

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
      <div className="grid grid-cols-2 rounded-full border border-line bg-sand p-1 text-sm">
        <button
          type="button"
          aria-pressed={method === "password"}
          onClick={() => setMethod("password")}
          className={`rounded-full px-3 py-2 font-medium ${method === "password" ? "bg-pine text-foam" : "text-ink"}`}
        >
          Password
        </button>
        <button
          type="button"
          aria-pressed={method === "otp"}
          onClick={() => setMethod("otp")}
          className={`rounded-full px-3 py-2 font-medium ${method === "otp" ? "bg-pine text-foam" : "text-ink"}`}
        >
          Email code
        </button>
      </div>

      {method === "password" ? (
        <form action={passwordAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <Alert message={passwordState?.message} />
          <Field
            label="Email or username"
            name="identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            errors={passwordState?.fieldErrors?.identifier}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            errors={passwordState?.fieldErrors?.password}
          />
          <Button type="submit" pending={passwordPending}>
            Sign in
          </Button>
        </form>
      ) : codeSent ? (
        <form action={verifyAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="email" value={sentEmail} />
          <Alert message={verifyState?.message ?? requestState?.message} />
          <p className="text-sm text-ink-soft">
            Code sent to <span className="font-medium text-ink">{sentEmail}</span>
          </p>
          <OtpInput
            value={otp}
            disabled={verifyPending}
            onChange={setOtp}
            errors={verifyState?.fieldErrors?.otp}
          />
          <Button type="submit" pending={verifyPending}>
            Sign in
          </Button>
          <div className="flex items-center justify-between gap-3 text-sm">
            <button type="button" className="font-medium text-ink" onClick={() => setCodeSent(false)}>
              Use a different email
            </button>
            <button
              type="submit"
              formAction={requestAction}
              disabled={requestPending || cooldown > 0}
              className="font-medium text-pine disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      ) : (
        <form action={requestAction} className="flex flex-col gap-4" noValidate>
          <Alert message={requestState?.message} />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            errors={requestState?.fieldErrors?.email}
          />
          <Button type="submit" pending={requestPending}>
            Send code
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-soft">
        New here?{" "}
        <Link href={ROUTES.signup} className="font-medium text-pine">
          Create an account
        </Link>
      </p>
    </div>
  );
}
