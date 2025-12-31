'use client';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

export default function ScheduleStep({ service, business, onSelectionChange, onContinue }) {
    const [availability, setAvailability] = useState([]);
    const [customDate, setCustomDate] = useState("");
    const [openPeriod, setOpenPeriod] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [loading, setLoading] = useState(true);
    const isFirstRender = useRef(true);

    const loadAvailability = async (dateParam = null) => {
        setLoading(true);
        try {
            let url = `/services/${service.id}/availability`;
            if (dateParam) url += `?date=${dateParam}`;
            const data = await apiFetch(url);
            if (data) setAvailability(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            loadAvailability();
            isFirstRender.current = false;
        }
    }, [service.id]);

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setCustomDate(newDate);
        setOpenPeriod(null);
        setSelectedSlot(null);
        loadAvailability(newDate);
    };

    const groupSlotsByPeriod = (slots) => {
        if (!slots || slots.length === 0) return {};
        const rawGroups = {
            manana: slots.filter(s => parseInt(s.time.split(':')[0]) < 12),
            tarde: slots.filter(s => {
                const h = parseInt(s.time.split(':')[0]);
                return h >= 12 && h < 18;
            }),
            noche: slots.filter(s => parseInt(s.time.split(':')[0]) >= 18)
        };

        const dynamicGroups = {};
        Object.entries(rawGroups).forEach(([key, items]) => {
            if (items.length > 0) {
                const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
                const label = `${sorted[0].time.slice(0, 5)} - ${sorted[sorted.length - 1].time.slice(0, 5)}`;
                dynamicGroups[label] = items;
            }
        });
        return dynamicGroups;
    };

    const handleInternalClick = (slot, date) => {
        setSelectedSlot(slot);
        const staffId = slot.available_employees?.length === 1 ? slot.available_employees[0].id : null;
        setSelectedStaffId(staffId);
        onSelectionChange(slot, staffId, date);
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <input type="date" value={customDate} onChange={handleDateChange} className="bg-transparent text-sm font-bold outline-none cursor-pointer" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{customDate ? "Filtrando día" : "Próximos 7 días"}</span>
            </div>

            {loading ? (
                <div className="text-center py-10 animate-pulse text-xs font-bold uppercase">Buscando horarios...</div>
            ) : (
                availability.map((day) => {
                    const grouped = groupSlotsByPeriod(day.slots);
                    const hasSlots = day.slots && day.slots.length > 0; // Verificamos si hay lapsos

                    return (
                        <div key={day.date} className={`space-y-3 ${!hasSlots ? 'opacity-60' : ''}`}>
                            {/* Título del día con lógica de color y tachado */}
                            <p className={`text-[10px] font-black uppercase tracking-widest px-2 mt-4 flex items-center gap-2 
                    ${hasSlots ? 'text-indigo-600' : 'text-red-500 line-through'}`}>
                                {day.day_name} {day.date}
                                {!hasSlots && <span className="no-underline text-[9px] font-bold">(Sin disponibilidad)</span>}
                            </p>

                            {hasSlots ? (
                                Object.entries(grouped).map(([range, slots]) => {
                                    const isOpen = openPeriod === `${day.date}-${range}`;
                                    return (
                                        <div key={range} className={`border rounded-3xl overflow-hidden transition-all ${isOpen ? 'border-indigo-100 shadow-sm' : 'border-gray-100'}`}>
                                            <button onClick={() => setOpenPeriod(isOpen ? null : `${day.date}-${range}`)} className={`w-full flex items-center justify-between p-4 ${isOpen ? 'bg-indigo-50/50' : 'bg-white'}`}>
                                                <span className="font-bold text-sm">{range}</span>
                                                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                            {isOpen && (
                                                <div className="p-4 bg-white border-t border-gray-50">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {slots.map((slot, idx) => {
                                                            const isSelected = selectedSlot?.time === slot.time && selectedSlot?.date === day.date;
                                                            return (
                                                                <button key={idx} onClick={() => handleInternalClick({ ...slot, date: day.date }, day.date)} className={`py-2.5 rounded-xl text-[11px] font-black transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-50 hover:bg-black hover:text-white'}`}>{slot.time.slice(0, 5)}</button>
                                                            );
                                                        })}
                                                    </div>
                                                    {selectedSlot?.date === day.date && slots.some(s => s.time === selectedSlot.time) && (
                                                        <div className="mt-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                                                            <p className="text-[10px] font-black uppercase text-gray-400 mb-3">Profesional</p>
                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                {selectedSlot.available_employees?.map(staff => (
                                                                    <button key={staff.id} onClick={() => { setSelectedStaffId(staff.id); onSelectionChange(selectedSlot, staff.id, day.date); }} className={`px-4 py-2 rounded-full text-xs font-bold border ${selectedStaffId === staff.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500'}`}>{staff.name}</button>
                                                                ))}
                                                            </div>
                                                            <button onClick={() => onContinue((service.price * (service.deposit_percentage || business.deposit_percentage || 0)) / 100)} disabled={!selectedStaffId} className="w-full bg-black text-white py-3 rounded-2xl font-bold text-sm hover:bg-indigo-600 disabled:opacity-50">Continuar reserva</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                /* Mensaje opcional o espacio vacío para días sin slots */
                                <div className="px-2 py-1 text-[11px] text-gray-400 italic">
                                    No hay turnos libres para esta fecha.
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}