import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function FramedCard({ children, className }: Props) {
  return (
    <div
      className={`border border-fg bg-bg-card p-6 md:p-8 ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
