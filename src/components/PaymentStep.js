'use client';
import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { apiFetch } from '@/lib/api';

export default function PaymentStep({
    business,
    service,
    selectedSlot,
    selectedStaffId,
    customDate,
    paymentAmount,
    setPaymentAmount,
    minRequiredAmount,
    onBack,
    onProcessing,
    onSuccess,
    isExistingAppointment = false,
    appointmentId = null
}) {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [userData, setUserData] = useState(null);
    const [showBrick, setShowBrick] = useState(false);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    // Usamos una ref para guardar el ID de la cita creada dinámicamente
    const currentAppIdRef = useRef(appointmentId);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [methods, user] = await Promise.all([
                    apiFetch(`/paymethods/business/${business.id}/public`),
                    apiFetch('/auth/me')
                ]);
                if (methods) setPaymentMethods(methods);
                if (user) setUserData(user);
            } catch (err) {
                console.error("Error cargando datos:", err);
            }
        };
        loadInitialData();
    }, [business.id]);

    const initMPBrick = async (publicKey, paymentId) => {
        if (!window.MercadoPago) return;

        const mp = new window.MercadoPago(publicKey, { locale: 'es-MX' });
        const bricksBuilder = mp.bricks();

        const settings = {
            initialization: {
                amount: parseFloat(paymentAmount),
            },
            customization: {
                paymentMethods: {
                    creditCard: "all",
                    debitCard: "all",
                    mercadoPago: "all",
                },
            },
            callbacks: {
                onReady: () => onProcessing(false),
                onSubmit: async ({ formData }) => {
                    try {
                        // Llamamos al endpoint de confirmación con el payment_id obtenido previamente
                        const response = await apiFetch(`/payments/${paymentId}/confirm-mercadopago`, {
                            method: 'POST',
                            body: JSON.stringify({
                                token: formData.token,
                                provider_payment_method_id: formData.payment_method_id,
                                issuer_id: formData.issuer_id?.toString(),
                                installments: formData.installments,
                            })
                        });

                        if (response && response.status === 'approved') {
                            onSuccess(currentAppIdRef.current);
                        } else if (response && response.status === 'rejected') {
                            alert("El pago fue rechazado. Por favor, intenta con otra tarjeta o revisa tus fondos.");
                            onProcessing(false); // Detener el loader para permitir reintento
                        } else {
                            alert("Estado del pago: " + (response.status || 'Pendiente de validación'));
                            onProcessing(false);
                        }
                    } catch (err) {
                        console.error("Error en confirmación:", err);
                        alert("Ocurrió un error al procesar el pago. Inténtalo de nuevo.");
                        onProcessing(false);
                    }
                },
                onError: (error) => {
                    console.error("Error Brick:", error);
                    setShowBrick(false);
                    onProcessing(false);
                },
            },
        };

        if (window.paymentBrickController) {
            await window.paymentBrickController.unmount();
        }

        window.paymentBrickController = await bricksBuilder.create(
            'payment',
            'paymentBrick_container',
            settings
        );
    };

    const handleConfirm = async (methodName) => {
        if (parseFloat(paymentAmount) < minRequiredAmount) {
            return alert(`El monto mínimo es $${minRequiredAmount}`);
        }

        onProcessing(true);

        try {
            // 1. Crear la cita si no existe
            if (!isExistingAppointment && !currentAppIdRef.current) {
                const timeWithSeconds = selectedSlot.time.split(':').length === 2
                    ? `${selectedSlot.time}:00`
                    : selectedSlot.time;

                const appointment = await apiFetch('/appointments/place', {
                    method: 'POST',
                    body: JSON.stringify({
                        business_id: business.id,
                        service_id: service.id,
                        client_id: userData?.id,
                        staff_id: selectedStaffId,
                        start_time: `${customDate}T${timeWithSeconds}`,
                        notes: ""
                    })
                });

                if (!appointment) throw new Error("No se pudo crear la cita.");
                currentAppIdRef.current = appointment.id;
            }

            // 2. Crear la Intención de Pago (Aplica para ambos métodos)
            const paymentIntent = await apiFetch('/payments', {
                method: 'POST',
                body: JSON.stringify({
                    appointment_id: currentAppIdRef.current,
                    amount: parseFloat(paymentAmount),
                    payment_method_type: methodName,
                    description: `Pago ${methodName}: ${service.name}`
                })
            });

            if (!paymentIntent) throw new Error("No se pudo registrar la intención de pago.");

            // 3. Diferenciar flujo Digital vs Manual
            const isMP = methodName.toLowerCase().replace(/\s/g, '') === 'mercadopago';

            if (isMP) {
                const mpMethod = paymentMethods.find(m => m.name.toLowerCase().includes('mercado'));
                const publicKey = mpMethod?.public_key;

                if (!publicKey) throw new Error("Llave pública de Mercado Pago no configurada.");

                setShowBrick(true);
                // Pequeño delay para asegurar que el contenedor DOM esté listo
                setTimeout(() => {
                    initMPBrick(publicKey, paymentIntent.id);
                }, 200);
            } else {
                // Si es manual (Efectivo/Transfer), el backend ya lo puso como completed
                onSuccess(currentAppIdRef.current);
            }

        } catch (err) {
            console.error("Error en flujo de pago:", err);
            alert(err.message || "Error al procesar.");
            onProcessing(false);
        }
    };

    return (
        <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <Script
                src="https://sdk.mercadopago.com/js/v2"
                onLoad={() => setSdkLoaded(true)}
            />

            {/* CARD DE MONTO */}
            <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] mb-6 shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest text-center">
                    Monto a pagar
                </p>
                <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-black">$</span>
                    <input
                        type="number"
                        className="bg-transparent text-4xl font-black outline-none w-32 text-center"
                        value={paymentAmount}
                        disabled={showBrick}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                </div>
            </div>

            {/* CONTENEDOR DEL BRICK */}
            <div
                id="paymentBrick_container"
                className={`${!showBrick ? 'hidden' : 'mb-4'}`}
            ></div>

            {/* SELECCIÓN DE MÉTODOS */}
            {!showBrick && (
                <div className="grid gap-3">
                    {paymentMethods.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => handleConfirm(m.name)}
                            className="flex items-center justify-between p-5 bg-white border-2 border-gray-100 rounded-3xl hover:border-indigo-600 transition-all group"
                        >
                            <span className="font-bold text-gray-700">{m.name}</span>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showBrick && (
                <button
                    onClick={() => {
                        setShowBrick(false);
                        if (window.paymentBrickController) window.paymentBrickController.unmount();
                    }}
                    className="w-full mt-4 text-[10px] font-black text-red-400 uppercase tracking-widest"
                >
                    ✕ Cancelar y volver
                </button>
            )}
        </div>
    );
}