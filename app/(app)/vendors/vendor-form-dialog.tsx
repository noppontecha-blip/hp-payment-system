"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Download, Loader2, Sparkles, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { vendorSchema, type VendorFormValues } from "@/lib/validations/vendor";
import { sanitizeFileName } from "@/lib/utils/format";
import { composeThaiAddress } from "@/lib/utils/address";
import { createVendor, updateVendor, generateVendorCode } from "@/lib/actions/vendors";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];

const NONE = "__none__";

// No numeric input for the WHT rate — it's always derived from the chosen category +
// vendor_type so the user can't type in a rate that doesn't match either one.
function resolveWhtRateLabel(
  category: WhtCategory | undefined,
  vendorType: VendorFormValues["vendor_type"],
) {
  if (!category) return "-";
  if (!vendorType) return "เลือกประเภทผู้จำหน่ายก่อน";
  const progressive =
    vendorType === "นิติบุคคล"
      ? category.rate_corporate_progressive
      : category.rate_individual_progressive;
  if (progressive) return "อัตราก้าวหน้า";
  const rate = vendorType === "นิติบุคคล" ? category.rate_corporate_pct : category.rate_individual_pct;
  return rate != null ? `${rate}%` : "ไม่มีข้อมูล";
}

const emptyValues: VendorFormValues = {
  code: "",
  name: "",
  vendor_type: null,
  vat_registered: true,
  tax_id: "",
  default_account_code_id: "",
  payment_method: null,
  bank_name: "",
  bank_account: "",
  bank_account_name: "",
  default_wht_category_id: null,
  wht_certificate_name: "",
  document_source: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  work_type: null,
  delivery_method: "",
  mailing_address: "",
  registered_address: "",
  address_number: "",
  address_moo: "",
  address_village: "",
  address_soi: "",
  address_road: "",
  address_subdistrict: "",
  address_district: "",
  address_province: "",
  address_postal_code: "",
  branch_type: "สำนักงานใหญ่",
  branch_code: "",
  id_document_path: "",
};

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
  accounts,
  whtCategories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
  accounts: Account[];
  whtCategories: WhtCategory[];
}) {
  const [dbdLoading, setDbdLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    // zod's coerce.number() input type (unknown) vs output type (number) trips up the resolver's
    // inferred generic — cast is the standard workaround for @hookform/resolvers + zod v4 coerce.
    resolver: zodResolver(vendorSchema) as Resolver<VendorFormValues>,
    values: vendor
      ? {
          code: vendor.code,
          name: vendor.name,
          vendor_type: vendor.vendor_type ?? null,
          vat_registered: vendor.vat_registered,
          tax_id: vendor.tax_id ?? "",
          default_account_code_id: vendor.default_account_code_id ?? "",
          payment_method: (vendor.payment_method as "สด" | "โอน" | null) ?? null,
          bank_name: vendor.bank_name ?? "",
          bank_account: vendor.bank_account ?? "",
          bank_account_name: vendor.bank_account_name ?? "",
          default_wht_category_id: vendor.default_wht_category_id,
          wht_certificate_name: vendor.wht_certificate_name ?? "",
          document_source: vendor.document_source ?? "",
          contact_name: vendor.contact_name ?? "",
          contact_phone: vendor.contact_phone ?? "",
          contact_email: vendor.contact_email ?? "",
          work_type: vendor.work_type ?? null,
          delivery_method: vendor.delivery_method ?? "",
          mailing_address: vendor.mailing_address ?? "",
          registered_address: vendor.registered_address ?? "",
          address_number: vendor.address_number ?? "",
          address_moo: vendor.address_moo ?? "",
          address_village: vendor.address_village ?? "",
          address_soi: vendor.address_soi ?? "",
          address_road: vendor.address_road ?? "",
          address_subdistrict: vendor.address_subdistrict ?? "",
          address_district: vendor.address_district ?? "",
          address_province: vendor.address_province ?? "",
          address_postal_code: vendor.address_postal_code ?? "",
          branch_type: vendor.branch_type ?? "สำนักงานใหญ่",
          branch_code: vendor.branch_code ?? "",
          id_document_path: vendor.id_document_path ?? "",
        }
      : emptyValues,
  });

  const vendorType = watch("vendor_type");
  const idDocumentPath = watch("id_document_path");
  const paymentMethod = watch("payment_method");
  const branchType = watch("branch_type");
  const whtCertificateName = watch("wht_certificate_name");
  const defaultWhtCategoryId = watch("default_wht_category_id");
  const selectedWhtCategory = whtCategories.find((c) => c.id === defaultWhtCategoryId);
  const whtRateLabel = resolveWhtRateLabel(selectedWhtCategory, vendorType);
  const [useVendorNameForWht, setUseVendorNameForWht] = useState(!vendor?.wht_certificate_name);

  useEffect(() => {
    setUseVendorNameForWht(!vendor?.wht_certificate_name);
  }, [vendor]);

  // New vendor only — reserve the next code as soon as the drawer opens, mirroring how
  // bill-form.tsx generates hp_number on page load (an unsaved close just skips that number).
  useEffect(() => {
    if (open && !vendor) {
      generateVendorCode()
        .then((code) => {
          setGeneratedCode(code);
          setValue("code", code);
        })
        .catch(() => toast.error("สร้างรหัสผู้จำหน่ายไม่สำเร็จ"));
    }
  }, [open, vendor, setValue]);

  async function handleDbdLookup() {
    const taxId = getValues("tax_id")?.trim();
    if (!taxId) {
      toast.error("กรุณากรอกเลขทะเบียนนิติบุคคล 13 หลักก่อน");
      return;
    }
    setDbdLoading(true);
    try {
      const res = await fetch(`/api/vendors/dbd-lookup?taxId=${encodeURIComponent(taxId)}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        toast.error(data.message ?? "ไม่พบข้อมูลจาก DBD");
        return;
      }
      if (data.name) setValue("name", data.name);
      if (data.registered_address) setValue("registered_address", data.registered_address);
      toast.success("ดึงข้อมูลจาก DBD สำเร็จ");
    } catch {
      toast.error("เชื่อมต่อ DBD ไม่สำเร็จ ลองอีกครั้ง หรือกรอกข้อมูลเอง");
    } finally {
      setDbdLoading(false);
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const code = getValues("code")?.trim() || "vendor";
      const path = `${code}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("vendor-documents").upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      setValue("id_document_path", path);
      toast.success("อัปโหลดเอกสารแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleViewDocument() {
    const path = getValues("id_document_path");
    if (!path) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("vendor-documents")
      .createSignedUrl(path, 3600);
    if (error || !data) {
      toast.error("เปิดเอกสารไม่สำเร็จ");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function onSubmit(rawValues: VendorFormValues) {
    // registered_address is derived from the structured fields, not typed directly — recompute
    // it here so existing readers (bill-form, 50-ทวิ route) keep getting a correct joined string.
    // If none of the structured fields were filled (e.g. the address came from the DBD lookup as
    // one plain string and the owner never broke it apart), keep whatever's already there instead
    // of overwriting it with an empty string.
    const composed = composeThaiAddress(rawValues);
    const values = { ...rawValues, registered_address: composed || rawValues.registered_address };
    try {
      if (vendor) {
        await updateVendor(vendor.id, values);
        toast.success("แก้ไขข้อมูลผู้จำหน่ายแล้ว");
      } else {
        await createVendor(values);
        toast.success("เพิ่มผู้จำหน่ายใหม่แล้ว");
      }
      reset(emptyValues);
      setGeneratedCode(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  const displayCode = vendor ? vendor.code : (generatedCode ?? "กำลังสร้างรหัส...");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerEyebrow>ข้อมูล MASTER</DrawerEyebrow>
            <div className="flex items-center justify-between gap-2">
              <DrawerTitle>{vendor ? "แก้ไขผู้จำหน่าย" : "เพิ่มผู้จำหน่าย"}</DrawerTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                รหัส: {displayCode}
              </span>
            </div>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={vendorType === "บุคคลธรรมดา" ? "เลขบัตรประชาชน 13 หลัก" : "เลขทะเบียนนิติบุคคล 13 หลัก"}
                error={errors.tax_id?.message}
                className="col-span-2"
              >
                <div className="flex items-center gap-2">
                  <Input {...register("tax_id")} placeholder="13 หลัก" maxLength={13} className="w-40" />
                  {vendorType === "นิติบุคคล" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDbdLookup}
                      disabled={dbdLoading}
                      className="shrink-0"
                    >
                      {dbdLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      ดึงจาก DBD
                    </Button>
                  )}
                </div>
              </FormField>
              <FormField label="ประเภทผู้จำหน่าย" error={errors.vendor_type?.message}>
                <Controller
                  control={control}
                  name="vendor_type"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกประเภทผู้จำหน่าย" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="นิติบุคคล">นิติบุคคล</SelectItem>
                        <SelectItem value="บุคคลธรรมดา">บุคคลธรรมดา</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label=" ">
                <div className="flex h-9 items-center gap-2">
                  <Controller
                    control={control}
                    name="vat_registered"
                    render={({ field }) => (
                      <Checkbox
                        id="vat-registered"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Label htmlFor="vat-registered" className="cursor-pointer font-normal">
                    ผู้จำหน่ายจดทะเบียน VAT
                  </Label>
                </div>
              </FormField>
              <FormField label="ชื่อผู้จำหน่าย" required error={errors.name?.message}>
                <Input
                  {...register("name")}
                  placeholder={vendorType === "นิติบุคคล" ? "เช่น บริษัท ทดสอบ จำกัด" : undefined}
                />
              </FormField>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="branch-hq"
                    checked={branchType === "สำนักงานใหญ่"}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setValue("branch_type", "สำนักงานใหญ่");
                        setValue("branch_code", "");
                      }
                    }}
                  />
                  <Label htmlFor="branch-hq" className="cursor-pointer font-normal">
                    สำนักงานใหญ่
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="branch-sub"
                    checked={branchType === "สาขา"}
                    onCheckedChange={(checked) => {
                      if (checked === true) setValue("branch_type", "สาขา");
                    }}
                  />
                  <Label htmlFor="branch-sub" className="cursor-pointer font-normal">
                    สาขา
                  </Label>
                </div>
                {branchType === "สาขา" && (
                  <Input
                    {...register("branch_code")}
                    placeholder="รหัสสาขา เช่น 00001"
                    maxLength={5}
                    className="w-36"
                  />
                )}
              </div>
              {errors.branch_code && (
                <p className="col-span-2 -mt-2 text-xs text-destructive">{errors.branch_code.message}</p>
              )}

              <FormField label="ที่อยู่จดทะเบียน (สำหรับใบ 50 ทวิ)" className="col-span-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">เลขที่</Label>
                    <Input {...register("address_number")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">หมู่ที่</Label>
                    <Input {...register("address_moo")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">หมู่บ้าน/นิคม</Label>
                    <Input {...register("address_village")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">ซอย</Label>
                    <Input {...register("address_soi")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">ถนน</Label>
                    <Input {...register("address_road")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">ตำบล/แขวง</Label>
                    <Input {...register("address_subdistrict")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">อำเภอ/เขต</Label>
                    <Input {...register("address_district")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">จังหวัด</Label>
                    <Input {...register("address_province")} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">รหัสไปรษณีย์</Label>
                    <Input {...register("address_postal_code")} maxLength={5} />
                  </div>
                </div>
              </FormField>
              <FormField
                label="บัญชีที่มักใช้"
                required
                error={errors.default_account_code_id?.message}
                className="col-span-2"
              >
                <Controller
                  control={control}
                  name="default_account_code_id"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกบัญชีต้นทุน/รายจ่ายที่มักใช้">
                          {(value: string) => {
                            const account = accounts.find((a) => a.id === value);
                            return account ? `${account.code} — ${account.name}` : undefined;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
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
              {paymentMethod === "โอน" && (
                <>
                  <FormField label="ธนาคาร" required error={errors.bank_name?.message}>
                    <Input {...register("bank_name")} />
                  </FormField>
                  <FormField label="เลขบัญชี" required error={errors.bank_account?.message}>
                    <Input {...register("bank_account")} placeholder="เช่น 123-4-56789-0" />
                  </FormField>
                  <FormField label="ชื่อบัญชี" required error={errors.bank_account_name?.message}>
                    <Input {...register("bank_account_name")} />
                  </FormField>
                </>
              )}
              <FormField
                label="หมวดหัก ณ ที่จ่ายเริ่มต้น"
                error={errors.default_wht_category_id?.message}
              >
                <Controller
                  control={control}
                  name="default_wht_category_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ไม่ระบุ">
                          {(value: string) => {
                            if (value === NONE) return "ไม่ระบุ";
                            const category = whtCategories.find((c) => c.id === value);
                            return category ? category.name : undefined;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                        {whtCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="อัตราหัก ณ ที่จ่าย (default)">
                <Input value={whtRateLabel} disabled readOnly />
              </FormField>
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="use-vendor-name-wht"
                    checked={useVendorNameForWht}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setUseVendorNameForWht(isChecked);
                      if (isChecked) setValue("wht_certificate_name", null);
                    }}
                  />
                  <Label htmlFor="use-vendor-name-wht" className="cursor-pointer font-normal">
                    ชื่อในใบหัก ณ ที่จ่าย: ใช้ชื่อเดียวกับผู้จำหน่าย
                  </Label>
                </div>
                {!useVendorNameForWht && (
                  <FormField label="ชื่อในใบหัก ณ ที่จ่าย" error={errors.wht_certificate_name?.message}>
                    <Input
                      value={whtCertificateName ?? ""}
                      onChange={(e) => setValue("wht_certificate_name", e.target.value)}
                    />
                  </FormField>
                )}
              </div>
              <FormField label="ชื่อผู้ติดต่อ" error={errors.contact_name?.message}>
                <Input {...register("contact_name")} />
              </FormField>
              <FormField label="เบอร์โทร" error={errors.contact_phone?.message}>
                <Input {...register("contact_phone")} />
              </FormField>
              <FormField label="อีเมล" error={errors.contact_email?.message}>
                <Input type="email" {...register("contact_email")} />
              </FormField>
              <FormField label="ประเภทงาน" error={errors.work_type?.message}>
                <Controller
                  control={control}
                  name="work_type"
                  render={({ field }) => (
                    <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกประเภทงาน">
                          {(value: string) => (value === NONE ? "ไม่ระบุ" : value)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                        <SelectItem value="งานซ่อม">งานซ่อม</SelectItem>
                        <SelectItem value="อะไหล่รอซ่อม">อะไหล่รอซ่อม</SelectItem>
                        <SelectItem value="รถร่วม">รถร่วม</SelectItem>
                        <SelectItem value="ค่าใช้จ่าย">ค่าใช้จ่าย</SelectItem>
                        <SelectItem value="ต้นทุนขาย">ต้นทุนขาย</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="แหล่งที่มาเอกสาร" error={errors.document_source?.message}>
                <Input {...register("document_source")} />
              </FormField>
              <FormField label="วิธีจัดส่ง" error={errors.delivery_method?.message}>
                <Input {...register("delivery_method")} />
              </FormField>
            </div>
            <FormField label="ที่อยู่จัดส่งเอกสาร" error={errors.mailing_address?.message}>
              <Textarea {...register("mailing_address")} rows={2} />
            </FormField>
            <FormField label="สำเนาบัตรประชาชน / เอกสารยืนยันตัวตน">
              <div className="flex items-center gap-2">
                <label>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    อัปโหลดไฟล์
                  </span>
                </label>
                {idDocumentPath && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleViewDocument}>
                    <Download className="size-4" />
                    ดูเอกสารที่แนบไว้
                  </Button>
                )}
              </div>
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
