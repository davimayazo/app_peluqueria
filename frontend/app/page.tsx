"use client";
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/Navbar';
import { fetchBusinessConfig } from '@/lib/api';

export default function LandingPage() {
  const { data: config } = useQuery({ 
    queryKey: ['business_config'], 
    queryFn: fetchBusinessConfig 
  });

  const businessName = config?.name || 'BarberBook';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative px-4 py-24 md:py-32 lg:py-40 flex items-center justify-center overflow-hidden h-[90vh]">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0 bg-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full z-0 pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
              Bienvenido a <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primaryHover">
                {businessName}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-textMuted max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              {config?.description || 'Reserva tu cita hoy en la barbería más exclusiva de la ciudad. Experimenta cortes clásicos, arreglos de barba y el trato premium que mereces.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <Link href="/reserva" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg px-10 shadow-glow">
                  Reservar Cita
                </Button>
              </Link>
              <Link href="/servicios" className="w-full sm:w-auto">
                <Button variant="glass" size="lg" className="w-full text-lg px-10">
                  Ver Servicios
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES / PROCESS SECTION */}
        <section className="py-24 bg-surfaceLayer/30 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Elige tu Servicio", desc: "Desde cortes clásicos hasta rituales completos de afeitado con toalla caliente." },
                { title: "Selecciona a tu Barbero", desc: "Encuentra al profesional que mejor se adapte a tu estilo personal." },
                { title: "Reserva en Segundos", desc: "Confirma tu cita al instante de forma totalmente digital y sin llamadas." }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-surface border border-border flex flex-col items-center text-center hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-6 border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-textMuted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT INFO SECTION */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold text-white mb-12">Encuéntranos</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="text-primary flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <h4 className="text-xl font-bold text-white uppercase tracking-wider">Ubicación</h4>
                <p className="text-textMuted">{config?.address || 'Cargando dirección...'}</p>
              </div>
              <div className="space-y-4">
                <div className="text-primary flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <h4 className="text-xl font-bold text-white uppercase tracking-wider">Teléfono</h4>
                <p className="text-textMuted">{config?.phone || 'Cargando teléfono...'}</p>
              </div>
              <div className="space-y-4">
                <div className="text-primary flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                </div>
                <h4 className="text-xl font-bold text-white uppercase tracking-wider">Email</h4>
                <p className="text-textMuted">{config?.email || 'Cargando email...'}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/50 bg-surfaceLayer py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-6 tracking-tight">{businessName}</h2>
          <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm text-textMuted font-medium uppercase tracking-widest">
            <Link href="/servicios" className="hover:text-primary transition-colors">Servicios</Link>
            <Link href="/reserva" className="hover:text-primary transition-colors">Reserva</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Mi Cuenta</Link>
          </div>
          <p className="text-sm text-textMuted/60 font-medium">
            © {new Date().getFullYear()} {businessName}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
