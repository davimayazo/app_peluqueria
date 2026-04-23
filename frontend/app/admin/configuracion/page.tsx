"use client";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchBusinessConfig, updateBusinessConfig } from '@/lib/api';

export default function AdminConfiguracion() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    min_booking_notice_minutes: 60,
    show_appointments_widget: true,
    show_revenue_widget: true,
    show_services_widget: true,
    show_staff_widget: true,
    show_new_customers_widget: true,
    show_agenda_widget: true,
    points_per_euro: 1,
    point_redemption_value: 0.01,
  });
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({ 
    queryKey: ['business_config'], 
    queryFn: fetchBusinessConfig 
  });

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || '',
        email: config.email || '',
        address: config.address || '',
        phone: config.phone || '',
        min_booking_notice_minutes: config.min_booking_notice_minutes || 60,
        show_appointments_widget: config.show_appointments_widget ?? true,
        show_revenue_widget: config.show_revenue_widget ?? true,
        show_services_widget: config.show_services_widget ?? true,
        show_staff_widget: config.show_staff_widget ?? true,
        show_new_customers_widget: config.show_new_customers_widget ?? true,
        show_agenda_widget: config.show_agenda_widget ?? true,
        points_per_euro: config.points_per_euro || 1,
        point_redemption_value: config.point_redemption_value || 0.01,
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: updateBusinessConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_config'] });
      setSuccess(true);
      setErrorMsg(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      console.error("Error saving config:", err);
      let message = "Error al guardar la configuración.";
      try {
        const details = JSON.parse(err.message);
        message += "\n\nDetalles:\n" + Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n');
      } catch (e) {
        message += "\n" + err.message;
      }
      setErrorMsg(message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const toggleWidget = (key: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-4">
            <h1 className="text-3xl font-display font-bold text-primary mb-2">Configuración General</h1>
            <p className="text-textMuted">Ajustes globales de la aplicación y del negocio</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                  ¡Configuración actualizada correctamente!
                </div>
              )}
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium animate-in slide-in-from-top-2 duration-300 whitespace-pre-wrap select-all">
                  {errorMsg}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Nombre Comercial</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-surfaceLayer border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Email de Contacto</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-surfaceLayer border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Dirección</label>
                      <input 
                        type="text" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-surfaceLayer border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Teléfono de Contacto</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-surfaceLayer border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DASHBOARD WIDGETS CONFIG */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Personalización del Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-textMuted mb-4">Activa o desactiva los widgets que quieres ver en tu panel de administración principal.</p>
                  
                  <div className="grid gap-3">
                    {[
                      { id: 'show_appointments_widget', label: 'Citas del Periodo', desc: 'Resumen total de citas en el rango seleccionado' },
                      { id: 'show_revenue_widget', label: 'Ingresos Estimados', desc: 'Suma de facturación de citas completadas/confirmadas' },
                      { id: 'show_services_widget', label: 'Métricas de Servicios', desc: 'Análisis de los servicios más populares' },
                      { id: 'show_staff_widget', label: 'Rendimiento del Staff', desc: 'Ingresos generados por cada barbero' },
                      { id: 'show_new_customers_widget', label: 'Clientes Nuevos', desc: 'Listado de usuarios registrados recientemente' },
                      { id: 'show_agenda_widget', label: 'Lista de Agenda', desc: 'Visualización detallada de citas del periodo' },
                    ].map((widget) => {
                      const isActive = formData[widget.id as keyof typeof formData];
                      return (
                        <div key={widget.id} className="flex items-center justify-between p-4 bg-surfaceLayer rounded-xl border border-border/50 group hover:border-primary/30 transition-all">
                          <div className="flex flex-col">
                            <span className={`font-medium transition-colors ${isActive ? 'text-white' : 'text-textMuted'}`}>{widget.label}</span>
                            <span className="text-xs text-textMuted">{widget.desc}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-red-500'}`}>
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleWidget(widget.id as any)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none shadow-inner ${isActive ? 'bg-green-500/80 shadow-green-900/50' : 'bg-red-500/80 shadow-red-900/50'}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Sistema de Puntos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">Relación Puntos por Euro</h4>
                      <p className="text-sm text-textMuted">Cuántos puntos recibe el cliente por cada 1€ gastado.</p>
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.1"
                          value={formData.points_per_euro}
                          onChange={(e) => setFormData({...formData, points_per_euro: parseFloat(e.target.value) || 0})}
                          className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">Valor de Canje (1 Punto = €)</h4>
                      <p className="text-sm text-textMuted">Valor en euros de cada punto. Por defecto 0.01 (100 pts = 1€).</p>
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.0001"
                          value={formData.point_redemption_value}
                          onChange={(e) => setFormData({...formData, point_redemption_value: parseFloat(e.target.value) || 0})}
                          className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Ajustes de Reservas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-textMuted">
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surfaceLayer rounded-lg border border-border gap-4">
                      <div>
                        <p className="text-white font-medium">Reserva con antelación mínima</p>
                        <p className="text-xs">Tiempo mínimo antes de la cita para poder reservar</p>
                      </div>
                      <select 
                        value={formData.min_booking_notice_minutes}
                        onChange={(e) => setFormData({...formData, min_booking_notice_minutes: parseInt(e.target.value)})}
                        className="bg-background border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={60}>1 hora</option>
                        <option value={120}>2 horas</option>
                        <option value={720}>12 horas</option>
                        <option value={1440}>24 horas</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
