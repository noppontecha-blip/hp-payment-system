"use client";

import { useForm, type Resolver } from "react-hook-form";
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WhtCategoryFormValues>({
    resolver: zodResolver(whtCategorySchema) as Resolver<WhtCategoryFormValues>,
    values: category
      ? {
          name: category.name,
          default_rate_pct: category.default_rate_pct,
          reference_note: category.reference_note ?? "",
        }
      : emptyValues,
  });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "แก้ไขหมวดหัก ณ ที่จ่าย" : "เพิ่มหมวดหัก ณ ที่จ่าย"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="ชื่อหมวด" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="เช่น ค่าบริการ/ค่าจ้างทำของ" />
          </FormField>
          <FormField label="อัตราเริ่มต้น (%)" error={errors.default_rate_pct?.message}>
            <Input type="number" step="0.01" {...register("default_rate_pct")} />
          </FormField>
          <FormField label="หมายเหตุอ้างอิง" error={errors.reference_note?.message}>
            <Textarea {...register("reference_note")} rows={2} />
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
