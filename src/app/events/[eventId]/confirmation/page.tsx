import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
    searchParams: Promise<{
        name?: string;
        slot?: string;
        slotEnd?: string;
        date?: string;
        event?: string;
    }>;
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
    const { name, slot, slotEnd, date, event } = await searchParams;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="max-w-md w-full bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        You&apos;re Queued Up!
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Your reservation has been confirmed, <strong className="text-foreground">{name || "Guest"}</strong>.
                    </p>

                    <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-6 text-left mb-8 space-y-3">
                        {event && (
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📌</span>
                                <div>
                                    <p className="text-xs text-muted-foreground">Event</p>
                                    <p className="text-sm font-medium text-foreground">{event}</p>
                                </div>
                            </div>
                        )}
                        {date && (
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📅</span>
                                <div>
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="text-sm font-medium text-foreground">{date}</p>
                                </div>
                            </div>
                        )}
                        {slot && (
                            <div className="flex items-center gap-3">
                                <span className="text-lg">🕐</span>
                                <div>
                                    <p className="text-xs text-muted-foreground">Time</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {slot} — {slotEnd || ""}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        You&apos;ll receive a confirmation email and a reminder 15 minutes before your timeslot.
                    </p>

                    <Link href="/">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Back to Home
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
