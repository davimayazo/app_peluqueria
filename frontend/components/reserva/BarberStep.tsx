"use client";

import { Barber } from '@/types';
import { CardTitle } from '@/components/ui/Card';

interface BarberStepProps {
  barbers: Barber[] | undefined;
  isLoading: boolean;
  selectedBarber: Barber | null;
  onSelect: (barber: Barber) => void;
}

export default function BarberStep({ barbers, isLoading, selectedBarber, onSelect }: BarberStepProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <CardTitle className="mb-6 text-center text-3xl">¿Quién te atenderá?</CardTitle>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {barbers?.map((barber) => (
            <div 
              key={barber.id} 
              onClick={() => onSelect(barber)}
              className={`p-5 rounded-xl cursor-pointer border transition-all duration-300 flex items-center gap-4 ${selectedBarber?.id === barber.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-surface hover:border-textMuted'}`}
            >
              <div className="w-16 h-16 rounded-full bg-surfaceLayer flex items-center justify-center text-primary font-bold text-xl border border-border">
                {barber.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">{barber.full_name}</h3>
                {barber.specialties && barber.specialties.length > 0 && (
                  <p className="text-xs text-primary mt-1">{barber.specialties.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
