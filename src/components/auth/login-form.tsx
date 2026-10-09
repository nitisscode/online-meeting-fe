"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { login } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ROUTES } from "@/constants/routes";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Alert message={state?.message} />
      <Field
        label="Email or username"
        name="identifier"
        autoComplete="username"
        required
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        errors={state?.fieldErrors?.identifier}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        errors={state?.fieldErrors?.password}
      />
      <Button type="submit" pending={pending}>
        Sign in
      </Button>
      <p className="text-sm text-ink-soft">
        New here?{" "}
        <Link href={ROUTES.signup} className="font-medium text-pine">
          Create an account
        </Link>
      </p>
    </form>
  );
}
