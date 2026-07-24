"use client";

import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerEyebrow,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import {
  assetCategorySchema,
  type AssetCategoryFormValues,
} from "@/lib/validations/asset-category";
import { createAssetCategory, updateAssetCategory } from "@/lib/actions/asset-categories";
import type { Database } from "@/lib/types/database";

type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

const NONE = "__none__";

const emptyValues: AssetCategoryFormValues = {
  name: "",
  default_useful_life_years: null,
  fixed_asset_account_id: "",
  accumulated_depreciation_account_id: null,
  depreciation_expense_account_id: null,
  reference_note: "",
};

function AccountSelect({
  value,
  onChange,
  options,
  placeholder,
  allowNone,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: Account[];
  placeholder: string;
  allowNone?: boolean;
}) {
  return (
    <Select
      value={value || (allowNone ? NONE : undefined)}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {(v: string) => {
            if (v === NONE) return "ไม่มี (ไม่มีค่าเสื่อมราคา)";
            const account = options.find((a) => a.id === v);
            return account ? `${account.code} — ${account.name}` : undefined;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>ไม่มี (ไม่มีค่าเสื่อมราคา)</SelectItem>}
        {options.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.code} — {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AssetCategoryFormDialog({
  open,
  onOpenChange,
  category,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AssetCategory | null;
  accounts: Account[];
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetCategoryFormValues>({
    resolver: zodResolver(assetCategorySchema) as Resolver<AssetCategoryFormValues>,
    values: category
      ? {
          name: category.name,
          default_useful_life_years: category.default_useful_life_years,
          fixed_asset_account_id: category.fixed_asset_account_id ?? "",
          accumulated_depreciation_account_id: category.accumulated_depreciation_account_id,
          depreciation_expense_account_id: category.depreciation_expense_account_id,
          reference_note: category.reference_note ?? "",
        }
      : emptyValues,
  });

  const fixedAssetOptions = accounts.filter((a) => a.parent_code === "1410-00");
  const accumulatedDepreciationOptions = accounts.filter((a) => a.parent_code === "1420-00");
  const depreciationExpenseOptions = accounts.filter((a) => a.parent_code === "5340-00");

  async function onSubmit(values: AssetCategoryFormValues) {
    try {
      if (category) {
        await updateAssetCategory(category.id, values);
        toast.success("แก้ไขหมวดสินทรัพย์แล้ว");
      } else {
        await createAssetCategory(values);
        toast.success("เพิ่มหมวดสินทรัพย์ใหม่แล้ว");
      }
      reset(emptyValues);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerEyebrow>ข้อมูล MASTER</DrawerEyebrow>
            <DrawerTitle>{category ? "แก้ไขหมวดสินทรัพย์" : "เพิ่มหมวดสินทรัพย์"}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <FormField label="ชื่อหมวด" required error={errors.name?.message}>
              <Input {...register("name")} placeholder="เช่น อุปกรณ์สำนักงาน" />
            </FormField>
            <FormField
              label="อายุการใช้งาน (ปี)"
              error={errors.default_useful_life_years?.message}
            >
              <Input type="number" step="0.5" {...register("default_useful_life_years")} />
            </FormField>
            <FormField
              label="บัญชีสินทรัพย์"
              required
              error={errors.fixed_asset_account_id?.message}
            >
              <Controller
                control={control}
                name="fixed_asset_account_id"
                render={({ field }) => (
                  <AccountSelect
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    options={fixedAssetOptions}
                    placeholder="เลือกบัญชีสินทรัพย์"
                  />
                )}
              />
            </FormField>
            <FormField
              label="บัญชีค่าเสื่อมราคาสะสม"
              error={errors.accumulated_depreciation_account_id?.message}
            >
              <Controller
                control={control}
                name="accumulated_depreciation_account_id"
                render={({ field }) => (
                  <AccountSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={accumulatedDepreciationOptions}
                    placeholder="เลือกบัญชีค่าเสื่อมราคาสะสม"
                    allowNone
                  />
                )}
              />
            </FormField>
            <FormField
              label="บัญชีค่าเสื่อมราคา"
              error={errors.depreciation_expense_account_id?.message}
            >
              <Controller
                control={control}
                name="depreciation_expense_account_id"
                render={({ field }) => (
                  <AccountSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={depreciationExpenseOptions}
                    placeholder="เลือกบัญชีค่าเสื่อมราคา"
                    allowNone
                  />
                )}
              />
            </FormField>
            <FormField label="หมายเหตุอ้างอิง" error={errors.reference_note?.message}>
              <Textarea {...register("reference_note")} rows={2} />
            </FormField>
          </DrawerBody>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              บันทึก
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
