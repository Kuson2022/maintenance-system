"use client";

/**
 * Profile Settings Component
 * Form for updating user profile information
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User, Upload, Trash2 } from "lucide-react";
import { updateUser, uploadUserAvatarAction, deleteUserAvatarAction } from "@/lib/api/users/mutations";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";

interface ProfileSettingsProps {
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        avatarUrl?: string | null;
        position?: string | null;
        department?: string | null;
    };
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
    const router = useRouter();
    const { refreshUserProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        position: user.position || "",
        department: user.department || "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateUser(user.id, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                position: formData.position || undefined,
                department: formData.department || undefined,
            });

            if (result.success) {
                toast.success("อัปเดตโปรไฟล์สำเร็จ");
                router.refresh();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("ไฟล์มีขนาดใหญ่เกิน 2MB");
            return;
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("รองรับเฉพาะรูปภาพ JPG, PNG, GIF, WebP");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("userId", user.id);
            formData.append("file", file);

            const result = await uploadUserAvatarAction(formData);

            if (result.success && result.avatarUrl) {
                setAvatarUrl(result.avatarUrl);
                toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ");
                router.refresh();
                await refreshUserProfile();
            } else {
                toast.error(result.error || "อัปโหลดไม่สำเร็จ");
            }
        } catch (err) {
            console.error("Avatar upload error:", err);
            toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleDeleteAvatar = async () => {
        if (!avatarUrl) return;

        if (!confirm("คุณต้องการลบรูปโปรไฟล์หรือไม่?")) {
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteUserAvatarAction(user.id);

            if (result.success) {
                setAvatarUrl("");
                toast.success("ลบรูปโปรไฟล์สำเร็จ");
                router.refresh();
                await refreshUserProfile();
            } else {
                toast.error(result.error || "ลบรูปไม่สำเร็จ");
            }
        } catch (err) {
            console.error("Avatar delete error:", err);
            toast.error("เกิดข้อผิดพลาดในการลบรูปภาพ");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    ข้อมูลโปรไฟล์
                </CardTitle>
                <CardDescription>
                    แก้ไขข้อมูลส่วนตัวของคุณ
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarUrl || undefined} />
                            <AvatarFallback className="text-lg">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        กำลังอัปโหลด...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        อัปโหลดรูป
                                    </>
                                )}
                            </Button>
                            {avatarUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteAvatar}
                                    disabled={isDeleting || isUploading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            กำลังลบ...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            ลบรูป
                                        </>
                                    )}
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                JPG, PNG หรือ GIF ขนาดไม่เกิน 2MB
                            </p>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="กรอกชื่อ-นามสกุล"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">อีเมล</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="example@company.com"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="08X-XXX-XXXX"
                        />
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                        <Label htmlFor="position">ตำแหน่ง</Label>
                        <Input
                            id="position"
                            value={formData.position}
                            onChange={(e) => handleChange("position", e.target.value)}
                            placeholder="ตำแหน่งงาน"
                        />
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                        <Label htmlFor="department">แผนก</Label>
                        <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => handleChange("department", e.target.value)}
                            placeholder="แผนก / ฝ่าย"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                บันทึกการเปลี่ยนแปลง
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card >
    );
}
