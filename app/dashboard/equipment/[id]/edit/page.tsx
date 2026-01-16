import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getEquipmentById } from "@/lib/api/equipment";
import { EquipmentForm } from "@/components/forms/equipment-form";
import { SerializedEquipment } from "@/lib/api/equipment/types";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditEquipmentPage({ params }: Props) {
    const { id } = await params;
    const equipment = await getEquipmentById(id);

    if (!equipment) {
        notFound();
    }

    // Serialize equipment data for client component
    const serializedEquipment: SerializedEquipment = JSON.parse(
        JSON.stringify(equipment, (_, value) => {
            if (value && typeof value === "object" && "toNumber" in value) {
                return value.toNumber();
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        })
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/equipment/${id}`}>
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">แก้ไขเครื่องจักร</h1>
                    <p className="text-muted-foreground">
                        {equipment.code} - {equipment.name}
                    </p>
                </div>
            </div>

            {/* Form */}
            <EquipmentForm equipment={serializedEquipment} mode="edit" />
        </div>
    );
}
