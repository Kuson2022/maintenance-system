import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { getUserById } from "@/lib/api/users/queries";

export const metadata: Metadata = {
  title: "การตั้งค่า | ระบบซ่อมบำรุง",
  description: "จัดการการตั้งค่าระบบ",
};

export default async function SettingsPage() {
  // Get current user
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/login");
  }

  // Get user data from database
  const user = await getUserById(authUser.id);

  if (!user) {
    redirect("/login");
  }

  // Serialize user data
  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    position: user.position,
    department: user.department,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">การตั้งค่า</h1>
        <p className="text-muted-foreground">
          จัดการข้อมูลส่วนตัวและการตั้งค่าระบบ
        </p>
      </div>

      <SettingsTabs user={serializedUser} />
    </div>
  );
}