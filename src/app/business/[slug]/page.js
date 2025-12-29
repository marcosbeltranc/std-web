'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function BusinessDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estados de datos
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState([]);

    // Estados de UI
    const [showFullSchedule, setShowFullSchedule] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [customDate, setCustomDate] = useState("");
    const [openPeriod, setOpenPeriod] = useState(null); // Inicialmente cerrado

    const daysMap = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    // 1. Cargar datos base del negocio
    useEffect(() => {
        async function loadBusiness() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/businesses/${slug}`);
                if (!res.ok) throw new Error("Negocio no encontrado");
                const data = await res.json();
                setBusiness(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (slug) loadBusiness();
    }, [slug]);

    // 2. Cargar disponibilidad de la API
    const loadAvailability = async (serviceId, dateParam = null) => {
        try {
            setAvailability([]); // Reset para mostrar loading
            let url = `${process.env.NEXT_PUBLIC_API_URL}/services/${serviceId}/availability`;
            if (dateParam) url += `?date=${dateParam}`;

            const res = await fetch(url);
            const data = await res.json();
            setAvailability(data);
            setOpenPeriod(null); // Cerrar acordiones al cambiar fecha
        } catch (err) {
            console.error("Error slots:", err);
        }
    };

    // 3. Controlador de apertura de modales
    useEffect(() => {
        if (!business) return;
        const svcId = searchParams.get('reserve');
        const token = localStorage.getItem('token');

        if (svcId) {
            const service = business.services.find(s => s.id === svcId);
            if (service) {
                setSelectedService(service);
                if (!token) {
                    setShowAuthModal(true);
                    setShowBookingModal(false);
                } else {
                    setShowAuthModal(false);
                    setShowBookingModal(true);
                    loadAvailability(svcId);
                }
            }
        }
    }, [searchParams, business]);

    const groupSlotsByPeriod = (slots) => {
        const periods = { Mañana: [], Tarde: [], Noche: [] };
        if (!slots) return periods;
        slots.forEach(slot => {
            const hour = parseInt(slot.time.split(':')[0]);
            if (hour < 12) periods.Mañana.push(slot);
            else if (hour < 18) periods.Tarde.push(slot);
            else periods.Noche.push(slot);
        });
        return periods;
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-500 font-bold">Cargando...</div>;
    if (!business) return <div className="p-20 text-center text-red-500">404: Negocio no encontrado</div>;

    const groupedSchedules = (business.schedules || []).reduce((acc, sch) => {
        if (!acc[sch.day_of_week]) {
            acc[sch.day_of_week] = { is_closed: sch.is_closed, intervals: [] };
        }
        if (!sch.is_closed) {
            acc[sch.day_of_week].intervals.push(`${sch.open_time.slice(0, 5)} - ${sch.close_time.slice(0, 5)}`);
        }
        return acc;
    }, {});

    const todayData = groupedSchedules[todayIndex];

    return (
        <div className="min-h-screen bg-white text-black">
            <Navbar />

            <header className="pt-32 pb-12 px-6 max-w-3xl mx-auto">
                <h1 className="text-5xl font-black mb-4 tracking-tighter">{business.name}</h1>
                <p className="text-gray-500 text-lg mb-6">{business.address}</p>

                <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${todayData?.is_closed ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        <span className="font-bold text-sm uppercase">Hoy:</span>
                        <span className="text-gray-700">
                            {todayData?.is_closed ? "Cerrado" : todayData?.intervals.join(", ") || "Sin horario"}
                        </span>
                    </div>
                    <button onClick={() => setShowFullSchedule(true)} className="text-indigo-600 font-bold text-sm hover:underline">
                        Ver horario completo
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 pb-20">
                <h2 className="text-2xl font-bold mb-8">Servicios</h2>
                <div className="grid gap-6">
                    {business.services?.map((service) => (
                        <div key={service.id} className="flex justify-between items-center pb-6 border-b border-gray-50 group">
                            <div className="flex-1">
                                <h3 className="font-bold text-xl mb-1 group-hover:text-indigo-600 transition-colors">{service.name}</h3>
                                <p className="text-gray-400 font-medium text-sm">{service.duration_minutes} minutos</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className="text-2xl font-black">${service.price}</span>
                                <button
                                    onClick={() => router.push(`?reserve=${service.id}`, { scroll: false })}
                                    className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    Reservar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* MODAL: DISPONIBILIDAD (Compacta con Acordiones) */}
            {showBookingModal && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => { setShowBookingModal(false); router.push(`/business/${slug}`, { scroll: false }); setCustomDate(""); }}
                            className="absolute top-6 right-6 text-gray-400 hover:text-black z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-black tracking-tighter">Selecciona horario</h2>
                            <p className="text-sm text-gray-500">Servicio: <span className="text-indigo-600 font-bold">{selectedService?.name}</span></p>
                        </div>

                        {/* Selector de Fecha Compacto */}
                        <div className="mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <input
                                type="date"
                                value={customDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                    setCustomDate(e.target.value);
                                    loadAvailability(selectedService.id, e.target.value);
                                }}
                                className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                            />
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cambiar día</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {availability.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 font-bold animate-pulse text-sm uppercase tracking-widest">Cargando cupos...</p>
                            ) : (
                                availability.map((day) => {
                                    const grouped = groupSlotsByPeriod(day.slots);
                                    return (
                                        <div key={day.date} className="space-y-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{day.day_name} {day.date}</p>

                                            {Object.entries(grouped).map(([period, slots]) => {
                                                const hasSlots = slots.length > 0;
                                                const isOpen = openPeriod === period;

                                                return (
                                                    <div key={period} className={`border rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-indigo-100 shadow-sm' : 'border-gray-100'}`}>
                                                        <button
                                                            onClick={() => setOpenPeriod(isOpen ? null : period)}
                                                            className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-indigo-50/50' : 'bg-white'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex">
                                                                    <span className={`w-2.5 h-2.5 rounded-full ${hasSlots ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                    {hasSlots && <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></span>}
                                                                </div>
                                                                <span className={`font-bold text-sm ${!hasSlots ? 'text-gray-400' : (isOpen ? 'text-indigo-600' : 'text-gray-700')}`}>{period}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[10px] font-black ${hasSlots ? 'text-indigo-400' : 'text-gray-300'}`}>
                                                                    {hasSlots ? `${slots.length} DISPONIBLES` : 'SIN CUPOS'}
                                                                </span>
                                                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </button>

                                                        {isOpen && (
                                                            <div className="p-4 bg-white grid grid-cols-4 gap-2 border-t border-gray-50">
                                                                {hasSlots ? (
                                                                    slots.map((slot, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            className="py-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[11px] font-black transition-all active:scale-90"
                                                                        >
                                                                            {slot.time.slice(0, 5)}
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <p className="col-span-4 text-center py-4 text-xs text-gray-400 italic">No hay horarios disponibles</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Confirma tu hora para agendar</p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: HORARIO COMPLETO (Schedules) */}
            {showFullSchedule && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative">
                        <button onClick={() => setShowFullSchedule(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h3 className="text-2xl font-black mb-8 italic text-indigo-600">Horarios de atención</h3>
                        <div className="space-y-4">
                            {daysMap.map((day, idx) => {
                                const dayInfo = groupedSchedules[idx];
                                return (
                                    <div key={day} className={`flex justify-between items-center py-2 ${idx === todayIndex ? 'bg-indigo-50 px-4 rounded-xl' : ''}`}>
                                        <span className={`font-bold ${idx === todayIndex ? 'text-indigo-600' : 'text-gray-600'}`}>{day}</span>
                                        <div className="text-right italic font-medium text-sm">
                                            {dayInfo?.is_closed ? <span className="text-red-400 uppercase text-xs">Cerrado</span> : dayInfo?.intervals.join(" / ") || "—"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: AUTH */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 text-center">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tighter">Inicia Sesión</h2>
                        <p className="text-gray-500 mb-10 text-sm">Necesitas una cuenta para agendar <b>{selectedService?.name}</b>.</p>
                        <button
                            onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/business/${slug}?reserve=${selectedService.id}`)}`)}
                            className="w-full bg-black text-white py-5 rounded-3xl font-black text-lg mb-4 hover:bg-indigo-600 transition-colors"
                        >
                            Ir a Identificarme
                        </button>
                        <button onClick={() => { setShowAuthModal(false); router.push(`/business/${slug}`, { scroll: false }) }} className="text-gray-400 font-bold hover:text-black">Ahora no</button>
                    </div>
                </div>
            )}
        </div>
    );
}