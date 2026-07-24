"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import {
  companyProfileSchema,
  type CompanyProfileFormValues,
} from "@/lib/validations/company-profile";
import { updateCompanyProfile } from "@/lib/actions/company-profile";
import type { Database } from "@/lib/types/database";

type CompanyProfile = Database["public"]["Tables"]["company_profile"]["Row"];

export function CompanyProfileForm({ profile }: { profile: CompanyProfile }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema) as Resolver<CompanyProfileFormValues>,
    values: {
      company_name: profile.company_name,
      tax_id: profile.tax_id ?? "",
      branch: profile.branch ?? "",
      registered_address: profile.registered_address ?? "",
      phone: profile.phone ?? "",
      authorized_signer_name: profile.authorized_signer_name ?? "",
    },
  });

  async function onSubmit(values: CompanyProfileFormValues) {
    try {
      await updateCompanyProfile(profile.id, values);
      toast.success("บันทึกข้อมูลบริษัทแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl space-y-4 p-5"
    >
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
        <FormField label="ชื่อบริษัท" required error={errors.company_name?.message}>
          <Input {...register("company_name")} />
        </FormField>
        <FormField label="เลขประจำตัวผู้เสียภาษี" error={errors.tax_id?.message}>
          <Input {...register("tax_id")} placeholder="13 หลัก" />
        </FormField>
        <FormField label="สาขา" error={errors.branch?.message}>
          <Input {...register("branch")} placeholder="สำนักงานใหญ่" />
        </FormField>
        <FormField label="เบอร์โทรศัพท์" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </FormField>
        <FormField label="ชื่อผู้มีอำนาจลงนาม" error={errors.authorized_signer_name?.message}>
          <Input {...register("authorized_signer_name")} />
        </FormField>
        <FormField
          label="ที่อยู่จดทะเบียน (สำหรับใบ 50 ทวิ)"
          className="sm:col-span-2"
          error={errors.registered_address?.message}
        >
          <Textarea {...register("registered_address")} rows={3} />
        </FormField>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        บันทึก
      </Button>
    </form>
  );
}
