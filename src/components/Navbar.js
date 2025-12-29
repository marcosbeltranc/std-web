'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    // Cargamos los datos del usuario desde localStorage al montar el componente
    useEffect(() => {
        const token = localStorage.getItem('token');
        const level = localStorage.getItem('level');
        const email = localStorage.getItem('email');

        if (token) {
            setUser({
                token,
                level: parseInt(level),
                email
            });
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        router.push('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Lado Izquierdo: Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-black text-indigo-600 tracking-tighter">
                                STD
                            </span>
                        </Link>
                    </div>

                    {/* Lado Derecho: Navegación dinámica */}
                    <div className="flex items-center gap-4 md:gap-8">

                        {/* Si el usuario es Admin (0), Dueño (1) o Manager (2) */}
                        {user && user.level <= 2 && (
                            <Link
                                href="/dashboard"
                                className="hidden md:block text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
                            >
                                📊 Panel Admin
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center gap-6">
                                {/* Links para el Usuario Final / Cliente */}
                                <Link
                                    href="/profile"
                                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                                >
                                    Mis Citas
                                </Link>

                                {/* Avatar y Logout */}
                                <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
                                    <div className="flex flex-col items-end hidden sm:flex">
                                        <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                                            {user.email}
                                        </span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                            {user.level === 0 ? 'Super Admin' : 'Cliente'}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Cerrar Sesión"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Botones si NO hay sesión iniciada */
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                                >
                                    Registrarme
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
}