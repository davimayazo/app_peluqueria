"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CardTitle } from '@/components/ui/Card';
import { Service, Barber } from '@/types';

interface ConfirmStepProps {
  selectedService: Service;
  selectedBarber: Barber;
  selectedDate: string;
  selectedTime: string;
}

export default function ConfirmStep({ selectedService, selectedBarber, selectedDate, selectedTime }: ConfirmStepProps) {
  return (
    <div className="animate-in fade-in duration-500 max-w-lg mx-auto py-4">
      <CardTitle className="mb-8 text-center text-3xl">Confirmación Final</CardTitle>
      
      <div className="bg-surface border border-border p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primaryHover"></div>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <span className="text-textMuted">Servicio</span>
            <span className="font-semibold text-white text-right">{selectedService.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <span className="text-textMuted">Profesional</span>
            <span className="font-semibold text-white text-right">{selectedBarber.full_name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <span className="text-textMuted">Fecha y Hora</span>
            <div className="text-right">
              <p className="font-semibold text-white capitalize">
                {format(new Date(`${selectedDate}T00:00:00`), "EEEE, d MMM", { locale: es })}
              </p>
              <p className="text-primary font-bold">{selectedTime}</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-textMuted font-medium">Total Estimado</span>
            <span className="text-2xl font-bold text-primary">{selectedService.price_display}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
