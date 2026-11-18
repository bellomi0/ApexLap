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
  ChevronDown,
  Check,
  X,
  Upload,
  Trash2,
  UserPlus,
  Users,
  Award,
  AlertTriangle
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

// Database iniziale di tracciati consigliati
const ROADS_DATABASE = [
  {
    id: 1,
    name: 'Misto Panoramico Extraurbano',
    type: 'extraurbano',
    difficulty: 'difficile',
    lengthKm: 14.2,
    elevationGain: '320m',
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
    name: 'Anello Urbano',
    type: 'urbano',
    difficulty: 'facile',
    lengthKm: 5.8,
    elevationGain: '45m',
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
    name: 'Autostrada Express',
    type: 'autostrada',
    difficulty: 'facile',
    lengthKm: 45.0,
    elevationGain: '10m',
    curvesCount: 3,
    coords: [
      [45.0621, 7.6601],
      [45.1500, 7.8500],
      [45.2500, 8.1000],
      [45.4654, 9.1859]
    ]
  }
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

  // SESSIONE UTENTE
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('apexlap_current_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Modali dello stato
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [selectedLapDetail, setSelectedLapDetail] = useState(null);

  // Input per Autenticazione
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [authNotice, setAuthNotice] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Garage
  const [newCarName, setNewCarName] = useState('');

  // Telemetria GPS Real-Time
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [maxGForce, setMaxGForce] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordedPath, setRecordedPath] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);

  // Filtri Mappa Strava-style
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTitle, setSearchTitle] = useState('Posizione Attuale');
  const [isSearching, setIsSearching] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [filterType, setFilterType] = useState('tutti');
  const [filterDiff, setFilterDiff] = useState('tutti');
  const [sortByLength, setSortByLength] = useState(false);
  const [selectedPolyline, setSelectedPolyline] = useState(ROADS_DATABASE[0].coords);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState(ROADS_DATABASE[0]);

  // Feed & Amici
  const [feedSubTab, setFeedSubTab] = useState('personale');
  const [searchFriendQuery, setSearchFriendQuery] = useState('');
  const [friendsList, setFriendsList] = useState([]);

  // Selettore Statistiche Home
  const [statsTimeframe, setStatsTimeframe] = useState('settimanale');

  // Storico Tempi Salvati Utente
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

  // Formula Haversine per distanza reale tra 2 punti GPS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Monitoraggio GPS
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed: gpsSpeed } = position.coords;
          const newPos = [latitude, longitude];
          setUserLocation(newPos);
          if (searchTitle === 'Posizione Attuale') setMapCenter(newPos);

          const currentKmH = gpsSpeed !== null && gpsSpeed !== undefined ? Math.round(gpsSpeed * 3.6) : 0;
          setSpeed(currentKmH);

          if (isRecording && currentKmH > 2) {
            if (currentKmH > maxSpeed) setMaxSpeed(currentKmH);
            
            const gEstimate = parseFloat((currentKmH / 35).toFixed(2));
            if (gEstimate > maxGForce) setMaxGForce(gEstimate);

            setRecordedPath((prevPath) => {
              if (prevPath.length > 0) {
                const lastPoint = prevPath[prevPath.length - 1];
                const addedDist = calculateDistance(lastPoint[0], lastPoint[1], latitude, longitude);
                if (addedDist > 0.005) {
                  setDistanceKm((prevDist) => parseFloat((prevDist + addedDist).toFixed(2)));
                  return [...prevPath, newPos];
                }
                return prevPath;
              }
              return [newPos];
            });
          }
        },
        (error) => console.log('Errore GPS:', error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 3000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isRecording, searchTitle, maxSpeed, maxGForce]);

  // Timer della Sessione
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Caricamento foto profilo dal dispositivo
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

  // Login / Registrazione con controllo Username Unico
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;

    const emailKey = emailInput.toLowerCase();
    const usernameKey = usernameInput.trim().toLowerCase();
    const usersDB = JSON.parse(localStorage.getItem('apexlap_all_users') || '{}');

    if (isRegisterMode) {
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
        alert('Credenziali errate!');
      }
    }
  };

  // Blocco Avvio Sessione LIVE senza utente o senza auto
  const handleStartRecordingClick = () => {
    if (!currentUser) {
      setAuthNotice('Registrati o accedi per avviare il tracciamento telemetrico e salvare i tempi!');
      setIsRegisterMode(true);
      setShowAuthModal(true);
      return;
    }

    if (!currentUser.activeCar || currentUser.activeCar === 'Nessuna Auto') {
      alert('ATTENZIONE: Seleziona o aggiungi un\'auto nel Garage dal Profilo per iniziare!');
      setShowProfileModal(true);
      return;
    }

    setRecordedPath([userLocation]);
    setDistanceKm(0);
    setElapsedTime(0);
    setMaxSpeed(0);
    setMaxGForce(0);
    setIsRecording(true);
    setActiveTab('live');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    if (distanceKm < 0.05 || elapsedTime < 5) {
      alert('Sessione annullata: sei rimasto fermo o la distanza percorsa è troppo breve per salvare i dati!');
      setElapsedTime(0);
      setDistanceKm(0);
      return;
    }

    if (currentUser) {
      const avgSpeedKmH = Math.round((distanceKm / (elapsedTime / 3600)));

      const newLap = {
        id: Date.now(),
        timestamp: Date.now(),
        userEmail: currentUser.email,
        userName: currentUser.username || currentUser.fullName,
        userCar: currentUser.activeCar,
        date: new Date().toLocaleDateString('it-IT'),
        timeFormatted: formatTime(elapsedTime),
        durationSeconds: elapsedTime,
        maxSpeed: maxSpeed,
        avgSpeed: avgSpeedKmH > 0 ? avgSpeedKmH : Math.round(maxSpeed * 0.6),
        gForce: maxGForce > 0 ? maxGForce : 0.85,
        kmDistance: distanceKm,
        location: searchTitle,
        pathCoords: recordedPath
      };

      const updated = [newLap, ...userLaps];
      setUserLaps(updated);
      localStorage.setItem(`apexlap_laps_${currentUser.email}`, JSON.stringify(updated));
      alert(`Sessione Salvata con Successo! Distanza: ${distanceKm} km - Vel. Media: ${newLap.avgSpeed} km/h`);
    }

    setElapsedTime(0);
    setDistanceKm(0);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowProfileModal(false);
  };

  // Gestione Garage (Aggiungi/Elimina/Attiva)
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

    const updatedUser = { ...currentUser, garage: updatedGarage, activeCar: updatedActiveCar };
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

  // Ricerca Reale con Nominatim per Mappe
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setActiveDropdown(null);
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
        
        const generatedPath = [
          newCoords,
          [lat + 0.008, lon + 0.012],
          [lat + 0.015, lon + 0.005]
        ];
        setSelectedPolyline(generatedPath);
        setSelectedRouteInfo({
          name: `${mainName} - Tratto Selezionato`,
          type: filterType !== 'tutti' ? filterType : 'extraurbano',
          difficulty: filterDiff !== 'tutti' ? filterDiff : 'media',
          lengthKm: 12.4,
          elevationGain: '180m',
          curvesCount: 16
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Aggiungi Amico per Username nel Feed
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
      alert('Questo amico è già nella tua cerchia!');
      return;
    }

    const updatedFriends = [...friendsList, { username: foundUser.username, name: foundUser.fullName, email: foundUser.email }];
    setFriendsList(updatedFriends);
    localStorage.setItem(`apexlap_friends_${currentUser.email}`, JSON.stringify(updatedFriends));
    setSearchFriendQuery('');
    alert(`Amico @${foundUser.username} aggiunto con successo!`);
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
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
  const totalKm = filteredLaps.reduce((acc, curr) => acc + parseFloat(curr.kmDistance || 0), 0).toFixed(1);
  const totalHours = (filteredLaps.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 3600).toFixed(1);

  // Raggruppamento per classifiche separate in base ai km percorsi
  const groupedLapsBySector = userLaps.reduce((acc, lap) => {
    const sectorKey = lap.kmDistance < 3 ? 'Tratti Brevi (< 3 km)' : lap.kmDistance < 10 ? 'Tratti Medi (3-10 km)' : 'Long Run (> 10 km)';
    if (!acc[sectorKey]) acc[sectorKey] = [];
    acc[sectorKey].push(lap);
    return acc;
  }, {});

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

        {currentUser ? (
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-1.5 pr-3 rounded-full border border-slate-700 transition-all"
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
            <User className="w-3.5 h-3.5" /> Accedi / Registrati
          </button>
        )}
      </header>

      {/* REPORT TELEMETRICO DETTAGLIATO (AL CLICK SUI TEMPI) */}
      {selectedLapDetail && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button onClick={() => setSelectedLapDetail(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block">Report Telemetria Giro</span>
              <h3 className="text-lg font-bold text-white">{selectedLapDetail.location}</h3>
              <p className="text-xs text-slate-400">{selectedLapDetail.userCar} • {selectedLapDetail.date}</p>
            </div>

            {/* MAPPA DELLA TRACCIA PERCORSA */}
            <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
              <MapContainer 
                center={selectedLapDetail.pathCoords && selectedLapDetail.pathCoords.length > 0 ? selectedLapDetail.pathCoords[0] : userLocation} 
                zoom={14} 
                zoomControl={false} 
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-dark-filter" />
                {selectedLapDetail.pathCoords && (
                  <Polyline positions={selectedLapDetail.pathCoords} color="#ef4444" weight={5} opacity={0.9} />
                )}
              </MapContainer>
            </div>

            {/* DATO TELEMETRICO COMPLETO */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Tempo</span>
                <span className="text-sm font-black text-amber-400 font-mono">{selectedLapDetail.timeFormatted}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Vel. Media</span>
                <span className="text-sm font-black text-white font-mono">{selectedLapDetail.avgSpeed || 48} km/h</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Forza G Max</span>
                <span className="text-sm font-black text-red-500 font-mono">{selectedLapDetail.gForce || 0.85} G</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Distanza Reale Percorsa:</span>
              <span className="font-bold text-white font-mono">{selectedLapDetail.kmDistance} km</span>
            </div>

          </div>
        </div>
      )}

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
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white text-xs uppercase tracking-wider mt-2 shadow-lg shadow-red-600/30"
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

            <div className="text-center space-y-2">
              <div className="relative inline-block">
                {renderAvatarImage(currentUser.avatarUrl, "w-20 h-20 border-2 border-red-500 shadow-xl mx-auto")}
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

            {/* SELEZIONE E ELIMINAZIONE AUTO IN GARAGE */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-red-500" /> Garage Attivo
                </h4>
                <button 
                  onClick={() => setShowAddCarModal(true)}
                  className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Aggiungi Auto
                </button>
              </div>

              {(currentUser.garage || []).length === 0 ? (
                <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-xl text-center space-y-1">
                  <AlertTriangle className="w-4 h-4 text-red-400 mx-auto" />
                  <p className="text-[11px] text-red-300 font-bold">Nessun veicolo nel garage!</p>
                  <p className="text-[10px] text-slate-400">Aggiungi un'auto per sbloccare la telemetria GPS LIVE.</p>
                </div>
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
              className="w-full py-3 bg-slate-800 hover:bg-red-950/60 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
            >
              <LogOut className="w-4 h-4" /> DISCONNETTI
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
                placeholder="Nome veicolo (es. Golf R, Puma...)"
                value={newCarName}
                onChange={(e) => setNewCarName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddCarModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Annulla
                </button>
                <button type="submit" className="w-1/2 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md">
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
                <span className="text-xs font-bold text-red-500 tracking-wider uppercase">Dashboard Telemetria</span>
              </div>
              <h2 className="text-xl font-bold text-white">Pronto per il prossimo settore?</h2>
              <p className="text-xs text-slate-400 mt-1">Avvia il GPS dal vivo per registrare percorso, forza G e velocità reali.</p>
              
              <button 
                onClick={handleStartRecordingClick} 
                className="mt-4 w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 transition-all rounded-2xl font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-current" /> AVVIA SESSIONE LIVE
              </button>
            </div>

            {/* CONTATORI ATTIVITÀ UTENTE */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">La Tua Attività Reale</h3>
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
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">KM Reali</span>
                  <span className="text-xl font-black text-white font-mono">{totalKm} km</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Ore Guida</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{totalHours}h</span>
                </div>
              </div>
            </div>

            {/* EVENTI */}
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

            {/* TRATTI CONSIGLIATI */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tratti Consigliati</h3>
                <button onClick={() => setActiveTab('map')} className="text-xs text-red-400 font-semibold flex items-center">
                  vedi mappa <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {ROADS_DATABASE.map((road) => (
                <div 
                  key={road.id}
                  onClick={() => {
                    setSelectedRouteInfo(road);
                    setSelectedPolyline(road.coords);
                    setMapCenter(road.coords[0]);
                    setActiveTab('map');
                  }}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      {road.type} • {road.difficulty}
                    </span>
                    <h4 className="text-sm font-bold text-white">{road.name}</h4>
                    <p className="text-xs text-slate-400">
                      Lunghezza: {road.lengthKm} km • Dislivello: {road.elevationGain}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
                    <MapIcon className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 2. MAPPA CON FILTRI A TENDINA COMPLETI */}
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

            {/* BARRA E FILTRI A TENDINA */}
            <div className="absolute top-3 left-3 right-3 z-[1000] space-y-2">
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

              {/* BARRA FILTRI STRAVA-STYLE */}
              <div className="relative">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  
                  <button 
                    onClick={() => toggleDropdown('percorsi')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap backdrop-blur-md shadow-md transition-all ${filterType !== 'tutti' ? 'bg-red-600 text-white' : 'bg-slate-900/90 border border-slate-700 text-slate-200'}`}
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" /> 
                    {filterType === 'tutti' ? 'Percorsi' : filterType.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>

                  <button 
                    onClick={() => {
                      setSortByLength(!sortByLength);
                      setActiveDropdown(null);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-md shadow-md transition-all ${sortByLength ? 'bg-red-600 text-white font-bold' : 'bg-slate-900/90 border border-slate-700 text-slate-200'}`}
                  >
                    Lunghezza {sortByLength ? '(Max ➔ Min)' : ''}
                  </button>

                  <button 
                    onClick={() => toggleDropdown('difficolta')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap backdrop-blur-md shadow-md transition-all ${filterDiff !== 'tutti' ? 'bg-red-600 text-white' : 'bg-slate-900/90 border border-slate-700 text-slate-200'}`}
                  >
                    {filterDiff === 'tutti' ? 'Difficoltà' : filterDiff.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>

                </div>

                {/* TENDINA PERCORSI */}
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

                {/* TENDINA DIFFICOLTÀ */}
                {activeDropdown === 'difficolta' && (
                  <div className="absolute left-32 top-10 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 w-52 shadow-2xl backdrop-blur-xl z-[1100] space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 px-3 py-1 block uppercase">Grado Curvatura</span>
                    {[
                      { id: 'tutti', label: 'Tutte le difficoltà' },
                      { id: 'facile', label: 'Facile (Poche curve)' },
                      { id: 'media', label: 'Media (Misto Guidato)' },
                      { id: 'difficile', label: 'Difficile (Molte curve)' }
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

            <button 
              onClick={() => { setMapCenter(userLocation); setMapZoom(14); setSearchTitle('Posizione Attuale'); }}
              className="absolute right-4 top-32 z-[1000] w-10 h-10 bg-slate-900/90 border border-slate-700 rounded-full flex items-center justify-center shadow-xl text-slate-200"
            >
              <Crosshair className="w-5 h-5 text-red-500" />
            </button>
          </div>
        )}

        {/* 3. TELEMETRIA LIVE GPS REAL-TIME */}
        {activeTab === 'live' && (
          <div className="p-4 space-y-6 text-center py-6">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {isRecording ? `${currentUser?.username} @ ${currentUser?.activeCar}` : 'Pronto al Via'}
              </span>
            </div>

            <div className="relative w-60 h-60 mx-auto bg-slate-900/90 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center shadow-2xl">
              <Gauge className="w-6 h-6 text-red-500 mb-1" />
              <span className="text-7xl font-black text-white font-mono tracking-tighter">{speed}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">KM/H REAL-TIME</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 max-w-sm mx-auto grid grid-cols-3 gap-2 text-center">
              <div className="border-r border-slate-800 pr-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Tempo</span>
                <span className="text-lg font-black text-white font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="border-r border-slate-800 pr-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Distanza</span>
                <span className="text-lg font-black text-white font-mono">{distanceKm} km</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Forza G</span>
                <span className="text-lg font-black text-red-500 font-mono">{maxGForce} G</span>
              </div>
            </div>

            <div>
              {!isRecording ? (
                <button
                  onClick={handleStartRecordingClick}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-white text-base tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-600/30"
                >
                  <Play className="w-5 h-5 fill-current" /> AVVIA TRACCIAMENTO GPS
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-full py-4 bg-slate-800 border border-slate-700 rounded-2xl font-black text-red-500 text-base tracking-wider flex items-center justify-center gap-2 shadow-xl"
                >
                  <Square className="w-5 h-5 fill-current" /> SALVA SESSIONE REALE
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. CLASSIFICHE DIVISE PER CHILOMETRAGGIO/SETTORE */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Classifiche per Settore Reale
            </h2>

            {userLaps.length === 0 ? (
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-300 font-bold">Nessun giro registrato</p>
                <p className="text-[11px] text-slate-500">Avvia il GPS e percorri un tratto per entrare in classifica!</p>
              </div>
            ) : (
              Object.keys(groupedLapsBySector).map((sectorName) => (
                <div key={sectorName} className="space-y-2">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider block px-1">
                    {sectorName}
                  </span>
                  
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 divide-y divide-slate-800 shadow-xl overflow-hidden">
                    {groupedLapsBySector[sectorName]
                      .sort((a, b) => a.durationSeconds - b.durationSeconds)
                      .map((lap, idx) => (
                        <div 
                          key={lap.id} 
                          onClick={() => setSelectedLapDetail(lap)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-white">@{lap.userName}</h4>
                              <p className="text-xs text-slate-400">{lap.userCar} • {lap.kmDistance} km</p>
                            </div>
                          </div>
                          <span className="font-mono text-sm font-bold text-amber-400">{lap.timeFormatted}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 5. FEED: CERCHIA AMICI & TORNEI */}
        {activeTab === 'feed' && (
          <div className="p-4 space-y-4">
            
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

            {feedSubTab === 'personale' && (
              <div className="space-y-4">
                
                {/* RICERCA E AGGIUNTA AMICO */}
                <form onSubmit={handleAddFriend} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Cerca Amico per Username</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Username dell'amico..."
                      value={searchFriendQuery}
                      onChange={(e) => setSearchFriendQuery(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <button type="submit" className="px-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> Aggiungi
                    </button>
                  </div>
                </form>

                {/* LISTA AMICI */}
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

                {/* REGISTRO ATTIVITÀ CLICCABILE */}
                <div className="space-y-3">
                  {userLaps.length === 0 ? (
                    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Nessuna attività registrata per il tuo account.</p>
                    </div>
                  ) : (
                    userLaps.map((lap) => (
                      <div 
                        key={lap.id} 
                        onClick={() => setSelectedLapDetail(lap)}
                        className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-2 cursor-pointer hover:border-slate-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white">@{lap.userName} ({lap.userCar})</span>
                          <span className="text-[10px] text-slate-500">{lap.date}</span>
                        </div>
                        <p className="text-xs text-slate-300">Ha completato un percorso di {lap.kmDistance} km.</p>
                        <div className="flex justify-between items-center text-[10px] text-red-400 font-semibold pt-1">
                          <span>Tempo: {lap.timeFormatted}</span>
                          <span>Vel. Media: {lap.avgSpeed || 48} km/h</span>
                          <span className="text-amber-400 font-bold">Vedi Report ➔</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {feedSubTab === 'gruppi' && (
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-red-500" /> Torneo Prova a Tempo
                    </h3>
                    <span className="bg-red-600/20 text-red-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-red-500/30">
                      IN CORSO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Gara a tempo sui percorsi liberi. Realizza il miglior tempo della settimana!</p>
                  
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
