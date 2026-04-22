"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchServices, createService, updateService, deleteService } from '@/lib/api';
import { Service } from '@/types';

export default function AdminServicios() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: '',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: services, isLoading } = useQuery({ 
    queryKey: ['services'], 
    queryFn: fetchServices 
  });

  const filteredServices = services?.filter((service: Service) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      service.description.toLowerCase().includes(searchLower)
    );
  }).sort((a: Service, b: Service) => {
    if (a.is_active === b.is_active) return a.name.localeCompare(b.name);
    return a.is_active ? -1 : 1;
  }) || [];

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear el servicio');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Service> }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar el servicio');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Error al eliminar el servicio');
    }
  });

  const openModal = (service: Service | null = null) => {
    setError(null);
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_active: service.is_active
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        description: '',
        duration_minutes: 30,
        price: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica en frontend para evitar errores comunes del backend
    if (formData.duration_minutes % 15 !== 0) {
      setError('La duración debe ser múltiplo de 15 minutos (ej: 15, 30, 45, 60...)');
      return;
    }

    if (selectedService) {
      updateMutation.mutate({ id: selectedService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary mb-2">Gestión de Servicios</h1>
              <p className="text-textMuted">Administra los servicios ofrecidos en la peluquería</p>
            </div>
            <button 
              onClick={() => openModal()}
              className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Nuevo Servicio
            </button>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textMuted">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                type="text"
                placeholder="Buscar servicio..."
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
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Lista de Servicios ({filteredServices.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredServices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-textMuted">
                          <th className="p-4 font-medium">Nombre</th>
                          <th className="p-4 font-medium">Duración</th>
                          <th className="p-4 font-medium">Precio</th>
                          <th className="p-4 font-medium">Estado</th>
                          <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServices.map((service: Service) => (
                          <tr key={service.id} className={`border-b border-border/50 hover:bg-surfaceLayer transition-colors ${!service.is_active ? 'opacity-60 bg-black/10' : ''}`}>
                            <td className="p-4 font-medium text-white">
                              {service.name}
                            </td>
                            <td className="p-4 text-textMuted">{service.duration_display}</td>
                            <td className="p-4 text-primary font-semibold">{service.price_display}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs rounded-md ${service.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {service.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-3">
                              <button 
                                onClick={() => openModal(service)}
                                className="text-sm text-textMuted hover:text-white transition-colors inline-flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Editar
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm(`¿Estás seguro de que deseas eliminar el servicio "${service.name}"?`)) {
                                    deleteMutation.mutate(service.id);
                                  }
                                }}
                                className="text-sm text-red-500/70 hover:text-red-400 transition-colors inline-flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-textMuted border-2 border-dashed border-border rounded-xl">
                    No hay servicios registrados.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-surfaceLayer border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Duración (min)</label>
                    <input
                      type="number"
                      required
                      min="15"
                      max="240"
                      step="15"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-[10px] text-textMuted mt-1">Múltiplo de 15 min.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Precio (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-textMuted select-none">Servicio activo</label>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-surface border border-border text-white rounded-lg hover:bg-surface/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      selectedService ? 'Guardar Cambios' : 'Crear Servicio'
                    )}
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
