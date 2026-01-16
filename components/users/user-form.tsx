"use client";

/**
 * User Form Component
 * ฟอร์มสร้าง/แก้ไขผู้ใช้
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { createUser, updateUser } from "@/lib/api/users/mutations";

interface UserFormProps {
    user?: User;
    mode?: "create" | "edit";
}

export function UserForm({ user, mode = "create" }: UserFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        position: user?.position || "",
        department: user?.department || "",
        role: user?.role || "USER" as UserRole,
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let result;

            if (mode === "create") {
                result = await createUser({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    position: formData.position || undefined,
                    department: formData.department || undefined,
                    role: formData.role,
                });
            } else {
                result = await updateUser(user!.id, {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    position: formData.position || undefined,
                    department: formData.department || undefined,
                });
            }

            if (result.success) {
                router.push("/dashboard/users");
                router.refresh();
            } else {
                setError(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {mode === "create" ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขข้อมูลผู้ใช้"}
                    </CardTitle>
                    <CardDescription>
                        {mode === "create"
                            ? "กรอกข้อมูลเพื่อสร้างผู้ใช้ใหม่ในระบบ"
                            : "แก้ไขข้อมูลผู้ใช้"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
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
                            <Label htmlFor="email">อีเมล *</Label>
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
                                placeholder="เช่น วิศวกร, ช่างเทคนิค"
                            />
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <Label htmlFor="department">แผนก</Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => handleChange("department", e.target.value)}
                                placeholder="เช่น ฝ่ายซ่อมบำรุง, ฝ่ายผลิต"
                            />
                        </div>

                        {/* Role - Only for create mode */}
                        {mode === "create" && (
                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleChange("role", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">ผู้ใช้ทั่วไป</SelectItem>
                                        <SelectItem value="TECHNICIAN">ช่างเทคนิค</SelectItem>
                                        <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {mode === "create" ? "สร้างผู้ใช้" : "บันทึก"}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
