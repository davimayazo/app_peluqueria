"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchBarbers, createBarber, updateBarber, deleteBarber } from '@/lib/api';
import { Barber, BarberSchedule } from '@/types';

const DAYS = [
  { id: 0, name: 'Lunes' },
  { id: 1, name: 'Martes' },
  { id: 2, name: 'Miércoles' },
  { id: 3, name: 'Jueves' },
  { id: 4, name: 'Viernes' },
  { id: 5, name: 'Sábado' },
  { id: 6, name: 'Domingo' },
];

export default function AdminBarberos() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  // Form State (Profile)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    specialties: '',
    avatar_url: '',
    is_active: true,
    email: '',
    password: ''
  });

  // Schedule State
  const [schedules, setSchedules] = useState<Partial<BarberSchedule>[]>([]);

  const { data: barbers, isLoading } = useQuery({ 
    queryKey: ['barbers'], 
    queryFn: fetchBarbers 
  });

  const filteredBarbers = barbers?.filter((barber: Barber) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      barber.full_name.toLowerCase().includes(searchLower) ||
      barber.specialties.some(s => s.toLowerCase().includes(searchLower))
    );
  }).sort((a: Barber, b: Barber) => {
    if (a.is_active === b.is_active) return a.full_name.localeCompare(b.full_name);
    return a.is_active ? -1 : 1;
  }) || [];

  const createMutation = useMutation({
    mutationFn: createBarber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      closeModal();
    },
    onError: (err: any) => setError(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateBarber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      closeModal();
      setIsScheduleModalOpen(false);
    },
    onError: (err: any) => setError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBarber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
    },
    onError: (err: any) => alert(err.message)
  });

  const openModal = (barber: Barber | null = null) => {
    setError(null);
    if (barber) {
      setSelectedBarber(barber);
      setFormData({
        full_name: barber.full_name,
        bio: barber.bio || '',
        specialties: barber.specialties.join(', '),
        avatar_url: barber.avatar_url || '',
        is_active: barber.is_active,
        email: '',
        password: ''
      });
    } else {
      setSelectedBarber(null);
      setFormData({
        full_name: '',
        bio: '',
        specialties: '',
        avatar_url: '',
        is_active: true,
        email: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const openScheduleModal = (barber: Barber) => {
    setSelectedBarber(barber);
    // Inicializar horarios: si el barbero ya tiene, usarlos. Si no, crear por defecto.
    const initialSchedules = DAYS.map(day => {
      const existing = barber.schedules?.find(s => s.day_of_week === day.id);
      return existing ? { ...existing } : {
        day_of_week: day.id,
        start_time: '09:00:00',
        end_time: '20:00:00',
        break_start: '14:00:00',
        break_end: '16:00:00',
        is_working: true
      };
    });
    setSchedules(initialSchedules);
    setIsScheduleModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsScheduleModalOpen(false);
    setSelectedBarber(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data: any = {
      ...formData,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s !== '')
    };

    // Solo enviar email y password si tienen contenido para evitar errores de validación
    if (!data.email) delete data.email;
    if (!data.password) delete data.password;

    if (selectedBarber) {
      updateMutation.mutate({ id: selectedBarber.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSaveSchedule = () => {
    if (!selectedBarber) return;
    updateMutation.mutate({
      id: selectedBarber.id,
      data: { schedules }
    });
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'barbero']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary mb-2">Profesionales y Horarios</h1>
              <p className="text-textMuted">Gestiona el equipo de barberos y su disponibilidad</p>
            </div>
            <button 
              onClick={() => openModal()}
              className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Nuevo Barbero
            </button>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textMuted">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surfaceLayer border border-border rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbers.length > 0 ? (
                filteredBarbers.map((barber: Barber) => (
                <Card key={barber.id} className={`overflow-hidden border-border/50 hover:border-primary/50 transition-all group ${!barber.is_active ? 'opacity-60 grayscale-[0.5] bg-black/10' : ''}`}>
                  <div className={`h-2 w-full ${barber.is_active ? 'bg-primary' : 'bg-textMuted'}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-surfaceLayer border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
                        {barber.avatar_url ? (
                          <img src={barber.avatar_url} alt={barber.full_name} className="h-full w-full object-cover" />
                        ) : (
                          barber.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{barber.full_name}</h3>
                        <p className="text-sm text-textMuted">{barber.is_active ? '✅ En plantilla' : '❌ Inactivo'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-sm font-medium text-textMuted mb-2">Especialidades:</p>
                      <div className="flex flex-wrap gap-2">
                        {barber.specialties.map((spec, i) => (
                          <span key={i} className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase font-bold">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex gap-3">
                      <button 
                        onClick={() => openScheduleModal(barber)}
                        className="flex-1 px-3 py-2 bg-surfaceLayer hover:bg-surface text-white text-sm rounded-lg transition-colors border border-border"
                      >
                        Horarios
                      </button>
                      <button 
                        onClick={() => openModal(barber)}
                        className="px-3 py-2 bg-surfaceLayer hover:bg-surface text-white text-sm rounded-lg transition-colors border border-border"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar a ${barber.full_name}?`)) {
                            deleteMutation.mutate(barber.id);
                          }
                        }}
                        className="p-2 text-red-500/70 hover:text-red-400 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </CardContent>
                </Card>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-textMuted border-2 border-dashed border-border rounded-2xl">
                   <p className="text-lg font-medium">No se encontraron profesionales</p>
                   <p className="text-sm">Prueba con otro nombre o especialidad</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Modal Perfil Barbero */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-surfaceLayer border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedBarber ? 'Editar Barbero' : 'Nuevo Barbero'}
              </h2>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Nombre Completo</label>
                  <input type="text" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Especialidades</label>
                  <input type="text" placeholder="Fade, Barba..." value={formData.specialties} onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Biografía</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]" />
                </div>
                
                {!selectedBarber && (
                  <div className="grid grid-cols-1 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Acceso a la Aplicación</p>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Email del Barbero</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" 
                        placeholder="ejemplo@barberia.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Contraseña Temporal</label>
                      <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" 
                        placeholder="Mínimo 8 caracteres" />
                      <p className="text-[10px] text-textMuted mt-1">El barbero podrá cambiarla después en su perfil.</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" />
                  <label htmlFor="is_active" className="text-sm font-medium text-textMuted">Barbero activo</label>
                </div>
                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-surface border border-border text-white rounded-lg hover:bg-surface/80 transition-colors">Cancelar</button>
                  <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {selectedBarber ? 'Guardar Cambios' : 'Crear Barbero'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Horarios */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-surfaceLayer border border-border w-full max-w-4xl rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Horario Semanal</h2>
                  <p className="text-textMuted">Define la disponibilidad de {selectedBarber?.full_name}</p>
                </div>
                <button onClick={closeModal} className="text-textMuted hover:text-white">✕</button>
              </div>

              <div className="space-y-4">
                {schedules.map((day, index) => (
                  <div key={day.day_of_week} className={`grid grid-cols-1 md:grid-cols-6 items-center gap-4 p-4 rounded-xl border ${day.is_working ? 'bg-surface border-border' : 'bg-black/20 border-border/30 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={day.is_working} 
                        onChange={(e) => {
                          const newScheds = [...schedules];
                          newScheds[index].is_working = e.target.checked;
                          setSchedules(newScheds);
                        }}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="font-bold text-white w-24">{DAYS.find(d => d.id === day.day_of_week)?.name}</span>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-textMuted uppercase mb-1">Entrada</label>
                      <input 
                        type="time" 
                        value={day.start_time?.slice(0, 5)} 
                        disabled={!day.is_working}
                        onChange={(e) => {
                          const newScheds = [...schedules];
                          newScheds[index].start_time = e.target.value + ':00';
                          setSchedules(newScheds);
                        }}
                        className="bg-background border border-border rounded px-2 py-1 text-white text-sm" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-textMuted uppercase mb-1">Salida</label>
                      <input 
                        type="time" 
                        value={day.end_time?.slice(0, 5)} 
                        disabled={!day.is_working}
                        onChange={(e) => {
                          const newScheds = [...schedules];
                          newScheds[index].end_time = e.target.value + ':00';
                          setSchedules(newScheds);
                        }}
                        className="bg-background border border-border rounded px-2 py-1 text-white text-sm" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-textMuted uppercase mb-1">Descanso (Inicio)</label>
                      <input 
                        type="time" 
                        value={day.break_start?.slice(0, 5) || ''} 
                        disabled={!day.is_working}
                        onChange={(e) => {
                          const newScheds = [...schedules];
                          newScheds[index].break_start = e.target.value ? e.target.value + ':00' : null;
                          setSchedules(newScheds);
                        }}
                        className="bg-background border border-border rounded px-2 py-1 text-white text-sm" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-textMuted uppercase mb-1">Descanso (Fin)</label>
                      <input 
                        type="time" 
                        value={day.break_end?.slice(0, 5) || ''} 
                        disabled={!day.is_working}
                        onChange={(e) => {
                          const newScheds = [...schedules];
                          newScheds[index].break_end = e.target.value ? e.target.value + ':00' : null;
                          setSchedules(newScheds);
                        }}
                        className="bg-background border border-border rounded px-2 py-1 text-white text-sm" 
                      />
                    </div>
                    
                    <div className="flex items-center justify-end text-xs text-textMuted">
                      {!day.is_working && <span>No disponible</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={closeModal} className="px-6 py-2 bg-surface border border-border text-white rounded-lg hover:bg-surface/80 transition-colors">Cerrar</button>
                <button 
                  onClick={handleSaveSchedule}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar Horarios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
