"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { fetchServices, fetchBarbers, fetchAvailableSlots, createAppointment } from '@/lib/api';
import { Service, Barber } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import StepIndicator from '@/components/reserva/StepIndicator';
import ServiceStep from '@/components/reserva/ServiceStep';
import BarberStep from '@/components/reserva/BarberStep';
import DateTimeStep from '@/components/reserva/DateTimeStep';
import ConfirmStep from '@/components/reserva/ConfirmStep';

export default function ReservaWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Data Fetching
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices
  });

  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['barbers'],
    queryFn: fetchBarbers
  });

  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['slots', selectedBarber?.id, selectedDate, selectedService?.id],
    queryFn: () => fetchAvailableSlots(String(selectedBarber!.id), selectedDate, String(selectedService!.id)),
    enabled: !!selectedBarber && !!selectedDate && !!selectedService,
  });

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      router.push('/cliente/dashboard?success=true');
    },
    onError: (err: Error) => {
      setError(err.message || 'Error al confirmar la reserva.');
    }
  });

  const nextStep = () => {
    setError('');
    setStep(s => s + 1);
  };
  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setSelectedDate('');
    setSelectedTime(null);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleConfirm = () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) return;
    
    const startDatetime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    
    mutation.mutate({
      service_id: selectedService.id,
      barber_id: selectedBarber.id,
      start_datetime: startDatetime
    });
  };

  const isNextDisabled =
    (step === 1 && !selectedService) ||
    (step === 2 && !selectedBarber) ||
    (step === 3 && (!selectedDate || !selectedTime)) ||
    mutation.isPending;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 flex flex-col">
          <div className="mb-8 border-b border-border pb-6 pt-4">
            <h1 className="text-4xl font-display font-bold text-primary mb-6 text-center">Reserva tu Experiencia</h1>
            <StepIndicator currentStep={step} />
          </div>

          <Card className="flex-1 flex flex-col shadow-2xl">
            <CardContent className="flex-1 py-8">
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              {step === 1 && (
                <ServiceStep
                  services={services}
                  isLoading={isLoadingServices}
                  selectedService={selectedService}
                  onSelect={setSelectedService}
                />
              )}

              {step === 2 && (
                <BarberStep
                  barbers={barbers}
                  isLoading={isLoadingBarbers}
                  selectedBarber={selectedBarber}
                  onSelect={handleBarberSelect}
                />
              )}

              {step === 3 && (
                <DateTimeStep
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  slotsData={slotsData}
                  isLoadingSlots={isLoadingSlots}
                  onDateChange={handleDateChange}
                  onTimeSelect={setSelectedTime}
                />
              )}

              {step === 4 && selectedService && selectedBarber && selectedDate && selectedTime && (
                <ConfirmStep
                  selectedService={selectedService}
                  selectedBarber={selectedBarber}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                />
              )}
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t border-border pt-6 pb-2 px-8">
              <Button 
                variant="ghost"
                onClick={prevStep} 
                disabled={step === 1 || mutation.isPending}
                className={step === 1 ? 'opacity-0 pointer-events-none' : ''}
              >
                Volver
              </Button>
              <Button 
                onClick={step === 4 ? handleConfirm : nextStep} 
                disabled={isNextDisabled}
                className="px-8 shadow-glow"
              >
                {step === 4 ? (mutation.isPending ? 'Procesando...' : 'Confirmar Reserva') : 'Continuar'}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
