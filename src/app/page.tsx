import Link from "next/link";
import { getActiveEvents } from "@/app/actions/events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let events: Awaited<ReturnType<typeof getActiveEvents>> = [];
  try {
    events = await getActiveEvents();
  } catch (err) {
    console.error("Failed to fetch active events:", err);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Smart Queue Management
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            QueueUp
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            No more waiting in line. Scan the QR code, pick your timeslot, and get notified when it&apos;s your turn.
            Simple, fast, and hassle-free.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <a href="#events">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40">
                Browse Events
              </Button>
            </a>
            <Link href="/about">
              <Button variant="outline" size="lg" className="border-indigo-500/30 hover:bg-indigo-500/10">
                About Us
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                Admin Panel →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <h2 className="text-center text-2xl font-semibold mb-12 text-foreground">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              icon: "📱",
              title: "Scan QR Code",
              desc: "Find the QR code at the station and scan it with your phone.",
            },
            {
              step: "2",
              icon: "🗓️",
              title: "Pick a Timeslot",
              desc: "Browse available slots and reserve the one that works for you.",
            },
            {
              step: "3",
              icon: "🔔",
              title: "Get Notified",
              desc: "Receive a confirmation and a reminder 15 minutes before your slot.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl group-hover:bg-indigo-500/20 transition-colors">
                  {item.icon}
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  STEP {item.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Events */}
      <section id="events" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <h2 className="text-2xl font-semibold mb-8 text-foreground">
          Active Events
        </h2>
        {events.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-lg text-muted-foreground">No active events yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Events created by admins will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="group cursor-pointer transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 bg-card/50 backdrop-blur-sm h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Active
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 group-hover:text-indigo-400 transition-colors">
                      {event.name}
                    </CardTitle>
                    <CardDescription>
                      {event.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>📍</span> {event.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            QueueUp — Smart Queue Management System
          </p>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About Us
          </Link>
        </div>
      </footer>
    </div>
  );
}
