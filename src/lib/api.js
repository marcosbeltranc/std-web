// src/lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Utilidad centralizada para peticiones al API con Interceptor de Sesión
 */
export async function apiFetch(endpoint, options = {}) {
    // 1. Obtener el token del localStorage (solo cliente)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // 2. Configurar cabeceras
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // --- INTERCEPTOR DE AUTENTICACIÓN ---
        if (response.status === 401) {
            console.warn("Sesión expirada (401). Redirigiendo al login...");

            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
                // Usamos window.location para resetear todo el estado de la app
                window.location.href = '/login?expired=true';
            }
            return null;
        }

        // 4. Manejo de errores global para otros estados (400, 404, 500, etc)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Lógica para extraer el mensaje de error de FastAPI (detail)
            const errorMessage = errorData.detail || 'Error en la petición';
            throw new Error(errorMessage);
        }

        // 5. Retornar datos procesados
        return await response.json();

    } catch (error) {
        // Si el error fue el 401, el interceptor ya manejó la redirección
        console.error("API Error:", error.message);
        throw error;
    }
}