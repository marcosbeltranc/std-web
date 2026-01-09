'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

// Función para calcular si está abierto según los horarios del backend
const getBusinessStatus = (schedules) => {
  if (!schedules || schedules.length === 0) return { label: "Consultar horario", color: "text-gray-400" };

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Dom) a 6 (Sáb)
  // Formato HH:MM:SS para comparar con el backend
  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });

  const todaySchedules = schedules.filter(s => s.day_of_week === dayOfWeek && !s.is_closed);

  if (todaySchedules.length === 0) return { label: "Cerrado hoy", color: "text-red-500" };

  const isOpen = todaySchedules.some(s => currentTime >= s.open_time && currentTime <= s.close_time);

  return isOpen
    ? { label: "Abierto ahora", color: "text-green-500" }
    : { label: "Cerrado ahora", color: "text-red-500" };
};

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const latParam = searchParams.get('lat') || '';
  const lonParam = searchParams.get('lon') || '';
  const locNameParam = searchParams.get('locName') || '';

  const [query, setQuery] = useState(queryParam);
  const [locationInput, setLocationInput] = useState(locNameParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!(queryParam || latParam));

  useEffect(() => {
    if (queryParam || (latParam && lonParam)) {
      fetchData(queryParam, latParam, lonParam);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [queryParam, latParam, lonParam]);

  const fetchData = async (searchQuery, lat, lon) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (lat) params.append('lat', lat);
      if (lon) params.append('lon', lon);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/businesses/search?${params.toString()}`);
      const data = await response.json();
      setResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return null;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`
      );
      const data = await response.json();
      if (data.features?.length > 0) {
        const [lon, lat] = data.features[0].center;
        return { lat, lon };
      }
    } catch (err) { return null; }
    return null;
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationInput("Mi ubicación actual");
      router.push(`/?q=${encodeURIComponent(query)}&lat=${latitude}&lon=${longitude}&locName=${encodeURIComponent("Mi ubicación")}`);
    });
  };

  const handleSearchTrigger = async (e) => {
    e.preventDefault();
    let lat = latParam;
    let lon = lonParam;

    if (locationInput.trim() && locationInput !== locNameParam && locationInput !== "Mi ubicación actual") {
      const coords = await geocodeAddress(locationInput);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (lat) params.append('lat', lat);
    if (lon) params.append('lon', lon);
    if (locationInput) params.append('locName', locationInput);

    router.push(`/?${params.toString()}`);
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative min-h-[50vh] flex items-center justify-center pt-20 pb-20 px-4">
        <div className="absolute inset-0 z-0">
          <Image src="/images/hero-bg.jpg" alt="Background" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Tu tiempo es <span className="text-indigo-400">valioso.</span>
          </h1>

          <form onSubmit={handleSearchTrigger} className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row bg-white rounded-[2rem] shadow-2xl p-2 gap-1 border border-white/20">
              <input
                type="text"
                placeholder="¿Qué buscas?"
                className="flex-[1.2] p-5 pl-8 outline-none text-black bg-transparent text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="hidden md:block w-px h-10 bg-gray-200 self-center"></div>
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="¿Dónde?"
                  className="w-full p-5 pl-8 pr-12 outline-none text-black bg-transparent text-lg"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
                <button type="button" onClick={handleGPS} className="absolute right-4 text-gray-400 hover:text-indigo-500">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
                </button>
              </div>
              <button type="submit" className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg">
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* RESULTS SECTION */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {hasSearched && (
          <div className="mb-12 flex items-end justify-between border-b pb-6">
            <div>
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{locNameParam ? `Cerca de ${locNameParam}` : 'Explorar'}</p>
              <h2 className="text-4xl font-black text-gray-900">{loading ? 'Buscando...' : 'Negocios encontrados'}</h2>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 rounded-[2.5rem] h-96"></div>)
          ) : (
            results.map((biz) => {
              const status = getBusinessStatus(biz.schedules);
              return (
                <div key={biz.id} className="group bg-white rounded-[2.5rem] shadow-xl border overflow-hidden hover:-translate-y-2 transition-all duration-300">
                  <div className="h-44 bg-indigo-50 flex items-center justify-center relative">
                    <span className="text-indigo-100 text-9xl font-black uppercase">{biz.name.charAt(0)}</span>
                    {biz.distance && (
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow-sm text-xs font-bold text-indigo-600">
                        📍 {biz.distance}
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <h3 className="font-black text-2xl text-gray-900">{biz.name}</h3>
                    <p className="text-gray-400 text-xs mt-1 mb-3 line-clamp-1">{biz.address}</p>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-6">{biz.description}</p>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
                      <Link
                        href={`/business/${biz.slug}?lat=${latParam}&lon=${lonParam}`}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors"
                      >
                        Ver Agenda
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={<div className="text-center py-24">Cargando...</div>}>
        <SearchResultsContent />
      </Suspense>
    </div>
  );
}