"use client";

/**
 * Equipment Selector Component
 * Searchable dropdown สำหรับเลือกเครื่องจักร
 */

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface Equipment {
  id: string;
  code: string;
  name: string;
  category?: {
    name: string;
  };
  location?: string;
}

interface EquipmentSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function EquipmentSelector({
  value,
  onChange,
  error,
  disabled,
}: EquipmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch equipment list
  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);

      // ✅ ดึงข้อมูลจาก Supabase ผ่าน Server Action
      const { getAvailableEquipmentAction } = await import("@/app/actions/equipment");
      const response = await getAvailableEquipmentAction();

      if (response.success && response.data) {
        // แปลง data ให้ตรงกับ interface Equipment
        const equipmentData: Equipment[] = response.data.map((eq: any) => ({
          id: eq.id,
          code: eq.code,
          name: eq.name,
          category: eq.category ? { name: eq.category.name } : undefined,
          location: eq.location || undefined,
        }));
        setEquipment(equipmentData);
      } else {
        console.error("Failed to fetch equipment:", response.error);
        // แสดง empty array ถ้า error
        setEquipment([]);
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedEquipment = equipment.find((eq) => eq.id === value);

  return (
    <div className="space-y-2">
      <Label>
        เครื่องจักร/อุปกรณ์ <span className="text-red-500">*</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
            disabled={disabled}
          >
            {selectedEquipment ? (
              <div className="flex items-center gap-2 truncate">
                <Package className="h-4 w-4" />
                <span className="truncate">
                  {selectedEquipment.code} - {selectedEquipment.name}
                </span>
              </div>
            ) : (
              "เลือกเครื่องจักร/อุปกรณ์"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="ค้นหาเครื่องจักร..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "กำลังโหลด..." : "ไม่พบเครื่องจักร"}
              </CommandEmpty>
              <CommandGroup>
                {equipment.map((eq) => (
                  <CommandItem
                    key={eq.id}
                    value={`${eq.code} ${eq.name}`}
                    onSelect={() => {
                      onChange(eq.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === eq.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{eq.code}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{eq.name}</span>
                      </div>
                      {(eq.category || eq.location) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {eq.category && <span>{eq.category.name}</span>}
                          {eq.category && eq.location && (
                            <span>•</span>
                          )}
                          {eq.location && <span>{eq.location}</span>}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {selectedEquipment && (
        <div className="text-sm text-muted-foreground">
          📍 {selectedEquipment.location}
        </div>
      )}
    </div>
  );
}