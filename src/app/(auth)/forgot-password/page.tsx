import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-ink-soft">We email a 4-digit code, then you choose a new password.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-soft">Loading the form…</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </section>
  );
}
