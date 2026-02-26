import { notFound } from "next/navigation";
import { getEvent } from "@/app/actions/events";
import { getTimeslotsWithCounts } from "@/app/actions/timeslots";
import { getReservationsForEvent } from "@/app/actions/reservations";
import EventDetailClient from "./event-detail-client";

interface PageProps {
    params: Promise<{ eventId: string }>;
}

export default async function AdminEventDetailPage({ params }: PageProps) {
    const { eventId } = await params;
    const event = await getEvent(eventId);

    if (!event) return notFound();

    let timeslots: Awaited<ReturnType<typeof getTimeslotsWithCounts>> = [];
    let reservations: Awaited<ReturnType<typeof getReservationsForEvent>> = [];

    try {
        timeslots = await getTimeslotsWithCounts(eventId);
    } catch {
        // Supabase not configured
    }

    try {
        reservations = await getReservationsForEvent(eventId);
    } catch {
        // Supabase not configured
    }

    return (
        <EventDetailClient
            event={event}
            timeslots={timeslots}
            reservations={reservations}
        />
    );
}
