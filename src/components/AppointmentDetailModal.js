'use client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AppointmentDetailModal({ appt, onClose }) {
    if (!appt) return null;
    const date = new Date(appt.start_time);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden relative border-2 border-gray-100 animate-in zoom-in duration-300">

                {/* Botón Cerrar */}
                <button onClick={onClose} className="absolute top-6 right-6 text-white hover:scale-110 transition-transform z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Diseño de Ticket */}
                <div className="bg-indigo-600 p-8 text-white text-center">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Tu Reservación</h2>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Confirmación Exitosa</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 leading-tight">{appt.service?.name}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{appt.business?.name}</p>
                        </div>
                        <div className="text-right">
                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Confirmada</span>
                        </div>
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

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>Pagado Online</span>
                            <span className="text-green-600">${appt.paid_amount}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-gray-900 pt-2 border-t border-gray-50">
                            <span>Restante en local</span>
                            <span className="text-lg">${appt.total_amount - appt.paid_amount}</span>
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