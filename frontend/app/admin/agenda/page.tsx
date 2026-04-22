"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  fetchAppointments, 
  fetchServices, 
  fetchBarbers, 
  fetchUsers, 
  createAppointment,
  completeAppointment
} from '@/lib/api';
import { Appointment, Service, Barber, User } from '@/types';

export default function AdminAgenda() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('pendiente');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    barber_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00'
  });

  // Queries
  const { data: appointments, isLoading } = useQuery({ 
    queryKey: ['admin_appointments'], 
    queryFn: fetchAppointments 
  });

  const { data: services } = useQuery({ queryKey: ['services'], queryFn: fetchServices });
  const { data: barbers } = useQuery({ queryKey: ['barbers'], queryFn: fetchBarbers });
  const { data: users } = useQuery({ queryKey: ['admin_users'], queryFn: fetchUsers });

  const clients = users?.filter((u: User) => u.profile?.role === 'cliente') || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_appointments'] });
      setIsModalOpen(false);
      setFormData({
        client_id: '',
        service_id: '',
        barber_id: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
      });
    },
    onError: (err: any) => setError(err.message)
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_appointments'] });
    },
    onError: (err: any) => alert(err.message)
  });

  const filteredAppointments = appointments?.filter((appt: Appointment) => {
    const matchesDate = isSameDay(parseISO(appt.start_datetime), parseISO(selectedDate));
    const matchesStatus = filterStatus === 'todos' || appt.status === filterStatus;
    return matchesDate && matchesStatus;
  }) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.client_id || !formData.service_id || !formData.date || !formData.time) {
      setError("Por favor, completa los campos obligatorios.");
      return;
    }

    const start_datetime = `${formData.date}T${formData.time}:00`;
    const barberId = formData.barber_id === 'sin_preferencia' || !formData.barber_id ? null : parseInt(formData.barber_id);
    
    createMutation.mutate({
      client_id: parseInt(formData.client_id),
      service_id: parseInt(formData.service_id),
      barber_id: barberId,
      start_datetime
    });
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary mb-2">Agenda de Citas</h1>
              <p className="text-textMuted">Gestiona y visualiza todas las reservas</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => { setError(null); setIsModalOpen(true); }}
                className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Nueva Cita
              </button>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-surfaceLayer border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-surfaceLayer border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="pendiente">Por Realizar (Pendientes)</option>
                <option value="todos">Todos los estados</option>
                <option value="confirmada">Confirmadas</option>
                <option value="completada">Completadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">
                    Citas para el {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}
                  </CardTitle>
                  <span className="text-sm text-textMuted">
                    {filteredAppointments.length} cita(s) encontrada(s)
                  </span>
                </CardHeader>
                <CardContent>
                  {filteredAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {filteredAppointments.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime)).map((appt: Appointment) => (
                        <div key={appt.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 bg-surface rounded-xl border transition-all group ${appt.status === 'pendiente' ? 'border-primary/30' : 'border-border/50'}`}>
                          <div className="flex gap-6 items-center">
                            <div className="text-center">
                              <p className={`text-2xl font-bold ${appt.status === 'pendiente' ? 'text-primary' : 'text-textMuted'}`}>
                                {format(parseISO(appt.start_datetime), "HH:mm")}
                              </p>
                              <p className="text-[10px] text-textMuted uppercase tracking-wider">Inicio</p>
                            </div>
                            
                            <div className="h-10 w-[1px] bg-border hidden md:block"></div>
                            
                            <div>
                              <p className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                {appt.client_name}
                              </p>
                              <p className="text-sm text-textMuted flex items-center gap-2">
                                <span className="text-white/80">{appt.service_name}</span> 
                                <span className="w-1 h-1 bg-textMuted rounded-full"></span>
                                <span className="text-primary/90 font-medium">{appt.barber_name}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6">
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">{parseFloat(appt.price_at_booking).toFixed(2)} €</p>
                              <p className="text-[10px] text-textMuted uppercase tracking-wider">Precio</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {appt.status === 'pendiente' && (
                                <button 
                                  onClick={() => completeMutation.mutate(appt.id)}
                                  disabled={completeMutation.isPending}
                                  className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20"
                                >
                                  {completeMutation.isPending ? '...' : 'Completar'}
                                </button>
                              )}
                              <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                                appt.status === 'confirmada' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                appt.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                appt.status === 'cancelada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {appt.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-textMuted border-2 border-dashed border-border rounded-2xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">No hay citas para este día</p>
                      <p className="text-sm">Selecciona otra fecha o cambia los filtros</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Modal Nueva Cita */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-surfaceLayer border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">Nueva Cita (Admin)</h2>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Cliente</label>
                  <select required value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Selecciona un cliente</option>
                    {clients.map((c: User) => (
                      <option key={c.id} value={c.id}>{c.full_name || c.username} ({c.email})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Barbero</label>
                    <select value={formData.barber_id} onChange={(e) => setFormData({...formData, barber_id: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Seleccionar</option>
                      <option value="sin_preferencia" className="text-primary font-bold">✨ Sin preferencia (Auto)</option>
                      {barbers?.map((b: Barber) => (
                        <option key={b.id} value={b.id}>{b.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Servicio</label>
                    <select required value={formData.service_id} onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Seleccionar</option>
                      {services?.map((s: Service) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.price}€)</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Fecha</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Hora</label>
                    <input type="time" required step="900" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-surface border border-border text-white rounded-lg hover:bg-surface/80 transition-colors">Cancelar</button>
                  <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {createMutation.isPending ? 'Creando...' : 'Confirmar Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
