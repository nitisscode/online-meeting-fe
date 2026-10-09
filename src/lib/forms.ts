import type { ZodError } from "zod";

export type ActionState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function validationState(error: ZodError): ActionState {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string[]> = {};

  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    const list = stringList(messages);
    if (list.length > 0) {
      fieldErrors[key] = list;
    }
  }

  return {
    message: flattened.formErrors[0] ?? "Check the highlighted fields.",
    fieldErrors,
  };
}

export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function readChecked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "yes" || value === "true";
}
