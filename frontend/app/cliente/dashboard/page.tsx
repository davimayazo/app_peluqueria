"use client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">Pendiente</span>;
      case 'confirmada':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">Confirmada</span>;
      case 'cancelada':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold border border-red-500/30">Cancelada</span>;
      case 'completada':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold border border-blue-500/30">Completada</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const upcomingAppts = appointments?.filter((a: Appointment) => isFuture(parseISO(a.start_datetime)) && a.status !== 'cancelada' && a.status !== 'completada').sort((a: Appointment, b: Appointment) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  const pastAppts = appointments?.filter((a: Appointment) => isPast(parseISO(a.start_datetime)) || a.status === 'cancelada' || a.status === 'completada').sort((a: Appointment, b: Appointment) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());

  return (
    <ProtectedRoute allowedRoles={['cliente', 'admin']}>
      <div className="text-textMain">
        <div className="mb-8 border-b border-border pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary mb-2">Mi Perfil</h1>
            <p className="text-textMuted">Gestiona y revisa todas tus citas</p>
          </div>
          <Button variant="default" onClick={() => window.location.href='/reserva'}>Nueva Cita</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-xl text-center">
            Error al cargar las citas. Por favor, intenta de nuevo más tarde.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Próximas Citas */}
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center border-l-4 border-primary pl-3">Próximas Citas</h2>
              {upcomingAppts?.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppts.map((appt: Appointment) => (
                    <Card key={appt.id} className="border-border hover:border-primary/50 transition-colors bg-surface">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-white mb-1">{appt.service_name}</h3>
                            <p className="text-sm text-textMuted flex items-center">
                              <span className="inline-block w-4 h-4 mr-2 rounded-full bg-surfaceLayer text-primary flex items-center justify-center text-[10px]">🤵</span> 
                              {appt.barber_name}
                            </p>
                          </div>
                          {getStatusBadge(appt.status)}
                        </div>
                        <div className="bg-surfaceLayer rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3">
                          <div className="text-center sm:text-left">
                            <p className="text-primary font-bold text-xl capitalize">
                              {format(parseISO(appt.start_datetime), "d 'de' MMMM", { locale: es })}
                            </p>
                            <p className="text-white text-lg">
                              {format(parseISO(appt.start_datetime), "HH:mm")} hs
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-textMuted">Duración: {appt.service_duration} min</p>
                            <p className="text-primary font-semibold text-lg">{parseFloat(appt.price_at_booking).toFixed(2)} €</p>
                          </div>
                        </div>
                        
                        {/* Botón de cancelar */}
                        <div className="mt-4 pt-4 border-t border-border flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleCancel(appt.id, appt.service_name)}
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar Cita'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-border bg-transparent">
                  <CardContent className="p-8 text-center text-textMuted flex flex-col items-center justify-center h-48">
                    <p className="mb-4">No tienes próximas citas reservadas.</p>
                    <Button variant="outline" onClick={() => window.location.href='/reserva'}>Reserva ahora</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Historial */}
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center border-l-4 border-surfaceLayer pl-3 text-textMuted">Historial</h2>
              {pastAppts?.length > 0 ? (
                <div className="space-y-4">
                  {pastAppts.map((appt: Appointment) => (
                    <Card key={appt.id} className="border-border bg-surfaceLayer/30 opacity-70">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-white">{appt.service_name}</h3>
                          {getStatusBadge(appt.status)}
                        </div>
                        <p className="text-sm text-textMuted mb-2">Con {appt.barber_name}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 capitalize">
                            {format(parseISO(appt.start_datetime), "d MMM, yyyy - HH:mm", { locale: es })}
                          </span>
                          <span className="font-semibold text-white">{parseFloat(appt.price_at_booking).toFixed(2)} €</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-textMuted border border-border rounded-xl">
                  <p>Aún no tienes un historial de citas.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
