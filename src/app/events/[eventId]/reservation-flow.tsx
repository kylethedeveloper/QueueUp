"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createReservation } from "@/app/actions/reservations";
import { TimeslotInstance, DAY_NAMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReservationFlowProps {
    eventId: string;
    eventName: string;
    instances: TimeslotInstance[];
}

function formatTime(time: string): string {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

export default function ReservationFlow({
    eventId,
    eventName,
    instances,
}: ReservationFlowProps) {
    const router = useRouter();
    const [selectedSlot, setSelectedSlot] = useState<TimeslotInstance | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Group instances by date
    const groupedByDate = instances.reduce(
        (acc, inst) => {
            if (!acc[inst.date]) acc[inst.date] = [];
            acc[inst.date].push(inst);
            return acc;
        },
        {} as Record<string, TimeslotInstance[]>
    );

    const handleSelectSlot = (inst: TimeslotInstance) => {
        if (inst.reservation_count >= inst.max_reservations) return;
        setSelectedSlot(inst);
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSlot) return;

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.set("timeslot_id", selectedSlot.timeslot_id);
        formData.set("reservation_date", selectedSlot.date);

        try {
            const result = await createReservation(formData);
            if (result.error) {
                toast.error(result.error);
                setIsSubmitting(false);
                return;
            }
            setDialogOpen(false);
            const dateStr = format(new Date(selectedSlot.date + "T00:00:00"), "MMM d, yyyy");
            router.push(
                `/events/${eventId}/confirmation?name=${encodeURIComponent(
                    formData.get("user_name") as string
                )}&slot=${encodeURIComponent(
                    formatTime(selectedSlot.start_time)
                )}&slotEnd=${encodeURIComponent(
                    formatTime(selectedSlot.end_time)
                )}&date=${encodeURIComponent(dateStr)}&event=${encodeURIComponent(eventName)}`
            );
        } catch {
            toast.error("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <h2 className="text-xl font-semibold mb-6 text-foreground">
                Available Timeslots
            </h2>

            {instances.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border/50">
                    <p className="text-lg text-muted-foreground">No timeslots available yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Check back later for available slots.
                    </p>
                </div>
            ) : (
                Object.entries(groupedByDate).map(([dateKey, slots]) => {
                    const dateObj = new Date(dateKey + "T00:00:00");
                    return (
                        <div key={dateKey} className="mb-10">
                            <h3 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider">
                                {format(dateObj, "EEEE, MMMM d, yyyy")}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {slots.map((inst) => {
                                    const isFull = inst.reservation_count >= inst.max_reservations;
                                    const remaining = inst.max_reservations - inst.reservation_count;

                                    return (
                                        <button
                                            key={`${inst.timeslot_id}-${inst.date}`}
                                            onClick={() => handleSelectSlot(inst)}
                                            disabled={isFull}
                                            className={`group relative rounded-xl border p-4 text-left transition-all ${isFull
                                                ? "border-border/30 bg-muted/30 opacity-50 cursor-not-allowed"
                                                : "border-border/50 bg-card/50 hover:border-indigo-500/40 hover:bg-indigo-500/5 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5"
                                                }`}
                                        >
                                            <p className="font-semibold text-foreground text-sm">
                                                {formatTime(inst.start_time)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                to {formatTime(inst.end_time)}
                                            </p>
                                            <div className="mt-3">
                                                {isFull ? (
                                                    <span className="text-xs font-medium text-destructive/80">
                                                        Full
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-emerald-400">
                                                        {remaining} spot{remaining !== 1 ? "s" : ""} left
                                                    </span>
                                                )}
                                            </div>
                                            {/* Capacity bar */}
                                            <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isFull
                                                        ? "bg-destructive/50"
                                                        : remaining <= 1
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-500"
                                                        }`}
                                                    style={{
                                                        width: `${(inst.reservation_count / inst.max_reservations) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            {/* Reservation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reserve Your Spot</DialogTitle>
                        <DialogDescription>
                            {selectedSlot && (
                                <>
                                    {format(new Date(selectedSlot.date + "T00:00:00"), "EEEE, MMMM d")} ·{" "}
                                    {formatTime(selectedSlot.start_time)} —{" "}
                                    {formatTime(selectedSlot.end_time)}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="user_name">Name</Label>
                            <Input
                                id="user_name"
                                name="user_name"
                                placeholder="John Doe"
                                required
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user_email">Email</Label>
                            <Input
                                id="user_email"
                                name="user_email"
                                type="email"
                                placeholder="john@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Reserving..." : "Confirm Reservation"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
