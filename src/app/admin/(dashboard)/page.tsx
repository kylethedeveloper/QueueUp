import Link from "next/link";
import { getEvents } from "@/app/actions/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
    let events: Awaited<ReturnType<typeof getEvents>> = [];
    try {
        events = await getEvents();
    } catch {
        // Supabase not configured
    }

    const activeEvents = events.filter((e) => e.is_active).length;
    const totalEvents = events.length;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your events and reservations.
                    </p>
                </div>
                <Link href="/admin/events">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Manage Events
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-foreground">{totalEvents}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-400">{activeEvents}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Inactive Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-muted-foreground">
                            {totalEvents - activeEvents}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Events */}
            <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Events</h2>
            {events.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border/50">
                    <p className="text-lg text-muted-foreground">No events yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Create your first event to get started.
                    </p>
                    <Link href="/admin/events" className="mt-4 inline-block">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
                            Create Event
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.slice(0, 6).map((event) => (
                        <Link key={event.id} href={`/admin/events/${event.id}`}>
                            <Card className="group cursor-pointer transition-all hover:border-indigo-500/30 bg-card/50 border-border/50 h-full">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-xs font-medium px-2 py-1 rounded-full ${event.is_active
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {event.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 group-hover:text-indigo-400 transition-colors text-lg">
                                        {event.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {event.location && (
                                        <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
