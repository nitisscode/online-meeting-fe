import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Use the email or username on your account.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-soft">Loading the form…</p>}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
