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
import { vendorSchema, type VendorFormValues } from "@/lib/validations/vendor";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

const emptyValues: VendorFormValues = {
  code: "",
  name: "",
  account_code_hint: "",
  payment_method: null,
  default_wht_pct: null,
  default_wht_category: "",
  wht_certificate_name: "",
  bank_account: "",
  document_source: "",
  contact_info: "",
  work_type: "",
  delivery_method: "",
  mailing_address: "",
  tax_id: "",
};

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    // zod's coerce.number() input type (unknown) vs output type (number) trips up the resolver's
    // inferred generic — cast is the standard workaround for @hookform/resolvers + zod v4 coerce.
    resolver: zodResolver(vendorSchema) as Resolver<VendorFormValues>,
    values: vendor
      ? {
          code: vendor.code,
          name: vendor.name,
          account_code_hint: vendor.account_code_hint ?? "",
          payment_method: (vendor.payment_method as "สด" | "โอน" | null) ?? null,
          default_wht_pct: vendor.default_wht_pct,
          default_wht_category: vendor.default_wht_category ?? "",
          wht_certificate_name: vendor.wht_certificate_name ?? "",
          bank_account: vendor.bank_account ?? "",
          document_source: vendor.document_source ?? "",
          contact_info: vendor.contact_info ?? "",
          work_type: vendor.work_type ?? "",
          delivery_method: vendor.delivery_method ?? "",
          mailing_address: vendor.mailing_address ?? "",
          tax_id: vendor.tax_id ?? "",
        }
      : emptyValues,
  });

  async function onSubmit(values: VendorFormValues) {
    try {
      if (vendor) {
        await updateVendor(vendor.id, values);
        toast.success("แก้ไขข้อมูลผู้จำหน่ายแล้ว");
      } else {
        await createVendor(values);
        toast.success("เพิ่มผู้จำหน่ายใหม่แล้ว");
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
            <DrawerTitle>{vendor ? "แก้ไขผู้จำหน่าย" : "เพิ่มผู้จำหน่าย"}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="รหัสผู้จำหน่าย" required error={errors.code?.message}>
                <Input {...register("code")} placeholder="เช่น V01" />
              </FormField>
              <FormField label="ชื่อผู้จำหน่าย" required error={errors.name?.message}>
                <Input {...register("name")} />
              </FormField>
              <FormField label="รหัสบัญชีที่มักใช้" error={errors.account_code_hint?.message}>
                <Input {...register("account_code_hint")} />
              </FormField>
              <FormField label="วิธีการชำระเงิน" error={errors.payment_method?.message}>
                <Controller
                  control={control}
                  name="payment_method"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกวิธีการชำระเงิน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="สด">สด</SelectItem>
                        <SelectItem value="โอน">โอน</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="อัตราหัก ณ ที่จ่าย (%) เริ่มต้น" error={errors.default_wht_pct?.message}>
                <Input type="number" step="0.01" {...register("default_wht_pct")} />
              </FormField>
              <FormField label="หมวดหัก ณ ที่จ่ายเริ่มต้น" error={errors.default_wht_category?.message}>
                <Input {...register("default_wht_category")} />
              </FormField>
              <FormField label="ชื่อในใบหัก ณ ที่จ่าย" error={errors.wht_certificate_name?.message}>
                <Input {...register("wht_certificate_name")} />
              </FormField>
              <FormField label="เลขบัญชีธนาคาร" error={errors.bank_account?.message}>
                <Input {...register("bank_account")} />
              </FormField>
              <FormField label="แหล่งที่มาเอกสาร" error={errors.document_source?.message}>
                <Input {...register("document_source")} />
              </FormField>
              <FormField label="ข้อมูลติดต่อ" error={errors.contact_info?.message}>
                <Input {...register("contact_info")} />
              </FormField>
              <FormField label="ประเภทงาน" error={errors.work_type?.message}>
                <Input {...register("work_type")} placeholder="ขาย/ซ่อม/บริการ/รถร่วม" />
              </FormField>
              <FormField label="วิธีจัดส่ง" error={errors.delivery_method?.message}>
                <Input {...register("delivery_method")} />
              </FormField>
              <FormField label="เลขประจำตัวผู้เสียภาษี" error={errors.tax_id?.message}>
                <Input {...register("tax_id")} />
              </FormField>
            </div>
            <FormField label="ที่อยู่จัดส่งเอกสาร" error={errors.mailing_address?.message}>
              <Textarea {...register("mailing_address")} rows={2} />
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
