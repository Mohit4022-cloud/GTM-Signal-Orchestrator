import type { ReactNode } from "react";

export function ShellInset({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>;
}
