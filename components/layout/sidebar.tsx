"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  FilePlus,
  FileCheck2,
  Building2,
  Truck,
  BookOpenText,
  Percent,
  HardHat,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const mainMenu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "รายการบิล", icon: ReceiptText },
  { href: "/bills/new", label: "สร้างบิล", icon: FilePlus },
  { href: "/wht-tracking", label: "ติดตามใบหัก", icon: FileCheck2 },
];

const masterMenu = [
  { href: "/vendors", label: "ผู้จำหน่าย", icon: Building2 },
  { href: "/vehicles", label: "รถ-เครน", icon: Truck },
  { href: "/accounts", label: "ผังบัญชี", icon: BookOpenText },
  { href: "/wht-categories", label: "หมวดหัก", icon: Percent },
];

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof mainMenu;
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-medium tracking-wide text-white/40">{title}</p>
      {items.map((item) => {
        const active =
          item.href === "/bills"
            ? pathname === "/bills"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white",
              active && "border-l-amber bg-white/10 font-medium text-amber",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-navy">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber">
          <HardHat className="size-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">SPK Crane</p>
          <p className="text-xs text-white/40">ระบบบัญชีคุมบิลจ่าย HP</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-6 px-3 pb-6">
        <NavGroup title="เมนูหลัก" items={mainMenu} pathname={pathname} />
        <NavGroup title="ข้อมูล MASTER" items={masterMenu} pathname={pathname} />
      </nav>
      <form action={signOut} className="border-t border-white/10 p-3">
        {userEmail && <p className="truncate px-3 pb-2 text-xs text-white/40">{userEmail}</p>}
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4 shrink-0" />
          ออกจากระบบ
        </button>
      </form>
    </aside>
  );
}
