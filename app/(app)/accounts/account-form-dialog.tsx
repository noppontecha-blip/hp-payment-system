"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { accountSchema, type AccountFormValues } from "@/lib/validations/account";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import type { Database } from "@/lib/types/database";

type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

const emptyValues: AccountFormValues = { code: "", name: "", legacy_note: "" };

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    values: account
      ? { code: account.code, name: account.name, legacy_note: account.legacy_note ?? "" }
      : emptyValues,
  });

  async function onSubmit(values: AccountFormValues) {
    try {
      if (account) {
        await updateAccount(account.id, values);
        toast.success("แก้ไขผังบัญชีแล้ว");
      } else {
        await createAccount(values);
        toast.success("เพิ่มรหัสบัญชีใหม่แล้ว");
      }
      reset(emptyValues);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? "แก้ไขรหัสบัญชี" : "เพิ่มรหัสบัญชี"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="รหัสบัญชี" required error={errors.code?.message}>
            <Input {...register("code")} placeholder="เช่น 511002" />
          </FormField>
          <FormField label="ชื่อบัญชี" required error={errors.name?.message}>
            <Input {...register("name")} />
          </FormField>
          <FormField label="หมายเหตุ (legacy)" error={errors.legacy_note?.message}>
            <Textarea {...register("legacy_note")} rows={2} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
