"use client";

/**
 * Technician Selector Component
 * เลือกช่างผู้รับผิดชอบ (Optional)
 */

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCog } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TechnicianSelectorProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  disabled?: boolean;
}

export function TechnicianSelector({
  value,
  onChange,
  error,
  disabled,
}: TechnicianSelectorProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      // ✅ ดึงข้อมูลจาก Supabase ผ่าน Server Action
      const { getTechniciansAction } = await import("@/app/actions/users");
      const response = await getTechniciansAction();

      if (response.success && response.data) {
        // แปลง data ให้ตรงกับ interface Technician
        const technicianData: Technician[] = response.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }));
        setTechnicians(technicianData);
      } else {
        console.error("Failed to fetch technicians:", response.error);
        // แสดง empty array ถ้า error
        setTechnicians([]);
      }
    } catch (error) {
      console.error("Failed to fetch technicians:", error);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-2">
      <Label>
        มอบหมายช่าง
        <span className="text-xs text-muted-foreground ml-2">(ไม่บังคับ)</span>
      </Label>
      <Select
        value={value || "none"}
        onValueChange={(val) => onChange(val === "none" ? undefined : val)}
        disabled={disabled || loading}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="เลือกช่างผู้รับผิดชอบ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ไม่มอบหมาย</span>
            </div>
          </SelectItem>
          {technicians.map((tech) => (
            <SelectItem key={tech.id} value={tech.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary text-white">
                    {getInitials(tech.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{tech.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tech.email}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value && value !== "none" && (
        <p className="text-sm text-muted-foreground">
          💡 ช่างจะได้รับการแจ้งเตือนทางอีเมล
        </p>
      )}
    </div>
  );
}