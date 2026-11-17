import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Trophy, 
  Map, 
  Navigation, 
  User, 
  Flame, 
  Zap, 
  Search, 
  Play, 
  Square, 
  Gauge, 
  ChevronRight 
} from 'lucide-react';

// Icona personalizzata per il Marker GPS
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente per centrare automaticamente la mappa al variare della posizione GPS
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userLocation, setUserLocation] = useState([45.7144, 8.2818]); // Borgosesia di default
  const [speed, setSpeed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('Borgosesia sesia');

  // Gestione GPS in tempo reale
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed: gpsSpeed } = position.coords;
          setUserLocation([latitude, longitude]);
          // Converti m/s in km/h se disponibile
          if (gpsSpeed !== null && gpsSpeed !== undefined) {
            setSpeed(Math.round(gpsSpeed * 3.6));
          }
        },
        (error) => console.log('Errore GPS:', error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Timer della sessione LIVE
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* HEADER TOP */}
      <header className="px-5 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent italic">
              APEXLAP
            </h1>
            <p className="text-[10px] text-red-500 font-extrabold tracking-widest uppercase -mt-1">
              Pure Track Telemetry
            </p>
          </div>
        </div>
        <button className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-slate-300">
          <User className="w-4 h-4" />
        </button>
      </header>

      {/* CONTENUTO PRINCIPALE IN BASE ALLA SCHEDA */}
      <main className="p-4 max-w-lg mx-auto">
        {/* HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 p-5 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <span className="text-xs font-bold text-red-500 tracking-wider uppercase">Dashboard Pilota</span>
              <h2 className="text-lg font-bold text-white mt-1">Pronto per il prossimo settore?</h2>
              <p className="text-xs text-slate-400 mt-1">Scegli una rotta sulla mappa o avvia il tracciamento GPS.</p>
              
              <button 
                onClick={() => setActiveTab('live')} 
                className="mt-4 w-full py-3 bg-red-600 hover:bg-red-500 active:scale-95 transition-all rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
              >
                <Play className="w-4 h-4 fill-current" /> AVVIA SESSIONE LIVE
              </button>
            </div>

            {/* STATISTICHE RAPIDE */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Giri Totali</span>
                <span className="text-lg font-black text-white">0</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ore Guida</span>
                <span className="text-lg font-black text-white">0.0h</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">KOM Presi</span>
                <span className="text-lg font-black text-amber-400">0</span>
              </div>
            </div>

            {/* SEZIONE TRATTI CONSIGLIATI */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tratti Consigliati vicini a te</h3>
                <button onClick={() => setActiveTab('map')} className="text-xs text-red-400 font-semibold flex items-center">
                  vedi mappa <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>

              <div 
                onClick={() => setActiveTab('map')}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase">Passo Guidato</span>
                  <h4 className="text-sm font-bold text-white">Borgosesia - Tratto panoramico</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Lunghezza: 12.4 km • Curvatura: Alta</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAPPA INTERATTIVA (100% PULITA E SENZA SCARTEGGI) */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* BARRA DI RICERCA */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca tratto o città..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* CONTENITORE MAPPA LEAFLET */}
            <div className="bg-slate-900 rounded-3xl h-[340px] w-full border border-slate-800 overflow-hidden relative z-0 shadow-xl">
              <MapContainer 
                center={userLocation} 
                zoom={13} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <ChangeView center={userLocation} />
                {/* TileLayer OpenStreetMap con stile scuro applicato via CSS */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-dark-filter"
                />
                <Marker position={userLocation} icon={customIcon}>
                  <Popup>Sei Qui</Popup>
                </Marker>
              </MapContainer>

              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-2 z-[1000]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-300">GPS LIVE ATTIVO</span>
              </div>
            </div>

            {/* CARD DETTAGLIO PERCORSO */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">Risultato Ricerca</span>
                  <h3 className="text-base font-bold text-white">{searchQuery || 'Borgosesia sesia'}</h3>
                  <p className="text-xs text-slate-400">Tratto autostradale / guidato • 12.4 km</p>
                </div>
                <span className="bg-slate-800 text-amber-400 font-mono text-xs px-2.5 py-1 rounded-xl border border-amber-400/20 font-bold">
                  KOM: 4:12.80
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Record Attuale: <strong className="text-slate-200">Marco R. (Porsche 911)</strong></span>
                <button onClick={() => setActiveTab('live')} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-red-600/20">
                  SELEZIONA & GUIDA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TELEMETRIA LIVE GPS */}
        {activeTab === 'live' && (
          <div className="space-y-6 text-center py-4">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {isRecording ? 'Sessione In Corso' : 'Pronto al Via'}
              </span>
            </div>

            {/* TACHIMETRO PRINCIPALE */}
            <div className="relative w-56 h-56 mx-auto bg-slate-900/90 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center shadow-2xl">
              <Gauge className="w-6 h-6 text-red-500 mb-1" />
              <span className="text-6xl font-black text-white font-mono tracking-tighter">{speed}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">KM/H</span>
            </div>

            {/* TIMER & CRONOMETRO */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 max-w-xs mx-auto flex justify-around">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tempo Trascorso</span>
                <span className="text-2xl font-black text-white font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="border-r border-slate-800"></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Settore Più Veloce</span>
                <span className="text-2xl font-black text-amber-400 font-mono">--:--</span>
              </div>
            </div>

            {/* PULSANTE START / STOP */}
            <div className="pt-2">
              {!isRecording ? (
                <button
                  onClick={() => setIsRecording(true)}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-white text-base tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" /> AVVIA TRACCIAMENTO
                </button>
              ) : (
                <button
                  onClick={() => setIsRecording(false)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-black text-red-500 text-base tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <Square className="w-5 h-5 fill-current" /> FERMA SESSIONE
                </button>
              )}
            </div>
          </div>
        )}

        {/* CLASSIFICA */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Classifica Leaderboard
            </h2>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 divide-y divide-slate-800">
              {[
                { rank: 1, name: 'Marco R.', car: 'Porsche 911 GT3', time: '4:12.80', kom: true },
                { rank: 2, name: 'Luca B.', car: 'BMW M3 Competition', time: '4:15.20', kom: false },
                { rank: 3, name: 'Andrea M.', car: 'Golf R', time: '4:18.90', kom: false },
              ].map((driver) => (
                <div key={driver.rank} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${driver.rank === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                      {driver.rank}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {driver.name} {driver.kom && <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                      </h4>
                      <p className="text-xs text-slate-400">{driver.car}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-200">{driver.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEED / COMMUNITY */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Feed Attività Piloti</h2>
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center py-8">
              <p className="text-xs text-slate-400">Nessuna attività recente nella tua zona.</p>
            </div>
          </div>
        )}
      </main>

      {/* NAVBAR IN BASSO A 5 SCHEDE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 px-3 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          {[
            { id: 'home', label: 'Home', icon: Flame },
            { id: 'map', label: 'Mappe', icon: Map },
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
