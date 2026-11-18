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
  LogOut,
  Car,
  Activity,
  Plus,
  CheckCircle2,
  Calendar,
  ChevronRight,
  X,
  Upload,
  Trash2,
  UserPlus,
  Users,
  Award,
  Lock
} from 'lucide-react';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const PRESET_AVATARS = [
  { id: 'helmet', name: 'Casco', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=150&auto=format&fit=crop&q=80' },
  { id: 'car', name: 'Auto', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=150&auto=format&fit=crop&q=80' }
];

function ControllerMappa({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userLocation, setUserLocation] = useState([45.0621, 7.6601]);
  const [mapCenter, setMapCenter] = useState([45.0621, 7.6601]);
  const [mapZoom, setMapZoom] = useState(13);

  // SESSIONE UTENTE (Può essere null se non ancora registrato)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('apexlap_current_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Modal Auth & Profilo
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [authNotice, setAuthNotice] = useState('');

  // Form Inputs Auth
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Garage
  const [newCarName, setNewCarName] = useState('');
  const [showAddCarModal, setShowAddCarModal] = useState(false);

  // Feed Tab (personale vs gruppi/tornei)
  const [feedSubTab, setFeedSubTab] = useState('personale');
  const [searchFriendQuery, setSearchFriendQuery] = useState('');
  const [friendsList, setFriendsList] = useState([]);

  // Telemetria GPS Live
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Statistiche & Mappa
  const [statsTimeframe, setStatsTimeframe] = useState('settimanale');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTitle, setSearchTitle] = useState('Posizione Attuale');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPolyline, setSelectedPolyline] = useState(null);

  // Storico Giri Utente
  const [userLaps, setUserLaps] = useState(() => {
    if (!currentUser) return [];
    const saved = localStorage.getItem(`apexlap_laps_${currentUser.email}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('apexlap_current_session', JSON.stringify(currentUser));
      const savedLaps = localStorage.getItem(`apexlap_laps_${currentUser.email}`);
      setUserLaps(savedLaps ? JSON.parse(savedLaps) : []);
      
      const savedFriends = localStorage.getItem(`apexlap_friends_${currentUser.email}`);
      setFriendsList(savedFriends ? JSON.parse(savedFriends) : []);
    } else {
      localStorage.removeItem('apexlap_current_session');
      setUserLaps([]);
      setFriendsList([]);
    }
  }, [currentUser]);

  // GPS Live
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed: gpsSpeed } = position.coords;
          const newPos = [latitude, longitude];
          setUserLocation(newPos);
          if (searchTitle === 'Posizione Attuale') setMapCenter(newPos);

          if (gpsSpeed !== null && gpsSpeed !== undefined) {
            const currentKmH = Math.round(gpsSpeed * 3.6);
            setSpeed(currentKmH);
            if (currentKmH > maxSpeed) setMaxSpeed(currentKmH);
          }
        },
        (error) => console.log('Errore GPS:', error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [searchTitle, maxSpeed]);

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

  // Caricamento foto dal dispositivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrlInput(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modifica Foto Profilo ad account già esistente
  const handleUpdateAvatarInProfile = (e) => {
    const file = e.target.files[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUser = { ...currentUser, avatarUrl: reader.result };
        setCurrentUser(updatedUser);

        const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');
        if (usersDB[currentUser.email]) {
          usersDB[currentUser.email].avatarUrl = reader.result;
          localStorage.setItem('apexlap_all_users', JSON.stringify(usersDB));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Login / Registrazione con Controllo Username Unico
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;

    const emailKey = emailInput.toLowerCase();
    const usernameKey = usernameInput.trim().toLowerCase();
    const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');

    if (isRegisterMode) {
      // Controllo se l'username è già stato preso
      const usernameExists = Object.values(usersDB).some(
        (user) => user.username && user.username.toLowerCase() === usernameKey
      );

      if (usernameExists) {
        alert('Questo username è già in uso! Scegline un altro.');
        return;
      }

      const newUser = {
        email: emailKey,
        fullName: fullNameInput || 'Nome Cognome',
        username: usernameInput || 'Pilota',
        avatarUrl: avatarUrlInput,
        garage: [],
        activeCar: 'Nessuna Auto',
        joinedAt: new Date().toLocaleDateString('it-IT')
      };
      
      usersDB[emailKey] = { ...newUser, password: passwordInput };
      localStorage.setItem('apexlap_all_users', JSON.stringify(usersDB));
      setCurrentUser(newUser);
      setShowAuthModal(false);
      setAuthNotice('');
    } else {
      const found = usersDB[emailKey];
      if (found && found.password === passwordInput) {
        setCurrentUser(found);
        setShowAuthModal(false);
        setAuthNotice('');
      } else {
        alert('Credenziali errate o utente non trovato!');
      }
    }
  };

  // Avvio Sessione LIVE (Richiede registrazione se non loggato)
  const handleStartRecordingClick = () => {
    if (!currentUser) {
      setAuthNotice('Devi registrarti o accedere per avviare la telemetria GPS e salvare i tuoi tempi!');
      setIsRegisterMode(true);
      setShowAuthModal(true);
      return;
    }
    setIsRecording(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmailInput('');
    setPasswordInput('');
    setShowProfileModal(false);
  };

  // Gestione Garage: Aggiungi & Elimina
  const handleAddCar = (e) => {
    e.preventDefault();
    if (!newCarName.trim() || !currentUser) return;

    const updatedGarage = [...(currentUser.garage || []), newCarName.trim()];
    const updatedUser = { 
      ...currentUser, 
      garage: updatedGarage,
      activeCar: currentUser.activeCar === 'Nessuna Auto' ? newCarName.trim() : currentUser.activeCar
    };

    setCurrentUser(updatedUser);
    
    const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');
    if (usersDB[currentUser.email]) {
      usersDB[currentUser.email] = { ...usersDB[currentUser.email], ...updatedUser };
      localStorage.setItem('apexlap_all_users', JSON.stringify(usersDB));
    }

    setNewCarName('');
    setShowAddCarModal(false);
  };

  const handleDeleteCar = (carToDelete) => {
    if (!currentUser) return;

    const updatedGarage = (currentUser.garage || []).filter(c => c !== carToDelete);
    const updatedActiveCar = currentUser.activeCar === carToDelete 
      ? (updatedGarage[0] || 'Nessuna Auto') 
      : currentUser.activeCar;

    const updatedUser = { 
      ...currentUser, 
      garage: updatedGarage,
      activeCar: updatedActiveCar
    };

    setCurrentUser(updatedUser);
    
    const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');
    if (usersDB[currentUser.email]) {
      usersDB[currentUser.email] = { ...usersDB[currentUser.email], ...updatedUser };
      localStorage.setItem('apexlap_all_users', JSON.stringify(usersDB));
    }
  };

  const handleSelectActiveCar = (carName) => {
    const updatedUser = { ...currentUser, activeCar: carName };
    setCurrentUser(updatedUser);

    const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');
    if (usersDB[currentUser.email]) {
      usersDB[currentUser.email] = { ...usersDB[currentUser.email], activeCar: carName };
      localStorage.setItem('apexlap_all_users', JSON.stringify(usersDB));
    }
  };

  // Ricerca e Aggiungi Amico per Username
  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!searchFriendQuery.trim() || !currentUser) return;

    const targetUser = searchFriendQuery.trim().toLowerCase();
    const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');
    
    const foundUser = Object.values(usersDB).find(
      u => u.username && u.username.toLowerCase() === targetUser
    );

    if (!foundUser) {
      alert('Nessun utente trovato con questo username!');
      return;
    }

    if (foundUser.email === currentUser.email) {
      alert('Non puoi aggiungere te stesso!');
      return;
    }

    if (friendsList.some(f => f.email === foundUser.email)) {
      alert('Questo amico è già nella tua lista!');
      return;
    }

    const updatedFriends = [...friendsList, { username: foundUser.username, name: foundUser.fullName, email: foundUser.email }];
    setFriendsList(updatedFriends);
    localStorage.setItem(`apexlap_friends_${currentUser.email}`, JSON.stringify(updatedFriends));
    setSearchFriendQuery('');
    alert(`Amico @${foundUser.username} aggiunto alla tua cerchia!`);
  };

  // Salva Sessione
  const handleStopRecording = () => {
    setIsRecording(false);
    if (elapsedTime > 3 && currentUser) {
      const newLap = {
        id: Date.now(),
        timestamp: Date.now(),
        userEmail: currentUser.email,
        userName: currentUser.username || currentUser.fullName,
        userCar: currentUser.activeCar || 'Auto Generica',
        date: new Date().toLocaleDateString('it-IT'),
        timeFormatted: formatTime(elapsedTime),
        durationSeconds: elapsedTime,
        maxSpeed: maxSpeed,
        estimatedKm: ((maxSpeed > 0 ? maxSpeed : 45) * (elapsedTime / 3600)).toFixed(1),
        location: searchTitle
      };
      
      const updated = [newLap, ...userLaps];
      setUserLaps(updated);
      localStorage.setItem(`apexlap_laps_${currentUser.email}`, JSON.stringify(updated));
      alert(`Giro registrato nel tuo database! Tempo: ${formatTime(elapsedTime)}`);
    }
    setElapsedTime(0);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const newCoords = [lat, lon];
        setMapCenter(newCoords);
        setMapZoom(14);
        const mainName = data[0].display_name.split(',')[0];
        setSearchTitle(mainName);
        setSelectedPolyline([newCoords, [lat + 0.008, lon + 0.012]]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFilteredLaps = () => {
    const now = Date.now();
    const oneDay = 86400000;
    if (statsTimeframe === 'giornaliero') {
      return userLaps.filter(l => (now - l.timestamp) <= oneDay);
    } else if (statsTimeframe === 'settimanale') {
      return userLaps.filter(l => (now - l.timestamp) <= oneDay * 7);
    } else {
      return userLaps.filter(l => (now - l.timestamp) <= oneDay * 30);
    }
  };

  const filteredLaps = getFilteredLaps();
  const totalKm = filteredLaps.reduce((acc, curr) => acc + parseFloat(curr.estimatedKm || 0), 0).toFixed(1);
  const totalHours = (filteredLaps.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 3600).toFixed(1);

  const renderAvatarImage = (url, sizeClasses = "w-8 h-8") => {
    if (url) {
      return <img src={url} alt="Avatar" className={`${sizeClasses} rounded-full object-cover border border-slate-700`} />;
    }
    return (
      <div className={`${sizeClasses} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300`}>
        <User className="w-[60%] h-[60%]" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 select-none">
      
      {/* HEADER TOP */}
      <header className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent italic">
              APEXLAP
            </h1>
          </div>
        </div>

        {/* PULSANTE PROFILO O ACCESSO */}
        {currentUser ? (
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-1.5 pr-3 rounded-full border border-slate-700 transition-all active:scale-95"
          >
            {renderAvatarImage(currentUser.avatarUrl, "w-6 h-6")}
            <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
              @{currentUser.username}
            </span>
          </button>
        ) : (
          <button
            onClick={() => { setAuthNotice(''); setIsRegisterMode(true); setShowAuthModal(true); }}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" /> Registrati
          </button>
        )}
      </header>

      {/* MODAL REGISTRAZIONE / ACCESSO */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[2500] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative">
            
            <button onClick={() => setShowAuthModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-600/40 mb-2">
                <Zap className="w-7 h-7 text-white fill-current" />
              </div>
              <h1 className="text-xl font-black italic bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                APEXLAP
              </h1>
              {authNotice && (
                <p className="text-xs font-bold text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-500/30">
                  {authNotice}
                </p>
              )}
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome e Cognome</label>
                    <input
                      type="text"
                      placeholder="Es. Nome Cognome"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Username Unico (per gli amici)</label>
                    <input
                      type="text"
                      placeholder="Es. Pilota01"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>

                  {/* FOTO PROFILO OPZIONALE */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Foto Profilo (Opzionale)</label>
                    <label className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-2 cursor-pointer text-xs text-slate-300">
                      <Upload className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[11px] font-semibold">Scegli dal dispositivo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="utente@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 uppercase tracking-wider mt-2"
              >
                {isRegisterMode ? 'CREA ACCOUNT' : 'ACCEDI'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-slate-400 hover:text-red-400 underline font-semibold"
              >
                {isRegisterMode ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati ora'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PROFILO & GARAGE */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button onClick={() => setShowProfileModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {/* FOTO E INFO */}
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                {renderAvatarImage(currentUser.avatarUrl, "w-20 h-20 border-2 border-red-500 shadow-xl mx-auto")}
                
                {/* CAMBIA FOTO PROFILO */}
                <label className="absolute bottom-0 right-0 bg-red-600 text-white p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-red-500">
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleUpdateAvatarInProfile} className="hidden" />
                </label>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{currentUser.fullName}</h3>
                <p className="text-xs text-slate-400">@{currentUser.username}</p>
                <span className="text-[10px] text-slate-500 block mt-0.5">{currentUser.email}</span>
              </div>
            </div>

            {/* GARAGE CON TASTO ELIMINA */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-red-500" /> Il Tuo Garage
                </h4>
                <button 
                  onClick={() => setShowAddCarModal(true)}
                  className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Aggiungi Auto
                </button>
              </div>

              {(currentUser.garage || []).length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-2">Nessun veicolo nel garage. Aggiungine uno!</p>
              ) : (
                <div className="space-y-1.5">
                  {(currentUser.garage || []).map((car, idx) => {
                    const isActive = currentUser.activeCar === car;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div 
                          onClick={() => handleSelectActiveCar(car)}
                          className={`flex-1 p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs ${
                            isActive 
                              ? 'bg-red-950/40 border-red-500/80 text-white font-bold' 
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>{car}</span>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                        </div>

                        {/* TASTO ELIMINA AUTO */}
                        <button
                          onClick={() => handleDeleteCar(car)}
                          className="p-2.5 bg-slate-900 hover:bg-red-950/50 hover:text-red-400 border border-slate-800 rounded-xl text-slate-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" /> DISCONNETTI ACCOUNT
            </button>

          </div>
        </div>
      )}

      {/* MODAL NUOVA AUTO */}
      {showAddCarModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[2100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Aggiungi Veicolo al Garage</h3>
            <form onSubmit={handleAddCar} className="space-y-3">
              <input 
                type="text"
                placeholder="Nome veicolo..."
                value={newCarName}
                onChange={(e) => setNewCarName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                required
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddCarModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Annulla
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTENUTO PRINCIPALE */}
      <main className="max-w-md mx-auto">

        {/* 1. HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/50 p-5 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold text-red-500 tracking-wider uppercase">Dashboard Pilota</span>
              </div>
              <h2 className="text-xl font-bold text-white">Pronto per il prossimo settore?</h2>
              <p className="text-xs text-slate-400 mt-1">Scegli una rotta sulla mappa o avvia subito la telemetria GPS dal vivo.</p>
              
              <button 
                onClick={handleStartRecordingClick} 
                className="mt-4 w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 transition-all rounded-2xl font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 tracking-wider uppercase"
              >
                <Play className="w-4 h-4 fill-current" /> AVVIA SESSIONE LIVE
              </button>
            </div>

            {/* CONTATORI ATTIVITÀ */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">La Tua Attività</h3>
                <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px]">
                  {['giornaliero', 'settimanale', 'mensile'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setStatsTimeframe(tf)}
                      className={`px-2 py-1 rounded-lg capitalize font-bold transition-colors ${statsTimeframe === tf ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Giri Totali</span>
                  <span className="text-xl font-black text-white font-mono">{filteredLaps.length}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">KM Percorsi</span>
                  <span className="text-xl font-black text-white font-mono">{totalKm} km</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Ore Guida</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{totalHours}h</span>
                </div>
              </div>
            </div>

            {/* EVENTI & TORNEI */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Eventi & Challenge</h3>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-red-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Evento della Settimana
                  </span>
                  <span className="bg-red-600/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                    ATTIVO
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Challenge Sprint Notturno</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Registra una sessione tra le 20:00 e le 02:00 su tratto extraurbano.</p>
                </div>
                <button onClick={() => setActiveTab('map')} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                  Partecipa all'Evento <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MAPPA */}
        {activeTab === 'map' && (
          <div className="relative h-[calc(100vh-125px)] w-full overflow-hidden">
            <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="h-full w-full z-0" zoomControl={false}>
              <ControllerMappa center={mapCenter} zoom={mapZoom} />
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-dark-filter" />
              {selectedPolyline && <Polyline positions={selectedPolyline} color="#ef4444" weight={6} opacity={0.9} />}
              <Marker position={userLocation} icon={customIcon}>
                <Popup>La tua posizione GPS</Popup>
              </Marker>
            </MapContainer>

            <div className="absolute top-3 left-3 right-3 z-[1000]">
              <form onSubmit={handleSearch} className="relative shadow-2xl">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca località sulla mappa..."
                  className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl pl-10 pr-20 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
                <button type="submit" disabled={isSearching} className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-red-600 hover:bg-red-500 rounded-xl text-[11px] font-bold text-white">
                  {isSearching ? '...' : 'Cerca'}
                </button>
              </form>
            </div>

            <button 
              onClick={() => { setMapCenter(userLocation); setMapZoom(14); setSearchTitle('Posizione Attuale'); }}
              className="absolute right-4 top-20 z-[1000] w-10 h-10 bg-slate-900/90 border border-slate-700 rounded-full flex items-center justify-center shadow-xl text-slate-200"
            >
              <Crosshair className="w-5 h-5 text-red-500" />
            </button>
          </div>
        )}

        {/* 3. TELEMETRIA LIVE GPS */}
        {activeTab === 'live' && (
          <div className="p-4 space-y-6 text-center py-6">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {isRecording ? `${currentUser?.username} @ ${currentUser?.activeCar || 'Auto'}` : 'Pronto al Via'}
              </span>
            </div>

            <div className="relative w-60 h-60 mx-auto bg-slate-900/90 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center shadow-2xl">
              <Gauge className="w-7 h-7 text-red-500 mb-1" />
              <span className="text-7xl font-black text-white font-mono tracking-tighter">{speed}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">KM/H REAL-TIME</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 max-w-sm mx-auto grid grid-cols-2 gap-4">
              <div className="border-r border-slate-800 pr-2">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tempo</span>
                <span className="text-2xl font-black text-white font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="pl-2">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Auto in Uso</span>
                <span className="text-xs font-bold text-amber-400 truncate block mt-2">{currentUser?.activeCar || 'Nessuna'}</span>
              </div>
            </div>

            <div>
              {!isRecording ? (
                <button
                  onClick={handleStartRecordingClick}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-white text-base tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30"
                >
                  <Play className="w-5 h-5 fill-current" /> AVVIA TRACCIAMENTO
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-full py-4 bg-slate-800 border border-slate-700 rounded-2xl font-black text-red-500 text-base tracking-wider flex items-center justify-center gap-2 shadow-xl"
                >
                  <Square className="w-5 h-5 fill-current" /> SALVA & FERMA SESSIONE
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. CLASSIFICA */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Classifica Tempi Personali
            </h2>

            {userLaps.length === 0 ? (
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-300 font-bold">Nessun tempo registrato</p>
                <p className="text-[11px] text-slate-500">Avvia una sessione LIVE per registrare i tuoi tempi!</p>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 divide-y divide-slate-800 shadow-xl overflow-hidden">
                {[...userLaps]
                  .sort((a, b) => a.durationSeconds - b.durationSeconds)
                  .map((lap, idx) => (
                    <div key={lap.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">@{lap.userName}</h4>
                          <p className="text-xs text-slate-400">{lap.userCar} • {lap.date}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-400">{lap.timeFormatted}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 5. FEED: AGGIUNGI AMICI, VISTA PERSONALE VS GRUPPI / TORNEI */}
        {activeTab === 'feed' && (
          <div className="p-4 space-y-4">
            
            {/* SUB-TABS: PERSONALE VS GRUPPI / TORNEI */}
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setFeedSubTab('personale')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${feedSubTab === 'personale' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                Personale & Trofei
              </button>
              <button
                onClick={() => setFeedSubTab('gruppi')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${feedSubTab === 'gruppi' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                Gruppi & Tornei
              </button>
            </div>

            {/* SEZIONE 1: PERSONALE & TROFEI */}
            {feedSubTab === 'personale' && (
              <div className="space-y-4">
                
                {/* BARRA PER CERCARE E AGGIUNGERE AMICI TRAMITE USERNAME */}
                <form onSubmit={handleAddFriend} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Cerca Amico per Username</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Username esatto dell'amico..."
                      value={searchFriendQuery}
                      onChange={(e) => setSearchFriendQuery(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <button type="submit" className="px-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> Aggiungi
                    </button>
                  </div>
                </form>

                {/* CERCHIA DI AMICI */}
                {friendsList.length > 0 && (
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block">La tua Cerchia Amici</span>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {friendsList.map((f, i) => (
                        <div key={i} className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 whitespace-nowrap">
                          @{f.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TROFEI E STATS PERSONALI */}
                <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> I Tuoi Trofei Personali
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Trofeo Velocità</span>
                      <span className="text-sm font-bold text-amber-400">{maxSpeed} km/h Max</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Sessioni Salvate</span>
                      <span className="text-sm font-bold text-white">{userLaps.length} Totali</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SEZIONE 2: GRUPPI & TORNEI A TEMPO */}
            {feedSubTab === 'gruppi' && (
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-red-500" /> Torneo Prova a Tempo Notturno
                    </h3>
                    <span className="bg-red-600/20 text-red-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-red-500/30">
                      IN CORSO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Gara a tempo tra i membri dei gruppi sulla tratta urbana. Chi realizza il miglior giro entro domenica vince il badge!</p>
                  
                  <button onClick={handleStartRecordingClick} className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md">
                    Partecipa Ora alla Prova a Tempo
                  </button>
                </div>
              </div>
            )}

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
