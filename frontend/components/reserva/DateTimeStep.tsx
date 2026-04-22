"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CardTitle } from '@/components/ui/Card';

interface DateTimeStepProps {
  selectedDate: string;
  selectedTime: string | null;
  slotsData: { slots: string[] } | undefined;
  isLoadingSlots: boolean;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

export default function DateTimeStep({
  selectedDate,
  selectedTime,
  slotsData,
  isLoadingSlots,
  onDateChange,
  onTimeSelect,
}: DateTimeStepProps) {
  return (
    <div className="animate-in fade-in duration-500 max-w-xl mx-auto">
      <CardTitle className="mb-6 text-center text-3xl">Elige fecha y hora</CardTitle>
      
      <div className="mb-8 p-1 bg-surfaceLayer rounded-xl border border-border">
        <input 
          type="date" 
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => onDateChange(e.target.value)} 
          className="w-full px-4 py-3 bg-transparent text-white outline-none [&::-webkit-calendar-picker-indicator]:filter-invert" 
        />
      </div>
      
      {selectedDate && (
        <div>
          <h4 className="text-sm font-medium text-textMuted mb-4 uppercase tracking-wider">
            Horarios disponibles para el {format(new Date(`${selectedDate}T00:00:00`), "d 'de' MMMM", { locale: es })}
          </h4>
          
          {isLoadingSlots ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : slotsData?.slots?.length ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slotsData.slots.map((time: string) => (
                <div 
                  key={time} 
                  onClick={() => onTimeSelect(time)}
                  className={`py-3 rounded-lg text-center font-medium cursor-pointer transition-all ${selectedTime === time ? 'bg-primary text-background shadow-glow' : 'border border-border bg-surface hover:bg-surfaceLayer text-white'}`}
                >
                  {time}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-surface rounded-xl border border-border">
              <p className="text-textMuted">No hay horarios disponibles para esta fecha.</p>
              <p className="text-sm text-textMuted mt-2">Por favor, selecciona otro día o cambia de barbero.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
