import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  variant?: "primary" | "ghost" | "danger";
};

const variants = {
  primary: "bg-pine text-sand hover:bg-pine-deep",
  ghost: "border border-line bg-sand text-ink hover:bg-paper",
  danger: "bg-danger text-sand hover:bg-danger/90",
};

export function Button({ pending = false, variant = "primary", children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
