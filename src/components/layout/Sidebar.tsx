import Link from "next/link";

import { MODULES } from "@/constants/modules";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activePath?: string;
};

export function Sidebar({ activePath }: SidebarProps) {
  return (
    <aside className="w-sidebar shrink-0 border-r border-border bg-surface p-4">
      <div className="mb-6">
        <p className="text-caption font-medium uppercase tracking-wide text-secondary">
          Security ERP
        </p>
        <p className="text-sm font-semibold text-foreground">Navigation</p>
      </div>
      <nav className="space-y-1">
        {MODULES.map((module) => (
          <Link
            key={module.key}
            href={module.href}
            className={cn(
              "nav-link",
              activePath === module.href && "nav-link-active",
            )}
          >
            {module.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
