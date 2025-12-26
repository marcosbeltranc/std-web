'use client'; // <-- Vital para usar hooks como useState y useRouter

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api'; // Asegúrate de que la ruta sea correcta

export default function LoginPage() {
    // 1. Definimos los estados que usará el formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 2. La función de login que ya teníamos
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
                // Manejo de errores de FastAPI
                const errorMsg = data.detail || 'Error en el servidor';
                throw new Error(typeof errorMsg === 'object' ? 'Datos inválidos' : errorMsg);
            }

            // 3. Guardar token y redirigir
            localStorage.setItem('token', data.access_token);
            router.push('/');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. El JSX (lo que se ve en pantalla)
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Iniciar Sesión</h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}