// app/dashboard/work-orders/[id]/components/attachments-section.tsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Paperclip,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  deleteAttachmentAction,
  uploadWorkOrderAttachmentsAction,
} from "@/app/actions/work-orders";
import {
  uploadMultipleFilesParallel,
  validateFiles,
  formatFileSize as formatSize,
} from "@/lib/supabase/upload-file";

interface AttachmentsSectionProps {
  workOrder: WorkOrderDetail;
  currentUserId: string;
  isAdmin?: boolean;
}

export function AttachmentsSection({
  workOrder,
  currentUserId,
  isAdmin,
}: AttachmentsSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress("กำลังตรวจสอบไฟล์...");

    try {
      // Convert FileList to Array
      const fileArray = Array.from(files);

      // Validate files ก่อนอัปโหลด
      const validation = validateFiles(fileArray, {
        maxSize: 10 * 1024 * 1024, // 10MB
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setUploadProgress(`กำลังอัปโหลด ${fileArray.length} ไฟล์...`);

      // Upload files to Supabase Storage (แบบ parallel เร็วกว่า)
      const uploadedFiles = await uploadMultipleFilesParallel(
        fileArray,
        workOrder.id, // ใช้ workOrderId เป็นชื่อ folder
        {
          maxSize: 10 * 1024 * 1024,
          validateBeforeUpload: false, // skip validation เพราะ validate แล้ว
        }
      );

      if (uploadedFiles.length === 0) {
        throw new Error("ไม่สามารถอัปโหลดไฟล์ใดๆ ได้");
      }

      setUploadProgress("กำลังบันทึกข้อมูล...");

      // Save attachment records to database
      const result = await uploadWorkOrderAttachmentsAction(
        workOrder.id,
        uploadedFiles
      );

      if (result.success) {
        const successCount = uploadedFiles.length;
        const totalCount = fileArray.length;

        toast({
          title: "อัปโหลดสำเร็จ",
          description:
            successCount === totalCount
              ? `อัปโหลด ${successCount} ไฟล์เรียบร้อยแล้ว`
              : `อัปโหลดสำเร็จ ${successCount} จาก ${totalCount} ไฟล์`,
        });
        router.refresh();
      } else {
        throw new Error(result.error || "ไม่สามารถบันทึกข้อมูลไฟล์ได้");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถอัปโหลดได้",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteAttachmentId) return;

    setIsDeleting(true);
    try {
      const result = await deleteAttachmentAction(deleteAttachmentId);

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบไฟล์เรียบร้อยแล้ว",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถลบได้",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteAttachmentId(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType.includes("pdf")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    return formatSize(bytes);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d MMM yyyy, HH:mm น.", { locale: th });
  };

  const attachments = workOrder.attachments || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                ไฟล์แนบ
                <Badge variant="secondary">{attachments.length}</Badge>
              </CardTitle>
              <CardDescription>
                รูปภาพและเอกสารประกอบ (สูงสุด 10MB ต่อไฟล์)
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadProgress}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  อัพโหลด
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {attachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.fileType);
                const canDelete = attachment.uploadedBy === currentUserId || isAdmin;
                const isImage = attachment.fileType.startsWith("image/");

                return (
                  <div
                    key={attachment.id}
                    className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Preview for images */}
                    {isImage ? (
                      <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                        <FileIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* File info */}
                    <div className="space-y-2">
                      <p className="font-medium text-sm truncate">
                        {attachment.fileName}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.fileSize)}</span>
                        <span>{formatDate(attachment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        อัพโหลดโดย {attachment.uploader.name}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={attachment.fileUrl}
                          download={attachment.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>

                      {canDelete && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => setDeleteAttachmentId(attachment.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Paperclip className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">ยังไม่มีไฟล์แนบ</p>
              <p className="text-xs mb-4">
                อัพโหลดรูปภาพหรือเอกสารประกอบ
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                เลือกไฟล์
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteAttachmentId !== null}
        onOpenChange={(open) => !open && setDeleteAttachmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}