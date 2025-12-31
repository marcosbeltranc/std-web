'use client';
import Link from 'next/link';

export default function SuccessStep({ serviceName, appointmentId }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h2 className="text-3xl font-black tracking-tighter mb-2">¡Todo listo!</h2>
            <p className="text-gray-500 mb-8 px-4">
                Tu reserva para <span className="font-bold text-black">{serviceName}</span> ha sido confirmada con éxito.
            </p>

            <Link
                href={`/citas/?id=${appointmentId}`}
                className="flex items-center justify-center w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
                Ver mi Ticket
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </Link>
        </div>
    );
}