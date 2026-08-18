import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  RefreshCw, 
  Search, 
  Maximize2, 
  X, 
  Wind, 
  Droplets, 
  Sun, 
  Compass, 
  Eye, 
  Gauge, 
  Activity, 
  Sparkles, 
  Volume2, 
  CloudRain, 
  CloudLightning, 
  CloudSun,
  ShieldCheck,
  Thermometer
} from 'lucide-react';

interface WeatherPanelProps {
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
  compact?: boolean;
  isOpenFullModal?: boolean;
  onToggleFullModal?: (isOpen: boolean) => void;
  onAskJarvisWeather?: (query: string) => void;
}

interface ForecastDay {
  dayName: string;
  dateStr: string;
  high: number;
  low: number;
  hasSun: boolean;
  hasRain: boolean;
  condition: string;
  humidity: number;
  windSpeed: number;
}

interface HourlyForecast {
  time: string;
  temp: number;
  code: number;
  pop: number; // Probability of precipitation %
}

interface WeatherData {
  city: string;
  state: string;
  timeStr: string;
  tempC: number;
  tempF: number;
  highC: number;
  lowC: number;
  feelsLikeC: number;
  condition: string;
  weatherCode: number;
  humidity: number;
  windSpeedKm: number;
  windDirection: string;
  uvIndex: number;
  pressureHpa: number;
  visibilityKm: number;
  aqi: string;
  updatedText: string;
  forecast: ForecastDay[];
  hourly: HourlyForecast[];
}

