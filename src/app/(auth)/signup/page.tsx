import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Create an account</h1>
        <p className="mt-2 text-sm text-ink-soft">Passwords need 8 or more characters, including a letter and a number.</p>
      </div>
      <SignupForm />
    </section>
  );
}
