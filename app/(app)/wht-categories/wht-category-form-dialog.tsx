"use client";

import { useForm, type Resolver } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
import {
  whtCategorySchema,
  type WhtCategoryFormValues,
} from "@/lib/validations/wht-category";
import { createWhtCategory, updateWhtCategory } from "@/lib/actions/wht-categories";
import type { Database } from "@/lib/types/database";

type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];

const emptyValues: WhtCategoryFormValues = {
  name: "",
  default_rate_pct: null,
  rate_corporate_pct: null,
  rate_corporate_progressive: false,
  rate_individual_pct: null,
  rate_individual_progressive: false,
  reference_note: "",
};

export function WhtCategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: WhtCategory | null;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WhtCategoryFormValues>({
    resolver: zodResolver(whtCategorySchema) as Resolver<WhtCategoryFormValues>,
    values: category
      ? {
          name: category.name,
          default_rate_pct: category.default_rate_pct,
          rate_corporate_pct: category.rate_corporate_pct,
          rate_corporate_progressive: category.rate_corporate_progressive,
          rate_individual_pct: category.rate_individual_pct,
          rate_individual_progressive: category.rate_individual_progressive,
          reference_note: category.reference_note ?? "",
        }
      : emptyValues,
  });

  const corporateProgressive = watch("rate_corporate_progressive");
  const individualProgressive = watch("rate_individual_progressive");

  async function onSubmit(values: WhtCategoryFormValues) {
    try {
      if (category) {
        await updateWhtCategory(category.id, values);
        toast.success("แก้ไขหมวดหัก ณ ที่จ่ายแล้ว");
      } else {
        await createWhtCategory(values);
        toast.success("เพิ่มหมวดหัก ณ ที่จ่ายใหม่แล้ว");
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
            <DrawerTitle>{category ? "แก้ไขหมวดหัก ณ ที่จ่าย" : "เพิ่มหมวดหัก ณ ที่จ่าย"}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <FormField label="ชื่อหมวด" required error={errors.name?.message}>
              <Input {...register("name")} placeholder="เช่น ค่าบริการ/ค่าจ้างทำของ" />
            </FormField>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <FormField label="อัตรานิติบุคคล (%)" error={errors.rate_corporate_pct?.message}>
                <Input
                  type="number"
                  step="0.01"
                  disabled={corporateProgressive}
                  {...register("rate_corporate_pct")}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rate-corporate-progressive"
                  checked={corporateProgressive}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setValue("rate_corporate_progressive", isChecked);
                    if (isChecked) setValue("rate_corporate_pct", null);
                  }}
                />
                <Label htmlFor="rate-corporate-progressive" className="cursor-pointer font-normal">
                  อัตราก้าวหน้า (นิติบุคคล)
                </Label>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <FormField label="อัตราบุคคลธรรมดา (%)" error={errors.rate_individual_pct?.message}>
                <Input
                  type="number"
                  step="0.01"
                  disabled={individualProgressive}
                  {...register("rate_individual_pct")}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rate-individual-progressive"
                  checked={individualProgressive}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setValue("rate_individual_progressive", isChecked);
                    if (isChecked) setValue("rate_individual_pct", null);
                  }}
                />
                <Label htmlFor="rate-individual-progressive" className="cursor-pointer font-normal">
                  อัตราก้าวหน้า (บุคคลธรรมดา)
                </Label>
              </div>
            </div>

            <FormField
              label="อัตราเริ่มต้น (ใช้ตอนบันทึกบิล)"
              error={errors.default_rate_pct?.message}
            >
              <Input type="number" step="0.01" {...register("default_rate_pct")} />
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
