"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerEyebrow,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";
import { BillForm } from "./bill-form";
import type { HpBillFormValues } from "@/lib/validations/hp-line";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];
type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
type BillPayment = Database["public"]["Tables"]["bill_payments"]["Row"];

type BillDetail = {
  initialValues: HpBillFormValues;
  vendors: Vendor[];
  vehicles: Vehicle[];
  accounts: Account[];
  whtCategories: WhtCategory[];
  assetCategories: AssetCategory[];
  payments: BillPayment[];
  initialIsDraft: boolean;
  initialIsCancelled: boolean;
};

// Row-click detail view for the รายจ่าย and สถานะเอกสารซื้อ tables — reuses the same edit
// form as the full /bills/[hpNumber]/edit page, just fetched on demand and shown in a drawer
// instead of navigating away. `key={hpNumber}` below forces a clean remount per bill, since
// BillForm captures react-hook-form's defaultValues once at mount.
export function BillDetailDrawer({
  hpNumber,
  onClose,
}: {
  hpNumber: string | null;
  onClose: () => void;
}) {
  return (
    <Drawer open={hpNumber != null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent size="wide" className="p-0">
        {hpNumber && <BillDetailBody key={hpNumber} hpNumber={hpNumber} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  );
}

function BillDetailBody({ hpNumber, onClose }: { hpNumber: string; onClose: () => void }) {
  const router = useRouter();
  const [detail, setDetail] = useState<BillDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    fetch(`/api/bills/${hpNumber}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "โหลดข้อมูลไม่สำเร็จ");
        return res.json() as Promise<BillDetail>;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
    };
  }, [hpNumber]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-danger">{error}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
        <Loader2 className="size-5 animate-spin text-muted-2" />
        <p className="text-xs text-muted-foreground">กำลังโหลดเอกสาร {hpNumber}...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader className="shrink-0">
        <DrawerEyebrow>รายจ่าย</DrawerEyebrow>
        <DrawerTitle>เลข HP: {hpNumber}</DrawerTitle>
      </DrawerHeader>
      <DrawerBody className="flex-1 p-0">
        <BillForm
          mode="edit"
          hpNumber={hpNumber}
          vendors={detail.vendors}
          vehicles={detail.vehicles}
          accounts={detail.accounts}
          whtCategories={detail.whtCategories}
          assetCategories={detail.assetCategories}
          initialValues={detail.initialValues}
          payments={detail.payments}
          initialIsDraft={detail.initialIsDraft}
          initialIsCancelled={detail.initialIsCancelled}
          onSaved={() => {
            onClose();
            router.refresh();
          }}
        />
      </DrawerBody>
    </div>
  );
}
