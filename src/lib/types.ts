export interface Event {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    is_active: boolean;
    cooldown_minutes: number;
    timezone: string;
    created_at: string;
    updated_at: string;
}

// Weekly schedule template (stored in DB)
export interface Timeslot {
    id: string;
    event_id: string;
    day_of_week: number; // 0=Sunday, 1=Monday, ... 6=Saturday
    start_time: string; // HH:mm:ss (TIME format)
    end_time: string; // HH:mm:ss (TIME format)
    max_reservations: number;
    created_at: string;
}

// Admin view - template with total reservation count
export interface TimeslotWithCount extends Timeslot {
    reservation_count: number;
}

// Public view - a specific date instance of a timeslot template
export interface TimeslotInstance {
    timeslot_id: string;
    date: string; // YYYY-MM-DD
    day_of_week: number;
    start_time: string; // HH:mm:ss
    end_time: string; // HH:mm:ss
    max_reservations: number;
    reservation_count: number;
}

export interface Reservation {
    id: string;
    timeslot_id: string;
    reservation_date: string | null; // YYYY-MM-DD
    user_name: string;
    user_email: string;
    status: "confirmed" | "cancelled" | "completed";
    confirmation_sent: boolean;
    reminder_sent: boolean;
    created_at: string;
}

export interface ReservationWithDetails extends Reservation {
    timeslot: Timeslot;
    event: Event;
}

export const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
