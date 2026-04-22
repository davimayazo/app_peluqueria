"use client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchAppointments, cancelAppointment } from '@/lib/api';
import { Appointment } from '@/types';
import { Button } from '@/components/ui/Button';

export default function ClienteDashboard() {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: fetchAppointments
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelAppointment(id, 'Cancelada por el cliente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => alert(err.message)
  });

  const handleCancel = (id: number, serviceName: string) => {
    if (confirm(`¿Estás seguro de que deseas cancelar tu cita de ${serviceName}?`)) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pendiente':
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-[10px] font-bold border border-yellow-500/20 uppercase tracking-wider">Pendiente</span>;
      case 'confirmada':
        return <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold border border-green-500/20 uppercase tracking-wider">Confirmada</span>;
      case 'cancelada':
        return <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] font-bold border border-red-500/20 uppercase tracking-wider">Cancelada</span>;
      case 'completada':
        return <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/20 uppercase tracking-wider">Completada</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-[10px] font-bold border border-gray-500/20 uppercase tracking-wider">{status}</span>;
    }
  };

  const upcomingAppts = appointments?.filter((a: Appointment) => 
    (isFuture(parseISO(a.start_datetime)) || isToday(parseISO(a.start_datetime))) && 
    a.status !== 'cancelada' && 
    a.status !== 'completada'
  ).sort((a: Appointment, b: Appointment) => a.start_datetime.localeCompare(b.start_datetime)) || [];

  const pastAppts = appointments?.filter((a: Appointment) => 
    isPast(parseISO(a.start_datetime)) || 
    a.status === 'cancelada' || 
    a.status === 'completada'
  ).sort((a: Appointment, b: Appointment) => b.start_datetime.localeCompare(a.start_datetime)) || [];

  function isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  return (
    <ProtectedRoute allowedRoles={['cliente', 'admin']}>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-textMuted">Bienvenido a tu espacio personal de BarberBook</p>
          </div>
          <Button onClick={() => window.location.href='/reserva'} className="bg-primary text-black font-bold hover:bg-primary/90">
            Nueva Reserva
          </Button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center">
            No se han podido cargar tus citas. Por favor, inténtalo más tarde.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Próximas Citas */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Próximas Citas
              </h2>
              {upcomingAppts.length > 0 ? (
                <div className="space-y-6">
                  {upcomingAppts.map((appt: Appointment) => (
                    <Card key={appt.id} className="bg-surface border-border/40 hover:border-primary/30 transition-all overflow-hidden group">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{appt.service_name}</h3>
                              <p className="text-textMuted text-sm flex items-center gap-2 mt-1">
                                <span className="text-primary">●</span> {appt.barber_name}
                              </p>
                            </div>
                            {getStatusBadge(appt.status)}
                          </div>
                          
                          <div className="flex items-center justify-between bg-surfaceLayer/50 rounded-2xl p-4 border border-border/20">
                            <div className="flex items-center gap-4">
                              <div className="text-center bg-background p-2 rounded-xl min-w-[60px] border border-border/30">
                                <p className="text-xs text-textMuted uppercase font-bold">{format(parseISO(appt.start_datetime), "MMM", { locale: es })}</p>
                                <p className="text-xl font-bold text-primary">{format(parseISO(appt.start_datetime), "dd")}</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-white">{format(parseISO(appt.start_datetime), "HH:mm")} hs</p>
                                <p className="text-xs text-textMuted">Duración: {appt.service_duration} min</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-white">{parseFloat(appt.price_at_booking).toFixed(2)} €</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-6 py-4 bg-surfaceLayer/30 border-t border-border/10 flex justify-end">
                          <button 
                            onClick={() => handleCancel(appt.id, appt.service_name)}
                            disabled={cancelMutation.isPending}
                            className="text-xs font-bold text-red-500/70 hover:text-red-400 transition-colors uppercase tracking-widest disabled:opacity-50"
                          >
                            {cancelMutation.isPending ? 'Procesando...' : 'Cancelar Cita'}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-border/30 rounded-[2rem] bg-surface/20">
                  <p className="text-textMuted mb-6">No tienes ninguna cita programada.</p>
                  <Button variant="outline" onClick={() => window.location.href='/reserva'}>Hacer mi primera reserva</Button>
                </div>
              )}
            </section>

            {/* Historial */}
            <section>
              <h2 className="text-xl font-bold text-textMuted mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-textMuted/30 rounded-full"></span>
                Historial de Servicios
              </h2>
              {pastAppts.length > 0 ? (
                <div className="space-y-4">
                  {pastAppts.map((appt: Appointment) => (
                    <div key={appt.id} className="p-5 bg-surface/40 border border-border/20 rounded-2xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                      <div>
                        <p className="font-bold text-white">{appt.service_name}</p>
                        <p className="text-xs text-textMuted mt-1">
                          {format(parseISO(appt.start_datetime), "dd/MM/yyyy HH:mm")} • {appt.barber_name}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-sm font-bold text-white">{parseFloat(appt.price_at_booking).toFixed(2)} €</span>
                        {getStatusBadge(appt.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-textMuted border border-border/20 rounded-2xl">
                  <p>Aún no tienes historial de citas.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
