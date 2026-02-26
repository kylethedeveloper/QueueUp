"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { Reservation } from "@/lib/types";

export async function createReservation(formData: FormData) {
    const supabase = createAdminClient();

    const timeslotId = formData.get("timeslot_id") as string;
    const reservationDate = formData.get("reservation_date") as string;
    const userName = formData.get("user_name") as string;
    const userEmail = formData.get("user_email") as string;

    if (!userName || !userEmail || !timeslotId || !reservationDate) {
        return { error: "All fields are required." };
    }

    // 1. Get the timeslot + event info
    const { data: timeslot, error: slotError } = await supabase
        .from("timeslots")
        .select("*, event:events(*)")
        .eq("id", timeslotId)
        .single();

    if (slotError || !timeslot) {
        return { error: "Timeslot not found." };
    }

    const event = timeslot.event;

    // 2. Check cooldown: same email + same event within cooldown window
    const cooldownMinutes = event?.cooldown_minutes ?? 30;
    if (cooldownMinutes > 0) {
        // Get all timeslot IDs for this event
        const { data: eventTimeslots } = await supabase
            .from("timeslots")
            .select("id")
            .eq("event_id", timeslot.event_id);

        const eventSlotIds = (eventTimeslots || []).map((t) => t.id);

        if (eventSlotIds.length > 0) {
            const cooldownThreshold = new Date(
                Date.now() - cooldownMinutes * 60 * 1000
            ).toISOString();

            const { data: recent, error: recentError } = await supabase
                .from("reservations")
                .select("id")
                .in("timeslot_id", eventSlotIds)
                .eq("user_email", userEmail)
                .eq("status", "confirmed")
                .gte("created_at", cooldownThreshold)
                .limit(1);

            if (!recentError && recent && recent.length > 0) {
                return {
                    error: `You already have a reservation for this event. Please wait ${cooldownMinutes} minutes before making another.`,
                };
            }
        }
    }

    // 3. Check capacity for this specific date
    const { count, error: countError } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("timeslot_id", timeslotId)
        .eq("reservation_date", reservationDate)
        .eq("status", "confirmed");

    if (countError) {
        return { error: "Failed to check availability." };
    }

    if ((count ?? 0) >= timeslot.max_reservations) {
        return { error: "This timeslot is full. Please choose another one." };
    }

    // 4. Insert the reservation
    const { data: reservation, error: insertError } = await supabase
        .from("reservations")
        .insert({
            timeslot_id: timeslotId,
            reservation_date: reservationDate,
            user_name: userName,
            user_email: userEmail,
        })
        .select()
        .single();

    if (insertError) {
        return { error: insertError.message };
    }

    // 5. Send confirmation email (non-blocking)
    if (event) {
        sendConfirmationEmail(userEmail, userName, event, timeslot, reservationDate).catch(
            (err) => console.error("Failed to send confirmation email:", err)
        );

        await supabase
            .from("reservations")
            .update({ confirmation_sent: true })
            .eq("id", reservation.id);
    }

    const eventId = timeslot.event_id;
    revalidatePath(`/events/${eventId}`);

    return { success: true, reservationId: reservation.id, eventId };
}

export async function cancelReservation(id: string) {
    const supabase = createAdminClient();

    const { data: reservation, error: fetchError } = await supabase
        .from("reservations")
        .select("*, timeslot:timeslots(event_id)")
        .eq("id", id)
        .single();

    if (fetchError) return { error: fetchError.message };

    const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id);

    if (error) return { error: error.message };

    const eventId = reservation?.timeslot?.event_id;
    if (eventId) {
        revalidatePath(`/admin/events/${eventId}`);
        revalidatePath(`/events/${eventId}`);
    }

    return { success: true };
}

export async function getReservationsForEvent(eventId: string): Promise<(Reservation & { timeslot: { day_of_week: number; start_time: string; end_time: string } })[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("reservations")
        .select(`
      *,
      timeslot:timeslots!inner(day_of_week, start_time, end_time, event_id)
    `)
        .eq("timeslot.event_id", eventId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}
