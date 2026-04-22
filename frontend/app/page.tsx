import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative px-4 py-24 md:py-32 lg:py-40 flex items-center justify-center overflow-hidden h-[90vh]">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0 bg-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full z-0 pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
              Diseñado para el <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primaryHover">
                Hombre Moderno
              </span>
            </h1>
            <p className="text-lg md:text-xl text-textMuted max-w-2xl mb-12">
              Reserva tu cita hoy en la barbería más exclusiva de la ciudad. Experimenta cortes clásicos, arreglos de barba y el trato premium que mereces.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/reserva">
                <Button size="lg" className="w-full sm:w-auto text-lg px-10 shadow-glow">
                  Reservar Cita
                </Button>
              </Link>
              <Link href="/servicios">
                <Button variant="glass" size="lg" className="w-full sm:w-auto text-lg px-10">
                  Ver Servicios
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES / PROCESS SECTION */}
        <section className="py-24 bg-surfaceLayer/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Elige tu Servicio", desc: "Desde cortes clásicos hasta rituales completos de afeitado con toalla caliente." },
                { title: "Selecciona a tu Barbero", desc: "Encuentra al profesional que mejor se adapte a tu estilo personal." },
                { title: "Reserva en Segundos", desc: "Confirma tu cita al instante de forma totalmente digital y sin llamadas." }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-2xl bg-surface border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl mb-6">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-textMuted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-surface py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-textMuted">
          <h2 className="text-2xl font-display text-white mb-2">BarberBook</h2>
          <p>© {new Date().getFullYear()} BarberBook. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
