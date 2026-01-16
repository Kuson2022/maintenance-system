export * from "./database";

// User type from Supabase Auth
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = SupabaseUser;

// Extended User with profile data
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "USER" | "TECHNICIAN" | "ADMIN";
  phone?: string;
  avatar_url?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

// Auth Context Type
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}