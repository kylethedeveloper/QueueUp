"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { TeamMember } from "@/lib/types";

export async function getTeamMembers(): Promise<TeamMember[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createTeamMember(formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get("name") as string;
    const position = formData.get("position") as string;
    const photoUrl = formData.get("photo_url") as string;
    const displayOrder = parseInt(formData.get("display_order") as string, 10) || 0;

    if (!name || !position) {
        return { error: "Name and position are required." };
    }

    const { error } = await supabase.from("team_members").insert({
        name,
        position,
        photo_url: photoUrl || null,
        display_order: displayOrder,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/about");
    return { success: true };
}

export async function updateTeamMember(id: string, formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get("name") as string;
    const position = formData.get("position") as string;
    const photoUrl = formData.get("photo_url") as string;
    const displayOrder = parseInt(formData.get("display_order") as string, 10) || 0;

    if (!name || !position) {
        return { error: "Name and position are required." };
    }

    const { error } = await supabase
        .from("team_members")
        .update({
            name,
            position,
            photo_url: photoUrl || null,
            display_order: displayOrder,
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/about");
    return { success: true };
}

export async function deleteTeamMember(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("team_members").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/about");
    return { success: true };
}
