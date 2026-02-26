"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Timeslot, TimeslotWithCount, TimeslotInstance } from "@/lib/types";

export async function getTimeslots(eventId: string): Promise<Timeslot[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("timeslots")
        .select("*")
        .eq("event_id", eventId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

// Admin view: timeslots with total reservation counts (all dates combined)
export async function getTimeslotsWithCounts(eventId: string): Promise<TimeslotWithCount[]> {
    const supabase = createAdminClient();

    // Get all timeslots for the event
    const { data: timeslots, error } = await supabase
        .from("timeslots")
        .select("*")
        .eq("event_id", eventId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) throw new Error(error.message);
    if (!timeslots || timeslots.length === 0) return [];

    // Get reservation counts per timeslot
    const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("timeslot_id")
        .in("timeslot_id", timeslots.map((t) => t.id))
        .eq("status", "confirmed");

    if (resError) throw new Error(resError.message);

    const countMap: Record<string, number> = {};
    for (const r of reservations || []) {
        countMap[r.timeslot_id] = (countMap[r.timeslot_id] || 0) + 1;
    }

    return timeslots.map((t) => ({
        ...t,
        reservation_count: countMap[t.id] || 0,
    }));
}

// Public view: compute upcoming slot instances for the next N days
export async function getTimeslotInstances(
    eventId: string,
    days: number = 7
): Promise<TimeslotInstance[]> {
    const supabase = createAdminClient();

    // 1. Get all timeslot templates for this event
    const { data: timeslots, error } = await supabase
        .from("timeslots")
        .select("*")
        .eq("event_id", eventId)
        .order("day_of_week")
        .order("start_time");

    if (error) throw new Error(error.message);
    if (!timeslots || timeslots.length === 0) return [];

    // 2. Build a list of upcoming dates and match to templates
    const instances: { timeslot_id: string; date: string; day_of_week: number; start_time: string; end_time: string; max_reservations: number }[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dow = d.getDay(); // 0=Sunday
        const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

        for (const slot of timeslots) {
            if (slot.day_of_week === dow) {
                instances.push({
                    timeslot_id: slot.id,
                    date: dateStr,
                    day_of_week: slot.day_of_week,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    max_reservations: slot.max_reservations,
                });
            }
        }
    }

    if (instances.length === 0) return [];

    // 3. Get reservation counts for these (timeslot_id, date) combos
    const timeslotIds = [...new Set(instances.map((i) => i.timeslot_id))];
    const dates = [...new Set(instances.map((i) => i.date))];

    const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("timeslot_id, reservation_date")
        .in("timeslot_id", timeslotIds)
        .in("reservation_date", dates)
        .eq("status", "confirmed");

    if (resError) throw new Error(resError.message);

    // Count per (timeslot_id, date)
    const countMap: Record<string, number> = {};
    for (const r of reservations || []) {
        const key = `${r.timeslot_id}_${r.reservation_date}`;
        countMap[key] = (countMap[key] || 0) + 1;
    }

    return instances.map((inst) => ({
        ...inst,
        reservation_count: countMap[`${inst.timeslot_id}_${inst.date}`] || 0,
    }));
}

// Create a single weekly timeslot template
export async function createTimeslot(formData: FormData) {
    const supabase = createAdminClient();

    const eventId = formData.get("event_id") as string;
    const dayOfWeek = parseInt(formData.get("day_of_week") as string, 10);
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;
    const maxReservations = parseInt(formData.get("max_reservations") as string, 10);

    const { error } = await supabase.from("timeslots").insert({
        event_id: eventId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        max_reservations: maxReservations,
    });

    if (error) return { error: error.message };

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
}

// Bulk create: generate timeslot templates for selected days at regular intervals
export async function bulkCreateTimeslots(
    eventId: string,
    days: number[],
    startHour: string,
    endHour: string,
    intervalMinutes: number,
    maxReservations: number
) {
    const supabase = createAdminClient();

    const slots: {
        event_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
        max_reservations: number;
    }[] = [];

    const [startH, startM] = startHour.split(":").map(Number);
    const [endH, endM] = endHour.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (const day of days) {
        let currentMin = startMinutes;
        while (currentMin + intervalMinutes <= endMinutes) {
            const slotStartH = Math.floor(currentMin / 60).toString().padStart(2, "0");
            const slotStartM = (currentMin % 60).toString().padStart(2, "0");
            const slotEndMin = currentMin + intervalMinutes;
            const slotEndH = Math.floor(slotEndMin / 60).toString().padStart(2, "0");
            const slotEndM = (slotEndMin % 60).toString().padStart(2, "0");

            slots.push({
                event_id: eventId,
                day_of_week: day,
                start_time: `${slotStartH}:${slotStartM}`,
                end_time: `${slotEndH}:${slotEndM}`,
                max_reservations: maxReservations,
            });

            currentMin = slotEndMin;
        }
    }

    if (slots.length === 0) {
        return { error: "No valid timeslots could be created with the given parameters." };
    }

    const { error } = await supabase.from("timeslots").insert(slots);

    if (error) return { error: error.message };

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true, count: slots.length };
}

export async function updateTimeslot(id: string, eventId: string, formData: FormData) {
    const supabase = createAdminClient();

    const dayOfWeek = parseInt(formData.get("day_of_week") as string, 10);
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;
    const maxReservations = parseInt(formData.get("max_reservations") as string, 10);

    const { error } = await supabase
        .from("timeslots")
        .update({
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            max_reservations: maxReservations,
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
}

export async function deleteTimeslot(id: string, eventId: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("timeslots").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
}

export async function bulkDeleteTimeslots(ids: string[], eventId: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("timeslots").delete().in("id", ids);

    if (error) return { error: error.message };

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true, count: ids.length };
}
