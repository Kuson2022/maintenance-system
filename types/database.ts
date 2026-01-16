/**
 * Database Types
 * สามารถ generate อัตโนมัติจาก Supabase CLI ได้
 * npx supabase gen types typescript --project-id "your-project-id" --schema public > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// User Role Enum
export type UserRole = "USER" | "TECHNICIAN" | "ADMIN";

// User Status Enum
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// Work Order Status Enum
export type WorkOrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

// Work Order Priority Enum
export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Equipment Status Enum
export type EquipmentStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "RETIRED";

// Database Tables Interface
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          phone: string | null;
          avatar_url: string | null;
          status: UserStatus;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: UserRole;
          phone?: string | null;
          avatar_url?: string | null;
          status?: UserStatus;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          phone?: string | null;
          avatar_url?: string | null;
          status?: UserStatus;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          code: string;
          name: string;
          category_id: string;
          type: string | null;
          manufacturer: string | null;
          serial_number: string | null;
          location: string | null;
          installation_date: string | null;
          warranty_expiry: string | null;
          cost: number | null;
          status: EquipmentStatus;
          qr_code: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category_id: string;
          type?: string | null;
          manufacturer?: string | null;
          serial_number?: string | null;
          location?: string | null;
          installation_date?: string | null;
          warranty_expiry?: string | null;
          cost?: number | null;
          status?: EquipmentStatus;
          qr_code: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          category_id?: string;
          type?: string | null;
          manufacturer?: string | null;
          serial_number?: string | null;
          location?: string | null;
          installation_date?: string | null;
          warranty_expiry?: string | null;
          cost?: number | null;
          status?: EquipmentStatus;
          qr_code?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_orders: {
        Row: {
          id: string;
          wo_number: string;
          equipment_id: string;
          title: string;
          description: string;
          priority: WorkOrderPriority;
          status: WorkOrderStatus;
          reported_by: string;
          assigned_to: string | null;
          reported_at: string;
          started_at: string | null;
          completed_at: string | null;
          due_date: string | null;
          resolution_time_hours: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wo_number?: string;
          equipment_id: string;
          title: string;
          description: string;
          priority?: WorkOrderPriority;
          status?: WorkOrderStatus;
          reported_by: string;
          assigned_to?: string | null;
          reported_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          due_date?: string | null;
          resolution_time_hours?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wo_number?: string;
          equipment_id?: string;
          title?: string;
          description?: string;
          priority?: WorkOrderPriority;
          status?: WorkOrderStatus;
          reported_by?: string;
          assigned_to?: string | null;
          reported_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          due_date?: string | null;
          resolution_time_hours?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      work_order_status: WorkOrderStatus;
      work_order_priority: WorkOrderPriority;
      equipment_status: EquipmentStatus;
    };
  };
}

// Helper Types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];