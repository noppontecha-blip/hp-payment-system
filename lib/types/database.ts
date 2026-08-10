// Hand-written to match supabase/migrations/*.sql exactly (no live Supabase project to run
// `supabase gen types` against yet). Regenerate with the CLI once a real project is connected.
//
// `Relationships: []` on every table/view is required by @supabase/postgrest-js's GenericTable /
// GenericView constraints even though we have no foreign-key embeds configured here — omitting
// it silently degrades every query builder's inferred types to `never`.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string;
          code: string;
          name: string;
          default_account_code_id: string | null;
          payment_method: string | null;
          bank_name: string | null;
          bank_account_name: string | null;
          default_wht_category_id: string | null;
          wht_certificate_name: string | null;
          bank_account: string | null;
          document_source: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          work_type: "งานซ่อม" | "อะไหล่รอซ่อม" | "รถร่วม" | "ค่าใช้จ่าย" | "ต้นทุนขาย" | null;
          delivery_method: string | null;
          mailing_address: string | null;
          tax_id: string | null;
          vendor_type: "นิติบุคคล" | "บุคคลธรรมดา" | null;
          registered_address: string | null;
          id_document_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendors"]["Row"]> & {
          code: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Row"]>;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          code: string;
          short_name: string | null;
          vehicle_type:
            | "รถเครน"
            | "รถบรรทุกติดเครน"
            | "รถเทรลเลอร์"
            | "หางเทรลเลอร์"
            | "รถ Forklift"
            | "Handlift"
            | "รถกระเช้า"
            | "ปิคอัพ"
            | "อื่นๆ"
            | null;
          brand: string | null;
          plate_number: string | null;
          size: string | null;
          model: string | null;
          chassis_number: string | null;
          engine_number: string | null;
          serial_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vehicles"]["Row"]> & {
          code: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Row"]>;
        Relationships: [];
      };
      chart_of_accounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          name_en: string | null;
          category: "สินทรัพย์" | "หนี้สิน" | "ทุน" | "รายได้" | "ค่าใช้จ่าย" | null;
          account_type: "คุม" | "ย่อย" | null;
          level: number | null;
          parent_code: string | null;
          legacy_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chart_of_accounts"]["Row"]> & {
          code: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["chart_of_accounts"]["Row"]>;
        Relationships: [];
      };
      wht_categories: {
        Row: {
          id: string;
          name: string;
          default_rate_pct: number | null;
          rate_corporate_pct: number | null;
          rate_corporate_progressive: boolean;
          rate_individual_pct: number | null;
          rate_individual_progressive: boolean;
          reference_note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wht_categories"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["wht_categories"]["Row"]>;
        Relationships: [];
      };
      hp_payment_lines: {
        Row: {
          id: string;
          hp_number: string;
          transaction_date: string;
          work_type: "ปกติ" | "สร้างสินทรัพย์";
          asset_construction_detail: string | null;
          special_category: string | null;
          expense_group: "ต้นทุนรายคัน" | "ค่าใช้จ่ายขายและบริหาร" | "สินทรัพย์";
          cost_subtype: "อะไหล่ซ่อม/สต๊อก" | "วัสดุสิ้นเปลือง" | null;
          asset_category_id: string | null;
          asset_useful_life_years: number | null;
          document_type: "ใบกำกับภาษี" | "บิลเงินสด" | "ยังไม่มีเอกสาร";
          document_number: string | null;
          document_invoice_date: string | null;
          vendor_id: string | null;
          vendor_name_snapshot: string;
          description: string;
          account_code_id: string | null;
          vehicle_id: string | null;
          related_vehicles_text: string | null;
          quantity: number | null;
          unit_price: number | null;
          amount_before_vat: number;
          vat_amount: number;
          requires_wht: boolean;
          wht_category_id: string | null;
          wht_rate_pct: number | null;
          wht_payee_name: string | null;
          wht_amount: number | null;
          wht_issue_date: string | null;
          wht_pnd_form: "ภ.ง.ด.3" | "ภ.ง.ด.53" | null;
          net_paid_amount: number;
          payment_method: "บัญชีธนาคารบริษัท" | "สำรองจ่าย" | null;
          payment_date: string | null;
          advance_payer_name: string | null;
          spk_repaid_date: string | null;
          notes: string | null;
          recorded_by: string | null;
          is_draft: boolean;
          is_cancelled: boolean;
          slip_path: string | null;
          slip_ocr_amount: number | null;
          slip_ocr_date: string | null;
          slip_ocr_bank: string | null;
          slip_ocr_reference: string | null;
          slip_looks_valid: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["hp_payment_lines"]["Row"]> & {
          hp_number: string;
          transaction_date: string;
          vendor_name_snapshot: string;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["hp_payment_lines"]["Row"]>;
        Relationships: [];
      };
      hp_number_counters: {
        Row: {
          year_month: string;
          last_seq: number;
        };
        Insert: {
          year_month: string;
          last_seq?: number;
        };
        Update: Partial<Database["public"]["Tables"]["hp_number_counters"]["Row"]>;
        Relationships: [];
      };
      asset_categories: {
        Row: {
          id: string;
          name: string;
          default_useful_life_years: number | null;
          fixed_asset_account_id: string | null;
          accumulated_depreciation_account_id: string | null;
          depreciation_expense_account_id: string | null;
          reference_note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["asset_categories"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["asset_categories"]["Row"]>;
        Relationships: [];
      };
      bill_payments: {
        Row: {
          id: string;
          hp_number: string;
          payment_date: string;
          amount: number;
          payment_method: "บัญชีธนาคารบริษัท" | "สำรองจ่าย" | null;
          notes: string | null;
          recorded_by: string | null;
          slip_path: string | null;
          slip_ocr_amount: number | null;
          slip_ocr_date: string | null;
          slip_ocr_bank: string | null;
          slip_ocr_reference: string | null;
          slip_looks_valid: boolean | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bill_payments"]["Row"]> & {
          hp_number: string;
          payment_date: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["bill_payments"]["Row"]>;
        Relationships: [];
      };
      company_profile: {
        Row: {
          id: string;
          company_name: string;
          tax_id: string | null;
          branch: string | null;
          registered_address: string | null;
          phone: string | null;
          authorized_signer_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_profile"]["Row"]> & {
          company_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_profile"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      hp_voucher_summary: {
        Row: {
          hp_number: string;
          first_date: string;
          line_count: number;
          total_net_paid: number;
          has_asset_line: boolean;
          doc_pending: boolean;
        };
        Relationships: [];
      };
      fixed_asset_register: {
        Row: {
          id: string;
          hp_number: string;
          transaction_date: string;
          description: string;
          vendor_name_snapshot: string;
          vehicle_id: string | null;
          amount_before_vat: number;
          vat_amount: number;
          net_paid_amount: number;
          capitalized_flag: boolean;
          asset_category_id: string | null;
          asset_category_name: string | null;
          asset_useful_life_years: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      generate_next_hp_number: {
        Args: { p_date?: string };
        Returns: string;
      };
      peek_next_hp_number: {
        Args: { p_date?: string };
        Returns: string;
      };
      generate_next_vendor_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
