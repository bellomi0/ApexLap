import React, { useState, useEffect } from 'react';
import { 
  Play, Square, Navigation, Award, Users, Zap, Gauge, 
  MapPin, Timer, Compass, ShieldAlert, Trophy, Home as HomeIcon, Map as MapIcon, User, Search, ChevronRight
} from 'lucide-react';

// Importazioni di Leaflet per la Mappa Reale Interattiva
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Icona personalizzata per il marker GPS sulla mappa
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Componente per ricentrare la mappa quando cambia la posizione GPS o la ricerca
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isTracking, setIsTracking] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('Borgosesia');
  
  // Coordinate predefinite (es. Borgosesia: 45.718, 8.277)
  const [userLocation, setUserLocation] = useState([45.718, 8.277]);
  const [gpsActive, setGpsActive] = useState(false);

  // Lettura GPS Reale del dispositivo
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setGpsActive(true);
        },
        (err) => console.log("Errore GPS o permessi negati, uso posizione standard", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Tracking velocita durante la sessione
  useEffect(() => {
    let watchId = null;
    let interval = null;

    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const rawSpeed = position.coords.speed;
            const kmh = rawSpeed ? Math.round(rawSpeed * 3.6) : 0;
            setSpeed(kmh);
            setUserLocation([position.coords.latitude, position.coords.longitude]);
          },
          (error) => console.error("Errore GPS:", error),
          { enableHighAccuracy: true }
        );
      }
    } else {
      setSpeed(0);
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 text-slate-100 border-x border-slate-800 font-sans select-none">
      
      {/* Header Top Bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-600 rounded-xl text-white font-black shadow-lg shadow-red-600/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-black text-xl leading-none tracking-wider text-white">APEXLAP</h1>
            <span className="text-[10px] font-extrabold text-red-500 tracking-widest uppercase">Pure Track Telemetry</span>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('profile')}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
        >
          <User className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 p-5 rounded-3xl border border-red-900/40 relative overflow-hidden">
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Dashboard Pilota</span>
              <h2 className="text-xl font-black text-white mt-1">Pronto per il prossimo settore?</h2>
              <p className="text-xs text-slate-400 mt-1">Scegli una rotta sulla mappa o avvia il tracciamento GPS.</p>
              
              <button 
                onClick={() => setActiveTab('live')}
                className="mt-4 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-red-950/60 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> AVVIA SESSIONE LIVE
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Giri Totali</div>
                <div className="text-lg font-black font-mono text-slate-100 mt-0.5">0</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Ore Guida</div>
                <div className="text-lg font-black font-mono text-slate-100 mt-0.5">0.0h</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">KOM presi</div>
                <div className="text-lg font-black font-mono text-amber-400 mt-0.5">0 🏆</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Tratti Consigliati vicini a te</h3>
                <button onClick={() => setActiveTab('maps')} className="text-xs text-red-400 font-bold flex items-center">
                  Vedi Mappa <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div 
                onClick={() => setActiveTab('maps')}
                className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer flex justify-between items-center transition-all"
              >
                <div>
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Passo Guidato</span>
                  <h4 className="font-bold text-sm text-white">Borgosesia - Tratto panoramico</h4>
                  <p className="text-xs text-slate-400">Lunghezza: 12.4 km • Curvatura: Alta</p>
                </div>
                <MapIcon className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MAPPE INTERATTIVE */}
        {activeTab === 'maps' && (
          <div className="space-y-4">
            
            {/* Barra di Ricerca Mappe */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca tratto o località (es. Borgosesia)..."
                className="w-full bg-slate-900 text-sm font-semibold pl-11 pr-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Mappa Reale Interattiva con Leaflet */}
            <div className="bg-slate-900 rounded-3xl h-64 border border-slate-800 overflow-hidden relative shadow-inner">
              <MapContainer 
                center={userLocation} 
                zoom={13} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <ChangeView center={userLocation} />
                {/* TileLayer Mappa Tema Dark Racing */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={userLocation} icon={customIcon}>
                  <Popup>
                    <span className="font-bold text-xs">Sei Qui (Posizione GPS)</span>
                  </Popup>
                </Marker>
              </MapContainer>

              <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full border border-slate-800 flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {gpsActive ? "GPS LIVE ATTIVO" : "CERCA POSIZIONE..."}
              </div>
            </div>

            {/* Scheda Risultato della Ricerca */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest">RISULTATO RICERCA</span>
                  <h3 className="font-bold text-slate-100 text-base">{searchQuery || 'Borgosesia'}</h3>
                  <span className="text-xs text-slate-400">Tratto autostradale / guidato • 12.4 km</span>
                </div>
                <span className="text-xs font-mono font-bold bg-red-950/40 text-red-400 border border-red-900/40 px-2.5 py-1 rounded-lg">
                  KOM: 4:12.80
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Record Attuale: <strong className="text-amber-400">Marco R. (Porsche 911)</strong></span>
                <button 
                  onClick={() => setActiveTab('live')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-950/50"
                >
                  SELEZIONA & GUIDA
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LIVE GPS */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-red-500" /> Speed (KM/H)
              </div>
              
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-7xl font-black tracking-tighter font-mono text-white drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  {speed}
                </span>
                <span className="text-slate-500 font-extrabold text-sm">KM/H</span>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-center">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-red-500" /> Sector Time
                  </div>
                  <div className="text-2xl font-black font-mono text-red-500 mt-0.5">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
                
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-sky-400" /> Lat G-Force
                  </div>
                  <div className="text-2xl font-black font-mono text-sky-400 mt-0.5">
                    0.00 G
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`w-full py-4.5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-xl ${
                isTracking
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/60 active:scale-95'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/60 active:scale-95'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-6 h-6 fill-current" /> STOP RECORDING
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" /> START LAP RECORDING
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 4: CLASSIFICA */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <h2 className="font-extrabold text-base flex items-center gap-2 text-white uppercase tracking-wide">
              <Trophy className="w-5 h-5 text-amber-500" /> Classifica Tratti
            </h2>
            <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-sm">
              Nessun tempo registrato ancora.
              <br />
              Fai il tuo primo giro per registrare il record!
            </div>
          </div>
        )}

        {/* TAB 5: FEED */}
        {activeTab === 'social' && (
          <div className="space-y-3">
            <h2 className="font-extrabold text-base flex items-center gap-2 text-white uppercase tracking-wide">
              <Users className="w-5 h-5 text-red-500" /> Drivers Feed
            </h2>
            <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-sm">
              Nessun'attività recente degli amici.
            </div>
          </div>
        )}

        {/* SCHEDA UTENTE */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-center space-y-3">
              <div className="w-20 h-20 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/40">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Profilo Pilota</h2>
                <span className="text-xs text-slate-400">Membro ApexLap</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="grid grid-cols-5 border-t border-slate-800/80 bg-slate-900 px-1 py-2 items-center">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1.5 text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'home' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HomeIcon className="w-5 h-5 mb-0.5" /> Home
        </button>

        <button
          onClick={() => setActiveTab('maps')}
          className={`flex flex-col items-center py-1.5 text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'maps' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-5 h-5 mb-0.5" /> Mappe
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center justify-center -mt-5 py-2 px-1 rounded-full transition-all ${
            activeTab === 'live' 
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-105' 
              : 'bg-slate-800 text-red-500 border border-slate-700'
          }`}
        >
          <Navigation className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center py-1.5 text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'leaderboard' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" /> Classifica
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex flex-col items-center py-1.5 text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'social' ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" /> Feed
        </button>
      </nav>

    </div>
  );
}