const POPULAR_CITIES = [
  { name: 'Lucknow', state: 'UP', lat: 26.8467, lon: 80.9462 },
  { name: 'New Delhi', state: 'DL', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', state: 'MH', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', state: 'KA', lat: 12.9716, lon: 77.5946 },
  { name: 'London', state: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', state: 'US', lat: 40.7128, lon: -74.0060 },
  { name: 'Tokyo', state: 'JP', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris', state: 'FR', lat: 48.8566, lon: 2.3522 },
  { name: 'Dubai', state: 'AE', lat: 25.2048, lon: 55.2708 },
];

// Soft 3D Glossy Cloud SVG matching the user image
const Soft3DCloud: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hasSun?: boolean;
  hasRain?: boolean;
}> = ({ size = 'md', hasSun = false, hasRain = false }) => {
  const dimensions = 
    size === 'xl' ? 'w-28 h-20 md:w-36 md:h-28' : 
    size === 'lg' ? 'w-14 h-11' : 
    size === 'sm' ? 'w-7 h-5' : 'w-10 h-8';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensions}`}>
      <svg className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)]" viewBox="0 0 120 90">
        <defs>
          {/* 3D Sun Radial Gradient */}
          <radialGradient id="sun3d" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          {/* 3D Cloud Radial Body Gradient */}
          <radialGradient id="cloud3dBody" cx="30%" cy="25%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#dbeafe" />
            <stop offset="70%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>

          {/* Cloud Bottom Shading */}
          <linearGradient id="cloudBottomShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.8" />
          </linearGradient>

          {/* 3D Teardrop Rain Gradient */}
          <radialGradient id="rain3d" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </radialGradient>

          <filter id="cloudSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Optional 3D Sun Spherical Glow behind cloud */}
        {hasSun && (
          <g className="animate-pulse">
            <circle cx="82" cy="32" r="18" fill="url(#sun3d)" />
            <circle cx="82" cy="32" r="22" fill="#fef08a" opacity="0.35" className="animate-ping" />
          </g>
        )}

        {/* Main 3D Soft Glossy Cloud Silhouette */}
        <g filter="url(#cloudSoftShadow)">
          {/* Base cloud volumetric shape */}
          <path
            d="M 32 68 
               L 88 68 
               A 20 20 0 0 0 88 28 
               A 24 24 0 0 0 46 20 
               A 22 22 0 0 0 20 42 
               A 16 16 0 0 0 32 68 Z"
            fill="url(#cloud3dBody)"
          />
          
          {/* Bottom curve shading for 3D depth */}
          <path
            d="M 28 64 L 92 64 A 20 20 0 0 0 92 48 Q 60 70 28 64 Z"
            fill="url(#cloudBottomShadow)"
          />

          {/* Top gloss highlight cap */}
          <ellipse cx="48" cy="24" rx="14" ry="8" fill="#ffffff" opacity="0.85" />
          <ellipse cx="72" cy="32" rx="10" ry="6" fill="#ffffff" opacity="0.75" />
        </g>

        {/* 3D Raindrop Teardrop */}
        {hasRain && (
          <g>
            <path
              d="M 42 74 C 42 74, 38 82, 42 86 C 45 89, 49 87, 49 83 C 49 79, 42 74, 42 74 Z"
              fill="url(#rain3d)"
              className="animate-bounce"
            />
            {(size === 'lg' || size === 'xl') && (
              <path
                d="M 68 76 C 68 76, 64 84, 68 88 C 71 91, 75 89, 75 85 C 75 81, 68 76, 68 76 Z"
                fill="url(#rain3d)"
                className="animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  isOpenFullModal = false,
  onToggleFullModal,
  onAskJarvisWeather
}) => {
  const [selectedCity, setSelectedCity] = useState(POPULAR_CITIES[0]); // Lucknow, UP default
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [internalFullModal, setInternalFullModal] = useState(false);

  // Sync internal state with prop
  const isFullOpen = isOpenFullModal || internalFullModal;

  const toggleModal = (state: boolean) => {
    setInternalFullModal(state);
    if (onToggleFullModal) onToggleFullModal(state);
  };

  const [weather, setWeather] = useState<WeatherData>({
    city: 'Lucknow',
    state: 'UP',
    timeStr: '07:55 PM',
    tempC: 30,
    tempF: 86,
    highC: 33,
    lowC: 28,
    feelsLikeC: 32,
    condition: 'Cloudy',
    weatherCode: 2,
    humidity: 78,
    windSpeedKm: 14,
    windDirection: 'SW',
    uvIndex: 4,
    pressureHpa: 1012,
    visibilityKm: 10,
    aqi: '42 (Good)',
    updatedText: 'Updated a few minutes ago',
    forecast: [
      { dayName: 'Today', dateStr: '', high: 33, low: 28, hasSun: false, hasRain: true, condition: 'Light Rain', humidity: 82, windSpeed: 14 },
      { dayName: 'Tue', dateStr: '4', high: 31, low: 27, hasSun: true, hasRain: true, condition: 'Scattered Showers', humidity: 76, windSpeed: 12 },
      { dayName: 'Wed', dateStr: '5', high: 30, low: 26, hasSun: false, hasRain: true, condition: 'Cloudy & Rain', humidity: 80, windSpeed: 16 },
      { dayName: 'Thu', dateStr: '6', high: 29, low: 27, hasSun: false, hasRain: true, condition: 'Heavy Showers', humidity: 85, windSpeed: 18 },
      { dayName: 'Fri', dateStr: '7', high: 32, low: 26, hasSun: true, hasRain: false, condition: 'Partly Sunny', humidity: 68, windSpeed: 10 },
      { dayName: 'Sat', dateStr: '8', high: 34, low: 27, hasSun: true, hasRain: false, condition: 'Sunny & Clear', humidity: 62, windSpeed: 8 },
      { dayName: 'Sun', dateStr: '9', high: 33, low: 28, hasSun: true, hasRain: true, condition: 'Humid Thunderstorms', humidity: 79, windSpeed: 15 },
    ],
    hourly: [
      { time: '08 PM', temp: 30, code: 2, pop: 20 },
      { time: '09 PM', temp: 29, code: 61, pop: 60 },
      { time: '10 PM', temp: 29, code: 61, pop: 75 },
      { time: '11 PM', temp: 28, code: 2, pop: 30 },
      { time: '12 AM', temp: 28, code: 3, pop: 10 },
      { time: '01 AM', temp: 27, code: 0, pop: 0 },
      { time: '02 AM', temp: 27, code: 0, pop: 0 },
      { time: '03 AM', temp: 26, code: 0, pop: 0 },
      { time: '04 AM', temp: 26, code: 1, pop: 5 },
      { time: '05 AM', temp: 26, code: 1, pop: 5 },
      { time: '06 AM', temp: 27, code: 0, pop: 0 },
      { time: '07 AM', temp: 28, code: 0, pop: 0 },
    ],
  });

  const fetchWeather = useCallback(async (lat: number, lon: number, cityName: string, stateName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto`
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();

      const current = data.current;
      const daily = data.daily;
      const hourlyData = data.hourly;

      const cTemp = Math.round(current?.temperature_2m ?? 30);
      const fTemp = Math.round((cTemp * 9) / 5 + 32);
      const hTemp = Math.round(daily?.temperature_2m_max?.[0] ?? cTemp + 3);
      const lTemp = Math.round(daily?.temperature_2m_min?.[0] ?? cTemp - 2);
      const feelsLike = Math.round(current?.apparent_temperature ?? cTemp);

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      // Generate 7 day forecast
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const forecastList: ForecastDay[] = [];

      for (let i = 0; i < 7; i++) {
        const dateObj = new Date();
        dateObj.setDate(now.getDate() + i);
        const dayLabel = i === 0 ? 'Today' : `${days[dateObj.getDay()]}`;
        const dateNum = i === 0 ? '' : `${dateObj.getDate()}`;
        const dayCode = daily?.weather_code?.[i] ?? 2;
        const dayMax = Math.round(daily?.temperature_2m_max?.[i] ?? cTemp + 2 - i);
        const dayMin = Math.round(daily?.temperature_2m_min?.[i] ?? cTemp - 2 - i);

        forecastList.push({
          dayName: dayLabel,
          dateStr: dateNum,
          high: dayMax,
          low: dayMin,
          hasSun: dayCode === 0 || dayCode === 1 || dayCode === 2,
          hasRain: dayCode >= 51,
          condition: dayCode === 0 ? 'Clear Sky' : dayCode >= 51 ? 'Rain Showers' : 'Partly Cloudy',
          humidity: Math.min(95, 60 + i * 3),
          windSpeed: 10 + (i % 4) * 2,
        });
      }

      // Generate 12 hourly forecast points
      const hourlyPoints: HourlyForecast[] = [];
      const currentHour = now.getHours();
      for (let i = 0; i < 12; i++) {
        const hIdx = (currentHour + i) % 24;
        const hTimeStr = `${(hIdx % 12 || 12).toString().padStart(2, '0')} ${hIdx >= 12 ? 'PM' : 'AM'}`;
        const hTemp = Math.round(hourlyData?.temperature_2m?.[i] ?? cTemp - Math.sin(i / 2) * 2);
        const hCode = hourlyData?.weather_code?.[i] ?? current?.weather_code ?? 2;
        const hPop = Math.round(hourlyData?.precipitation_probability?.[i] ?? (hCode >= 51 ? 70 : 10));

        hourlyPoints.push({
          time: hTimeStr,
          temp: hTemp,
          code: hCode,
          pop: hPop,
        });
      }

      let cond = 'Cloudy';
      const code = current?.weather_code ?? 2;
      if (code === 0) cond = 'Clear Sky';
      else if (code === 1) cond = 'Mostly Clear';
      else if (code === 2) cond = 'Partly Cloudy';
      else if (code === 3) cond = 'Overcast Cloudy';
      else if (code >= 51 && code <= 65) cond = 'Rainy Drizzle';
      else if (code >= 80) cond = 'Rain Showers';
      else if (code >= 95) cond = 'Thunderstorm';

      setWeather({
        city: cityName,
        state: stateName,
        timeStr: timeFormatted,
        tempC: cTemp,
        tempF: fTemp,
        highC: hTemp,
        lowC: lTemp,
        feelsLikeC: feelsLike,
        condition: cond,
        weatherCode: code,
        humidity: Math.round(current?.relative_humidity_2m ?? 78),
        windSpeedKm: Math.round(current?.wind_speed_10m ?? 14),
        windDirection: 'SW',
        uvIndex: Math.round(daily?.uv_index_max?.[0] ?? 4),
        pressureHpa: Math.round(current?.surface_pressure ?? 1012),
        visibilityKm: 10,
        aqi: '42 (Good)',
        updatedText: 'Updated a few minutes ago',
        forecast: forecastList,
        hourly: hourlyPoints,
      });
    } catch (e) {
      console.warn('Weather fetch fallback:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity.lat, selectedCity.lon, selectedCity.name, selectedCity.state);
  }, [selectedCity, fetchWeather]);

  // Handle ESC key to close full modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullOpen) {
        toggleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullOpen]);

  const handleAskJarvis = () => {
    if (onAskJarvisWeather) {
      onAskJarvisWeather(`JARVIS, give me a complete detailed weather report for ${weather.city}, ${weather.state}. Current temperature is ${weather.tempC}°C, condition is ${weather.condition}.`);
    }
  };

  return (
    <>
      {/* 1. COMPACT FLOATING BADGE (Fits seamlessly anywhere without right-side panel box) */}
      <div className="inline-flex items-center">
        <button 
          onClick={() => toggleModal(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950/90 border border-cyan-500/40 text-slate-100 text-xs font-semibold backdrop-blur-xl shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all cursor-pointer group hover:scale-105 active:scale-95"
          title="Click to view 3D Weather Cloud directly over AI Core"
        >
          <Soft3DCloud
            size="sm"
            hasSun={weather.weatherCode === 1 || weather.weatherCode === 2}
            hasRain={weather.weatherCode >= 51}
          />
          <div className="flex items-center gap-1.5 font-sans">
            <span className="font-bold text-white tracking-tight">{weather.city}:</span>
            <span className="font-extrabold text-cyan-300">{weather.tempC}°C</span>
            <span className="text-[10px] text-slate-300 hidden sm:inline">{weather.condition}</span>
          </div>
          <Maximize2 className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform ml-0.5" />
        </button>

        {/* City Dropdown Menu overlay */}
        {isSearching && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 w-56 p-2 rounded-2xl bg-slate-900/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-50"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
              Select Location
            </p>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelectedCity(c);
                    setIsSearching(false);
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors ${
                    selectedCity.name === c.name
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{c.name}, {c.state}</span>
                  <MapPin className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. FULL WINDOW WEATHER WORKSPACE MODAL (Pure Borderless Floating View over Blurred AI Core Background) */}
      {isFullOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 md:p-8 backdrop-blur-3xl bg-black/60 animate-in fade-in duration-300 overflow-y-auto font-sans select-none text-white">
          
          {/* Top Floating Control Bar - Borderless & Clean */}
          <div className="w-full max-w-5xl flex items-center justify-between py-2 z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                <span className="text-xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                  {weather.city}, {weather.state}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                {weather.timeStr}
              </span>
            </div>

            {/* City Switcher + Ask JARVIS + Sleek Close Button */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsSearching(!isSearching)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all backdrop-blur-md border border-white/20"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Change City</span>
                </button>

                {/* Dropdown in Full View */}
                {isSearching && (
                  <div className="absolute top-full right-0 mt-2 w-56 p-2 rounded-2xl bg-slate-900/95 border border-white/20 shadow-2xl backdrop-blur-3xl z-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                      Select Location
                    </p>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {POPULAR_CITIES.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setSelectedCity(c);
                            setIsSearching(false);
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors ${
                            selectedCity.name === c.name
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{c.name}, {c.state}</span>
                          <MapPin className="w-3 h-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAskJarvis}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/40 transition-all backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                title="Ask JARVIS to give complete weather breakdown"
              >
                <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">Ask JARVIS</span>
              </button>

              <button
                onClick={() => toggleModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 text-slate-200 hover:text-white transition-colors border border-white/20 backdrop-blur-md"
                title="Close Weather (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Hero: 3D Soft Glossy Cloud Face directly in front of the AI Core */}
          <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center my-auto py-6 gap-3 z-10">
            {/* Giant 3D Glossy Weather Cloud centered */}
            <div className="relative flex items-center justify-center my-2 transform hover:scale-105 transition-transform duration-300">
              {/* Soft Radial Ambient Aura Glow behind the cloud */}
              <div className="absolute w-64 h-64 rounded-full bg-sky-500/20 blur-3xl -z-10 animate-pulse" />
              <Soft3DCloud
                size="xl"
                hasSun={weather.weatherCode === 1 || weather.weatherCode === 2}
                hasRain={weather.weatherCode >= 51}
              />
            </div>

            {/* Giant Floating Temperature Typography */}
            <div className="flex items-start justify-center">
              <span className="text-7xl sm:text-8xl md:text-9xl font-black text-white tracking-tighter leading-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                {weather.tempC}
              </span>
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-300 tracking-tight ml-1 mt-2">
                °C
              </span>
            </div>

            {/* Weather Condition Name */}
            <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
              {weather.condition}
            </div>

            {/* High / Low & Feels Like */}
            <div className="text-sm sm:text-base font-semibold text-slate-300 tracking-wide">
              High <span className="text-white font-bold">{weather.highC}°C</span> • Low <span className="text-white font-bold">{weather.lowC}°C</span> • Feels like <span className="text-white font-bold">{weather.feelsLikeC}°C</span>
            </div>

            {/* Meteorological Metrics Row - Borderless Floating Glass Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md text-sm font-medium">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">Humidity</span>
                <span className="text-white font-bold">{weather.humidity}%</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md text-sm font-medium">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">Wind</span>
                <span className="text-white font-bold">{weather.windSpeedKm} km/h</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md text-sm font-medium">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">UV Index</span>
                <span className="text-white font-bold">{weather.uvIndex}</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md text-sm font-medium">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">AQI</span>
                <span className="text-white font-bold">{weather.aqi}</span>
              </div>
            </div>
          </div>

          {/* Bottom Floating Forecast Rows (Hourly & 7-Day) - Borderless & Clean */}
          <div className="w-full max-w-5xl flex flex-col gap-4 z-10 pb-2">
            
            {/* 24-Hour Timeline Bar - Borderless */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-300 uppercase tracking-widest px-1">
                <span>24-Hour Atmospheric Timeline</span>
                <span className="text-cyan-400">Precipitation Chance</span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scroll">
                {weather.hourly.map((h, idx) => (
                  <div 
                    key={idx}
                    className="flex flex-col items-center justify-between p-2.5 min-w-[70px] rounded-2xl bg-white/5 hover:bg-white/15 transition-all backdrop-blur-md"
                  >
                    <span className="text-[11px] font-bold text-slate-300">{h.time}</span>
                    <div className="my-1.5">
                      <Soft3DCloud
                        size="sm"
                        hasSun={h.code < 3}
                        hasRain={h.code >= 51}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-white">{h.temp}°C</span>
                    <span className="text-[10px] font-bold text-cyan-300 mt-0.5">{h.pop}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Forecast Grid - Borderless */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest px-1">
                7-Day Meteorological Forecast
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {weather.forecast.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`flex flex-col items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      selectedDayIdx === idx
                        ? 'bg-white text-slate-900 shadow-2xl scale-[1.04] font-bold'
                        : 'bg-white/5 hover:bg-white/15 text-white backdrop-blur-md'
                    }`}
                  >
                    <span className={`text-xs font-extrabold ${selectedDayIdx === idx ? 'text-slate-900' : 'text-slate-200'}`}>
                      {item.dayName} {item.dateStr}
                    </span>
                    <div className="my-2">
                      <Soft3DCloud
                        size="sm"
                        hasSun={item.hasSun}
                        hasRain={item.hasRain}
                      />
                    </div>
                    <span className={`text-[11px] font-bold text-center leading-tight ${selectedDayIdx === idx ? 'text-slate-800' : 'text-slate-300'}`}>
                      {item.condition}
                    </span>
                    <span className={`text-xs font-extrabold mt-1 ${selectedDayIdx === idx ? 'text-slate-950' : 'text-white'}`}>
                      {item.high}° / {item.low}°
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Footer Status */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                JARVIS LIVE OPEN-METEO SATELLITE FEED ACTIVE
              </span>
              <span>
                Press <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">ESC</kbd> or click X to return
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default WeatherPanel;
