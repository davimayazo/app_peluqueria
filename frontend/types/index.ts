export type Role = 'cliente' | 'admin' | 'barbero';

export interface Profile {
  id: number;
  role: Role;
  phone: string;
  points: number;
  favorite_barber: number | null;
  is_active: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_joined: string;
  profile: Profile;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  duration_display: string;
  price: string; // Decimal from API
  price_display: string;
  is_active: boolean;
}

export interface BarberSchedule {
  id: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_working: boolean;
}

export interface Barber {
  id: number;
  full_name: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  is_active: boolean;
  schedules?: BarberSchedule[];
}

export interface Appointment {
  id: number;
  client: number;
  barber: number;
  service: number;
  client_name: string;
  barber_name: string;
  service_name: string;
  service_duration: number;
  start_datetime: string;
  end_datetime: string;
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  price_at_booking: string;
}

export interface BusinessMetrics {
  totalAppointments: number;
  totalIncome: number;
  activeClients: number;
  cancellations: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone?: string;
}
