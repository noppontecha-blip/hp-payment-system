import { Bell, Search } from "lucide-react";

export function Header({
  title,
  subtitle,
  hasNotification = false,
  userName = "ผู้ใช้งาน",
  userRole = "เจ้าหน้าที่บัญชี",
}: {
  title: string;
  subtitle?: string;
  hasNotification?: boolean;
  userName?: string;
  userRole?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      <div>
        <h1 className="text-xl font-bold text-navy-text">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="ค้นหา"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="size-4" />
          {hasNotification && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-amber" />
          )}
        </button>
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-medium text-white">
            {userName.slice(0, 1)}
          </div>
          <div className="text-sm">
            <p className="font-medium text-navy-text">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
