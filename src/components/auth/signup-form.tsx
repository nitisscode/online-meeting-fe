"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";

import { signup } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ROUTES } from "@/constants/routes";

const emptySignup = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  confirm_password: "",
};

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);
  const [values, setValues] = useState(emptySignup);
  const errors = state?.fieldErrors;

  function update(name: keyof typeof emptySignup) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
    };
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Alert message={state?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          name="first_name"
          autoComplete="given-name"
          required
          value={values.first_name}
          onChange={update("first_name")}
          errors={errors?.first_name}
        />
        <Field
          label="Last name"
          name="last_name"
          autoComplete="family-name"
          value={values.last_name}
          onChange={update("last_name")}
          errors={errors?.last_name}
        />
      </div>
      <Field
        label="Username"
        name="username"
        autoComplete="username"
        required
        value={values.username}
        onChange={update("username")}
        errors={errors?.username}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={update("email")}
        errors={errors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={values.password}
        onChange={update("password")}
        errors={errors?.password}
      />
      <Field
        label="Confirm password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
        value={values.confirm_password}
        onChange={update("confirm_password")}
        errors={errors?.confirm_password}
      />
      <Button type="submit" pending={pending}>
        Create account
      </Button>
      <p className="text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-pine">
          Sign in
        </Link>
      </p>
    </form>
  );
}
