"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountSchema, type AccountFormValues } from "@/lib/validations/account";
import { createAccount, updateAccount, deleteAccount } from "@/lib/actions/accounts";
import type { Database } from "@/lib/types/database";

type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

const CATEGORIES: NonNullable<Account["category"]>[] = [
  "สินทรัพย์",
  "หนี้สิน",
  "ทุน",
  "รายได้",
  "ค่าใช้จ่าย",
];

const NONE = "__none__";

export function AccountDetailPanel({
  account,
  defaultParentCode,
  accounts,
  onSaved,
  onDeleted,
  onCancel,
  onAddChild,
}: {
  account: Account | null;
  defaultParentCode?: string | null;
  accounts: Account[];
  onSaved: (code: string) => void;
  onDeleted: () => void;
  onCancel?: () => void;
  onAddChild?: (parentCode: string) => void;
}) {
  const isCreating = account === null;
  const defaultParent = useMemo(
    () => accounts.find((a) => a.code === defaultParentCode) ?? null,
    [accounts, defaultParentCode],
  );

  const values: AccountFormValues = account
    ? {
        code: account.code,
        name: account.name,
        name_en: account.name_en ?? "",
        category: (account.category ?? undefined) as AccountFormValues["category"],
        account_type: (account.account_type ?? undefined) as AccountFormValues["account_type"],
        parent_code: account.parent_code,
        legacy_note: account.legacy_note ?? "",
      }
    : {
        code: "",
        name: "",
        name_en: "",
        category: (defaultParent?.category ?? undefined) as AccountFormValues["category"],
        account_type: undefined as unknown as AccountFormValues["account_type"],
        parent_code: defaultParentCode ?? null,
        legacy_note: "",
      };

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    values,
  });

  const parentCode = watch("parent_code");
  const parentAccount = useMemo(
    () => accounts.find((a) => a.code === parentCode) ?? null,
    [accounts, parentCode],
  );
  const computedLevel = parentAccount ? (parentAccount.level ?? 0) + 1 : 1;

  const parentOptions = useMemo(
    () =>
      accounts.filter((a) => a.account_type === "คุม" && (!account || a.code !== account.code)),
    [accounts, account],
  );

  async function onSubmit(formValues: AccountFormValues) {
    try {
      if (account) {
        await updateAccount(account.id, formValues);
        toast.success("แก้ไขรหัสบัญชีแล้ว");
      } else {
        await createAccount(formValues);
        toast.success("เพิ่มรหัสบัญชีใหม่แล้ว");
      }
      onSaved(formValues.code);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleDelete() {
    if (!account) return;
    if (!confirm(`ยืนยันลบรหัสบัญชี "${account.code}"?`)) return;
    try {
      await deleteAccount(account.id);
      toast.success("ลบรหัสบัญชีแล้ว");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <Card className="h-fit">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>{isCreating ? "เพิ่มรหัสบัญชี" : "แก้ไขรหัสบัญชี"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="รหัสบัญชี" required error={errors.code?.message}>
              <Input {...register("code")} placeholder="เช่น 5100-01" />
            </FormField>
            <FormField label="ระดับ">
              <Input value={computedLevel} disabled readOnly />
            </FormField>
            <FormField label="ชื่อบัญชี" required error={errors.name?.message} className="col-span-2">
              <Input {...register("name")} />
            </FormField>
            <FormField label="ชื่ออังกฤษ" error={errors.name_en?.message} className="col-span-2">
              <Input {...register("name_en")} />
            </FormField>
            <FormField label="บัญชีคุม (บัญชีแม่)" error={errors.parent_code?.message} className="col-span-2">
              <Controller
                control={control}
                name="parent_code"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ไม่มี (บัญชีระดับบนสุด)">
                        {(value: string) => {
                          if (value === NONE) return "ไม่มี (บัญชีระดับบนสุด)";
                          const parent = accounts.find((a) => a.code === value);
                          return parent ? `${parent.code} — ${parent.name}` : undefined;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>ไม่มี (บัญชีระดับบนสุด)</SelectItem>
                      {parentOptions.map((a) => (
                        <SelectItem key={a.code} value={a.code}>
                          {a.code} — {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="หมวดบัญชี" required error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกหมวดบัญชี" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="ประเภทบัญชี" required error={errors.account_type?.message}>
              <Controller
                control={control}
                name="account_type"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="คุม">คุม (มีบัญชีย่อยได้)</SelectItem>
                      <SelectItem value="ย่อย">ย่อย</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="หมายเหตุ" error={errors.legacy_note?.message} className="col-span-2">
              <Textarea {...register("legacy_note")} rows={2} />
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2">
          <div>
            {!isCreating && account.account_type === "คุม" && onAddChild && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddChild(account.code)}
              >
                <Plus className="size-3.5" />
                เพิ่มบัญชีย่อย
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCreating && onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                ยกเลิก
              </Button>
            )}
            {!isCreating && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="size-3.5" />
                ลบ
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isSubmitting}>
              บันทึก
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
