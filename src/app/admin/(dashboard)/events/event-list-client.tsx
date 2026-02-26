"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, deleteEvent } from "@/app/actions/events";
import { Event } from "@/lib/types";
import { TIMEZONES } from "@/lib/timezones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface EventListClientProps {
    events: Event[];
}

export default function EventListClient({ events }: EventListClientProps) {
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);
        const formData = new FormData(e.currentTarget);
        const result = await createEvent(formData);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Event created successfully!");
            setDialogOpen(false);
            router.refresh();
        }
        setIsCreating(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated timeslots and reservations.`)) return;
        const result = await deleteEvent(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Event deleted successfully!");
            router.refresh();
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Events</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage queue events.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            + New Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Event</DialogTitle>
                            <DialogDescription>
                                Add a new queue station or event.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Event Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Microwave Station A"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="e.g., Located near the cafeteria"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="e.g., Building A, Floor 2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <select
                                    id="timezone"
                                    name="timezone"
                                    defaultValue="America/New_York"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cooldown_minutes">Cooldown (minutes)</Label>
                                <Input
                                    id="cooldown_minutes"
                                    name="cooldown_minutes"
                                    type="number"
                                    min="0"
                                    defaultValue="30"
                                    placeholder="Same email can't reserve again within this time"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Prevents the same email from reserving again within this many minutes. Set to 0 to disable.
                                </p>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={isCreating}
                            >
                                {isCreating ? "Creating..." : "Create Event"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-border/50">
                    <p className="text-lg text-muted-foreground">No events yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Click &quot;+ New Event&quot; to create your first event.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                        <Card
                            key={event.id}
                            className="group bg-card/50 border-border/50 transition-all hover:border-indigo-500/30"
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant="secondary"
                                        className={
                                            event.is_active
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-muted text-muted-foreground"
                                        }
                                    >
                                        {event.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-2 text-lg">{event.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {event.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {event.description}
                                    </p>
                                )}
                                {event.location && (
                                    <p className="text-sm text-muted-foreground mb-4">
                                        📍 {event.location}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => router.push(`/admin/events/${event.id}`)}
                                    >
                                        Manage
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(event.id, event.name)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
