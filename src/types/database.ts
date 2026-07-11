export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          company_name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          billing_address: string | null;
          contract_start: string | null;
          contract_end: string | null;
          monthly_invoice_amount: number | null;
          payment_terms_days: number | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          billing_address?: string | null;
          contract_start?: string | null;
          contract_end?: string | null;
          monthly_invoice_amount?: number | null;
          payment_terms_days?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          billing_address?: string | null;
          contract_start?: string | null;
          contract_end?: string | null;
          monthly_invoice_amount?: number | null;
          payment_terms_days?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      timesheets: {
        Row: {
          id: string;
          client_id: string;
          month: number;
          year: number;
          total_hours: number | null;
          status: string | null;
          sent_date: string | null;
          approved_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          month: number;
          year: number;
          total_hours?: number | null;
          status?: string | null;
          sent_date?: string | null;
          approved_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          month?: number;
          year?: number;
          total_hours?: number | null;
          status?: string | null;
          sent_date?: string | null;
          approved_date?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      invoices: {
        Row: {
          id: string;
          client_id: string;
          timesheet_id: string | null;
          invoice_number: string;
          invoice_date: string;
          due_date: string | null;
          subtotal: number | null;
          vat_amount: number | null;
          total_amount: number | null;
          paid_amount: number | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          timesheet_id?: string | null;
          invoice_number: string;
          invoice_date?: string;
          due_date?: string | null;
          subtotal?: number | null;
          vat_amount?: number | null;
          total_amount?: number | null;
          paid_amount?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          timesheet_id?: string | null;
          invoice_number?: string;
          invoice_date?: string;
          due_date?: string | null;
          subtotal?: number | null;
          vat_amount?: number | null;
          total_amount?: number | null;
          paid_amount?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method: string | null;
          reference_number: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          payment_date?: string;
          payment_method?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};