"use client";

import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/shared/form-field";
import { Label } from "@/components/ui/label";
import { vehicleSchema, type VehicleFormValues } from "@/lib/validations/vehicle";
import { createVehicle, updateVehicle } from "@/lib/actions/vehicles";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

const emptyValues: VehicleFormValues = {
  code: "",
  vat_eligible: false,
  registered_under: "",
  plate_number: "",
  size: "",
  nickname: "",
  brand: "",
  model: "",
  chassis_number: "",
  engine_number: "",
  serial_number: "",
};

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    values: vehicle
      ? {
          code: vehicle.code,
          vat_eligible: vehicle.vat_eligible ?? false,
          registered_under: vehicle.registered_under ?? "",
          plate_number: vehicle.plate_number ?? "",
          size: vehicle.size ?? "",
          nickname: vehicle.nickname ?? "",
          brand: vehicle.brand ?? "",
          model: vehicle.model ?? "",
          chassis_number: vehicle.chassis_number ?? "",
          engine_number: vehicle.engine_number ?? "",
          serial_number: vehicle.serial_number ?? "",
        }
      : emptyValues,
  });

  async function onSubmit(values: VehicleFormValues) {
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, values);
        toast.success("แก้ไขข้อมูลรถ/เครนแล้ว");
      } else {
        await createVehicle(values);
        toast.success("เพิ่มรถ/เครนใหม่แล้ว");
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
            <DrawerTitle>{vehicle ? "แก้ไขรถ/เครน" : "เพิ่มรถ/เครน"}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="รหัสรถ/เครน" required error={errors.code?.message}>
              <Input {...register("code")} placeholder="เช่น C04" />
            </FormField>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label>เข้าเกณฑ์ VAT</Label>
              <Controller
                control={control}
                name="vat_eligible"
                render={({ field }) => (
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <FormField label="จดชื่อ" error={errors.registered_under?.message}>
              <Input {...register("registered_under")} />
            </FormField>
            <FormField label="ทะเบียน" error={errors.plate_number?.message}>
              <Input {...register("plate_number")} />
            </FormField>
            <FormField label="ขนาด" error={errors.size?.message}>
              <Input {...register("size")} placeholder="เช่น 25 ตัน" />
            </FormField>
            <FormField label="ชื่อเล่น" error={errors.nickname?.message}>
              <Input {...register("nickname")} />
            </FormField>
            <FormField label="ยี่ห้อ" error={errors.brand?.message}>
              <Input {...register("brand")} />
            </FormField>
            <FormField label="รุ่น" error={errors.model?.message}>
              <Input {...register("model")} />
            </FormField>
            <FormField label="เลขตัวถัง" error={errors.chassis_number?.message}>
              <Input {...register("chassis_number")} />
            </FormField>
            <FormField label="เลขเครื่องยนต์" error={errors.engine_number?.message}>
              <Input {...register("engine_number")} />
            </FormField>
            <FormField label="เลขซีเรียล" error={errors.serial_number?.message}>
              <Input {...register("serial_number")} />
            </FormField>
          </div>
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
