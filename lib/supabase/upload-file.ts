// lib/supabase/upload-file.ts

import { createClient } from "@/lib/supabase/client";

// =============================================
// TYPES & INTERFACES
// =============================================

export interface UploadFileResult {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  path?: string; // เพิ่ม path สำหรับการลบไฟล์
}

export interface UploadOptions {
  maxSize?: number; // ขนาดไฟล์สูงสุดเป็น bytes (default: 10MB)
  allowedTypes?: string[]; // ประเภทไฟล์ที่อนุญาต
  validateBeforeUpload?: boolean; // validate ก่อนอัปโหลดหรือไม่ (default: true)
}

// =============================================
// CONSTANTS
// =============================================

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const DEFAULT_BUCKET = "attachments"; // bucket name ที่ใช้ในระบบ

// =============================================
// VALIDATION FUNCTIONS
// =============================================

/**
 * ตรวจสอบความถูกต้องของไฟล์
 */
export function validateFile(
  file: File,
  options: UploadOptions = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;

  // ตรวจสอบขนาดไฟล์
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `ไฟล์ "${file.name}" มีขนาดใหญ่เกิน ${maxSizeMB}MB`,
    };
  }

  // ตรวจสอบประเภทไฟล์
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `ไฟล์ "${file.name}" เป็นประเภทที่ไม่รองรับ (รองรับเฉพาะรูปภาพและ PDF)`,
    };
  }

  return { valid: true };
}

/**
 * ตรวจสอบไฟล์หลายไฟล์
 */
export function validateFiles(
  files: File[],
  options: UploadOptions = {}
): { valid: boolean; error?: string } {
  for (const file of files) {
    const result = validateFile(file, options);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}

// =============================================
// UPLOAD FUNCTIONS
// =============================================

/**
 * อัพโหลดไฟล์ไปยัง Supabase Storage
 * 
 * @param file - ไฟล์ที่ต้องการอัปโหลด
 * @param folder - โฟลเดอร์ที่จะเก็บไฟล์ (default: "work-orders")
 * @param options - ตัวเลือกเพิ่มเติมสำหรับการ validate
 * @returns ข้อมูลไฟล์ที่อัปโหลดสำเร็จ หรือ null ถ้าล้มเหลว
 */
export async function uploadFile(
  file: File,
  folder: string = "work-orders",
  options: UploadOptions = {}
): Promise<{ url: string; path: string } | null> {
  try {
    // Validate ไฟล์ก่อนอัปโหลด (ถ้าเปิดใช้งาน)
    if (options.validateBeforeUpload !== false) {
      const validation = validateFile(file, options);
      if (!validation.valid) {
        console.error("Validation error:", validation.error);
        throw new Error(validation.error);
      }
    }

    const supabase = createClient();

    // สร้างชื่อไฟล์ที่ unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // อัพโหลดไฟล์
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET) // ชื่อ bucket ใน Supabase Storage
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`ไม่สามารถอัปโหลดไฟล์ได้: ${error.message}`);
    }

    // ดึง public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error("Upload file error:", error);
    throw error; // throw แทน return null เพื่อให้ caller จัดการ error
  }
}

/**
 * อัพโหลดไฟล์และคืนค่าในรูปแบบที่ database ต้องการ
 * 
 * @param file - ไฟล์ที่ต้องการอัปโหลด
 * @param folder - โฟลเดอร์ที่จะเก็บไฟล์
 * @param options - ตัวเลือกเพิ่มเติม
 * @returns ข้อมูลไฟล์พร้อม metadata สำหรับบันทึกใน database
 */
export async function uploadFileWithMetadata(
  file: File,
  folder: string = "work-orders",
  options: UploadOptions = {}
): Promise<UploadFileResult> {
  const uploadResult = await uploadFile(file, folder, options);
  
  if (!uploadResult) {
    throw new Error("ไม่สามารถอัปโหลดไฟล์ได้");
  }

  return {
    fileName: file.name,
    fileUrl: uploadResult.url,
    fileType: file.type,
    fileSize: file.size,
    path: uploadResult.path,
  };
}

