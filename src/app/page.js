'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificamos si existe el token
    const token = localStorage.getItem('token');

    if (!token) {
      // 2. Si no hay token, lo mandamos al login
      router.push('/login');
    } else {
      // 3. Si hay token, dejamos de mostrar el estado de carga
      setLoading(false);
    }
  }, [router]);

  // Mientras se verifica el token, mostramos una pantalla de carga blanca o un spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 font-medium">Verificando sesión...</p>
      </div>
    );
  }

  // Si llegamos aquí, es que el usuario está autenticado
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bienvenido a tu App de Citas</h1>
      <p className="mt-4">Aquí verás tus próximas reservas.</p>

      <button
        onClick={() => {
          localStorage.removeItem('token');
          router.push('/login');
        }}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}