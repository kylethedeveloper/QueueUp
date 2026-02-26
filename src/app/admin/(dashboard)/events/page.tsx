import { getEvents } from "@/app/actions/events";
import EventListClient from "./event-list-client";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
    let events: Awaited<ReturnType<typeof getEvents>> = [];
    try {
        events = await getEvents();
    } catch (err) {
        console.error("Failed to fetch events:", err);
    }

    return <EventListClient events={events} />;
}
