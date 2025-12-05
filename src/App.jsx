import React, { useState, useEffect, useRef } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import DiscordIcon from "./assets/discord.svg";
import ShopModal from "./ShopModal";
import Activo from "./assets/Activo.webp";
import { TebexService } from "./services/tebex";

// --- ICONOS SVG INLINE (Para evitar errores de importación) ---
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const IconDiscord = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
const IconTwitch = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2H3v18h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" /></svg>;
const IconYoutube = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>;
const IconInstagram = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" ry="5" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

// --- token Twitch
//const res = await fetch("/api/token.js");
//const token = await res.json();
//console.log(token.access_token);


const DATA_ACTIVITIES = [
  { title: "EVENTOS", desc: "Torneos PvP semanales, noches de cine y eventos gaming exclusivos en Discord." },
  { title: "GIVEAWAYS", desc: "Sorteos mensuales de Discord Nitro, videojuegos y hardware gaming." },
  { title: "COMUNIDAD", desc: "Comunidad gamer LATAM activa para encontrar tu squad gaming ideal." },
];

const DATA_EVENTS = [
  {
    id: 1,
    title: "Torneo PvP",
    description: "Compite y gana premios exclusivos en nuestro torneo mensual.",
    badge: "PRÓXIMAMENTE",
    badgeColor: "bg-purple-600",
    image: "https://images.wallpapersden.com/image/download/heist-fortnite_bGdoZWWUmZqaraWkpJRobWllrWdma2U.jpg",
    gradient: "from-purple-900/50 to-blue-900/50"
  },
  {
    id: 2,
    title: "Cine en Discord",
    description: "Noches de películas y series con la comunidad cada viernes.",
    badge: "VIERNES",
    badgeColor: "bg-blue-600",
    image: "https://preview.redd.it/81g4h40e2c471.jpg?width=640&crop=smart&auto=webp&s=e3af4e909fc4a309bbcf8fde58dfac3612ac5051",
    gradient: "from-blue-900/50 to-purple-900/50"
  },
  {
    id: 3,
    title: "Giveaways",
    description: "Sorteos de Nitro, juegos y hardware para miembros activos.",
    badge: "MENSUAL",
    badgeColor: "bg-pink-600",
    image: "https://cdn.shopify.com/s/files/1/0327/9585/2937/files/Discord---Nitro-Monthly-_INT.jpg?w=400&h=500&fit=crop",
    gradient: "from-pink-900/50 to-purple-900/50"
  },
  {
    id: 4,
    title: "LAN Party",
    description: "Conectate a conocer gente nueva y divertirte con amigos.",
    badge: "SÁBADO",
    badgeColor: "bg-yellow-600",
    image: "https://i.imgur.com/YLu2y8G.png",
    gradient: "from-yellow-900/50 to-orange-900/50"
  },
];

