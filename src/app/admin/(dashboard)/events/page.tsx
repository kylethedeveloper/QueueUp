import { getEvents } from "@/app/actions/events";
import EventListClient from "./event-list-client";

export default async function AdminEventsPage() {
    let events: Awaited<ReturnType<typeof getEvents>> = [];
    try {
        events = await getEvents();
    } catch {
        // Supabase not configured
    }

    return <EventListClient events={events} />;
}
