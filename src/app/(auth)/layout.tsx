import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-5">
        <div className="mx-auto w-full max-w-md">
          <Brand />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16">{children}</main>
    </div>
  );
}
