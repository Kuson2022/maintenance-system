import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface Props {
    specifications: any;
}

export function EquipmentSpecifications({ specifications }: Props) {
    if (!specifications) {
        return null;
    }

    // Handle array format [{key: "Color", value: "Red"}]
    if (Array.isArray(specifications)) {
        if (specifications.length === 0) return null;

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        สเปคเครื่องจักร
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {specifications.map((spec: any, index: number) => (
                            <div key={index} className="flex flex-col border-b pb-2 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                                <span className="text-sm text-muted-foreground">{spec.key}</span>
                                <span className="font-medium">{spec.value || "-"}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Handle object format { "Color": "Red", "Weight": "10kg" }
    const entries = Object.entries(specifications);
    if (entries.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    สเปคเครื่องจักร
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    {entries.map(([key, value], index) => (
                        <div key={index} className="flex flex-col border-b pb-2 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                            <span className="text-sm text-muted-foreground">{key}</span>
                            <span className="font-medium">{String(value) || "-"}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
