"use client";

/**
 * Users Table Component
 * ตารางแสดงรายชื่อผู้ใช้
 */

import { useState } from "react";
import Link from "next/link";
import { User, UserRole, UserStatus } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    MoreHorizontal,
    Eye,
    Pencil,
    UserX,
    UserCheck,
    Shield,
    Wrench,
    User as UserIcon,
    Trash2,
    Ban,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { deactivateUser, activateUser, updateUserRole, deleteUser, hardDeleteUser } from "@/lib/api/users/mutations";
import { UserPermissions } from "@/lib/api/users/permissions";
import { toast } from "sonner";

interface UsersTableProps {
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
    SUSPENDED: "ระงับการใช้งาน",
};

const statusColors: Record<UserStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export function UsersTable({ users, permissions, currentUserId }: UsersTableProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionType, setActionType] = useState<"deactivate" | "activate" | "suspend" | "hardDelete" | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusAction = async () => {
        if (!selectedUser || !actionType) return;

        setIsLoading(true);
        try {
            let result;
            if (actionType === "deactivate") {
                result = await deactivateUser(selectedUser.id);
            } else if (actionType === "activate") {
                result = await activateUser(selectedUser.id);
            } else if (actionType === "suspend") {
                result = await deleteUser(selectedUser.id);
            } else if (actionType === "hardDelete") {
                result = await hardDeleteUser(selectedUser.id);
            }

            if (!result?.success) {
                toast.error(result?.error || "เกิดข้อผิดพลาด");
            } else {
                const messages = {
                    deactivate: "ปิดการใช้งานสำเร็จ",
                    activate: "เปิดการใช้งานสำเร็จ",
                    suspend: "ระงับผู้ใช้สำเร็จ",
                    hardDelete: "ลบผู้ใช้ถาวรสำเร็จ",
                };
                toast.success(messages[actionType]);
            }
        } finally {
            setIsLoading(false);
            setSelectedUser(null);
            setActionType(null);
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

    // Check if current user can edit a specific user
    const canEditUser = (userId: string) => {
        return permissions.canEdit || (permissions.canEditOwn && userId === currentUserId);
    };

    // Check if user can be deleted (not self)
    const canDeleteUser = (userId: string) => {
        return permissions.canDelete && userId !== currentUserId;
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ผู้ใช้</TableHead>
                            <TableHead>อีเมล</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    ไม่พบข้อมูลผู้ใช้
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                                <AvatarFallback>
                                                    {user.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                {user.phone && (
                                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={roleColors[user.role]}>
                                            {roleLabels[user.role]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={statusColors[user.status]}>
                                            {statusLabels[user.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.lastLoginAt
                                            ? format(new Date(user.lastLoginAt), "d MMM yyyy HH:mm", { locale: th })
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
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
                                                {canDeleteUser(user.id) && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        {user.status === "ACTIVE" ? (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setActionType("deactivate");
                                                                }}
                                                                className="text-orange-600"
                                                            >
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                ปิดการใช้งาน
                                                            </DropdownMenuItem>
                                                        ) : user.status === "INACTIVE" ? (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setActionType("activate");
                                                                }}
                                                                className="text-green-600"
                                                            >
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                เปิดการใช้งาน
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        {user.status !== "SUSPENDED" && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setActionType("suspend");
                                                                }}
                                                                className="text-red-600"
                                                            >
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                ระงับผู้ใช้
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setActionType("hardDelete");
                                                            }}
                                                            className="text-red-700 font-semibold"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            ลบถาวร
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={() => { setSelectedUser(null); setActionType(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === "deactivate" && "ปิดการใช้งานผู้ใช้"}
                            {actionType === "activate" && "เปิดการใช้งานผู้ใช้"}
                            {actionType === "suspend" && "ระงับผู้ใช้"}
                            {actionType === "hardDelete" && "⚠️ ลบผู้ใช้ถาวร"}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                {actionType === "deactivate" && (
                                    <p>คุณต้องการปิดการใช้งานผู้ใช้ &quot;{selectedUser?.name}&quot; หรือไม่? ผู้ใช้จะไม่สามารถเข้าใช้งานระบบได้</p>
                                )}
                                {actionType === "activate" && (
                                    <p>คุณต้องการเปิดการใช้งานผู้ใช้ &quot;{selectedUser?.name}&quot; หรือไม่?</p>
                                )}
                                {actionType === "suspend" && (
                                    <p>คุณต้องการระงับผู้ใช้ &quot;{selectedUser?.name}&quot; หรือไม่? ผู้ใช้จะถูกระงับการใช้งาน</p>
                                )}
                                {actionType === "hardDelete" && (
                                    <>
                                        <p className="text-red-600 font-semibold">
                                            คุณต้องการลบผู้ใช้ &quot;{selectedUser?.name}&quot; ออกจากระบบถาวรหรือไม่?
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลผู้ใช้จะถูกลบออกจากระบบอย่างถาวร
                                        </p>
                                    </>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStatusAction}
                            disabled={isLoading}
                            className={
                                actionType === "hardDelete"
                                    ? "bg-red-700 hover:bg-red-800"
                                    : actionType === "suspend" || actionType === "deactivate"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : ""
                            }
                        >
                            {isLoading ? "กำลังดำเนินการ..." : actionType === "hardDelete" ? "ลบถาวร" : "ยืนยัน"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
