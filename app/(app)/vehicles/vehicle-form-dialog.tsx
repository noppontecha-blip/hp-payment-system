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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleSchema, type VehicleFormValues } from "@/lib/validations/vehicle";
import { createVehicle, updateVehicle } from "@/lib/actions/vehicles";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

const VEHICLE_TYPES: NonNullable<Vehicle["vehicle_type"]>[] = [
  "รถเครน",
  "รถบรรทุกติดเครน",
  "รถเทรลเลอร์",
  "หางเทรลเลอร์",
  "รถ Forklift",
  "Handlift",
  "รถกระเช้า",
  "ปิคอัพ",
  "อื่นๆ",
];

// Code stays manual entry — only the type-prefix letters auto-fill, the running number
// after it is typed by hand.
const VEHICLE_TYPE_PREFIXES: Record<NonNullable<Vehicle["vehicle_type"]>, string> = {
  รถเครน: "C",
  รถบรรทุกติดเครน: "H",
  รถเทรลเลอร์: "TL",
  หางเทรลเลอร์: "TTL",
  "รถ Forklift": "FL",
  Handlift: "HL",
  รถกระเช้า: "SK",
  ปิคอัพ: "PK",
  อื่นๆ: "OH",
};

const emptyValues: VehicleFormValues = {
  code: "",
  short_name: "",
  vehicle_type: undefined as unknown as VehicleFormValues["vehicle_type"],
  registered_under: "",
  plate_number: "",
  size: "",
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    values: vehicle
      ? {
          code: vehicle.code,
          short_name: vehicle.short_name ?? "",
          vehicle_type: vehicle.vehicle_type ?? (undefined as unknown as VehicleFormValues["vehicle_type"]),
          registered_under: vehicle.registered_under ?? "",
          plate_number: vehicle.plate_number ?? "",
          size: vehicle.size ?? "",
          model: vehicle.model ?? "",
          chassis_number: vehicle.chassis_number ?? "",
          engine_number: vehicle.engine_number ?? "",
          serial_number: vehicle.serial_number ?? "",
        }
      : emptyValues,
  });

  function handleVehicleTypeChange(value: string | null, onChange: (value: string) => void) {
    if (!value) return;
    onChange(value);
    // New vehicles only — prefill the code with just the type's prefix letters, the owner
    // types the running number after it. Editing an existing vehicle never touches its code.
    if (!vehicle) {
      const prefix = VEHICLE_TYPE_PREFIXES[value as NonNullable<Vehicle["vehicle_type"]>];
      setValue("code", prefix);
    }
  }

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
            <FormField label="ประเภทรถ" required error={errors.vehicle_type?.message}>
              <Controller
                control={control}
                name="vehicle_type"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(v) => handleVehicleTypeChange(v, field.onChange)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกประเภทรถ" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="รหัสรถ/เครน" required error={errors.code?.message}>
              <Input {...register("code")} placeholder="เช่น C00042" />
            </FormField>
            <FormField
              label="ชื่อย่อ"
              error={errors.short_name?.message}
              className="col-span-2"
            >
              <Input
                {...register("short_name")}
                placeholder="เช่น เครน4 — ใช้เลือกรถตอนบันทึกค่าใช้จ่ายแทนรหัสยาวๆ"
              />
            </FormField>
            <FormField label="รายละเอียดรถ" error={errors.registered_under?.message} className="col-span-2">
              <Textarea {...register("registered_under")} rows={3} />
            </FormField>
            <FormField label="ทะเบียน" error={errors.plate_number?.message}>
              <Input {...register("plate_number")} />
            </FormField>
            <FormField label="ขนาด" error={errors.size?.message}>
              <Input {...register("size")} placeholder="เช่น 25 ตัน" />
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
