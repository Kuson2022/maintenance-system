"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { MobileNav } from "./mobile-nav";
import { MobileSidebar } from "./mobile-sidebar";
import { Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Client-side protection: Redirect if no user
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if no user (prevent race condition)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      {/* Desktop Sidebar */}
      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleSidebarCollapsedChange}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div className="print:hidden">
        <MobileSidebar
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible print:h-auto">
        {/* Navbar */}
        <div className="print:hidden">
          <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        </div>

        {/* Page Content - Add padding bottom for mobile nav */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6 pb-20 lg:pb-6 print:p-0 print:bg-white print:overflow-visible print:h-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="print:hidden">
        <MobileNav onMenuClick={() => setMobileMenuOpen(true)} />
      </div>
    </div>
  );
}