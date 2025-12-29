'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!queryParam);

  useEffect(() => {
    if (queryParam) {
      fetchData(queryParam);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [queryParam]);

  const fetchData = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/businesses/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTrigger = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      {/* Hero Section - Más alto y con mejor tipografía */}
      <section className="relative bg-indigo-700 pt-32 pb-24 px-4 overflow-hidden">
        {/* Decoración sutil de fondo */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Tus servicios favoritos, <br /> <span className="text-indigo-200">a un click de distancia.</span>
          </h1>
          <p className="text-indigo-100 text-lg mb-10 max-w-xl mx-auto">
            Busca, elige y reserva. Así de fácil es gestionar tu tiempo con nuestra agenda.
          </p>

          <form onSubmit={handleSearchTrigger} className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Ej: Barbería, Dentista, Spa..."
              className="w-full p-6 pl-16 pr-36 rounded-2xl text-lg shadow-2xl outline-none text-black focus:ring-4 focus:ring-white/20 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-3 bottom-3 bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-indigo-800 transition-all active:scale-95 shadow-lg">
              Buscar
            </button>
          </form>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Título de Resultados */}
        {hasSearched && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800">
              {loading ? 'Buscando resultados...' : `Resultados para "${queryParam}"`}
            </h2>
            <p className="text-gray-500">{results.length} negocios encontrados</p>
          </div>
        )}

        {/* Estado de Carga (Skeletons) */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-80 shadow-sm border border-gray-100"></div>
            ))}
          </div>
        )}

        {/* Grid de Resultados Real */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((biz) => (
              <div key={biz.id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Header de la tarjeta con iniciales o placeholder */}
                <div className="h-40 bg-indigo-50 flex items-center justify-center relative overflow-hidden">
                  <span className="text-indigo-200 text-6xl font-black uppercase">
                    {biz.name.charAt(0)}
                  </span>
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    {biz.category || 'Destacado'}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-2xl text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {biz.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2 h-10">
                    {biz.description || 'Agenda tu cita con los mejores profesionales de la zona.'}
                  </p>

                  <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center text-yellow-500">
                      <span className="text-sm font-bold ml-1 text-gray-700">Abierto ahora</span>
                    </div>
                    <Link
                      href={`/business/${biz.slug}`}
                      className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-all text-sm"
                    >
                      Ver Servicios
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado Vacío */}
        {hasSearched && results.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">No encontramos lo que buscas</h3>
            <p className="text-gray-500 mt-2">Intenta con otros términos o busca categorías similares.</p>
          </div>
        )}

        {/* Landing Page cuando no hay búsqueda */}
        {!hasSearched && !loading && (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-gray-400 italic">
              Empieza escribiendo algo arriba para descubrir lugares increíbles...
            </h3>
          </div>
        )}
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={<div className="text-center p-20">Cargando buscador...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}