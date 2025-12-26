// src/lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Utilidad centralizada para peticiones al API
 */
export async function apiFetch(endpoint, options = {}) {
    // 1. Obtener el token del localStorage (solo si estamos en el cliente)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // 2. Configurar cabeceras por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    // 3. Realizar la petición
    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // 4. Manejo de errores global
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Error en la petición');
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error.message);
        throw error;
    }
}