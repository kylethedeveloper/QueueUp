"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Event } from "@/lib/types";

export async function getEvents(): Promise<Event[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function getActiveEvents(): Promise<Event[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function getEvent(id: string): Promise<Event | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}

export async function createEvent(formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const cooldownMinutes = parseInt(formData.get("cooldown_minutes") as string, 10) || 30;
    const timezone = (formData.get("timezone") as string) || "America/New_York";

    const { error } = await supabase.from("events").insert({
        name,
        description: description || null,
        location: location || null,
        cooldown_minutes: cooldownMinutes,
        timezone,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/events");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
}

export async function updateEvent(id: string, formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const isActive = formData.get("is_active") === "true";
    const cooldownMinutes = parseInt(formData.get("cooldown_minutes") as string, 10) || 30;
    const timezone = (formData.get("timezone") as string) || "America/New_York";

    const { error } = await supabase
        .from("events")
        .update({
            name,
            description: description || null,
            location: location || null,
            is_active: isActive,
            cooldown_minutes: cooldownMinutes,
            timezone,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/events");
    revalidatePath("/admin");
    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/");
    return { success: true };
}

export async function deleteEvent(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/events");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
}
