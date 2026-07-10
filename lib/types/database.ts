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
          account_code_hint: string | null;
          payment_method: string | null;
          default_wht_pct: number | null;
          default_wht_category: string | null;
          wht_certificate_name: string | null;
          bank_account: string | null;
          document_source: string | null;
          contact_info: string | null;
          work_type: string | null;
          delivery_method: string | null;
          mailing_address: string | null;
          tax_id: string | null;
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
          vat_eligible: boolean | null;
          registered_under: string | null;
          plate_number: string | null;
          size: string | null;
          nickname: string | null;
          brand: string | null;
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
          tax_invoice_number: string | null;
          bill_number: string | null;
          vendor_id: string | null;
          vendor_name_snapshot: string;
          description: string;
          account_code_id: string | null;
          vehicle_id: string | null;
          related_vehicles_text: string | null;
          amount_before_vat: number;
          vat_amount: number;
          requires_wht: boolean;
          wht_category_id: string | null;
          wht_rate_pct: number | null;
          wht_payee_name: string | null;
          wht_amount: number | null;
          wht_issue_date: string | null;
          net_paid_amount: number;
          payment_account: string | null;
          advance_payer_name: string | null;
          spk_repaid_date: string | null;
          accounting_office_doc_status: "ครบถ้วน" | "รอเอกสารจากสนง.บัญชี";
          notes: string | null;
          recorded_by: string | null;
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
    };
    Functions: {
      generate_next_hp_number: {
        Args: { p_date?: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
