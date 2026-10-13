import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="my-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
