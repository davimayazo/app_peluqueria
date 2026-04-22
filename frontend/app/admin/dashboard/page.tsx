"use client";
import { useQuery } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchAppointments, fetchServices, fetchBarbers } from '@/lib/api';
import { Appointment } from '@/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ['admin_appointments'],
    queryFn: fetchAppointments
  });

  const { data: services } = useQuery({ queryKey: ['services'], queryFn: fetchServices });
  const { data: barbers } = useQuery({ queryKey: ['barbers'], queryFn: fetchBarbers });

  // Calculate Metrics
  const todayAppointments = appointments?.filter((a: Appointment) => isToday(parseISO(a.start_datetime))) || [];
  const activeAppointments = appointments?.filter((a: Appointment) => a.status === 'confirmada' || a.status === 'completada') || [];
  const totalRevenue = activeAppointments.reduce((acc: number, curr: Appointment) => acc + parseFloat(curr.price_at_booking), 0);
  
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-4">
            <h1 className="text-3xl font-display font-bold text-primary mb-2">Panel de Administración</h1>
            <p className="text-textMuted">Gestión general de BarberBook</p>
          </div>

          {loadingAppts ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
          ) : (
            <div className="space-y-8">
              
              {/* METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-surfaceLayer">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-textMuted mb-2">Citas Hoy</p>
                    <h3 className="text-3xl font-bold text-white">{todayAppointments.length}</h3>
                  </CardContent>
                </Card>
                <Card className="bg-surfaceLayer">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-textMuted mb-2">Ingresos Totales (Est.)</p>
                    <h3 className="text-3xl font-bold text-primary">{totalRevenue.toFixed(2)} €</h3>
                  </CardContent>
                </Card>
                <Card className="bg-surfaceLayer">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-textMuted mb-2">Servicios Activos</p>
                    <h3 className="text-3xl font-bold text-white">{services?.length || 0}</h3>
                  </CardContent>
                </Card>
                <Card className="bg-surfaceLayer">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-textMuted mb-2">Profesionales</p>
                    <h3 className="text-3xl font-bold text-white">{barbers?.length || 0}</h3>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-8">
                
                {/* AGENDA HOY */}
                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">Agenda de Hoy</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {todayAppointments.length > 0 ? (
                      <div className="space-y-3">
                        {todayAppointments.map((appt: Appointment) => (
                          <div key={appt.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border/50">
                            <div className="flex gap-4 items-center">
                              <div className="text-center font-bold text-primary border-r border-border pr-4">
                                {format(parseISO(appt.start_datetime), "HH:mm")}
                              </div>
                              <div>
                                <p className="font-medium text-white">{appt.client_name}</p>
                                <p className="text-sm text-textMuted">{appt.service_name} • <span className="text-primary">{appt.barber_name}</span></p>
                              </div>
                            </div>
                            <div>
                               <span className="px-2 py-1 bg-surfaceLayer text-xs rounded-md text-textMuted capitalize">
                                 {appt.status}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-textMuted min-h-[200px] border-2 border-dashed border-border rounded-xl">
                        <p>No hay citas programadas para hoy.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
