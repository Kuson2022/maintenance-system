"use client";

/**
 * Users Mobile Card Component
 * แสดงรายการผู้ใช้ในรูปแบบ Card สำหรับ Mobile
 */

import { useState } from "react";
import Link from "next/link";
import { User, UserRole, UserStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Eye,
    Pencil,
    UserX,
    UserCheck,
    Shield,
    Wrench,
    User as UserIcon,
    Mail,
    Phone,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { deactivateUser, activateUser, updateUserRole } from "@/lib/api/users/mutations";
import { UserPermissions } from "@/lib/api/users/permissions";
import { toast } from "sonner";

interface UsersMobileCardProps {
    users: User[];
    permissions: UserPermissions;
    currentUserId: string;
}

const roleLabels: Record<UserRole, string> = {
    USER: "ผู้ใช้ทั่วไป",
    TECHNICIAN: "ช่างเทคนิค",
    ADMIN: "ผู้ดูแลระบบ",
};

const roleColors: Record<UserRole, string> = {
    USER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    TECHNICIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
};

const statusLabels: Record<UserStatus, string> = {
    ACTIVE: "ใช้งาน",
    INACTIVE: "ไม่ใช้งาน",
    SUSPENDED: "ระงับ",
};

const statusColors: Record<UserStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export function UsersMobileCard({ users, permissions, currentUserId }: UsersMobileCardProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const canEditUser = (userId: string) => {
        return permissions.canEdit || (permissions.canEditOwn && userId === currentUserId);
    };

    const handleStatusChange = async (userId: string, activate: boolean) => {
        setIsLoading(userId);
        try {
            const result = activate
                ? await activateUser(userId)
                : await deactivateUser(userId);
            if (!result.success) {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            } else {
                toast.success(activate ? "เปิดการใช้งานสำเร็จ" : "ปิดการใช้งานสำเร็จ");
            }
        } finally {
            setIsLoading(null);
        }
    };

    const handleRoleChange = async (userId: string, role: UserRole) => {
        const result = await updateUserRole(userId, role);
        if (!result.success) {
            toast.error(result.error || "เกิดข้อผิดพลาด");
        } else {
            toast.success("เปลี่ยน Role สำเร็จ");
        }
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                ไม่พบข้อมูลผู้ใช้
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {users.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                    <AvatarFallback>
                                        {user.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold truncate">{user.name}</h3>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <Badge variant="secondary" className={`text-xs ${roleColors[user.role]}`}>
                                            {roleLabels[user.role]}
                                        </Badge>
                                        <Badge variant="secondary" className={`text-xs ${statusColors[user.status]}`}>
                                            {statusLabels[user.status]}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/users/${user.id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            ดูรายละเอียด
                                        </Link>
                                    </DropdownMenuItem>
                                    {canEditUser(user.id) && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/users/${user.id}/edit`}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                แก้ไข
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {permissions.canChangeRole && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>เปลี่ยน Role</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => handleRoleChange(user.id, "USER")}
                                                disabled={user.role === "USER"}
                                            >
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                ผู้ใช้ทั่วไป
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleRoleChange(user.id, "TECHNICIAN")}
                                                disabled={user.role === "TECHNICIAN"}
                                            >
                                                <Wrench className="mr-2 h-4 w-4" />
                                                ช่างเทคนิค
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleRoleChange(user.id, "ADMIN")}
                                                disabled={user.role === "ADMIN"}
                                            >
                                                <Shield className="mr-2 h-4 w-4" />
                                                ผู้ดูแลระบบ
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {permissions.canDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            {user.status === "ACTIVE" ? (
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(user.id, false)}
                                                    disabled={isLoading === user.id}
                                                    className="text-red-600"
                                                >
                                                    <UserX className="mr-2 h-4 w-4" />
                                                    ปิดการใช้งาน
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(user.id, true)}
                                                    disabled={isLoading === user.id}
                                                    className="text-green-600"
                                                >
                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                    เปิดการใช้งาน
                                                </DropdownMenuItem>
                                            )}
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{user.phone}</span>
                                </div>
                            )}
                            {user.lastLoginAt && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                        {format(new Date(user.lastLoginAt), "d MMM yyyy HH:mm", { locale: th })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
