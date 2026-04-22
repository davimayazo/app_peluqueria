import { useAuth } from '@/store/useAuth';
import { LoginCredentials, RegisterData } from '@/types';

export const API_URL = 'http://localhost:8000/api/v1';

/**
 * Cola de peticiones fallidas que esperan a que se resuelva el refresh.
 * Evita lanzar múltiples requests de refresh en paralelo.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

/**
 * Intenta renovar el access token usando el refresh token.
 * Devuelve el nuevo access token o lanza un error.
 */
const refreshAccessToken = async (): Promise<string> => {
  const { refreshToken, setAccessToken, logout } = useAuth.getState();

  if (!refreshToken) {
    logout();
    throw new Error('No hay refresh token disponible');
  }

  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    logout();
    throw new Error('Sesión expirada. Inicia sesión de nuevo.');
  }

  const data = await res.json();
  setAccessToken(data.access);
  return data.access;
};

/**
 * Wrapper de fetch con autenticación JWT y renovación automática de tokens.
 * - Añade el header Authorization si hay access token.
 * - Ante un 401, intenta renovar el token y reintentar la petición original.
 * - Si hay múltiples peticiones concurrentes que fallan con 401, solo una
 *   lanza el refresh y las demás esperan en cola.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { accessToken } = useAuth.getState();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si no es 401 o no había token, devolver la respuesta directamente
  if (res.status !== 401 || !accessToken) {
    return res;
  }

  // --- Flujo de refresh token ---
  if (isRefreshing) {
    // Ya hay un refresh en curso: encolar esta petición y esperar
    return new Promise<Response>((resolve, reject) => {
      failedQueue.push({
        resolve: async (newToken: string) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryRes = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
            resolve(retryRes);
          } catch (err) {
            reject(err);
          }
        },
        reject,
      });
    });
  }

  // Esta es la primera petición que detecta el 401: lanzar el refresh
  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);

    // Reintentar la petición original con el nuevo token
    headers['Authorization'] = `Bearer ${newToken}`;
    return await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch (error) {
    processQueue(error as Error, null);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

export const fetchAvailableSlots = async (barberId: string, date: string, serviceId: string) => {
  const res = await apiFetch(`/barbers/${barberId}/slots/?date=${date}&service_id=${serviceId}`);
  if (!res.ok) throw new Error('Failed to fetch slots');
  return res.json();
};

export const fetchServices = async () => {
  const res = await fetch(`${API_URL}/services/`);
  if (!res.ok) throw new Error('Failed to fetch services');
  const data = await res.json();
  return data.results || data;
};

export const fetchBarbers = async () => {
  const res = await fetch(`${API_URL}/barbers/`);
  if (!res.ok) throw new Error('Failed to fetch barbers');
  const data = await res.json();
  return data.results || data;
};

export const fetchAppointments = async () => {
  const res = await apiFetch('/appointments/');
  if (!res.ok) throw new Error('Failed to fetch appointments');
  const data = await res.json();
  return data.results || data;
};

export const createAppointment = async (appointmentData: { service_id: number; barber_id: number; start_datetime: string }) => {
  const res = await apiFetch('/appointments/', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al crear la cita');
  }
  return res.json();
};

export const loginUser = async (credentials: LoginCredentials) => {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) throw new Error('Usuario o contraseña incorrectos');
  return res.json();
};

export const registerUser = async (userData: RegisterData) => {
  const res = await fetch(`${API_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.username ? 'El usuario ya existe' : 'Error al registrar usuario');
  }
  return res.json();
};

export const fetchProfile = async () => {
  const res = await apiFetch('/users/me/');
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
};
