"use server";

import { redirect } from "next/navigation";

import { API_PATHS } from "@/constants/api";
import { RATE_LIMIT } from "@/constants/security";
import { ROUTES } from "@/constants/routes";
import { djangoPublic, loginWithOtp, loginWithPassword, logoutSession, requestLoginOtp as sendLoginOtp, requestPasswordReset as sendPasswordReset, resetPassword as submitPasswordReset } from "@/lib/api/django";
import { ApiError } from "@/lib/api/errors";
import { type ActionState, readString, validationState } from "@/lib/forms";
import { assertRateLimit, rateLimitKey, RateLimitError } from "@/lib/http/rate-limit";
import { safeInternalPath } from "@/lib/security/safe-path";
import { loginSchema, otpRequestSchema, otpVerifySchema, resetPasswordSchema, signupSchema } from "@/lib/validation/auth";

export async function login(_state: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: readString(formData, "identifier"),
    password: readString(formData, "password"),
  });

  if (!parsed.success) {
    return validationState(parsed.error);
  }

  try {
    await assertRateLimit(await rateLimitKey("login"), RATE_LIMIT.login.limit, RATE_LIMIT.login.windowMs);
    await loginWithPassword(parsed.data.identifier, parsed.data.password);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  redirect(safeInternalPath(readString(formData, "next"), ROUTES.dashboard));
}

export async function requestLoginOtp(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = otpRequestSchema.safeParse({
    email: readString(formData, "email").trim().toLowerCase(),
  });

  if (!parsed.success) {
    return validationState(parsed.error);
  }

  try {
    await assertRateLimit(
      await rateLimitKey("otp-request"),
      RATE_LIMIT.otpRequest.limit,
      RATE_LIMIT.otpRequest.windowMs,
    );
    await sendLoginOtp(parsed.data.email);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  return {
    otpSent: true,
    email: parsed.data.email,
    message: "We sent a 4-digit code to that email. It expires in 2 minutes.",
  };
}

export async function verifyLoginOtp(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = otpVerifySchema.safeParse({
    email: readString(formData, "email").trim().toLowerCase(),
    otp: readString(formData, "otp").trim(),
  });

  if (!parsed.success) {
    return { ...validationState(parsed.error), email: readString(formData, "email").trim().toLowerCase() };
  }

  try {
    await assertRateLimit(
      await rateLimitKey("otp-verify"),
      RATE_LIMIT.otpVerify.limit,
      RATE_LIMIT.otpVerify.windowMs,
    );
    await loginWithOtp(parsed.data.email, parsed.data.otp);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message, email: parsed.data.email, otpSent: true };
    }
    throw error;
  }

  redirect(safeInternalPath(readString(formData, "next"), ROUTES.dashboard));
}

export async function requestPasswordReset(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = otpRequestSchema.safeParse({
    email: readString(formData, "email").trim().toLowerCase(),
  });

  if (!parsed.success) {
    return validationState(parsed.error);
  }

  try {
    await assertRateLimit(
      await rateLimitKey("forgot-password"),
      RATE_LIMIT.otpRequest.limit,
      RATE_LIMIT.otpRequest.windowMs,
    );
    await sendPasswordReset(parsed.data.email);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  return {
    otpSent: true,
    email: parsed.data.email,
    message: "We sent a 4-digit code to that email. It expires in 2 minutes.",
  };
}

export async function resetPassword(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const email = readString(formData, "email").trim().toLowerCase();
  const parsed = resetPasswordSchema.safeParse({
    email,
    otp: readString(formData, "otp").trim(),
    new_password: readString(formData, "new_password"),
    confirm_password: readString(formData, "confirm_password"),
  });

  if (!parsed.success) {
    return { ...validationState(parsed.error), email, otpSent: true };
  }

  try {
    await assertRateLimit(
      await rateLimitKey("reset-password"),
      RATE_LIMIT.otpVerify.limit,
      RATE_LIMIT.otpVerify.windowMs,
    );
    await submitPasswordReset(parsed.data);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message, email, otpSent: true };
    }
    throw error;
  }

  redirect(`${ROUTES.login}?reset=1`);
}

export async function signup(_state: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    username: readString(formData, "username"),
    email: readString(formData, "email"),
    first_name: readString(formData, "first_name"),
    last_name: readString(formData, "last_name"),
    password: readString(formData, "password"),
    confirm_password: readString(formData, "confirm_password"),
  });

  if (!parsed.success) {
    return validationState(parsed.error);
  }

  try {
    await assertRateLimit(await rateLimitKey("signup"), RATE_LIMIT.signup.limit, RATE_LIMIT.signup.windowMs);
    await djangoPublic(API_PATHS.signup, {
      method: "POST",
      body: JSON.stringify({
        username: parsed.data.username,
        email: parsed.data.email,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        password: parsed.data.password,
        confirm_password: parsed.data.confirm_password,
      }),
    });
    await loginWithPassword(parsed.data.email, parsed.data.password);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { message: error.message };
    }
    if (error instanceof ApiError) {
      return {
        message: error.status === 401 ? "Account created. Sign in with the form on the login page." : error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    throw error;
  }

  redirect(ROUTES.dashboard);
}

export async function logout(): Promise<void> {
  await logoutSession();
  redirect(ROUTES.login);
}
