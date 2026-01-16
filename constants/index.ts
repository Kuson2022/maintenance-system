export const APP_NAME = "ระบบบริหารงานซ่อมบำรุง";
export const APP_DESCRIPTION = "Maintenance Management System";

// Work Order Status
export const WORK_ORDER_STATUS = {
  PENDING: "รอดำเนินการ",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  ON_HOLD: "พักการดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
} as const;

// Work Order Priority
export const WORK_ORDER_PRIORITY = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  CRITICAL: "ฉุกเฉิน",
} as const;

// User Roles
export const USER_ROLES = {
  USER: "ผู้ใช้",
  TECHNICIAN: "ช่างเทคนิค",
  ADMIN: "ผู้ดูแลระบบ",
} as const;

// Status Colors
export const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200",
  ON_HOLD: "bg-purple-100 text-purple-800 border-purple-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
} as const;

// Priority Colors
export const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-800 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
} as const;

// Date Formats
export const DATE_FORMAT = "dd/MM/yyyy";
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];