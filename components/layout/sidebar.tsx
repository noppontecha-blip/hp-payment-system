"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  FilePlus,
  FileCheck2,
  FileSpreadsheet,
  Building2,
  Truck,
  BookOpenText,
  Percent,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const mainMenu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "รายการบิล", icon: ReceiptText },
  { href: "/bills/new", label: "สร้างบิล", icon: FilePlus },
  { href: "/document-tracking", label: "ติดตามเอกสารซื้อ", icon: FileCheck2 },
  { href: "/tax-report", label: "รายงานภาษีซื้อ", icon: FileSpreadsheet },
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
  title: ReactNode;
  items: typeof mainMenu;
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-bold tracking-[0.1em] text-muted-2 uppercase">{title}</p>
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
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-[#3D4757] transition-colors hover:bg-secondary",
              active && "bg-navy font-semibold text-white hover:bg-navy",
            )}
          >
            <Icon className="size-[17px] shrink-0" strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({
  userEmail,
  lastUpdatedDate,
  lastUpdatedTime,
}: {
  userEmail?: string | null;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-5 py-6">
        <p className="text-[21px] font-bold text-ink">SPK Crane</p>
        <p className="text-xs text-muted-foreground">ระบบบัญชีคุมบิลจ่าย HP</p>
      </div>
      <nav className="flex flex-1 flex-col gap-6 px-3">
        <NavGroup title="เมนูหลัก" items={mainMenu} pathname={pathname} />
        <NavGroup
          title={
            <>
              ข้อมูล <span className="text-[10px]">MASTER</span>
            </>
          }
          items={masterMenu}
          pathname={pathname}
        />
      </nav>
      <div className="mx-3 mb-3 rounded-lg border border-border p-3">
        <p className="text-[11px] text-muted-foreground">อัปเดตข้อมูล ณ</p>
        <p className="font-mono text-xs font-medium text-navy">
          {lastUpdatedDate} {lastUpdatedTime} น.
        </p>
      </div>
      <form action={signOut} className="border-t border-border p-3">
        {userEmail && <p className="truncate px-3 pb-2 text-xs text-muted-2">{userEmail}</p>}
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium text-[#3D4757] transition-colors hover:bg-secondary"
        >
          <LogOut className="size-[17px] shrink-0" strokeWidth={1.8} />
          ออกจากระบบ
        </button>
      </form>
    </aside>
  );
}
