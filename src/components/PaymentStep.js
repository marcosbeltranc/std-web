'use client';
import { useState, useEffect } from 'react';
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
    const [showBrick, setShowBrick] = useState(false); // Nuevo: Controla si mostramos el formulario de MP

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

    // Lógica del Brick
    const initMPBrick = async (preferenceId, publicKey) => {
        if (!window.MercadoPago) {
            console.error("Mercado Pago SDK no cargado");
            return;
        }

        const mp = new window.MercadoPago(publicKey, { locale: 'es-MX' });
        const bricksBuilder = mp.bricks();

        const settings = {
            initialization: {
                amount: parseFloat(paymentAmount),
                preferenceId: preferenceId,
            },
            customization: {
                paymentMethods: {
                    ticket: "all",
                    bankTransfer: "all",
                    creditCard: "all",
                    debitCard: "all",
                    mercadoPago: "all",
                },
            },
            callbacks: {
                onReady: () => {
                    console.log("Brick ready");
                    onProcessing(false);
                },
                onSubmit: ({ selectedPaymentMethod, formData }) => {
                    console.log("Procesando pago...");
                    // Mercado Pago procesa esto con el preferenceId automáticamente
                },
                onError: (error) => {
                    console.error("Error en Brick:", error);
                    alert("Ocurrió un error al cargar el formulario de pago.");
                    setShowBrick(false);
                },
            },
        };

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
            let currentAppointmentId = appointmentId;

            if (!isExistingAppointment) {
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
                currentAppointmentId = appointment.id;
            }

            const payData = await apiFetch('/payments', {
                method: 'POST',
                body: JSON.stringify({
                    appointment_id: currentAppointmentId,
                    amount: parseFloat(paymentAmount),
                    payment_method_type: methodName,
                    description: `Pago de reserva: ${service.name}`,
                    status: "pending"
                })
            });

            // LOGICA PARA MERCADO PAGO
            if (methodName.toLowerCase() === 'mercadopago' && payData?.external_id) {
                const preferenceId = payData.external_id;

                // Buscamos la public_key en los métodos cargados al inicio
                const mpCredential = paymentMethods.find(
                    (m) => m.name.toLowerCase() === 'mercadopago'
                );

                const publicKey = mpCredential?.public_key;

                if (!publicKey) {
                    throw new Error("Llave pública de Mercado Pago no encontrada.");
                }

                setShowBrick(true); // Ocultamos los botones normales
                setTimeout(() => {
                    initMPBrick(preferenceId, publicKey);
                }, 100); // Pequeño delay para asegurar que el div contenedor exista

                return;
            }

            onSuccess(currentAppointmentId);

        } catch (err) {
            console.error("Error en proceso:", err);
            alert(err.message || "Error al procesar el pago.");
            onProcessing(false);
        }
    };

    return (
        <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {/* CARD DE MONTO */}
            <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] mb-6 shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest text-center">
                    {isExistingAppointment ? "Completar Pago" : "Monto a pagar ahora"}
                </p>
                <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-black">$</span>
                    <input
                        type="number"
                        className="bg-transparent text-4xl font-black outline-none w-32 text-center"
                        value={paymentAmount}
                        disabled={showBrick} // Deshabilitar si ya se está pagando
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                </div>
            </div>

            {/* CONTENEDOR DEL BRICK (Solo se llena cuando showBrick es true) */}
            <div id="paymentBrick_container" className={`${!showBrick ? 'hidden' : 'mb-4'}`}></div>

            {/* SELECCIÓN DE MÉTODOS (Se oculta si el Brick está activo) */}
            {!showBrick && (
                <>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-4 px-2 tracking-widest text-center">Selecciona Método</p>
                    <div className="grid gap-3">
                        {paymentMethods.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => handleConfirm(m.name.trim())}
                                className="flex items-center justify-between p-5 bg-white border-2 border-gray-100 rounded-3xl hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group"
                            >
                                <span className="font-bold text-gray-700">{m.name}</span>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* BOTONES DE CONTROL */}
            {showBrick ? (
                <button
                    onClick={() => {
                        setShowBrick(false);
                        if (window.paymentBrickController) window.paymentBrickController.unmount();
                    }}
                    className="w-full mt-4 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                    ✕ Cancelar pago electrónico
                </button>
            ) : (
                !isExistingAppointment && (
                    <button
                        onClick={onBack}
                        className="w-full mt-8 text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                    >
                        ← Volver a selección de horario
                    </button>
                )
            )}
        </div>
    );
}