/**
 * อัพโหลดหลายไฟล์พร้อมกัน (Original version - backward compatible)
 * 
 * @param files - Array ของไฟล์
 * @param folder - โฟลเดอร์ที่จะเก็บไฟล์
 * @returns Array ของข้อมูลไฟล์ที่อัปโหลดสำเร็จ
 */
export async function uploadMultipleFiles(
  files: File[],
  folder: string = "work-orders"
): Promise<Array<{ url: string; path: string; fileName: string; fileType: string; fileSize: number }>> {
  const results = [];

  for (const file of files) {
    try {
      const uploadResult = await uploadFile(file, folder, {
        validateBeforeUpload: true, // เปิด validation
      });
      
      if (uploadResult) {
        results.push({
          url: uploadResult.url,
          path: uploadResult.path,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      // ข้ามไฟล์ที่ upload ไม่สำเร็จ แทนที่จะ throw error ทั้งหมด
    }
  }

  return results;
}

/**
 * อัพโหลดหลายไฟล์พร้อมกัน (Parallel version - เร็วกว่า)
 * 
 * @param files - Array ของไฟล์
 * @param folder - โฟลเดอร์ที่จะเก็บไฟล์
 * @param options - ตัวเลือกเพิ่มเติม
 * @returns Array ของข้อมูลไฟล์ในรูปแบบที่ database ต้องการ
 */
export async function uploadMultipleFilesParallel(
  files: File[],
  folder: string = "work-orders",
  options: UploadOptions = {}
): Promise<UploadFileResult[]> {
  // Validate ทั้งหมดก่อน
  const validation = validateFiles(files, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // อัปโหลดแบบ parallel
  const uploadPromises = files.map((file) =>
    uploadFileWithMetadata(file, folder, {
      ...options,
      validateBeforeUpload: false, // skip validation เพราะ validate แล้ว
    }).catch((error) => {
      console.error(`Failed to upload ${file.name}:`, error);
      return null; // คืนค่า null สำหรับไฟล์ที่ล้มเหลว
    })
  );

  const results = await Promise.all(uploadPromises);

  // กรองเอาเฉพาะไฟล์ที่อัปโหลดสำเร็จ
  return results.filter((result): result is UploadFileResult => result !== null);
}

// =============================================
// DELETE FUNCTIONS
// =============================================

/**
 * ลบไฟล์จาก Supabase Storage
 * 
 * @param filePath - path ของไฟล์ใน storage (ไม่ต้องมี leading slash)
 * @returns { success: boolean, error?: string }
 */
export async function deleteFile(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // ตรวจสอบว่ามี filePath
    if (!filePath || filePath.trim() === '') {
      return {
        success: false,
        error: 'filePath ไม่ถูกต้อง'
      };
    }

    // ลบ leading slash ถ้ามี
    const cleanPath = filePath.startsWith('/') 
      ? filePath.substring(1) 
      : filePath;

    console.log('🗑️ Attempting to delete:', cleanPath);

    const supabase = createClient();

    // ตรวจสอบ authentication (ถ้าจำเป็น)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return {
        success: false,
        error: 'ไม่พบ authentication session'
      };
    }

    console.log('👤 User authenticated:', user.id);

    // ลบไฟล์
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .remove([cleanPath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return {
        success: false,
        error: `ไม่สามารถลบไฟล์ได้: ${error.message}`
      };
    }

    console.log('✅ Delete successful:', data);

    return {
      success: true
    };

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
    };
  }
}

/**
 * ลบหลายไฟล์พร้อมกัน
 * 
 * @param filePaths - Array ของ file paths
 * @returns จำนวนไฟล์ที่ลบสำเร็จ
 */
export async function deleteMultipleFiles(filePaths: string[]): Promise<number> {
  let successCount = 0;

  for (const filePath of filePaths) {
    const success = await deleteFile(filePath);
    if (success) {
      successCount++;
    }
  }

  return successCount;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * แปลงขนาดไฟล์เป็นรูปแบบที่อ่านง่าย
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * ตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}

/**
 * ตรวจสอบว่าไฟล์เป็น PDF หรือไม่
 */
export function isPDFFile(fileType: string): boolean {
  return fileType === "application/pdf";
}

/**
 * ดึงนามสกุลไฟล์จากชื่อไฟล์
 */
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}