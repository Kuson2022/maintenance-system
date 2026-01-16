"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    value?: File[];
    onChange: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number; // in MB
    accept?: string;
    error?: string;
    disabled?: boolean;
    initialFile?: string | null;
    onRemoveInitialFile?: () => void;
    label?: string;
}

export function FileUpload({
    value = [],
    onChange,
    maxFiles = 1,
    maxSize = 10,
    accept = "*",
    error,
    disabled,
    initialFile,
    onRemoveInitialFile,
    label = "Upload File",
}: FileUploadProps) {
    const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize with initialFile
    useEffect(() => {
        if (initialFile && previews.length === 0 && value.length === 0) {
            // Determine type based on extension (simple check)
            const isPdf = initialFile.toLowerCase().endsWith(".pdf");
            const type = isPdf ? "application/pdf" : "image/jpeg";
            const name = initialFile.split("/").pop() || "Existing File";

            setPreviews([{ url: initialFile, type, name }]);
        }
    }, [initialFile, value.length]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (value.length + files.length > maxFiles) {
            alert(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
            return;
        }

        const invalidFiles = files.filter((file) => file.size > maxSize * 1024 * 1024);
        if (invalidFiles.length > 0) {
            alert(`ขนาดไฟล์ต้องไม่เกิน ${maxSize} MB`);
            return;
        }

        // Add new files
        const newFiles = [...value, ...files];
        onChange(newFiles);

        // Create previews
        files.forEach((file) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews((prev) => [
                        ...prev,
                        { url: reader.result as string, type: file.type, name: file.name },
                    ]);
                };
                reader.readAsDataURL(file);
            } else {
                // For non-images, just store name and type
                setPreviews((prev) => [
                    ...prev,
                    { url: "", type: file.type, name: file.name },
                ]);
            }
        });

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const removeFile = (index: number) => {
        // Check if removing initial file
        const isRemovingInitial = initialFile && index === 0 && previews[0].url === initialFile;

        if (isRemovingInitial) {
            setPreviews(previews.filter((_, i) => i !== index));
            if (onRemoveInitialFile) onRemoveInitialFile();
            return;
        }

        // Removing new file
        const hasInitialInPreviews = initialFile && previews.length > value.length;
        // Logic: if initial exists, it is at index 0. Value array starts at index 0 (which corresponds to preview index 1)

        const valueIndex = hasInitialInPreviews ? index - 1 : index;
        const newFiles = value.filter((_, i) => i !== valueIndex);
        const newPreviews = previews.filter((_, i) => i !== index);

        setPreviews(newPreviews);
        onChange(newFiles);
    };

    return (
        <div className="space-y-2">
            <Label>
                {label}
                <span className="text-xs text-muted-foreground ml-2">
                    (ไม่เกิน {maxSize} MB)
                </span>
            </Label>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || (value.length + (initialFile && !onRemoveInitialFile ? 1 : 0) >= maxFiles)} // Approximate logic
                    className={cn(error && "border-red-500")}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    เลือกไฟล์
                </Button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={maxFiles > 1}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            {previews.length > 0 && (
                <div className="grid gap-2 mt-4">
                    {previews.map((preview, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-2 border rounded-lg bg-card"
                        >
                            <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                                {preview.type.startsWith("image/") ? (
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        className="h-full w-full object-cover rounded"
                                    />
                                ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{preview.name}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
