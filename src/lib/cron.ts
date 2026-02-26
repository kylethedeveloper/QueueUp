import cron from "node-cron";
import { createAdminClient } from "./supabase/admin";
import { sendReminderEmail } from "./email";

let isStarted = false;

export function startReminderCron() {
    if (isStarted) return;
    isStarted = true;

    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        console.log("[CRON] Checking for upcoming reservations to send reminders...");

        try {
            const supabase = createAdminClient();
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

            // Find confirmed reservations for today that haven't had a reminder sent
            const { data: reservations, error } = await supabase
                .from("reservations")
                .select(`
          *,
          timeslot:timeslots!inner(
            *,
            event:events!inner(*)
          )
        `)
                .eq("status", "confirmed")
                .eq("reminder_sent", false)
                .eq("reservation_date", today);

            if (error) {
                console.error("[CRON] Error fetching reservations:", error);
                return;
            }

            if (!reservations || reservations.length === 0) {
                console.log("[CRON] No reminders to send.");
                return;
            }

            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            // Filter to only those starting within 15-20 minutes
            const upcoming = reservations.filter((res) => {
                const [h, m] = res.timeslot.start_time.split(":").map(Number);
                const slotMinutes = h * 60 + m;
                const diff = slotMinutes - nowMinutes;
                return diff >= 15 && diff <= 20;
            });

            if (upcoming.length === 0) {
                console.log("[CRON] No reminders to send.");
                return;
            }

            console.log(`[CRON] Sending ${upcoming.length} reminder(s)...`);

            for (const reservation of upcoming) {
                try {
                    await sendReminderEmail(
                        reservation.user_email,
                        reservation.user_name,
                        reservation.timeslot.event,
                        reservation.timeslot,
                        reservation.reservation_date
                    );

                    // Mark reminder as sent
                    await supabase
                        .from("reservations")
                        .update({ reminder_sent: true })
                        .eq("id", reservation.id);

                    console.log(`[CRON] Reminder sent to ${reservation.user_email}`);
                } catch (err) {
                    console.error(`[CRON] Failed to send reminder to ${reservation.user_email}:`, err);
                }
            }
        } catch (err) {
            console.error("[CRON] Unexpected error:", err);
        }
    });

    console.log("[CRON] Reminder job started — runs every 5 minutes");
}
