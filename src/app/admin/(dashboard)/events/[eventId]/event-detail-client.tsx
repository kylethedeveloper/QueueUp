"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { Event, TimeslotWithCount, Reservation, DAY_NAMES, DAY_SHORT } from "@/lib/types";
import { TIMEZONES } from "@/lib/timezones";
import { updateEvent } from "@/app/actions/events";
import {
    bulkCreateTimeslots,
    deleteTimeslot,
    bulkDeleteTimeslots,
} from "@/app/actions/timeslots";
import { cancelReservation } from "@/app/actions/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface EventDetailClientProps {
    event: Event;
    timeslots: TimeslotWithCount[];
    reservations: (Reservation & {
        timeslot: { day_of_week: number; start_time: string; end_time: string };
    })[];
}

function formatTime(time: string): string {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

export default function EventDetailClient({
    event,
    timeslots,
    reservations,
}: EventDetailClientProps) {
    const router = useRouter();
    const [addSlotOpen, setAddSlotOpen] = useState(false);
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [editEventOpen, setEditEventOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const [bulkDays, setBulkDays] = useState<Set<number>>(new Set());

    const eventUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/events/${event.id}`
            : `/events/${event.id}`;

    const handleEditEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateEvent(event.id, formData);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Event updated!");
            setEditEventOpen(false);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleAddSlot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const dayOfWeek = parseInt(formData.get("day_of_week") as string, 10);
        const startTime = formData.get("start_time") as string;
        const endTime = formData.get("end_time") as string;
        const interval = parseInt(formData.get("interval") as string, 10);
        const maxReservations = parseInt(formData.get("max_reservations") as string, 10);

        const result = await bulkCreateTimeslots(
            event.id,
            [dayOfWeek],
            startTime,
            endTime,
            interval,
            maxReservations
        );
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} timeslot(s) created!`);
            setAddSlotOpen(false);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleBulkAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (bulkDays.size === 0) {
            toast.error("Please select at least one day.");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await bulkCreateTimeslots(
            event.id,
            Array.from(bulkDays),
            formData.get("start_hour") as string,
            formData.get("end_hour") as string,
            parseInt(formData.get("interval") as string, 10),
            parseInt(formData.get("max_reservations") as string, 10)
        );
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} timeslots created!`);
            setBulkAddOpen(false);
            setBulkDays(new Set());
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm("Delete this timeslot? Associated reservations will also be deleted.")) return;
        const result = await deleteTimeslot(slotId, event.id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Timeslot deleted!");
            router.refresh();
        }
    };

    const toggleSlotSelection = (slotId: string) => {
        setSelectedSlots((prev) => {
            const next = new Set(prev);
            if (next.has(slotId)) next.delete(slotId);
            else next.add(slotId);
            return next;
        });
    };

    const toggleAllSlots = () => {
        if (selectedSlots.size === timeslots.length) {
            setSelectedSlots(new Set());
        } else {
            setSelectedSlots(new Set(timeslots.map((s) => s.id)));
        }
    };

    const handleBulkDeleteSlots = async () => {
        if (selectedSlots.size === 0) return;
        if (!confirm(`Delete ${selectedSlots.size} timeslot(s)? Associated reservations will also be deleted.`)) return;
        const result = await bulkDeleteTimeslots(Array.from(selectedSlots), event.id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} timeslot(s) deleted!`);
            setSelectedSlots(new Set());
            router.refresh();
        }
    };

    const toggleBulkDay = (day: number) => {
        setBulkDays((prev) => {
            const next = new Set(prev);
            if (next.has(day)) next.delete(day);
            else next.add(day);
            return next;
        });
    };

    const handleCancelReservation = async (id: string) => {
        if (!confirm("Cancel this reservation?")) return;
        const result = await cancelReservation(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Reservation cancelled!");
            router.refresh();
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById("event-qr-code");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const a = document.createElement("a");
            a.download = `queueup-${event.name.toLowerCase().replace(/\s+/g, "-")}.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div>
            {/* Event Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
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
                    {event.description && (
                        <p className="text-muted-foreground">{event.description}</p>
                    )}
                    {event.location && (
                        <p className="text-muted-foreground mt-1">📍 {event.location}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                Edit Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Event</DialogTitle>
                                <DialogDescription>Update event details.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEditEvent} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input name="name" defaultValue={event.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        name="description"
                                        defaultValue={event.description || ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input
                                        name="location"
                                        defaultValue={event.location || ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <select
                                        name="timezone"
                                        defaultValue={event.timezone || "America/New_York"}
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
                                    <Label>Cooldown (minutes)</Label>
                                    <Input
                                        name="cooldown_minutes"
                                        type="number"
                                        min="0"
                                        defaultValue={event.cooldown_minutes ?? 30}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Same email can&apos;t reserve again within this time.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        value="true"
                                        defaultChecked={event.is_active}
                                        className="rounded"
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="timeslots" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="timeslots">
                        Weekly Schedule ({timeslots.length})
                    </TabsTrigger>
                    <TabsTrigger value="reservations">
                        Reservations ({reservations.length})
                    </TabsTrigger>
                    <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                </TabsList>

                {/* Timeslots Tab */}
                <TabsContent value="timeslots">
                    <div className="flex items-center gap-2 mb-6 flex-wrap">
                        <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    + Add Timeslot
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Timeslots</DialogTitle>
                                    <DialogDescription>
                                        Set a time range and interval to generate recurring slots.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddSlot} className="space-y-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>Day of Week</Label>
                                        <select
                                            name="day_of_week"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            required
                                        >
                                            {DAY_NAMES.map((day, i) => (
                                                <option key={i} value={i}>
                                                    {day}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input name="start_time" type="time" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input name="end_time" type="time" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Interval (minutes)</Label>
                                            <Input
                                                name="interval"
                                                type="number"
                                                min="1"
                                                defaultValue="10"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                e.g. 10 → 8:00-8:10, 8:10-8:20…
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max per Slot</Label>
                                            <Input
                                                name="max_reservations"
                                                type="number"
                                                min="1"
                                                defaultValue="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Generating..." : "Generate Timeslots"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={bulkAddOpen} onOpenChange={setBulkAddOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Bulk Add</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Bulk Add Timeslots</DialogTitle>
                                    <DialogDescription>
                                        Generate timeslots at regular intervals for selected days.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleBulkAdd} className="space-y-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>Days of Week</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAY_SHORT.map((day, i) => (
                                                <button
                                                    type="button"
                                                    key={i}
                                                    onClick={() => toggleBulkDay(i)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${bulkDays.has(i)
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-background text-muted-foreground border-border hover:border-indigo-500/40"
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input name="start_hour" type="time" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input name="end_hour" type="time" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Interval (minutes)</Label>
                                            <Input
                                                name="interval"
                                                type="number"
                                                min="1"
                                                defaultValue="10"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max per Slot</Label>
                                            <Input
                                                name="max_reservations"
                                                type="number"
                                                min="1"
                                                defaultValue="2"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Creating..." : "Generate Timeslots"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {selectedSlots.size > 0 && (
                            <Button
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={handleBulkDeleteSlots}
                            >
                                Delete Selected ({selectedSlots.size})
                            </Button>
                        )}
                    </div>

                    {timeslots.length === 0 ? (
                        <div className="text-center py-16 rounded-2xl border border-dashed border-border/50">
                            <p className="text-lg text-muted-foreground">
                                No timeslots yet.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Add individual slots or use bulk add to generate a weekly schedule.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedSlots.size === timeslots.length && timeslots.length > 0}
                                                onChange={toggleAllSlots}
                                                className="rounded"
                                            />
                                        </TableHead>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Total Reservations</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timeslots.map((slot) => (
                                        <TableRow key={slot.id}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSlots.has(slot.id)}
                                                    onChange={() => toggleSlotSelection(slot.id)}
                                                    className="rounded"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {DAY_NAMES[slot.day_of_week]}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                                            </TableCell>
                                            <TableCell>
                                                {slot.max_reservations}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-indigo-500/10 text-indigo-400"
                                                >
                                                    {slot.reservation_count} total
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                {/* Reservations Tab */}
                <TabsContent value="reservations">
                    {reservations.length === 0 ? (
                        <div className="text-center py-16 rounded-2xl border border-dashed border-border/50">
                            <p className="text-lg text-muted-foreground">
                                No reservations yet.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Timeslot</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Booked At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reservations.map((res) => (
                                        <TableRow key={res.id}>
                                            <TableCell className="font-medium">
                                                {res.user_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {res.user_email}
                                            </TableCell>
                                            <TableCell>
                                                {res.reservation_date
                                                    ? format(new Date(res.reservation_date + "T00:00:00"), "MMM d, yyyy")
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {DAY_SHORT[res.timeslot.day_of_week]}{" "}
                                                {formatTime(res.timeslot.start_time)} —{" "}
                                                {formatTime(res.timeslot.end_time)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        res.status === "confirmed"
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : res.status === "cancelled"
                                                                ? "bg-destructive/10 text-destructive"
                                                                : "bg-muted text-muted-foreground"
                                                    }
                                                >
                                                    {res.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(res.created_at), "MMM d, h:mm a")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {res.status === "confirmed" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleCancelReservation(res.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                {/* QR Code Tab */}
                <TabsContent value="qrcode">
                    <Card className="max-w-md mx-auto bg-card/50 border-border/50">
                        <CardHeader className="text-center">
                            <CardTitle>Event QR Code</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-6">
                            <div className="p-6 bg-white rounded-2xl">
                                <QRCodeSVG
                                    id="event-qr-code"
                                    value={eventUrl}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-center break-all">
                                {eventUrl}
                            </p>
                            <Separator />
                            <Button
                                onClick={downloadQR}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Download QR Code
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Print this QR code and place it next to your station. Users can
                                scan it to reserve a timeslot.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
