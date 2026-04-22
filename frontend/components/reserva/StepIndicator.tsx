"use client";

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = ['Servicio', 'Barbero', 'Horario', 'Confirmar'];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-between items-center text-sm text-textMuted max-w-2xl mx-auto">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;
        const isLast = index === STEPS.length - 1;

        return (
          <span key={label} className="contents">
            <span className={isActive ? "text-white font-medium" : ""}>
              {stepNumber}. {label}
            </span>
            {!isLast && (
              <span
                className={`flex-1 h-[2px] mx-4 transition-colors duration-300 ${
                  currentStep > stepNumber ? "bg-primary" : "bg-border"
                }`}
              ></span>
            )}
          </span>
        );
      })}
    </div>
  );
}
