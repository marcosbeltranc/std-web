'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Importamos useSearchParams

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams(); // Hook para leer la URL

    // 1. Capturamos el destino del redirect. 
    // Si no existe, por defecto enviamos al home '/'
    const redirectTo = searchParams.get('redirect') || '/';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const params = new URLSearchParams({
                email: email,
                password: password
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.detail || 'Error en el servidor';
                throw new Error(typeof errorMsg === 'object' ? 'Datos inválidos' : errorMsg);
            }

            // 2. Guardar sesión
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('email', data.email);
            localStorage.setItem('level', data.level);

            // 3. Redirección Inteligente
            // Usamos decodeURIComponent para asegurarnos que la URL sea válida
            router.push(decodeURIComponent(redirectTo));

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900">Bienvenido</h1>
                    <p className="text-gray-500 text-sm mt-2">Inicia sesión para continuar con tu reserva</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            className="mt-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 ml-1">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="mt-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                    >
                        {loading ? 'Validando datos...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}