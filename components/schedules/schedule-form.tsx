"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createScheduleSchema } from "@/lib/api/schedules/validation";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MaintenanceScheduleFrequency, MaintenanceScheduleType } from "@prisma/client";
import { createSchedule, updateSchedule } from "@/lib/api/schedules/mutations";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState, Suspense } from "react";
import { SerializedMaintenanceScheduleWithRelations } from "@/lib/api/schedules/types";
import { EquipmentSelector } from "@/components/forms/equipment-selector";

interface ScheduleFormProps {
    initialData?: SerializedMaintenanceScheduleWithRelations;
    technicianList: { id: string; name: string }[];
}

export function ScheduleForm(props: ScheduleFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <ScheduleFormContent {...props} />
        </Suspense>
    );
}

function ScheduleFormContent({ initialData, technicianList }: ScheduleFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledEquipmentId = searchParams.get("equipmentId");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(createScheduleSchema) as any,
        defaultValues: initialData
            ? {
                ...initialData,
                startDate: new Date(initialData.startDate),
                endDate: initialData.endDate ? new Date(initialData.endDate) : null,
                description: initialData.description || undefined,
                checklist: Array.isArray(initialData.checklist)
                    ? (initialData.checklist as any[]).map(item => ({
                        ...item,
                        inputType: item.inputType || "BOOLEAN",
                        unit: item.unit || ""
                    }))
                    : [],
                equipmentId: initialData.equipmentId, // Ensure ID is passed
                assignedTo: initialData.assignedTo || null,
                estimatedDuration: initialData.estimatedDuration ?? undefined,
            }
            : {
                activityName: "",
                type: "PREVENTIVE" as MaintenanceScheduleType,
                frequency: "MONTHLY" as MaintenanceScheduleFrequency,
                checklist: [],
                estimatedDuration: 60,
                equipmentId: prefilledEquipmentId || "",
                startDate: new Date(),
            },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "checklist",
    });

    const watchEquipment = form.watch("equipmentId");

    async function onSubmit(values: z.infer<typeof createScheduleSchema>) {
        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateSchedule({ ...values, id: initialData.id });
                toast.success("Schedule updated successfully");
            } else {
                await createSchedule(values);
                toast.success("Schedule created successfully");
            }
            router.push("/dashboard/schedules");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save schedule");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activity Name */}
                    <FormField
                        control={form.control}
                        name="activityName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Activity Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Monthly AC Filter Change" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Equipment Selection */}
                    <EquipmentSelector
                        value={watchEquipment}
                        onChange={(value) => form.setValue("equipmentId", value, { shouldValidate: true })}
                        error={form.formState.errors.equipmentId?.message as string}
                        disabled={isSubmitting || !!initialData}
                    />

                    {/* Type */}
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Maintenance Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(MaintenanceScheduleType).map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Frequency */}
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(MaintenanceScheduleFrequency).map((freq) => (
                                            <SelectItem key={freq} value={freq}>
                                                {freq}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Start Date */}
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Assignee */}
                    <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assigned Technician</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select technician..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {technicianList.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detailed description of the maintenance task..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Checklist Builder */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Checklist</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ id: crypto.randomUUID(), task: "", required: false, inputType: "BOOLEAN", unit: "" })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-md bg-muted/20">
                                <div className="flex-1 space-y-2 w-full">
                                    <FormField
                                        control={form.control}
                                        name={`checklist.${index}.task`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Task Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Checklist item (e.g. Check pressure)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`checklist.${index}.inputType`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">Input Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="BOOLEAN">Checkbox (Pass/Fail)</SelectItem>
                                                            <SelectItem value="TEXT">Text Input</SelectItem>
                                                            <SelectItem value="NUMBER">Number Input</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`checklist.${index}.unit`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormLabel className="text-xs">Unit (Opt)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. PSI" className="h-8" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 mt-6"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No checklist items added.</p>
                        )}
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <span className="animate-spin mr-2">⏳</span>}
                    <Save className="mr-2 h-4 w-4" />
                    {initialData ? "Update Schedule" : "Create Schedule"}
                </Button>
            </form>
        </Form>
    );
}