// --- COMPONENTES UI ---
const ButtonDiscord = ({ children, className = "" }) => {
  const handleClick = () => {
    window.open("https://discord.808.lat", "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(88,101,242,0.4)] flex items-center gap-2 ${className}`}
    >
      <IconDiscord />
      {children}
    </button>
  );
};

const FloatingParticles = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => {
        const depth = (i % 5) + 1; // 1 to 5
        const moveX = mousePos.x * 20 * depth; // Movement based on depth
        const moveY = mousePos.y * 20 * depth;

        return (
          <div
            key={i}
            className="absolute bg-purple-500/10 rounded-full blur-xl animate-pulse transition-transform duration-100 ease-out"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              animationDuration: `${Math.random() * 5 + 3}s`,
              animationDelay: `${Math.random() * 2}s`,
              transform: `translate(${moveX}px, ${moveY}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

const CopyBox = ({ label, text, subtext }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-[#130b24] border border-purple-500/30 rounded-xl backdrop-blur-sm hover:border-purple-500 hover:bg-[#1a103c] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 h-24 w-72 relative overflow-hidden flex flex-col justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

      <div className="flex justify-between items-center w-full">
        <div className="flex flex-col justify-center">
          <p className="text-purple-400 text-[10px] font-mono uppercase tracking-widest group-hover:text-purple-300 transition-colors mb-1">{label}</p>
          <p className="text-white font-mono text-lg font-bold leading-none mb-1">{text}</p>
          {subtext && <p className="text-gray-300 text-xs font-mono leading-none">{subtext}</p>}
        </div>

        <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors p-2 bg-black/20 rounded-lg border border-white/5 group-hover:border-purple-500/30">
          {copied ? <IconCheck /> : <IconCopy />}
        </button>
      </div>
    </div>
  );
};

// Helper para generar iniciales cuando no hay avatar
const getInitials = (nameOrLogin) => {
  if (!nameOrLogin) return "--";
  const s = String(nameOrLogin).trim();
  if (!s) return "--";
  const parts = s.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
};

// Componente reutilizable para tarjetas con parallax por tarjeta (mouse relativo)
const EventCard = ({ image, badge, badgeClass = 'bg-purple-600', title, desc, xMult = 10, yMult = 6, gradientClass = 'from-purple-900/50 to-blue-900/50' }) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setOffset({ x, y });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className="relative w-96 bg-[#130b24] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-2"
      style={{
        transform: `translate3d(${offset.x * xMult}px, ${offset.y * yMult}px, 0)`,
        transition: 'transform 120ms linear',
      }}
    >
      <div className={`aspect-[4/5] bg-gradient-to-br ${gradientClass} relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
          {badge && <span className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-2 ${badgeClass}`}>{badge}</span>}
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm">{desc}</p>
        </div>
      </div>
    </div>
  );
};

const TopDonorBox = () => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopDonor() {
      try {
        const fallback = { ign: "MissiFussa", total: "Unknown" };
        const data = await TebexService.getTopDonor();
        if (data) {
          setDonor(data);
        } else {
          setDonor(fallback);
        }
      } catch (e) {
        console.error(e);
        setDonor({ ign: "MissiFussa", total: "Unknown" });
      } finally {
        setLoading(false);
      }
    }
    fetchTopDonor();
  }, []);

  const username = donor?.ign || "MissiFussa";
  const skinUrl = `https://visage.surgeplay.com/bust/512/${username}`;

  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative flex items-center gap-4 bg-[#130b24] bg-gradient-to-r from-[#130b24] to-[#1e1b4b] p-3 pr-6 rounded-xl border border-purple-500/30 shadow-xl overflow-hidden h-24 w-72 hover:border-purple-500 transition-colors">
        {/* Decorative snow/ice top border effect (optional, based on image) */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-white/5 blur-md -translate-y-2"></div>

        {/* Skin Image */}
        <div className="relative w-16 h-16 shrink-0">
          <img
            src={skinUrl}
            alt="Top Donor Skin"
            className="w-full h-full object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
              <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
            </svg>
            <span className="text-[10px] font-bold text-purple-300 tracking-widest uppercase">MÁXIMO DONADOR</span>
          </div>

          <div className="font-bold text-lg text-white leading-tight">
            {username}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            Ha sido quien más donó este mes
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper para formatear tiempo relativo (ej: "hace 2 horas")
const formatRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const now = new Date();
  const past = new Date(isoDate);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  return `hace ${Math.floor(diffDays / 30)} meses`;
};


/*
  TWITCH INTEGRATION NOTES
  -------------------------
  - Recommended: implement a backend endpoint that returns a valid client credentials token.
    Example backend route: POST /api/twitch/token  -> { access_token: "..." }
    That backend will call:
      https://id.twitch.tv/oauth2/token?client_id=...&client_secret=...&grant_type=client_credentials
    using server-side SECRET (never expose client_secret in the frontend).

  - Dev shortcut: set VITE_TWITCH_TOKEN in your .env (Vite). This is acceptable for local dev only.
    Example .env:
      VITE_TWITCH_TOKEN=your_app_access_token_here
    To get such token temporarily:
    curl -X POST "https://id.twitch.tv/oauth2/token?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials"

  - This component will:
    1) if it finds a token via import.meta.env.VITE_TWITCH_TOKEN it will use it
    2) else it will attempt to GET /api/twitch/token (expected to return JSON { access_token })
    3) fetch live data from Twitch API via /api/streams
*/


const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#130b24] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <IconX />
        </button>

        <div className="p-8 md:p-12 max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold font-mono text-center mb-8">
            <span className="text-purple-500">&lt;</span> SOBRE NOSOTROS <span className="text-purple-500">/&gt;</span>
          </h2>

          <h3 className="text-2xl font-bold text-purple-400 mb-6">
            808 Activo: Más que un Clan.
          </h3>
          <p className="text-gray-300 mb-4 leading-relaxed">
            <span className="text-white font-bold">808 Activo</span> es una comunidad de gaming nacida para ofrecer un espacio de calidad para jugadores de todo el mundo. Lo que comenzó como un pequeño grupo se ha expandido hasta convertirse en un punto de encuentro robusto y estructurado. Somos el hogar de jugadores casuales y de creadores de contenido dedicados.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Nuestra misión es simple: fomentar un ambiente divertido, justo y organizado, mientras creamos experiencias únicas a través de eventos, sorteos y actividades semanales. Valoramos la lealtad, la amistad y el apoyo mutuo.
          </p>

          <h4 className="text-xl font-bold text-purple-400 mt-8 mb-4">
            Servidor de Minecraft: 808 CRAFT
          </h4>
          <p className="text-gray-400 mb-4 leading-relaxed">
            <span className="text-white font-bold">808 CRAFT</span> es nuestro servidor oficial de Minecraft, enfocado en una experiencia de Survival duradera, optimizada y profesional. Nuestro objetivo es que encuentres un lugar donde puedas construir, progresar y competir de forma segura y justa.
          </p>
          <p className="text-gray-400 mb-4 leading-relaxed">
            Cada contribución a través de nuestra tienda se reinvierte directamente en el hosting y mejoras para garantizar la mejor experiencia posible para todos.
          </p>


        </div>
      </div>
    </div>
  );
};


import ParallaxBackground from "./components/ParallaxBackground";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Twitch-related state
  const [streamers, setStreamers] = useState([]); // will be populated from API
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [twitchToken, setTwitchToken] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentStreamerIndex, setCurrentStreamerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const carouselRef = useRef(null);

  // List of streamer logins we want to monitor
  const STREAMER_LOGINS = ['MissiFussa', 'Yaqz29', 'parzival016', 'valesuki___', 'ladycherryblack'];

  // Helper: get token from env or backend
  const getToken = async () => {
    // 1) Try Vite env (dev)
    const envToken = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_TWITCH_TOKEN) ? import.meta.env.VITE_TWITCH_TOKEN : null;
    if (envToken) return envToken;

    // 2) Try backend endpoint (recommended), expects { access_token: "..." }
    try {
      const res = await fetch("/api/token");
      if (res.ok) {
        const json = await res.json();
        if (json?.access_token) return json.access_token;
      }
    } catch (e) {
      // ignore - will fallback
      console.warn("No backend token endpoint or it failed:", e);
    }

    // 3) no token available
    return null;
  };

  // Fetch server status (Minecraft)
  useEffect(() => {
    async function checkServer() {
      try {
        const res = await fetch("https://api.mcsrvstat.us/2/play.808.lat");
        const data = await res.json();

        if (data?.online) {
          setServerOnline(true);
          setOnlinePlayers(data.players?.online || 0);
        } else {
          setServerOnline(false);
          setOnlinePlayers(0);
        }
      } catch (error) {
        console.error("Error al consultar el servidor:", error);
        setServerOnline(false);
        setOnlinePlayers(0);
      }
    }

    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Twitch users + streams via server-side endpoint to avoid CORS/401 in browser
  useEffect(() => {
    let mounted = true;

    // Datos estáticos como fallback cuando la API no está disponible
    const STATIC_STREAMERS = [
      {
        id: '1',
        login: 'MissiFussa',
        name: 'MissiFussa',
        avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/c4e7c4c0-0e0a-4f0e-9c0a-0b0a0c0e0a0a-profile_image-300x300.png',
        url: 'https://twitch.tv/MissiFussa',
        status: 'offline',
        description: 'Streamer de la comunidad 808 Activo'
      },
      {
        id: '2',
        login: 'Yaqz29',
        name: 'Yaqz29',
        avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/c4e7c4c0-0e0a-4f0e-9c0a-0b0a0c0e0a0a-profile_image-300x300.png',
        url: 'https://twitch.tv/Yaqz29',
        status: 'offline',
        description: 'Streamer de la comunidad 808 Activo'
      },
      {
        id: '3',
        login: 'parzival016',
        name: 'Parzival',
        avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/c4e7c4c0-0e0a-4f0e-9c0a-0b0a0c0e0a0a-profile_image-300x300.png',
        url: 'https://twitch.tv/parzival016',
        status: 'offline',
        description: 'Streamer de la comunidad 808 Activo'
      },
      {
        id: '4',
        login: 'valesuki___',
        name: 'Valesuki',
        avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/c4e7c4c0-0e0a-4f0e-9c0a-0b0a0c0e0a0a-profile_image-300x300.png',
        url: 'https://twitch.tv/valesuki___',
        status: 'offline',
        description: 'Streamer de la comunidad 808 Activo'
      },
      {
        id: '5',
        login: 'ladycherryblack',
        name: 'LadyCherryBlack',
        avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/c4e7c4c0-0e0a-4f0e-9c0a-0b0a0c0e0a0a-profile_image-300x300.png',
        url: 'https://twitch.tv/ladycherryblack',
        status: 'offline',
        description: 'Streamer de la comunidad 808 Activo'
      }
    ];


    // Configuración de API URL (usa Vercel en producción, localhost en desarrollo)
    const API_BASE_URL = import.meta.env.PROD
      ? 'https://808-activo-web.vercel.app'  // Cambia esto por tu URL de Vercel
      : '';  // En desarrollo usa rutas relativas (localhost)

    async function fetchTwitchData() {
      setLoadingStreams(true);
      try {
        const loginsParam = STREAMER_LOGINS.join(',');
        const res = await fetch(`${API_BASE_URL}/api/streams?logins=${encodeURIComponent(loginsParam)}`);
        if (!res.ok) {
          console.warn('Server /api/streams failed:', res.status, '- Using static fallback data');
          // Usar datos estáticos como fallback
          if (mounted) {
            setStreamers(STATIC_STREAMERS);
            setCurrentStreamerIndex(0);
          }
          setLoadingStreams(false);
          return;
        }
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        if (mounted && data.length > 0) {
          setStreamers(data);
          setCurrentStreamerIndex(0);
        } else if (mounted) {
          // Si la API responde pero sin datos, usar fallback
          setStreamers(STATIC_STREAMERS);
          setCurrentStreamerIndex(0);
        }
      } catch (err) {
        console.error('Error fetching Twitch data from /api/streams:', err, '- Using static fallback data');
        // Usar datos estáticos cuando hay error de red
        if (mounted) {
          setStreamers(STATIC_STREAMERS);
          setCurrentStreamerIndex(0);
        }
      } finally {
        if (mounted) setLoadingStreams(false);
      }
    }

    fetchTwitchData();

    const interval = setInterval(fetchTwitchData, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);



  // Helper for opening channel
  const openChannel = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Event carousel navigation
  const nextEvent = () => {
    setCurrentEventIndex((prev) => (prev + 1) % DATA_EVENTS.length);
  };

  const prevEvent = () => {
    setCurrentEventIndex((prev) => (prev - 1 + DATA_EVENTS.length) % DATA_EVENTS.length);
  };



  const [isHoveringEvents, setIsHoveringEvents] = useState(false);



  // Streamer carousel navigation
  const itemsPerView = 3;

  const extendedStreamers = React.useMemo(() => {
    if (streamers.length === 0) return [];
    const clonesStart = streamers.slice(-itemsPerView);
    const clonesEnd = streamers.slice(0, itemsPerView);
    return [...clonesStart, ...streamers, ...clonesEnd];
  }, [streamers]);

  useEffect(() => {
    if (streamers.length > 0) {
      setCurrentStreamerIndex(itemsPerView);
      setIsTransitioning(false);
    }
  }, [streamers]);

  const nextStreamer = () => {
    if (streamers.length === 0) return;
    setIsTransitioning(true);
    setCurrentStreamerIndex((prev) => prev + 1);
  };

  const prevStreamer = () => {
    if (streamers.length === 0) return;
    setIsTransitioning(true);
    setCurrentStreamerIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (currentStreamerIndex >= streamers.length + itemsPerView) {
      setIsTransitioning(false);
      setCurrentStreamerIndex(itemsPerView);
    } else if (currentStreamerIndex < itemsPerView) {
      setIsTransitioning(false);
      setCurrentStreamerIndex(streamers.length + itemsPerView - 1);
    }
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      <ParallaxBackground />

      {/* HEADER / NAV */}
      <header className="fixed w-full top-0 z-50 bg-[#0a0319]/90 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-white to-white rounded-lg flex items-center justify-center font-bold text-black text-xl font-mono shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              808
            </div>
            <span className="font-mono font-bold text-xl tracking-tighter text-white hidden sm:block">
              ACTIVO.
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-sm">
            <a href="#eventos" className="hover:text-purple-400 transition-colors text-gray-300">&lt;Eventos/&gt;</a>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-purple-400 transition-colors text-gray-300">&lt;SobreNosotros/&gt;</button>
            <a href="#streamers" className="hover:text-purple-400 transition-colors text-gray-300">&lt;Streamers/&gt;</a>
            <a href="#minecraft" className="hover:text-purple-400 transition-colors text-gray-300">&lt;808_Craft/&gt;</a>
          </nav>

          {/* Buttons & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/808activo/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram 808activo"
              className="hidden md:flex items-center justify-center text-white hover:text-pink-400 transition-colors"
            >
              <IconInstagram />
            </a>
            <ButtonDiscord className="hidden md:flex text-sm py-1.5 px-4">Discord</ButtonDiscord>
            <button
              className="md:hidden text-white hover:text-purple-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#0f0b1e] border-b border-purple-500/20 p-4 flex flex-col gap-4 text-center font-mono animate-in slide-in-from-top-5">
            <a href="#eventos" className="py-2 hover:bg-white/5 rounded" onClick={() => setIsMenuOpen(false)}>Eventos</a>
            <button className="py-2 hover:bg-white/5 rounded w-full text-center" onClick={() => { setIsAboutOpen(true); setIsMenuOpen(false); }}>Sobre Nosotros</button>
            <a href="#streamers" className="py-2 hover:bg-white/5 rounded" onClick={() => setIsMenuOpen(false)}>Streamers</a>
            <a href="#minecraft" className="py-2 hover:bg-white/5 rounded" onClick={() => setIsMenuOpen(false)}>Minecraft Server</a>
            <ButtonDiscord className="w-full justify-center">Unirse</ButtonDiscord>
          </div>
        )}
      </header>



      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      <main className="pt-20">
        {/* HERO SECTION (#home) */}
        <section
          id="home"
          className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            setMousePos({ x, y });
          }}
          onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
        >
          {/* Background FX */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(88,28,135,0.2),transparent_70%)] pointer-events-none"></div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-mono mb-6 tracking-widest">
              ● COMUNIDAD GAMING LATAM
            </span>
            <h1
              onClick={() => setIsAboutOpen(true)}
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight cursor-pointer hover:text-purple-200 transition-colors"
              style={{
                transform: `translate3d(${mousePos.x * 26}px, ${mousePos.y * 20}px, 0)`,
                transition: 'transform 120ms linear',
              }}
            >
              <img src={Activo} alt="808 Activo - Comunidad Gaming LATAM Discord y Minecraft" className="h-auto w-full max-w-2xl mx-auto hover:scale-105 transition-transform duration-300" />
            </h1>
            <p
              className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{
                transform: `translate3d(${mousePos.x * 14}px, ${mousePos.y * 10}px, 0)`,
                transition: 'transform 140ms linear',
              }}
            >
              La comunidad gamer más activa. Discord con eventos semanales, servidor Minecraft 808 Craft, torneos y streamers en vivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonDiscord className="text-lg px-8 py-4">UNIRSE AL DISCORD</ButtonDiscord>
              <a href="#minecraft" className="px-8 py-4 rounded-lg border border-gray-600 hover:border-white text-gray-300 hover:text-white font-mono font-bold transition-all" aria-label="Ver servidor Minecraft 808 Craft">
                SERVIDOR MINECRAFT
              </a>
            </div>
          </div>
        </section>

        {/* EVENTOS SECTION (#eventos) */}
        <section
          id="eventos"
          className="py-24 bg-gaming-bg relative overflow-hidden"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            setMousePos({ x, y });
          }}
          onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold font-mono text-center mb-16">
              <span className="text-purple-500">&lt;</span> EVENTOS <span className="text-purple-500">/&gt;</span>
            </h2>

            <div
              className="relative flex justify-center items-center gap-4 md:gap-10 max-w-6xl mx-auto min-h-[500px]"
            >
              {/* Left Arrow */}
              <button
                onClick={prevEvent}
                className="absolute left-0 md:-left-12 z-30 bg-purple-600/90 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
                aria-label="Evento anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={nextEvent}
                className="absolute right-0 md:-right-12 z-30 bg-purple-600/90 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
                aria-label="Siguiente evento gaming"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              {DATA_EVENTS.map((evt, idx) => {
                // Calculate relative position
                let offset = (idx - currentEventIndex + DATA_EVENTS.length) % DATA_EVENTS.length;
                // Adjust for shortest path (e.g. if length is 4, 3 becomes -1)
                if (offset > DATA_EVENTS.length / 2) {
                  offset -= DATA_EVENTS.length;
                }

                // Determine styles based on offset
                let positionClass = 'opacity-0 scale-50 z-0 pointer-events-none';
                let translateClass = 'translate-x-[-50%]';

                if (offset === 0) {
                  // Center
                  positionClass = 'opacity-100 scale-100 md:scale-110 z-30';
                  translateClass = 'translate-x-[-50%]';
                } else if (offset === 1) {
                  // Right
                  positionClass = 'opacity-40 scale-90 z-20 blur-[1px] hidden md:block pointer-events-none';
                  translateClass = 'translate-x-[40%]';
                } else if (offset === -1) {
                  // Left
                  positionClass = 'opacity-40 scale-90 z-20 blur-[1px] hidden md:block pointer-events-none';
                  translateClass = 'translate-x-[-140%]';
                }

                return (
                  <div
                    key={evt.id}
                    className={`absolute top-1/2 left-1/2 transition-all duration-700 ease-in-out ${positionClass} ${translateClass} -translate-y-1/2`}
                    onMouseEnter={() => setIsHoveringEvents(true)}
                    onMouseLeave={() => setIsHoveringEvents(false)}
                  >
                    <EventCard
                      image={evt.image}
                      badge={evt.badge}
                      badgeClass={evt.badgeColor}
                      title={evt.title}
                      desc={evt.description}
                      xMult={offset === 0 ? 12 : 5}
                      yMult={offset === 0 ? 8 : 3}
                      gradientClass={evt.gradient}
                    />
                  </div>
                );
              })}

              {/* Navigation Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-40">
                {DATA_EVENTS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentEventIndex(idx)}
                    className={`relative h-2 rounded-full transition-all duration-300 overflow-hidden ${idx === currentEventIndex ? 'w-12 bg-gray-700' : 'w-2 bg-gray-600 hover:bg-gray-500'
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    {idx === currentEventIndex && (
                      <div
                        className="absolute top-0 left-0 h-full bg-purple-500"
                        style={{
                          animation: 'progress 5s linear forwards',
                          animationPlayState: isHoveringEvents ? 'paused' : 'running',
                        }}
                        onAnimationEnd={nextEvent}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>



        {/* STREAMERS SECTION (#streamers) */}
        <section id="streamers" className="py-24 bg-[#0f0b1e] relative overflow-hidden">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold font-mono text-center mb-16">
              <span className="text-purple-500">&lt;</span> STREAMERS LATAM <span className="text-purple-500">/&gt;</span> <span className="text-xs bg-red-600 text-white px-2 py-1 rounded animate-pulse ml-2">LIVE</span>
            </h2>

            {/* loading / hint */}
            {loadingStreams && (
              <div className="mb-6 text-sm text-gray-400 font-mono">Actualizando estado de streamers…</div>
            )}

            {streamers.length > 0 && (() => {
              return (
                <div className="relative max-w-7xl mx-auto">
                  {/* Left Arrow */}
                  <button
                    onClick={prevStreamer}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-purple-600/90 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
                    aria-label="Streamer anterior"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  {/* Right Arrow */}
                  <button
                    onClick={nextStreamer}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-purple-600/90 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
                    aria-label="Siguiente streamer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>

                  {/* Carousel Track */}
                  <div className="overflow-hidden px-12">
                    <div
                      className={`flex gap-6`}
                      style={{
                        transform: `translateX(-${currentStreamerIndex * (100 / itemsPerView)}%)`,
                        transition: isTransitioning ? 'transform 500ms ease-out' : 'none'
                      }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      {extendedStreamers.map((streamer, idx) => {
                        const uniqueKey = `${streamer.id || streamer.login}-${idx}`;
                        const avatarUrl = streamer.avatar || `https://decapi.me/twitch/avatar/${encodeURIComponent(streamer.login)}`;
                        const previewUrl = streamer.thumbnail || `https://static-cdn.jtvnw.net/previews-ttv/live_user_${encodeURIComponent(streamer.login)}-640x360.jpg`;

                        return (
                          <div
                            key={uniqueKey}
                            onClick={() => openChannel(streamer.url)}
                            className="bg-[#130b24] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/40 transition-all group flex-shrink-0 cursor-pointer"
                            style={{ width: `calc(${100 / itemsPerView}% - 1rem)` }}
                          >
                            {/* Preview */}
                            <div className="h-40 bg-gray-800 relative overflow-hidden">
                              <img
                                src={previewUrl}
                                alt={`${streamer.name || streamer.login} preview`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avatarUrl; }}
                              />

                              {streamer.status === 'live' && (
                                <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  En Vivo
                                </span>
                              )}
                            </div>

                            <div className="p-5">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={avatarUrl}
                                    alt={`${streamer.name || streamer.login} avatar`}
                                    className="w-10 h-10 rounded-full object-cover border border-white/5"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://decapi.me/twitch/avatar/${encodeURIComponent(streamer.login)}`; }}
                                  />
                                  <div>
                                    <h3 className="font-bold text-lg">{String(streamer.name || streamer.login)}</h3>
                                    <p className="text-xs text-purple-400 font-mono">
                                      {streamer.status === 'live' ? String(streamer.game || "—") : (
                                        streamer.lastStreamDate ? (
                                          `Último stream: ${formatRelativeTime(streamer.lastStreamDate)}`
                                        ) : '—'
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {streamer.platform === 'twitch' ? <IconTwitch /> : <IconYoutube />}
                              </div>

                              {streamer.status === "live" ? (
                                <>
                                  <p className="text-purple-300 text-sm mt-2 line-clamp-2">{String(streamer.title || "")}</p>
                                  <p className="text-gray-400 text-xs mt-1">👁 {Number(streamer.viewers || 0)} espectadores</p>
                                </>
                              ) : (
                                streamer.description && (
                                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{String(streamer.description)}</p>
                                )
                              )}

                              <div className={`w-full mt-4 py-2 rounded font-mono text-xs font-bold border text-center transition-colors ${streamer.status === 'live'
                                ? 'bg-purple-600 border-purple-600 text-white group-hover:bg-purple-700'
                                : 'border-gray-700 text-gray-500'
                                }`}>
                                {streamer.status === 'live' ? 'VER AHORA' : 'OFFLINE'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="flex justify-center gap-2 mt-6">
                    {streamers.map((_, index) => {
                      let activeIndex = currentStreamerIndex - itemsPerView;
                      if (activeIndex < 0) activeIndex = streamers.length + activeIndex;
                      if (activeIndex >= streamers.length) activeIndex = activeIndex - streamers.length;

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setIsTransitioning(true);
                            setCurrentStreamerIndex(index + itemsPerView);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${activeIndex === index
                            ? 'bg-purple-500 w-8'
                            : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                          aria-label={`Go to streamer ${index + 1}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* MINECRAFT SECTION (#minecraft) */}
        <section id="minecraft" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0319] via-[#130b2e] to-[#1e1b4b]"></div>

          <div className="container mx-auto px-4 md:pl-8 lg:pl-25 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-6xl mx-auto">
              {/* Left column: main server info */}
              <div className="w-full lg:w-1/2 flex flex-col gap-8 text-center lg:text-left">
                <div>
                  <h2 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">SERVIDOR MINECRAFT 808 CRAFT</h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 font-mono text-sm">
                    <span className={`w-3 h-3 rounded-full ${serverOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-red-500'}`}></span>
                    <span className={serverOnline ? 'text-green-400' : 'text-red-400'}>
                      {serverOnline ? `ONLINE: ${onlinePlayers} Jugadores` : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start items-center">
                  <CopyBox label="JAVA IP" text="play.808.lat" />
                  <CopyBox label="BEDROCK IP" text="play.808.lat" subtext="Puerto: 25910" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center lg:justify-start">
                  <button
                    onClick={() => setIsShopOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-mono font-bold rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all transform hover:scale-105 flex items-center justify-center gap-2 h-24 w-72"
                    aria-label="Abrir tienda Minecraft 808 Craft"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                    TIENDA MINECRAFT
                  </button>

                  <TopDonorBox />
                </div>

                <p className="text-gray-500 font-mono text-sm max-w-lg">
                  Survival 1.21.8+ • Economía • Protecciones • Eventos.<br />
                  ¿Problemas para entrar? Contactanos en Discord.
                </p>
              </div>

              {/* Right column: event card */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <EventCard
                  image="https://i.imgur.com/syIFmsS.png"
                  badge="EVENTO"
                  badgeClass="bg-green-600"
                  title="WELCOME TO THE NETHER"
                  desc="Únete para explorar el Nether con todos nosotros."
                  xMult={10}
                  yMult={6}
                  gradientClass="from-blue-900/40 to-purple-900/40"
                />
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-black border-t border-white/10 py-12 text-center">
        <div className="container mx-auto px-4">
          <div className="font-mono font-bold text-2xl mb-6">808 ACTIVO CREW</div>
          <div className="flex justify-center gap-6 mb-8 text-sm text-gray-400 font-mono">
            <a href="#" className="hover:text-white">Discord</a>
            <a href="#" className="hover:text-white">Reglas</a>
            <a href="#" className="hover:text-white">Staff</a>
          </div>
          <p className="text-gray-600 text-xs font-mono">
            &copy; 2025 808 ACTIVO. Todos los derechos reservados.
          </p>
        </div>
      </footer>
      <SpeedInsights />
      {isShopOpen && <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />}
      {isAboutOpen && <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
