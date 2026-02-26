import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
    title: "About Us — QueueUp",
    description:
        "Learn about the QueueUp team and our mission to eliminate waiting in lines through smart queue management.",
};

const team = [
    {
        name: "Emirhan Izgi",
        major: "BA in Business Administration and Management",
        emoji: "📊",
        color: "from-amber-500/20 to-orange-500/20",
        borderColor: "hover:border-amber-500/40",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
        name: "Gulce Gul",
        major: "MS in Artificial Intelligence Engineering",
        emoji: "🤖",
        color: "from-violet-500/20 to-purple-500/20",
        borderColor: "hover:border-violet-500/40",
        badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    {
        name: "Melih Can Gunes",
        major: "MS in Big Data Analytics",
        emoji: "📈",
        color: "from-cyan-500/20 to-blue-500/20",
        borderColor: "hover:border-cyan-500/40",
        badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
        name: "Mert Yerlikaya",
        major: "MS in Cloud Computing Engineering",
        emoji: "☁️",
        color: "from-emerald-500/20 to-teal-500/20",
        borderColor: "hover:border-emerald-500/40",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50">
                <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
                    >
                        QueueUp
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            ← Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
                <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-6 backdrop-blur-sm">
                        About Us
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                        The Team Behind QueueUp
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We&apos;re a multidisciplinary team of graduate and undergraduate
                        students building smarter solutions for everyday problems.
                    </p>
                </div>
            </section>

            {/* Project Description */}
            <section className="mx-auto max-w-5xl px-6 py-16">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-xl">
                                💡
                            </span>
                            What is QueueUp?
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            QueueUp is a smart queue management system designed to eliminate
                            the frustration of waiting in lines. Whether it&apos;s a shared
                            microwave station, a campus service desk, or any resource with
                            limited availability, QueueUp lets users scan a QR code, pick a
                            timeslot, and get notified when it&apos;s their turn.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Built with modern web technologies including Next.js, TypeScript,
                            and Supabase, QueueUp is fast, reliable, and works on any device
                            with a browser — no app installation required.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
                                🎯
                            </span>
                            Our Mission
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our mission is to make shared resources more accessible and
                            efficient. Nobody should have to stand around guessing when a
                            machine or service will be free. By providing a simple, intuitive
                            reservation system with real-time availability and automated
                            notifications, we help communities manage their time better.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We believe that great software should be invisible — it should
                            solve the problem and get out of the way. That&apos;s the
                            principle that guides every feature we build.
                        </p>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="mx-auto max-w-5xl px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Team */}
            <section className="mx-auto max-w-5xl px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-semibold text-foreground mb-3">
                        Meet the Team
                    </h2>
                    <p className="text-muted-foreground">
                        A diverse team bringing together business, AI, data, and cloud
                        expertise.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {team.map((member) => (
                        <Card
                            key={member.name}
                            className={`group relative overflow-hidden bg-card/50 border-border/50 transition-all ${member.borderColor} hover:shadow-lg`}
                        >
                            {/* Gradient background */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />
                            <CardContent className="relative pt-8 pb-8 text-center">
                                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 text-4xl group-hover:scale-110 transition-transform duration-300">
                                    {member.emoji}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {member.name}
                                </h3>
                                <span
                                    className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${member.badgeColor}`}
                                >
                                    {member.major}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-5xl px-6 pb-20">
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-12 text-center">
                    <h2 className="text-2xl font-semibold text-foreground mb-3">
                        Ready to skip the line?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Browse active events and reserve your timeslot in seconds.
                    </p>
                    <Link href="/#events">
                        <Button
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                        >
                            Browse Events
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 py-8">
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        QueueUp — Smart Queue Management System
                    </p>
                </div>
            </footer>
        </div>
    );
}
