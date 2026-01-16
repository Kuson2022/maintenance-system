"use client";

/**
 * Image Upload Component
 * Upload multiple images พร้อม preview
 */

import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  error?: string;
  disabled?: boolean;
  initialImage?: string | null;
  onRemoveInitialImage?: () => void;
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 10,
  maxSize = 10,
  error,
  disabled,
  initialImage,
  onRemoveInitialImage,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize previews with initialImage if provided
  useEffect(() => {
    if (initialImage && previews.length === 0 && value.length === 0) {
      setPreviews([initialImage]);
    }
  }, [initialImage, value.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (value.length + files.length > maxFiles) {
      alert(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    // Validate file size
    const invalidFiles = files.filter((file) => file.size > maxSize * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert(`ขนาดไฟล์ต้องไม่เกิน ${maxSize} MB`);
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidTypes = files.filter((file) => !validTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      alert("อนุญาตเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น");
      return;
    }

    // Add new files
    const newFiles = [...value, ...files];
    onChange(newFiles);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    // Check if we are removing the initial image
    // Logic: if initialImage is present and previews contains it at index 0 (and it's the first time/no mixed shuffling implied)
    const isRemovingInitial = initialImage && index === 0 && previews[0] === initialImage;

    if (isRemovingInitial) {
      setPreviews(previews.filter((_, i) => i !== index));
      if (onRemoveInitialImage) {
        onRemoveInitialImage();
      }
      return;
    }

    // Removing a newly added file
    // We need to calculate its index in 'value' array
    // If initialImage exists, it occupies index 0 in previews, so value index is index - 1
    // If no initialImage (or it was removed), value index is index.

    // Check if initial image is currently in previews to determine offset
    const hasInitialInPreviews = initialImage && previews[0] === initialImage;
    const valueIndex = hasInitialInPreviews ? index - 1 : index;

    const newFiles = value.filter((_, i) => i !== valueIndex);
    const newPreviews = previews.filter((_, i) => i !== index);

    setPreviews(newPreviews);
    onChange(newFiles);
  };

  return (
    <div className="space-y-2">
      <Label>
        รูปภาพประกอบ
        <span className="text-xs text-muted-foreground ml-2">
          (ไม่เกิน {maxFiles} ไฟล์, ขนาดไม่เกิน {maxSize} MB/ไฟล์)
        </span>
      </Label>

      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || value.length >= maxFiles}
          className={cn(error && "border-red-500")}
        >
          <Upload className="h-4 w-4 mr-2" />
          เลือกรูปภาพ
        </Button>
        <span className="text-sm text-muted-foreground">
          {value.length}/{maxFiles} ไฟล์
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-50"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  ลบ
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 truncate">
                {value[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {previews.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">ยังไม่มีรูปภาพ</p>
          <p className="text-xs mt-1">คลิกปุ่มด้านบนเพื่ออัพโหลด</p>
        </div>
      )}
    </div>
  );
}