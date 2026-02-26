import { createAdminClient } from "./supabase/admin";
import { Event, Timeslot, DAY_NAMES } from "./types";
import { format } from "date-fns";

function formatSlotTime(time: string): string {
  // Convert HH:mm or HH:mm:ss to 12h format
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export async function sendConfirmationEmail(
  email: string,
  userName: string,
  event: Event,
  timeslot: Timeslot,
  reservationDate: string
) {
  const dayName = DAY_NAMES[timeslot.day_of_week];
  const dateStr = format(new Date(reservationDate + "T00:00:00"), "MMM d, yyyy");
  const startTime = formatSlotTime(timeslot.start_time);
  const endTime = formatSlotTime(timeslot.end_time);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `✅ Reservation Confirmed — ${event.name}`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: white;">🎉 You're Queued Up!</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; color: #a1a1aa;">Hi <strong style="color: #fafafa;">${userName}</strong>,</p>
              <p style="font-size: 16px; color: #a1a1aa;">Your reservation has been confirmed!</p>
              <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #6366f1;">
                <p style="margin: 4px 0; color: #fafafa;"><strong>📌 Event:</strong> ${event.name}</p>
                <p style="margin: 4px 0; color: #fafafa;"><strong>📍 Location:</strong> ${event.location || "TBD"}</p>
                <p style="margin: 4px 0; color: #fafafa;"><strong>📅 Date:</strong> ${dayName}, ${dateStr}</p>
                <p style="margin: 4px 0; color: #fafafa;"><strong>🕐 Time:</strong> ${startTime} — ${endTime}</p>
              </div>
              <p style="font-size: 14px; color: #71717a;">You'll receive a reminder 15 minutes before your timeslot.</p>
            </div>
            <div style="background: #111; padding: 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #52525b;">QueueUp — Smart Queue Management</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("Failed to send confirmation email:", await res.text());
    }
  } catch (err) {
    console.error("Error sending confirmation email:", err);
  }
}

export async function sendReminderEmail(
  email: string,
  userName: string,
  event: Event,
  timeslot: Timeslot,
  reservationDate: string
) {
  const dayName = DAY_NAMES[timeslot.day_of_week];
  const dateStr = format(new Date(reservationDate + "T00:00:00"), "MMM d, yyyy");
  const startTime = formatSlotTime(timeslot.start_time);
  const endTime = formatSlotTime(timeslot.end_time);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `⏰ Reminder — ${event.name} in 15 minutes!`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: white;">⏰ Your Slot is Coming Up!</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; color: #a1a1aa;">Hi <strong style="color: #fafafa;">${userName}</strong>,</p>
              <p style="font-size: 16px; color: #a1a1aa;">Your reservation starts in <strong style="color: #f59e0b;">15 minutes</strong>!</p>
              <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 4px 0; color: #fafafa;"><strong>📌 Event:</strong> ${event.name}</p>
                <p style="margin: 4px 0; color: #fafafa;"><strong>📍 Location:</strong> ${event.location || "TBD"}</p>
                <p style="margin: 4px 0; color: #fafafa;"><strong>📅 Date:</strong> ${dayName}, ${dateStr}</p>
                <p style="margin: 4px 0; color: #fafafa;"><strong>🕐 Time:</strong> ${startTime} — ${endTime}</p>
              </div>
              <p style="font-size: 14px; color: #71717a;">Please head to the location and be ready for your slot.</p>
            </div>
            <div style="background: #111; padding: 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #52525b;">QueueUp — Smart Queue Management</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("Failed to send reminder email:", await res.text());
    }
  } catch (err) {
    console.error("Error sending reminder email:", err);
  }
}
