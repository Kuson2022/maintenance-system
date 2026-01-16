import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/users/user-form";
import { ArrowLeft } from "lucide-react";

export default function NewUserPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">เพิ่มผู้ใช้ใหม่</h1>
                    <p className="text-muted-foreground">
                        สร้างบัญชีผู้ใช้ใหม่ในระบบ
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl">
                <UserForm mode="create" />
            </div>
        </div>
    );
}
