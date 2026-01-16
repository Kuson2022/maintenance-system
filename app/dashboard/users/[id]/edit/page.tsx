import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/users/user-form";
import { getUserById } from "@/lib/api/users/queries";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

async function EditUserContent({ params }: PageProps) {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/users/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">แก้ไขผู้ใช้</h1>
                    <p className="text-muted-foreground">
                        แก้ไขข้อมูล {user.name}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl">
                <UserForm user={user} mode="edit" />
            </div>
        </div>
    );
}

export default function EditUserPage({ params }: PageProps) {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="h-64 max-w-2xl bg-muted animate-pulse rounded-lg" />
                </div>
            }
        >
            <EditUserContent params={params} />
        </Suspense>
    );
}
