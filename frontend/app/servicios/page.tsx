"use client";
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchServices } from '@/lib/api';
import { Service } from '@/types';

export default function ServiciosPublicPage() {
  const { data: services, isLoading } = useQuery({ 
    queryKey: ['services_public'], 
    queryFn: fetchServices 
  });

  const activeServices = services?.filter((s: Service) => s.is_active) || [];

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight">
              Nuestros <span className="text-primary">Servicios</span>
            </h1>
            <p className="text-textMuted max-w-2xl mx-auto text-lg">
              Ofrecemos una amplia gama de tratamientos premium diseñados para el cuidado del hombre moderno. Desde cortes clásicos hasta rituales completos.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeServices.length > 0 ? (
                activeServices.map((service: Service) => (
                  <Card key={service.id} className="bg-surface border-border/50 hover:border-primary/50 transition-all group overflow-hidden flex flex-col">
                    <div className="h-1 bg-gradient-to-r from-primary to-primaryHover transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    <CardContent className="p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                          <span className="text-2xl font-bold text-primary">
                            {parseFloat(service.price).toFixed(2)}€
                          </span>
                        </div>
                        
                        <p className="text-textMuted mb-8 leading-relaxed">
                          {service.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-textMuted mb-8 bg-black/20 w-fit px-3 py-1.5 rounded-full border border-border/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span>{service.duration_minutes} min</span>
                        </div>
                      </div>

                      <Link href="/reserva" className="block w-full">
                        <Button className="w-full font-bold tracking-wide" variant="default">
                          Reservar Ahora
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-surface/50 rounded-3xl border-2 border-dashed border-border">
                  <p className="text-xl text-textMuted">No hay servicios disponibles en este momento.</p>
                </div>
              )}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-24 p-12 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">¿Listo para un cambio de look?</h2>
            <p className="text-textMuted mb-8 max-w-xl mx-auto relative z-10">
              Reserva tu cita hoy mismo y deja tu estilo en manos de los mejores profesionales.
            </p>
            <Link href="/reserva">
              <Button size="lg" className="px-12 shadow-glow relative z-10">
                Reserva tu Cita
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-surface py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-textMuted">
          <h2 className="text-2xl font-display text-white mb-2">BarberBook</h2>
          <p>© {new Date().getFullYear()} BarberBook. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
