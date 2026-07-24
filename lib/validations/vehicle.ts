import { z } from "zod";

export const vehicleSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสรถ/เครน"),
  vehicle_type: z.enum(
    [
      "รถเครน",
      "รถบรรทุกติดเครน",
      "รถเทรลเลอร์",
      "หางเทรลเลอร์",
      "รถ Forklift",
      "Handlift",
      "รถกระเช้า",
      "ปิคอัพ",
      "อื่นๆ",
    ],
    { message: "กรุณาเลือกประเภทรถ" },
  ),
  short_name: z.string().optional().nullable(),
  registered_under: z.string().optional().nullable(),
  plate_number: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  chassis_number: z.string().optional().nullable(),
  engine_number: z.string().optional().nullable(),
  serial_number: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
