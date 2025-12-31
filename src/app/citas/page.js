'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PaymentStep from '@/components/PaymentStep';
import SuccessStep from '@/components/SuccessStep';

export default function MyAppointmentsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const apptIdFromUrl = searchParams.get('id');

    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('confirmed');
    const [loading, setLoading] = useState(true);

    // Estados para el Modal de Pago
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [paymentStep, setPaymentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [confirmedId, setConfirmedId] = useState(null);

    // Estado para el Modal de Detalle (Ticket)
    const [selectedDetail, setSelectedDetail] = useState(null);

    const tabs = [
        { id: 'confirmed', label: 'Confirmadas' },
        { id: 'pending', label: 'Pendientes' },
        { id: 'completed', label: 'Completadas' },
        { id: 'cancelled', label: 'Canceladas' }
    ];

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Detectar cambios en la URL para abrir el detalle
    useEffect(() => {
        if (apptIdFromUrl && appointments.length > 0) {
            const found = appointments.find(a => a.id === apptIdFromUrl);
            if (found) {
                setSelectedDetail(found);
            }
        }
    }, [apptIdFromUrl, appointments]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/appointments/my-appointments');
            if (data) setAppointments(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filteredAppointments = appointments.filter(a => a.status === activeTab);

    const openPayment = (appt) => {
        const remaining = appt.required_deposit - appt.paid_amount;
        setSelectedAppt(appt);
        setConfirmedId(appt.id);
        setPaymentAmount(remaining);
        setPaymentStep(1);
        setShowPaymentModal(true);
    };

    const closeDetail = () => {
        setSelectedDetail(null);
        router.push('/citas'); // Limpia el ?id= de la URL
    };

    return (
        <div className="max-w-4xl mx-auto p-6 pt-12 min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">Mis Reservas</h1>
            </header>

            {/* TABS */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeTab === tab.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredAppointments.length === 0 ? (
                <div className="bg-gray-50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-100 text-gray-400 font-bold uppercase text-xs tracking-widest">
                    No hay citas en esta categoría
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAppointments.map(appt => (
                        <AppointmentCard
                            key={appt.id}
                            appt={appt}
                            onPay={() => openPayment(appt)}
                            onView={() => router.push(`/citas?id=${appt.id}`, { scroll: false })}
                        />
                    ))}
                </div>
            )}

            {/* MODAL DE PAGO */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 relative overflow-hidden shadow-2xl">
                        <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black z-20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mt-4">
                            {paymentStep === 1 ? (
                                <PaymentStep
                                    business={{ id: selectedAppt.business_id }}
                                    service={selectedAppt.service}
                                    selectedSlot={{ time: format(new Date(selectedAppt.start_time), "HH:mm") }}
                                    selectedStaffId={selectedAppt.staff_id}
                                    customDate={format(new Date(selectedAppt.start_time), "yyyy-MM-dd")}
                                    paymentAmount={paymentAmount}
                                    setPaymentAmount={setPaymentAmount}
                                    minRequiredAmount={selectedAppt.required_deposit - selectedAppt.paid_amount}
                                    onBack={() => setShowPaymentModal(false)}
                                    onProcessing={setIsProcessing}
                                    onSuccess={(newId) => {
                                        if (newId) setConfirmedId(newId);
                                        setPaymentStep(2);
                                        fetchAppointments();
                                    }}
                                    isExistingAppointment={true}
                                    appointmentId={selectedAppt.id}
                                />
                            ) : (
                                <div className="py-10">
                                    <SuccessStep
                                        serviceName={selectedAppt.service.name}
                                        appointmentId={confirmedId}
                                    />
                                </div>
                            )}
                        </div>

                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Procesando...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DE DETALLE (TICKET) */}
            {selectedDetail && (
                <AppointmentDetailModal
                    appt={selectedDetail}
                    onClose={closeDetail}
                />
            )}
        </div>
    );
}

// --- SUB-COMPONENTE: CARD ---
function AppointmentCard({ appt, onPay, onView }) {
    const date = new Date(appt.start_time);
    return (
        <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-indigo-100">
            <div className="flex gap-5 items-center cursor-pointer" onClick={onView}>
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-600">
                    <span className="text-[10px] font-black uppercase">{format(date, "MMM", { locale: es })}</span>
                    <span className="text-xl font-black">{format(date, "dd")}</span>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 leading-tight">{appt.service.name}</h3>
                    <p className="text-xs font-medium text-gray-400">{format(date, "HH:mm")} hrs • {appt.service.duration_minutes} min</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Pagado</p>
                    <p className="font-black text-gray-900">${appt.paid_amount} / ${appt.total_amount}</p>
                </div>
                {appt.status === 'pending' ? (
                    <button
                        onClick={onPay}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                    >
                        Pagar ahora
                    </button>
                ) : (
                    <button
                        onClick={onView}
                        className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                        Ver Ticket
                    </button>
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTE: MODAL DE TICKET ---
function AppointmentDetailModal({ appt, onClose }) {
    const date = new Date(appt.start_time);
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden relative border-2 border-gray-100 animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 text-white hover:scale-110 transition-transform z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="bg-indigo-600 p-8 text-white text-center">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Tu Reservación</h2>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Ticket de Confirmación</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 leading-tight">{appt.service?.name}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{appt.business?.name}</p>
                        </div>
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Confirmada</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100">
                        <div>
                            <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Fecha</p>
                            <p className="text-sm font-bold capitalize">{format(date, "EEEE, d MMM", { locale: es })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Hora</p>
                            <p className="text-sm font-bold">{format(date, "HH:mm")} hrs</p>
                        </div>
                    </div>

                    <div className="space-y-2 bg-gray-50 p-4 rounded-2xl">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>Pagado</span>
                            <span className="text-green-600">${appt.paid_amount}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-gray-900 pt-2 border-t border-gray-200">
                            <span>Pendiente en local</span>
                            <span className="text-lg text-indigo-600">${appt.total_amount - appt.paid_amount}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}