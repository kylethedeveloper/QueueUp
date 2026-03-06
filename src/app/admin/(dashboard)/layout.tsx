import Link from "next/link";
import { logoutAdmin } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/admin"
                            className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
                        >
                            QueueUp Admin
                        </Link>
                        <nav className="hidden sm:flex items-center gap-1">
                            <Link href="/admin">
                                <Button variant="ghost" size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/admin/events">
                                <Button variant="ghost" size="sm">
                                    Events
                                </Button>
                            </Link>
                            <Link href="/admin/settings">
                                <Button variant="ghost" size="sm">
                                    Settings
                                </Button>
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/" target="_blank">
                            <Button variant="ghost" size="sm">
                                View Site
                            </Button>
                        </Link>
                        <form action={logoutAdmin}>
                            <Button variant="outline" size="sm" type="submit">
                                Logout
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
    );
}
