import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/app/actions/events";
import { getTimeslotInstances } from "@/app/actions/timeslots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReservationFlow from "./reservation-flow";

interface PageProps {
    params: Promise<{ eventId: string }>;
}

export default async function EventPage({ params }: PageProps) {
    const { eventId } = await params;
    const event = await getEvent(eventId);

    if (!event) return notFound();

    let instances: Awaited<ReturnType<typeof getTimeslotInstances>> = [];
    try {
        instances = await getTimeslotInstances(eventId, 7);
    } catch {
        // No timeslots yet
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50">
                <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        QueueUp
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            ← Back
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Event Info */}
            <section className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-8">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">
                        Active
                    </Badge>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{event.name}</h1>
                    {event.description && (
                        <p className="text-muted-foreground text-lg">{event.description}</p>
                    )}
                    {event.location && (
                        <p className="text-muted-foreground mt-2 flex items-center gap-2">
                            <span>📍</span> {event.location}
                        </p>
                    )}
                </div>

                {/* Timeslot Selection + Reservation */}
                <ReservationFlow eventId={eventId} eventName={event.name} instances={instances} />
            </section>
        </div>
    );
}
