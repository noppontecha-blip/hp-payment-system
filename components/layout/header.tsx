import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";

export function Header({
  eyebrow,
  title,
  subtitle,
  metaChip,
  hasNotification = false,
  userName = "ผู้ใช้งาน",
  userRole = "เจ้าหน้าที่บัญชี",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  metaChip?: ReactNode;
  hasNotification?: boolean;
  userName?: string;
  userRole?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[21px] font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {metaChip && (
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink">
            {metaChip}
          </div>
        )}
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="ค้นหา"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="size-4" />
          {hasNotification && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" />
          )}
        </button>
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-medium text-white">
            {userName.slice(0, 1)}
          </div>
          <div className="text-sm">
            <p className="font-medium text-ink">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
