import "server-only";

import { z } from "zod";

import { AUTH_LIMITS } from "@/constants/auth";

const passwordSchema = z
  .string()
  .min(AUTH_LIMITS.passwordMin, { error: `Use at least ${AUTH_LIMITS.passwordMin} characters.` })
  .max(AUTH_LIMITS.passwordMax, { error: `Use at most ${AUTH_LIMITS.passwordMax} characters.` })
  .regex(/[A-Za-z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." })
  .refine((value) => value.trim() === value, { error: "Do not start or end the password with a space." });

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { error: "Enter your email or username." })
    .max(AUTH_LIMITS.emailMax, { error: "That value is too long." }),
  password: z
    .string()
    .min(1, { error: "Enter your password." })
    .max(AUTH_LIMITS.passwordMax, { error: "That password is too long." }),
});

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, { error: "Choose a username." })
      .max(AUTH_LIMITS.usernameMax, { error: `Use at most ${AUTH_LIMITS.usernameMax} characters.` })
      .regex(/^[A-Za-z0-9_]+$/, { error: "Use letters, numbers, and underscores only." }),
    email: z.email({ error: "Enter a valid email address." }).max(AUTH_LIMITS.emailMax),
    first_name: z
      .string()
      .trim()
      .min(1, { error: "Enter your first name." })
      .max(AUTH_LIMITS.nameMax, { error: `Use at most ${AUTH_LIMITS.nameMax} characters.` }),
    last_name: z
      .string()
      .trim()
      .max(AUTH_LIMITS.nameMax, { error: `Use at most ${AUTH_LIMITS.nameMax} characters.` }),
    password: passwordSchema,
    confirm_password: z.string().min(1, { error: "Confirm your password." }),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match.",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
