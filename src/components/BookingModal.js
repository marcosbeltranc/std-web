'use client';
import { useState } from 'react';
import ScheduleStep from './ScheduleStep';
import PaymentStep from './PaymentStep';
import SuccessStep from './SuccessStep';

export default function BookingModal({ business, service, onClose }) {
    const [step, setStep] = useState(1);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. NUEVO ESTADO: Para guardar el ID que retorne la API
    const [confirmedAppointmentId, setConfirmedAppointmentId] = useState(null);

    const [paymentAmount, setPaymentAmount] = useState(0);
    const [minRequiredAmount, setMinRequiredAmount] = useState(0);

    const handleNextStep = (minAmount) => {
        setMinRequiredAmount(minAmount);
        setPaymentAmount(minAmount);
        setStep(2);
    };

    // 2. FUNCIÓN PARA FINALIZAR: Recibe el ID desde PaymentStep
    const handlePaymentSuccess = (appointmentId) => {
        setConfirmedAppointmentId(appointmentId);
        setStep(3);
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative flex flex-col h-[85vh] overflow-hidden">

                {/* HEADER */}
                {step < 3 && (
                    <div className="p-8 pb-2 flex items-center justify-between bg-white z-30 shrink-0">
                        <h2 className="text-2xl font-black tracking-tighter">
                            {step === 1 ? "Selecciona horario" : "Finalizar Reserva"}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-black transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                <div className="relative flex-1 overflow-hidden">
                    <div
                        className="flex h-full transition-transform duration-500 ease-in-out"
                        style={{
                            width: '300%',
                            transform: `translateX(-${(step - 1) * (100 / 3)}%)`
                        }}
                    >
                        {/* PASO 1: HORARIOS */}
                        <div className="w-1/3 h-full flex flex-col overflow-hidden flex-shrink-0">
                            <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar scroll-smooth">
                                <ScheduleStep
                                    service={service}
                                    business={business}
                                    onSelectionChange={(slot, staffId, date) => {
                                        setSelectedSlot(slot);
                                        setSelectedStaffId(staffId);
                                        setCustomDate(date);
                                    }}
                                    onContinue={handleNextStep}
                                />
                            </div>
                        </div>

                        {/* PASO 2: PAGO */}
                        <div className="w-1/3 h-full flex flex-col overflow-hidden flex-shrink-0">
                            <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                                <PaymentStep
                                    business={business}
                                    service={service}
                                    selectedSlot={selectedSlot}
                                    selectedStaffId={selectedStaffId}
                                    customDate={customDate}
                                    paymentAmount={paymentAmount}
                                    setPaymentAmount={setPaymentAmount}
                                    minRequiredAmount={minRequiredAmount}
                                    onBack={() => setStep(1)}
                                    onProcessing={setIsProcessing}
                                    // 3. CAMBIO: Pasamos la nueva función handlePaymentSuccess
                                    onSuccess={handlePaymentSuccess}
                                    isExistingAppointment={false} // En este modal siempre es cita nueva
                                />
                            </div>
                        </div>

                        {/* PASO 3: ÉXITO */}
                        <div className="w-1/3 h-full flex flex-col overflow-hidden flex-shrink-0">
                            <div className="flex-1 flex items-center justify-center px-8">
                                {/* 4. CAMBIO: Pasamos el ID confirmado al SuccessStep */}
                                <SuccessStep
                                    serviceName={service.name}
                                    appointmentId={confirmedAppointmentId}
                                />
                            </div>
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Procesando...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}