import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Trophy, 
  Map as MapIcon, 
  Navigation, 
  User, 
  Flame, 
  Zap, 
  Search, 
  Play, 
  Square, 
  Gauge, 
  Crosshair,
  ChevronDown,
  Check
} from 'lucide-react';

// Icona personalizzata Marker GPS
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente per muovere la mappa sulle coordinate cercate
function ControllerMappa({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Database simulato di percorsi per dimostrazione e test immediato
const ROADS_DATABASE = [
  {
    id: 1,
    name: 'Serravalle - Tratto Misto Panoramico',
    type: 'extraurbano',
    difficulty: 'difficile',
    lengthKm: 14.2,
    curvesCount: 28,
    coords: [
      [45.7144, 8.2818],
      [45.7200, 8.2900],
      [45.7280, 8.3050],
      [45.7350, 8.3150]
    ]
  },
  {
    id: 2,
    name: 'Torino Centro - Anello Urbano',
    type: 'urbano',
    difficulty: 'facile',
    lengthKm: 5.8,
    curvesCount: 8,
    coords: [
      [45.0621, 7.6601],
      [45.0650, 7.6700],
      [45.0700, 7.6750],
      [45.0680, 7.6620]
    ]
  },
  {
    id: 3,
    name: 'A4 Milano - Torino Express',
    type: 'autostrada',
    difficulty: 'facile',
    lengthKm: 45.0,
    curvesCount: 3,
    coords: [
      [45.0621, 7.6601],
      [45.1500, 7.8500],
      [45.2500, 8.1000],
      [45.4654, 9.1859]
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [userLocation, setUserLocation] = useState([45.0621, 7.6601]);
  const [mapCenter, setMapCenter] = useState([45.0621, 7.6601]);
  const [mapZoom, setMapZoom] = useState(13);
  
  const [speed, setSpeed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTitle, setSearchTitle] = useState('Posizione Attuale');
  const [isSearching, setIsSearching] = useState(false);

  // STATI PER I MENU A TENDINA E FILTRI
  const [activeDropdown, setActiveDropdown] = useState(null); // 'percorsi', 'difficolta', 'lunghezza'
  const [filterType, setFilterType] = useState('tutti'); // 'urbano', 'extraurbano', 'autostrada', 'tutti'
  const [filterDiff, setFilterDiff] = useState('tutti'); // 'facile', 'media', 'difficile', 'tutti'
  const [sortByLength, setSortByLength] = useState(false); // true = da più lungo a più corto

  // Tratto attualmente evidenziato sulla mappa
  const [selectedPolyline, setSelectedPolyline] = useState(ROADS_DATABASE[0].coords);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState(ROADS_DATABASE[0]);

  // Tracciamento GPS
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed: gpsSpeed } = position.coords;
          const newPos = [latitude, longitude];
          setUserLocation(newPos);
          if (searchTitle === 'Posizione Attuale') {
            setMapCenter(newPos);
          }
          if (gpsSpeed !== null && gpsSpeed !== undefined) {
            setSpeed(Math.round(gpsSpeed * 3.6));
          }
        },
        (error) => console.log('Errore GPS:', error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [searchTitle]);

  // Timer Sessione
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Ricerca Reale con Nominatim
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setActiveDropdown(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const newCoords = [lat, lon];
        
        setMapCenter(newCoords);
        setMapZoom(14);
        const mainName = data[0].display_name.split(',')[0];
        setSearchTitle(mainName);

        // Genera una traccia fittizia evidenziata attorno alla città cercata
        const generatedPath = [
          newCoords,
          [lat + 0.008, lon + 0.012],
          [lat + 0.015, lon + 0.005],
          [lat + 0.020, lon - 0.010]
        ];
        setSelectedPolyline(generatedPath);
        setSelectedRouteInfo({
          name: `${mainName} - Tratto Selezionato`,
          type: 'extraurbano',
          difficulty: 'media',
          lengthKm: 12.4,
          curvesCount: 16
        });

      } else {
        alert('Località non trovata. Prova con un altro nome (es. Serravalle Sesia, Torino, Milano)');
      }
    } catch (err) {
      console.error('Errore ricerca:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 select-none">
      
      {/* HEADER */}
      <header className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent italic">
            APEXLAP
          </h1>
        </div>
        <button className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-slate-300">
          <User className="w-4 h-4" />
        </button>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <main className="max-w-md mx-auto relative">
        
        {/* SCHEDA MAPPA */}
        {activeTab === 'map' && (
          <div className="relative h-[calc(100vh-125px)] w-full overflow-hidden">
            
            {/* MAPPA LEAFLET CON POLYLINE EVIDENZIATA */}
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              scrollWheelZoom={true} 
              className="h-full w-full z-0"
              zoomControl={false}
            >
              <ControllerMappa center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-dark-filter"
              />
              
              {/* LINEA TRACCIATO EVIDENZIATO SULLA MAPPA */}
              {selectedPolyline && (
                <Polyline 
                  positions={selectedPolyline} 
                  color="#ef4444" 
                  weight={6} 
                  opacity={0.9} 
                />
              )}

              <Marker position={userLocation} icon={customIcon}>
                <Popup>La tua posizione GPS</Popup>
              </Marker>
            </MapContainer>

            {/* OVERLAY SUPERIORE: RICERCA E TENDINE FILTRI */}
            <div className="absolute top-3 left-3 right-3 z-[1000] space-y-2">
              
              {/* BARRA RICERCA */}
              <form onSubmit={handleSearch} className="relative shadow-2xl">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca città o tratto (es. Serravalle Sesia, Torino)..."
                  className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl pl-10 pr-20 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 shadow-lg"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-red-600 hover:bg-red-500 rounded-xl text-[11px] font-bold text-white transition-all"
                >
                  {isSearching ? '...' : 'Cerca'}
                </button>
              </form>

              {/* PULSANTI TENDINA STRAVA-STYLE */}
              <div className="relative">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  
                  {/* TENDINA 1: PERCORSI */}
                  <button 
                    onClick={() => toggleDropdown('percorsi')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap backdrop-blur-md shadow-md transition-all ${filterType !== 'tutti' ? 'bg-red-600 text-white' : 'bg-slate-900/90 border border-slate-700 text-slate-200'}`}
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" /> 
                    {filterType === 'tutti' ? 'Percorsi' : filterType.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>

                  {/* TENDINA 2: LUNGHEZZA */}
                  <button 
                    onClick={() => {
                      setSortByLength(!sortByLength);
                      setActiveDropdown(null);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-md shadow-md transition-all ${sortByLength ? 'bg-red-600 text-white font-bold' : 'bg-slate-900/90 border border-slate-700 text-slate-200'}`}
                  >
                    Lunghezza {sortByLength ? '(Decrescente)' : ''}
                  </button>

                  {/* TENDINA 3: DIFFICOLTÀ */}
                  <button 
                    onClick={() => toggleDropdown('difficolta')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap backdrop-blur-md shadow-md transition-all ${filterDiff !== 'tutti' ? 'bg-red-600 text-white' : 'bg-slate-900/90 border border-slate-700 text-slate-200'}`}
                  >
                    {filterDiff === 'tutti' ? 'Difficoltà' : filterDiff.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>

                </div>

                {/* MENU A TENDINA PERCORSI (Urbano / Extraurbano / Autostrada) */}
                {activeDropdown === 'percorsi' && (
                  <div className="absolute left-0 top-10 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 w-48 shadow-2xl backdrop-blur-xl z-[1100] space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 px-3 py-1 block uppercase">Tipologia Strada</span>
                    {[
                      { id: 'tutti', label: 'Tutti i percorsi' },
                      { id: 'urbano', label: 'Urbano (Città)' },
                      { id: 'extraurbano', label: 'Extraurbano (Misto)' },
                      { id: 'autostrada', label: 'Autostrada (Veloce)' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setFilterType(opt.id);
                          setActiveDropdown(null);
                          // Seleziona la prima strada corrispondente dal database
                          const found = ROADS_DATABASE.find(r => opt.id === 'tutti' || r.type === opt.id);
                          if (found) {
                            setSelectedPolyline(found.coords);
                            setSelectedRouteInfo(found);
                            setMapCenter(found.coords[0]);
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-slate-800 text-slate-200 text-left"
                      >
                        {opt.label}
                        {filterType === opt.id && <Check className="w-3.5 h-3.5 text-red-500" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* MENU A TENDINA DIFFICOLTÀ (Facile / Media / Difficile) */}
                {activeDropdown === 'difficolta' && (
                  <div className="absolute left-32 top-10 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 w-52 shadow-2xl backdrop-blur-xl z-[1100] space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 px-3 py-1 block uppercase">Livello Curvatura / Angolo</span>
                    {[
                      { id: 'tutti', label: 'Tutte le difficoltà' },
                      { id: 'facile', label: 'Facile (Poche curve, Sicuro)' },
                      { id: 'media', label: 'Media (Misto Guidato)' },
                      { id: 'difficile', label: 'Difficile (Molte curve stretta)' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setFilterDiff(opt.id);
                          setActiveDropdown(null);
                          const found = ROADS_DATABASE.find(r => opt.id === 'tutti' || r.difficulty === opt.id);
                          if (found) {
                            setSelectedPolyline(found.coords);
                            setSelectedRouteInfo(found);
                            setMapCenter(found.coords[0]);
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-slate-800 text-slate-200 text-left"
                      >
                        {opt.label}
                        {filterDiff === opt.id && <Check className="w-3.5 h-3.5 text-red-500" />}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* MIRINO RE-CENTER GPS */}
            <button 
              onClick={() => {
                setMapCenter(userLocation);
                setMapZoom(14);
                setSearchTitle('Posizione Attuale');
              }}
              className="absolute right-4 top-36 z-[1000] w-10 h-10 bg-slate-900/90 border border-slate-700 rounded-full flex items-center justify-center shadow-xl text-slate-200 active:scale-95 backdrop-blur-md"
            >
              <Crosshair className="w-5 h-5 text-red-500" />
            </button>

            {/* CARD INFO TRATTO SELEZIONATO IN BASSO */}
            <div className="absolute bottom-4 left-3 right-3 z-[1000]">
              <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">
                      {selectedRouteInfo.type ? selectedRouteInfo.type.toUpperCase() : 'TRATTO SELEZIONATO'} • DIFFICOLTÀ: {selectedRouteInfo.difficulty ? selectedRouteInfo.difficulty.toUpperCase() : 'MEDIA'}
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedRouteInfo.name || searchTitle}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lunghezza: {selectedRouteInfo.lengthKm} km • Curve: {selectedRouteInfo.curvesCount || 12}
                    </p>
                  </div>
                  <span className="bg-slate-800 text-amber-400 font-mono text-xs px-2.5 py-1 rounded-xl border border-amber-400/20 font-bold">
                    KOM: 4:12.80
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[11px] font-bold text-slate-300">TRACCIATO EVIDENZIATO</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('live')} 
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> GUIDA QUI
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 p-5 rounded-3xl border border-slate-800 shadow-2xl">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Dashboard Pilota</span>
              <h2 className="text-lg font-bold text-white mt-1">Pronto per il prossimo settore?</h2>
              <button 
                onClick={() => setActiveTab('live')} 
                className="mt-4 w-full py-3 bg-red-600 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
              >
                <Play className="w-4 h-4 fill-current" /> AVVIA SESSIONE LIVE
              </button>
            </div>
          </div>
        )}

        {/* TELEMETRIA LIVE GPS */}
        {activeTab === 'live' && (
          <div className="p-4 space-y-6 text-center py-6">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {isRecording ? 'Sessione In Corso' : 'Pronto al Via'}
              </span>
            </div>

            <div className="relative w-56 h-56 mx-auto bg-slate-900 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center shadow-2xl">
              <Gauge className="w-6 h-6 text-red-500 mb-1" />
              <span className="text-6xl font-black text-white font-mono tracking-tighter">{speed}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">KM/H</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 max-w-xs mx-auto flex justify-around">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tempo</span>
                <span className="text-2xl font-black text-white font-mono">{formatTime(elapsedTime)}</span>
              </div>
            </div>

            {!isRecording ? (
              <button
                onClick={() => setIsRecording(true)}
                className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-white text-base tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30"
              >
                <Play className="w-5 h-5 fill-current" /> AVVIA TRACCIAMENTO
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(false)}
                className="w-full py-4 bg-slate-800 border border-slate-700 rounded-2xl font-black text-red-500 text-base tracking-wider flex items-center justify-center gap-2 shadow-xl"
              >
                <Square className="w-5 h-5 fill-current" /> FERMA SESSIONE
              </button>
            )}
          </div>
        )}

        {/* CLASSIFICA */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Classifica Leaderboard
            </h2>
          </div>
        )}

        {/* FEED */}
        {activeTab === 'feed' && (
          <div className="p-4 space-y-4">
            <h2 className="text-base font-bold text-white">Feed Attività</h2>
          </div>
        )}

      </main>

      {/* NAVBAR STRAVA-STYLE IN BASSO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {[
            { id: 'home', label: 'Home', icon: Flame },
            { id: 'map', label: 'Mappe', icon: MapIcon },
            { id: 'live', label: 'GPS', icon: Navigation, isCentral: true },
            { id: 'leaderboard', label: 'Classifica', icon: Trophy },
            { id: 'feed', label: 'Feed', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isCentral) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="-mt-5 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 border-2 border-slate-950 active:scale-95 transition-transform"
                >
                  <Navigation className="w-5 h-5 text-white fill-current" />
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${isActive ? 'text-red-500' : 'text-slate-500'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
