'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BookingModal from '@/components/BookingModal'; // Importamos el nuevo componente
import { apiFetch } from '@/lib/api';

export default function BusinessDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- ESTADOS DE DATOS ---
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DEL MODAL ---
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    // 1. Cargar información del negocio
    const loadBusiness = useCallback(async () => {
        try {
            const data = await apiFetch(`/businesses/${slug}`);
            if (data) setBusiness(data);
        } catch (err) {
            console.error("Error al cargar negocio:", err);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) loadBusiness();
    }, [slug, loadBusiness]);

    // 2. Escuchar cambios en la URL para abrir el modal de reserva
    useEffect(() => {
        if (!business) return;
        const svcId = searchParams.get('reserve');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (svcId) {
            const service = business.services.find(s => s.id === svcId);
            if (service) {
                if (!token) {
                    // Si no hay token, redirigir al login guardando la intención
                    router.push(`/login?redirect=/business/${slug}?reserve=${svcId}`);
                } else {
                    setSelectedService(service);
                    setShowBookingModal(true);
                }
            }
        }
    }, [searchParams, business, slug, router]);

    // Función para cerrar el modal y limpiar la URL
    const handleCloseModal = () => {
        setShowBookingModal(false);
        setSelectedService(null);
        router.push(`/business/${slug}`, { scroll: false });
    };

    if (loading) return <div className="p-20 text-center animate-pulse font-bold">Cargando...</div>;
    if (!business) return <div className="p-20 text-center">Negocio no encontrado</div>;

    // Agrupación de horarios para la vista previa
    const groupedSchedules = (business.schedules || []).reduce((acc, sch) => {
        if (!acc[sch.day_of_week]) acc[sch.day_of_week] = { is_closed: sch.is_closed, intervals: [] };
        if (!sch.is_closed) acc[sch.day_of_week].intervals.push(`${sch.open_time.slice(0, 5)} - ${sch.close_time.slice(0, 5)}`);
        return acc;
    }, {});
    const todayData = groupedSchedules[todayIndex];

    return (
        <div className="min-h-screen bg-white text-black">
            <Navbar />

            {/* HEADER DEL NEGOCIO */}
            <header className="pt-32 pb-12 px-6 max-w-3xl mx-auto">
                <h1 className="text-5xl font-black mb-4 tracking-tighter">{business.name}</h1>
                <p className="text-gray-500 text-lg mb-6">{business.address}</p>
                <div className="flex items-center gap-4 py-4 border-y border-gray-100">
                    <span className={`w-2 h-2 rounded-full ${todayData?.is_closed ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <span className="font-bold text-sm uppercase">
                        Hoy: {todayData?.is_closed ? "Cerrado" : todayData?.intervals.join(", ")}
                    </span>
                </div>
            </header>

            {/* LISTA DE SERVICIOS */}
            <main className="max-w-3xl mx-auto px-6 pb-20">
                <div className="grid gap-6">
                    {business.services?.map((svc) => (
                        <div key={svc.id} className="flex justify-between items-center pb-6 border-b border-gray-50">
                            <div>
                                <h3 className="font-bold text-xl">{svc.name}</h3>
                                <p className="text-gray-400 text-sm">{svc.duration_minutes} min</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className="text-2xl font-black">${svc.price}</span>
                                <button
                                    onClick={() => router.push(`?reserve=${svc.id}`, { scroll: false })}
                                    className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all"
                                >
                                    Reservar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* MODAL DE RESERVA (COMPONENTE SEPARADO) */}
            {showBookingModal && selectedService && (
                <BookingModal
                    business={business}
                    service={selectedService}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}