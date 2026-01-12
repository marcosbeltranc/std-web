'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

const getBusinessStatus = (schedules) => {
  if (!schedules || schedules.length === 0) return { label: "Consultar horario", color: "text-gray-400" };
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });
  const todaySchedules = schedules.filter(s => s.day_of_week === dayOfWeek && !s.is_closed);
  if (todaySchedules.length === 0) return { label: "Cerrado hoy", color: "text-red-500" };
  const isOpen = todaySchedules.some(s => currentTime >= s.open_time && currentTime <= s.close_time);
  return isOpen ? { label: "Abierto ahora", color: "text-green-500" } : { label: "Cerrado ahora", color: "text-red-500" };
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
  const [loading, setLoading] = useState(false); // Carga de resultados
  const [isGeocoding, setIsGeocoding] = useState(false); // Carga de dirección/coordenadas
  const [hasSearched, setHasSearched] = useState(!!(queryParam || latParam));

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (queryParam || (latParam && lonParam)) {
      fetchData(queryParam, latParam, lonParam);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [queryParam, latParam, lonParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput.length > 2 && !isSelecting && locationInput !== locNameParam && locationInput !== "Mi ubicación actual") {
        fetchMapboxSuggestions(locationInput);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationInput, isSelecting]);

  const fetchMapboxSuggestions = async (searchText) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchText)}&language=es&access_token=${token}&session_token=search_session_123`
      );
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error Mapbox Suggestions:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

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
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`);
      const data = await response.json();
      if (data.features?.length > 0) {
        const [lon, lat] = data.features[0].center;
        return { lat, lon };
      }
    } catch (err) { return null; }
    finally { setIsGeocoding(false); }
    return null;
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setIsSelecting(true);
      setLocationInput("Mi ubicación actual");
      setShowSuggestions(false);
      setIsGeocoding(false);
      router.push(`/?q=${encodeURIComponent(query)}&lat=${latitude}&lon=${longitude}&locName=${encodeURIComponent("Mi ubicación")}`);
    }, () => setIsGeocoding(false));
  };

  const handleSearchTrigger = async (e, forcedAddress = null) => {
    if (e) e.preventDefault();
    const addressToProcess = forcedAddress || locationInput;

    setIsSelecting(true);
    setShowSuggestions(false);
    setSuggestions([]);

    let lat = latParam;
    let lon = lonParam;

    if (addressToProcess.trim() && addressToProcess !== "Mi ubicación actual" && addressToProcess !== "Mi ubicación") {
      const coords = await geocodeAddress(addressToProcess);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (lat) params.append('lat', lat.toString());
    if (lon) params.append('lon', lon.toString());
    if (addressToProcess) params.append('locName', addressToProcess);

    router.push(`/?${params.toString()}`);
  };

  return (
    <>
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
                  autoComplete="off"
                  onChange={(e) => {
                    setIsSelecting(false);
                    setLocationInput(e.target.value);
                  }}
                  onFocus={() => {
                    if (locationInput.length > 2) setShowSuggestions(true);
                  }}
                />

                {/* ICONO DE CARGA O GPS */}
                <div className="absolute right-4 flex items-center justify-center">
                  {isGeocoding ? (
                    <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <button type="button" onClick={handleGPS} className="text-gray-400 hover:text-indigo-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3m10-10h-3M5 12H2" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </button>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && !isSelecting && (
                  <div className="absolute top-[110%] left-0 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]">
                    {suggestions.map((s) => (
                      <div
                        key={s.mapbox_id}
                        className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 text-left"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const fullAddress = s.full_address || s.name;
                          setIsSelecting(true);
                          setLocationInput(fullAddress);
                          setSuggestions([]);
                          setShowSuggestions(false);
                          handleSearchTrigger(null, fullAddress);
                        }}
                      >
                        <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{s.place_formatted}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95 disabled:opacity-70" disabled={isGeocoding}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {hasSearched && (
          <div className="mb-12 flex items-end justify-between border-b pb-6">
            <div>
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{locNameParam ? `Cerca de ${locNameParam}` : 'Explorar'}</p>
              <h2 className="text-4xl font-black text-gray-900">{loading ? 'Actualizando resultados...' : 'Negocios encontrados'}</h2>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-[2.5rem] p-8 border shadow-sm">
                <div className="h-44 bg-gray-200 rounded-2xl mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))
          ) : (
            results.map((biz) => {
              const status = getBusinessStatus(biz.schedules);
              return (
                <div key={biz.id} className="group bg-white rounded-[2.5rem] shadow-xl border overflow-hidden hover:-translate-y-2 transition-all duration-300">
                  <div className="h-44 bg-indigo-50 flex items-center justify-center relative">
                    <span className="text-indigo-100 text-9xl font-black uppercase select-none">{biz.name.charAt(0)}</span>
                    {biz.distance && (
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow-sm text-xs font-bold text-indigo-600 border border-indigo-100">
                        📍 {biz.distance}
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <h3 className="font-black text-2xl text-gray-900 group-hover:text-indigo-600 transition-colors">{biz.name}</h3>
                    <p className="text-gray-400 text-xs mt-1 mb-3 italic">{biz.address}</p>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">{biz.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                      <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
                      <Link
                        href={`/business/${biz.slug}?lat=${latParam}&lon=${lonParam}`}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg"
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
        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl font-medium">No encontramos negocios con estos criterios.</p>
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
      <Suspense fallback={<div className="text-center py-24 text-gray-500 font-medium">Cargando aplicación...</div>}>
        <SearchResultsContent />
      </Suspense>
    </div>
  );
}