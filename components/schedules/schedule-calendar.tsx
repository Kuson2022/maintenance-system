"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { SerializedMaintenanceScheduleWithRelations } from "@/lib/api/schedules/types";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface ScheduleCalendarProps {
    schedules: SerializedMaintenanceScheduleWithRelations[];
}

export function ScheduleCalendar({ schedules }: ScheduleCalendarProps) {
    const router = useRouter();
    const [date, setDate] = useState(new Date());

    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
    };

    const [view, setView] = useState<View>(Views.MONTH);

    // Map schedules to calendar events
    const events = schedules.map((s) => ({
        id: s.id,
        title: `${s.activityName} - ${s.equipment.name}`,
        start: new Date(s.nextDueDate || s.startDate), // Use next due date for calendar
        end: new Date(s.endDate || s.nextDueDate || s.startDate), // Approximate end
        allDay: true,
        resource: s,
    }));

    const handleSelectEvent = (event: any) => {
        router.push(`/dashboard/schedules/${event.id}`);
    };

    const eventPropGetter = (event: any) => {
        const status = event.resource.status;
        let className = "bg-primary text-primary-foreground";

        if (status === "COMPLETED") className = "bg-green-600 text-white";
        if (new Date(event.start) < new Date() && status !== "COMPLETED") className = "bg-red-500 text-white";

        return {
            className: `${className} text-xs rounded-md border-none px-1`,
        };
    };

    return (
        <div className="h-[600px] w-full bg-white p-4 rounded-lg border shadow-sm">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                views={["month", "week", "day", "agenda"]}
                view={view}
                onView={setView}
                date={date}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventPropGetter}
            />
        </div>
    );
}
