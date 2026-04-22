"use client";

import { Service } from '@/types';
import { CardTitle } from '@/components/ui/Card';

interface ServiceStepProps {
  services: Service[] | undefined;
  isLoading: boolean;
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

export default function ServiceStep({ services, isLoading, selectedService, onSelect }: ServiceStepProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <CardTitle className="mb-6 text-center text-3xl">Selecciona un servicio</CardTitle>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services?.map((service) => (
            <div 
              key={service.id} 
              onClick={() => onSelect(service)}
              className={`p-5 rounded-xl cursor-pointer border transition-all duration-300 flex flex-col justify-between ${selectedService?.id === service.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-surface hover:border-textMuted'}`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-lg text-white">{service.name}</span>
                  <span className="font-bold text-primary">{service.price_display}</span>
                </div>
                <p className="text-sm text-textMuted">{service.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 text-xs text-textMuted flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2"></span>
                Duración estimada: {service.duration_display}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
