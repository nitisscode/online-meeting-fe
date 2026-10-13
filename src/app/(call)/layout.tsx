export default function CallLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-dvh flex-col overflow-hidden bg-paper">{children}</div>;
}
