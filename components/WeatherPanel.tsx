import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  VolumeX,
  CloudRain, 
  CloudLightning, 
  CloudSun,
  ShieldCheck,
  Thermometer,
  CloudAlert,
  Navigation,
  CheckCircle2,
  History,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  Sunrise,
  Sunset,
  Mic,
  MicOff,
  Send,
  Zap,
  Bot,
  Radio,
  Waves
} from 'lucide-react';
import { openWeatherService, WeatherReport } from '../services/openWeatherService';
import { credentialManager } from '../services/credentialManager';
import { weatherControlService, WeatherControlAction, WeatherUnit } from '../services/weatherControlService';
import { JarvisStatus } from '../types';

interface WeatherPanelProps {
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
  compact?: boolean;
  isOpenFullModal?: boolean;
  onToggleFullModal?: (isOpen: boolean) => void;
  onAskJarvisWeather?: (query: string) => void;
  status?: JarvisStatus;
  isLive?: boolean;
  micLevel?: number;
  onSendMessage?: (msg: string) => void;
  handleStartLive?: () => void;
}

export interface ForecastDay {
  dayName: string;
  dateStr: string;
  fullDate?: string;
  high: number;
  low: number;
  hasSun: boolean;
  hasRain: boolean;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  pop: number; // Probability of precipitation %
  uvIndex?: number;
  pressureHpa?: number;
  dewPoint?: number;
  visibilityKm?: number;
  sunriseTime?: string;
  sunsetTime?: string;
  morning?: { temp: number; condition: string; code: number; pop: number };
  afternoon?: { temp: number; condition: string; code: number; pop: number };
  evening?: { temp: number; condition: string; code: number; pop: number };
  night?: { temp: number; condition: string; code: number; pop: number };
  jarvisSummary?: string;
}

export interface HourlyForecast {
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
  dewPointC: number;
  sunriseTime: string;
  sunsetTime: string;
  aqi: string;
  updatedText: string;
  forecast: ForecastDay[];
  hourly: HourlyForecast[];
}

export interface SavedCityLocation {
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
}

const POPULAR_CITIES: SavedCityLocation[] = [
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'IN', lat: 26.8467, lon: 80.9462 },
  { name: 'New Delhi', state: 'Delhi', country: 'IN', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'IN', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.5726, lon: 88.3639 },
  { name: 'London', state: 'England', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', state: 'NY', country: 'US', lat: 40.7128, lon: -74.0060 },
  { name: 'Tokyo', state: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris', state: 'Île-de-France', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { name: 'Dubai', state: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
];

// Helper to convert Celsius to selected unit
const displayTemp = (celsius: number, unit: WeatherUnit): number => {
  if (unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
};

// Soft 3D Glossy Atmospheric Weather Entity with Fluid Physics & Keyframe Animations
const Soft3DCloud: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  hasSun?: boolean;
  hasRain?: boolean;
  weatherCode?: number;
}> = ({ size = 'md', hasSun = false, hasRain = false, weatherCode = 0 }) => {
  const isHero = size === 'hero';
  const dimensions = 
    size === 'hero' ? 'w-36 h-24 sm:w-48 sm:h-32 md:w-60 md:h-38 lg:w-68 lg:h-44' : 
    size === 'xl' ? 'w-24 h-16 sm:w-28 sm:h-20' : 
    size === 'lg' ? 'w-14 h-10' : 
    size === 'sm' ? 'w-6 h-5' : 'w-9 h-7';

  const isThunder = weatherCode >= 95 || (hasRain && weatherCode >= 80);
  const isSnow = (weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensions}`}>
      <svg 
        className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]" 
        viewBox="0 0 160 110"
        style={{
          animation: isHero ? 'atmosphericFloat 5s ease-in-out infinite' : size === 'xl' ? 'atmosphericFloat 6s ease-in-out infinite' : undefined
        }}
      >
        <defs>
          {/* Sun Gradients */}
          <radialGradient id={`sun3dCore-${size}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="25%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          <radialGradient id={`sunAura-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>

          {/* 3D Volumetric Cloud Gradients */}
          <radialGradient id={`cloud3dMain-${size}`} cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="28%" stopColor="#f0f9ff" />
            <stop offset="65%" stopColor="#bae6fd" />
            <stop offset="88%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </radialGradient>

          <radialGradient id={`cloudPuffLeft-${size}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#e0f2fe" />
            <stop offset="75%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>

          <radialGradient id={`cloudPuffRight-${size}`} cx="35%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e0f2fe" />
            <stop offset="78%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>

          <linearGradient id={`cloudFloorShadow-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
          </linearGradient>

          {/* Gloss Top Sheen */}
          <linearGradient id={`glossSheen-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Rain Gradients */}
          <radialGradient id={`rainDrop-${size}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>

          {/* Lightning Gradients */}
          <linearGradient id={`lightningGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#00f2ff" />
          </linearGradient>

          {/* Atmospheric Ambient Glow Filter */}
          <filter id={`cloudSoftGlow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.35" />
          </filter>

          <filter id={`sunCoronaGlow-${size}`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* 1. BEHIND CLOUD: SUN WITH GLOWING ROTATING RAYS */}
        {hasSun && (
          <g transform="translate(108, 38)" className="pointer-events-none">
            {/* Ambient Sun Corona Aura */}
            <circle cx="0" cy="0" r={isHero ? 34 : 26} fill={`url(#sunAura-${size})`} className="animate-pulse" />
            
            {/* Rotating Sun Rays Corona */}
            <g style={{ animation: 'sunRaySpin 24s linear infinite', transformOrigin: '0px 0px' }}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={isHero ? -28 : -22}
                  x2="0"
                  y2={isHero ? -36 : -28}
                  stroke="#fde047"
                  strokeWidth={isHero ? 3.5 : 2.5}
                  strokeLinecap="round"
                  opacity={0.85}
                  transform={`rotate(${angle})`}
                />
              ))}
            </g>

            {/* Glowing 3D Sun Sphere */}
            <circle 
              cx="0" 
              cy="0" 
              r={isHero ? 24 : 18} 
              fill={`url(#sun3dCore-${size})`} 
              filter={`url(#sunCoronaGlow-${size})`}
            />
            {/* Sun Specular Highlight */}
            <circle cx={isHero ? -6 : -4} cy={isHero ? -6 : -4} r={isHero ? 7 : 5} fill="#ffffff" opacity={0.65} />
          </g>
        )}

        {/* 2. MAIN 3D VOLUMETRIC CLOUD BODY */}
        <g filter={`url(#cloudSoftGlow-${size})`}>
          {/* Base Unified Outline Body */}
          <path
            d="M 42 82 L 118 82 A 26 26 0 0 0 118 30 A 30 30 0 0 0 66 18 A 28 28 0 0 0 28 48 A 22 22 0 0 0 42 82 Z"
            fill={`url(#cloud3dMain-${size})`}
          />

          {/* Left Puffy Spherical Mass */}
          <circle cx="46" cy="58" r="22" fill={`url(#cloudPuffLeft-${size})`} />

          {/* Center Main Top Dome Spherical Mass */}
          <circle cx="82" cy="42" r="32" fill={`url(#cloud3dMain-${size})`} />

          {/* Right Puffy Spherical Mass */}
          <circle cx="116" cy="56" r="22" fill={`url(#cloudPuffRight-${size})`} />

          {/* Bottom Ambient Occlusion Shadow */}
          <path
            d="M 32 78 L 128 78 A 24 24 0 0 0 128 60 Q 80 88 32 60 Z"
            fill={`url(#cloudFloorShadow-${size})`}
          />

          {/* Specular Glossy 3D Highlight Reflections */}
          {/* Top center dome highlight */}
          <ellipse cx="76" cy="26" rx="18" ry="10" fill="url(#glossSheen-)" opacity={0.9} />
          <ellipse cx="74" cy="24" rx="10" ry="5" fill="#ffffff" opacity={0.8} />

          {/* Left puff highlight */}
          <ellipse cx="40" cy="48" rx="10" ry="6" fill="#ffffff" opacity={0.7} />

          {/* Right puff highlight */}
          <ellipse cx="118" cy="46" rx="11" ry="6" fill="#ffffff" opacity={0.65} />
        </g>

        {/* 3. LIGHTNING BOLT (If thunderstorm) */}
        {isThunder && (
          <g 
            transform="translate(68, 70)"
            style={{ animation: 'lightningFlash 2.5s infinite' }}
            filter="drop-shadow(0 0 8px #00f2ff)"
          >
            <path
              d="M 12 0 L 0 18 L 8 18 L 2 34 L 20 14 L 11 14 Z"
              fill={`url(#lightningGrad-${size})`}
            />
          </g>
        )}

        {/* 4. ANIMATED RAIN PARTICLES (If raining) */}
        {hasRain && !isSnow && (
          <g>
            {/* Drop 1 */}
            <path
              d="M 50 88 C 50 88, 45 98, 50 103 C 54 107, 59 105, 59 100 C 59 95, 50 88, 50 88 Z"
              fill={`url(#rainDrop-${size})`}
              style={{ animation: 'rainDropFall 1.4s ease-in infinite', animationDelay: '0s' }}
            />
            {/* Drop 2 */}
            <path
              d="M 76 90 C 76 90, 71 100, 76 105 C 80 109, 85 107, 85 102 C 85 97, 76 90, 76 90 Z"
              fill={`url(#rainDrop-${size})`}
              style={{ animation: 'rainDropFall 1.4s ease-in infinite', animationDelay: '0.45s' }}
            />
            {/* Drop 3 */}
            <path
              d="M 102 88 C 102 88, 97 98, 102 103 C 106 107, 111 105, 111 100 C 111 95, 102 88, 102 88 Z"
              fill={`url(#rainDrop-${size})`}
              style={{ animation: 'rainDropFall 1.4s ease-in infinite', animationDelay: '0.9s' }}
            />
            {/* Drop 4 (Hero only) */}
            {isHero && (
              <path
                d="M 124 89 C 124 89, 119 98, 124 102 C 127 105, 131 104, 131 100 C 131 96, 124 89, 124 89 Z"
                fill={`url(#rainDrop-${size})`}
                style={{ animation: 'rainDropFall 1.4s ease-in infinite', animationDelay: '0.25s' }}
              />
            )}
          </g>
        )}

        {/* 5. SNOW PARTICLES (If snowing) */}
        {isSnow && (
          <g fill="#e0f2fe" opacity={0.9}>
            <circle cx="52" cy="94" r="3" style={{ animation: 'rainDropFall 2.2s ease-in infinite', animationDelay: '0s' }} />
            <circle cx="82" cy="98" r="3.5" style={{ animation: 'rainDropFall 2.2s ease-in infinite', animationDelay: '0.7s' }} />
            <circle cx="108" cy="94" r="3" style={{ animation: 'rainDropFall 2.2s ease-in infinite', animationDelay: '1.4s' }} />
          </g>
        )}
      </svg>
    </div>
  );
};

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ 
  theme = 'cyber', 
  compact = false,
  isOpenFullModal = false,
  onToggleFullModal,
  onAskJarvisWeather,
  status = JarvisStatus.IDLE,
  isLive = false,
  micLevel = 0,
  onSendMessage,
  handleStartLive
}) => {
  const [internalFullOpen, setInternalFullOpen] = useState(false);
  const isFullOpen = isOpenFullModal !== undefined ? isOpenFullModal : internalFullOpen;

  const toggleModal = (open: boolean) => {
    if (onToggleFullModal) {
      onToggleFullModal(open);
    } else {
      setInternalFullOpen(open);
    }
    weatherControlService.dispatch({ type: 'TOGGLE_MODAL', open });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<'live_gps' | 'ip_auto' | 'custom'>('live_gps');
  const [selectedCity, setSelectedCity] = useState<SavedCityLocation | null>(null);
  const [dataSource, setDataSource] = useState<'OPENWEATHER_API' | 'OPEN_METEO_FALLBACK' | 'UNCONFIGURED'>('UNCONFIGURED');
  const [unit, setUnit] = useState<WeatherUnit>('C');

  // Interactive Detailed Day Deep Dive
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [isDayDeepDiveOpen, setIsDayDeepDiveOpen] = useState<boolean>(false);

  // Left-Side Quick Voice / Command Bar input
  const [quickVoicePrompt, setQuickVoicePrompt] = useState<string>('');

  // Dropdown search & city management
  const [isSearching, setIsSearching] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ name: string; state?: string; country?: string; lat: number; lon: number }>>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [recentCities, setRecentCities] = useState<SavedCityLocation[]>([]);

  // Speech Recognition & Voice Interaction State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const speechRecognitionRef = useRef<any>(null);

  // API Key Inline Quick-Config
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [weatherKeyInput, setWeatherKeyInput] = useState('');
  const [isKeySaving, setIsKeySaving] = useState(false);
  const [lastReport, setLastReport] = useState<WeatherReport | null>(null);

  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);
  const autoTrackedRef = useRef(false);
  const locationModeRef = useRef<'live_gps' | 'ip_auto' | 'custom'>('live_gps');
  const activeLocationRef = useRef<{ target: string | { lat: number; lon: number }; city?: string; state?: string } | null>(null);

  const [weather, setWeather] = useState<WeatherData>({
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    timeStr: '03:45 PM',
    tempC: 30,
    tempF: 86,
    highC: 33,
    lowC: 25,
    feelsLikeC: 34,
    condition: 'Scattered Clouds',
    weatherCode: 2,
    humidity: 76,
    windSpeedKm: 14,
    windDirection: 'SW',
    uvIndex: 5,
    pressureHpa: 1011,
    visibilityKm: 9.5,
    dewPointC: 24,
    sunriseTime: '05:38 AM',
    sunsetTime: '06:42 PM',
    aqi: 'Moderate (AQI 92)',
    updatedText: 'OpenWeather real-time stream',
    forecast: [
      {
        dayName: 'Today',
        dateStr: '24 Aug',
        fullDate: 'Sunday, 24 August',
        high: 33,
        low: 25,
        hasSun: true,
        hasRain: false,
        condition: 'Scattered Clouds',
        humidity: 76,
        windSpeed: 14,
        windDirection: 'SW',
        pop: 20,
        uvIndex: 6,
        pressureHpa: 1011,
        dewPoint: 24,
        visibilityKm: 9.5,
        sunriseTime: '05:38 AM',
        sunsetTime: '06:42 PM',
        morning: { temp: 27, condition: 'Clear Sky', code: 0, pop: 10 },
        afternoon: { temp: 33, condition: 'Scattered Clouds', code: 2, pop: 20 },
        evening: { temp: 29, condition: 'Mild Breeze', code: 1, pop: 15 },
        night: { temp: 26, condition: 'Calm Night', code: 0, pop: 5 },
        jarvisSummary: 'Optimal atmospheric pressure today with mild cloud dispersion. Pleasant evening conditions anticipated for Operator Virat Sir.'
      },
      {
        dayName: 'Mon',
        dateStr: '25 Aug',
        fullDate: 'Monday, 25 August',
        high: 32,
        low: 24,
        hasSun: false,
        hasRain: true,
        condition: 'Rain Showers',
        humidity: 84,
        windSpeed: 18,
        windDirection: 'WNW',
        pop: 65,
        uvIndex: 4,
        pressureHpa: 1008,
        dewPoint: 25,
        visibilityKm: 7.0,
        sunriseTime: '05:39 AM',
        sunsetTime: '06:41 PM',
        morning: { temp: 26, condition: 'Overcast', code: 3, pop: 40 },
        afternoon: { temp: 32, condition: 'Rain Showers', code: 61, pop: 65 },
        evening: { temp: 28, condition: 'Passing Rain', code: 51, pop: 50 },
        night: { temp: 25, condition: 'Cool Breeze', code: 2, pop: 30 },
        jarvisSummary: 'High probability of monsoon precipitation between 2 PM and 5 PM. Ambient humidity will elevate to 84%.'
      },
      {
        dayName: 'Tue',
        dateStr: '26 Aug',
        fullDate: 'Tuesday, 26 August',
        high: 34,
        low: 26,
        hasSun: true,
        hasRain: false,
        condition: 'Sunny & Clear',
        humidity: 68,
        windSpeed: 12,
        windDirection: 'NE',
        pop: 10,
        uvIndex: 8,
        pressureHpa: 1013,
        dewPoint: 22,
        visibilityKm: 12.0,
        sunriseTime: '05:40 AM',
        sunsetTime: '06:40 PM',
        morning: { temp: 28, condition: 'Sunny', code: 0, pop: 5 },
        afternoon: { temp: 34, condition: 'High Sun', code: 0, pop: 10 },
        evening: { temp: 30, condition: 'Clear Twilight', code: 0, pop: 5 },
        night: { temp: 27, condition: 'Starry Sky', code: 0, pop: 0 },
        jarvisSummary: 'Clear radiant solar exposure with low dew point. UV index will peak at 8 around solar noon.'
      },
      {
        dayName: 'Wed',
        dateStr: '27 Aug',
        fullDate: 'Wednesday, 27 August',
        high: 31,
        low: 24,
        hasSun: false,
        hasRain: true,
        condition: 'Thunderstorms',
        humidity: 88,
        windSpeed: 24,
        windDirection: 'SW',
        pop: 80,
        uvIndex: 3,
        pressureHpa: 1005,
        dewPoint: 26,
        visibilityKm: 5.5,
        sunriseTime: '05:40 AM',
        sunsetTime: '06:39 PM',
        morning: { temp: 27, condition: 'Dark Clouds', code: 3, pop: 50 },
        afternoon: { temp: 31, condition: 'Thunderstorm', code: 95, pop: 80 },
        evening: { temp: 26, condition: 'Heavy Rain', code: 65, pop: 70 },
        night: { temp: 24, condition: 'Wet Ground', code: 51, pop: 40 },
        jarvisSummary: 'Intense atmospheric instability detected. Wind gusts up to 35 km/h with localized electrical thunderstorm activity.'
      },
      {
        dayName: 'Thu',
        dateStr: '28 Aug',
        fullDate: 'Thursday, 28 August',
        high: 30,
        low: 23,
        hasSun: true,
        hasRain: false,
        condition: 'Partly Cloudy',
        humidity: 72,
        windSpeed: 15,
        windDirection: 'W',
        pop: 25,
        uvIndex: 6,
        pressureHpa: 1010,
        dewPoint: 21,
        visibilityKm: 10.0,
        sunriseTime: '05:41 AM',
        sunsetTime: '06:38 PM',
        morning: { temp: 25, condition: 'Misty Clear', code: 1, pop: 15 },
        afternoon: { temp: 30, condition: 'Partly Cloudy', code: 2, pop: 25 },
        evening: { temp: 27, condition: 'Fresh Air', code: 1, pop: 10 },
        night: { temp: 24, condition: 'Cool Night', code: 0, pop: 5 },
        jarvisSummary: 'Atmospheric pressure recovery nominal. Ambient thermal comfort levels restored post-storm.'
      },
      {
        dayName: 'Fri',
        dateStr: '29 Aug',
        fullDate: 'Friday, 29 August',
        high: 33,
        low: 25,
        hasSun: true,
        hasRain: false,
        condition: 'Clear Sky',
        humidity: 65,
        windSpeed: 11,
        windDirection: 'NNE',
        pop: 5,
        uvIndex: 7,
        pressureHpa: 1014,
        dewPoint: 20,
        visibilityKm: 11.5,
        sunriseTime: '05:42 AM',
        sunsetTime: '06:37 PM',
        morning: { temp: 26, condition: 'Bright Morning', code: 0, pop: 0 },
        afternoon: { temp: 33, condition: 'Sunny Clear', code: 0, pop: 5 },
        evening: { temp: 29, condition: 'Serene Sunset', code: 0, pop: 5 },
        night: { temp: 26, condition: 'Clear', code: 0, pop: 0 },
        jarvisSummary: 'Excellent atmospheric clarity with superior visibility of 11.5 km and low relative humidity.'
      },
      {
        dayName: 'Sat',
        dateStr: '30 Aug',
        fullDate: 'Saturday, 30 August',
        high: 32,
        low: 24,
        hasSun: true,
        hasRain: true,
        condition: 'Passing Showers',
        humidity: 78,
        windSpeed: 16,
        windDirection: 'SSE',
        pop: 45,
        uvIndex: 5,
        pressureHpa: 1010,
        dewPoint: 23,
        visibilityKm: 8.0,
        sunriseTime: '05:42 AM',
        sunsetTime: '06:36 PM',
        morning: { temp: 27, condition: 'Cloudy Sun', code: 2, pop: 20 },
        afternoon: { temp: 32, condition: 'Isolated Showers', code: 80, pop: 45 },
        evening: { temp: 28, condition: 'Breezy Cloud', code: 2, pop: 25 },
        night: { temp: 25, condition: 'Quiet Night', code: 1, pop: 10 },
        jarvisSummary: 'Weekend atmospheric envelope remains balanced with brief afternoon convective showers.'
      },
    ],
    hourly: [
      { time: '12 PM', temp: 31, code: 2, pop: 15 },
      { time: '01 PM', temp: 32, code: 2, pop: 20 },
      { time: '02 PM', temp: 33, code: 2, pop: 25 },
      { time: '03 PM', temp: 33, code: 61, pop: 60 },
      { time: '04 PM', temp: 31, code: 61, pop: 50 },
      { time: '05 PM', temp: 30, code: 2, pop: 35 },
      { time: '06 PM', temp: 29, code: 1, pop: 20 },
      { time: '07 PM', temp: 28, code: 1, pop: 10 },
      { time: '08 PM', temp: 27, code: 0, pop: 5 },
      { time: '09 PM', temp: 26, code: 0, pop: 5 },
      { time: '10 PM', temp: 26, code: 0, pop: 0 },
      { time: '11 PM', temp: 25, code: 0, pop: 0 },
    ],
  });

  // Save recent city searches
  const saveToRecent = useCallback((loc: SavedCityLocation) => {
    setRecentCities(prev => {
      const filtered = prev.filter(c => c.name.toLowerCase() !== loc.name.toLowerCase());
      const updated = [loc, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('jarvis_recent_weather_cities', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const removeRecentCity = (cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentCities(prev => {
      const updated = prev.filter(c => c.name.toLowerCase() !== cityName.toLowerCase());
      try {
        localStorage.setItem('jarvis_recent_weather_cities', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  // Load saved recent cities on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jarvis_recent_weather_cities');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentCities(parsed);
      }
    } catch (e) {}
  }, []);

  // Main Weather Fetching Engine
  const fetchWeather = useCallback(async (
    locationTarget: string | { lat: number; lon: number }, 
    cityName?: string, 
    stateName?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let resolvedTarget = locationTarget;
      let finalCityName = cityName;
      let finalStateName = stateName;

      // 1. Geocode string queries if needed
      if (typeof locationTarget === 'string') {
        const queryClean = locationTarget.trim();
        try {
          const geocoded = await openWeatherService.geocodeCity(queryClean);
          if (geocoded && geocoded.length > 0) {
            const best = geocoded[0];
            resolvedTarget = { lat: best.lat, lon: best.lon };
            finalCityName = best.name;
            finalStateName = best.state || best.country || '';
            saveToRecent(best);
          }
        } catch (geoErr) {
          console.warn('Geocoding resolution fallback:', geoErr);
        }
      } else if (typeof locationTarget === 'object' && cityName) {
        saveToRecent({
          name: cityName,
          state: stateName || '',
          lat: locationTarget.lat,
          lon: locationTarget.lon
        });
      }

      const hasOpenWeatherKey = openWeatherService.hasOpenWeatherCredential();

      if (hasOpenWeatherKey) {
        const report = await openWeatherService.getCombinedWeatherReport(resolvedTarget);
        if (report.success && report.current) {
          setLastReport(report);
          setDataSource('OPENWEATHER_API');

          const cur = report.current;
          const now = new Date();
          const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

          // Transform daily summaries into rich forecast cards
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const forecastList: ForecastDay[] = (report.daily || []).map((d, idx) => {
            const dateObj = new Date();
            dateObj.setDate(now.getDate() + idx);
            const fullDay = daysOfWeek[dateObj.getDay()];
            const dayCode = d.hasRain ? 61 : d.hasSun ? 0 : 2;

            return {
              dayName: idx === 0 ? 'Today' : d.dayName,
              dateStr: idx === 0 ? 'Today' : d.dateStr.split(' ')[0],
              fullDate: `${fullDay}, ${d.dateStr}`,
              high: d.highC,
              low: d.lowC,
              hasSun: d.hasSun,
              hasRain: d.hasRain,
              condition: d.condition,
              humidity: d.humidityAvg,
              windSpeed: d.windSpeedMax,
              windDirection: cur.windDirectionText || 'SW',
              pop: d.popMax || (d.hasRain ? 60 : 10),
              uvIndex: Math.max(3, 8 - idx),
              pressureHpa: cur.pressureHpa,
              dewPoint: cur.tempC - Math.round((100 - d.humidityAvg) / 5),
              visibilityKm: cur.visibilityKm,
              sunriseTime: cur.sunriseTime,
              sunsetTime: cur.sunsetTime,
              morning: { temp: d.lowC + 2, condition: d.hasSun ? 'Sunny' : 'Clear', code: 0, pop: Math.round(d.popMax * 0.3) },
              afternoon: { temp: d.highC, condition: d.condition, code: dayCode, pop: d.popMax },
              evening: { temp: Math.round((d.highC + d.lowC) / 2), condition: 'Mild Breeze', code: 1, pop: Math.round(d.popMax * 0.6) },
              night: { temp: d.lowC, condition: 'Calm Night', code: 0, pop: Math.round(d.popMax * 0.2) },
              jarvisSummary: `${fullDay} in ${finalCityName || cur.city} will reach a high of ${d.highC}°C and low of ${d.lowC}°C with ${d.condition.toLowerCase()}. Precipitation likelihood is ${d.popMax}%.`
            };
          });

          // Transform hourly points (up to 12 points)
          const hourlyPoints: HourlyForecast[] = (report.hourly || []).slice(0, 12).map(h => ({
            time: h.timeStr,
            temp: h.tempC,
            code: h.condition.toLowerCase().includes('rain') ? 61 : h.condition.toLowerCase().includes('clear') ? 0 : 2,
            pop: h.pop,
          }));

          const displayCity = finalCityName || cur.city || 'Detected Device Location';
          const displayState = finalStateName || cur.country || '';

          setWeather(prev => ({
            city: displayCity,
            state: displayState,
            timeStr: timeFormatted,
            tempC: cur.tempC,
            tempF: cur.tempF,
            highC: cur.tempMaxC,
            lowC: cur.tempMinC,
            feelsLikeC: cur.feelsLikeC,
            condition: cur.condition,
            weatherCode: cur.condition.toLowerCase().includes('rain') ? 61 : cur.condition.toLowerCase().includes('clear') ? 0 : 2,
            humidity: cur.humidity,
            windSpeedKm: cur.windSpeedKm,
            windDirection: cur.windDirectionText,
            uvIndex: 5,
            pressureHpa: cur.pressureHpa,
            visibilityKm: cur.visibilityKm,
            dewPointC: cur.tempC - Math.round((100 - cur.humidity) / 5),
            sunriseTime: cur.sunriseTime,
            sunsetTime: cur.sunsetTime,
            aqi: cur.aqi || 'Good (AQI 1)',
            updatedText: 'OpenWeather real-time stream',
            forecast: forecastList.length > 0 ? forecastList : prev.forecast,
            hourly: hourlyPoints.length > 0 ? hourlyPoints : prev.hourly,
          }));
          return;
        } else if (report.error) {
          setErrorMessage(report.error);
        }
      }

      // Meteorological Fallback Stream
      setDataSource(hasOpenWeatherKey ? 'OPEN_METEO_FALLBACK' : 'UNCONFIGURED');
      
      let lat = typeof resolvedTarget === 'object' ? resolvedTarget.lat : 26.8467;
      let lon = typeof resolvedTarget === 'object' ? resolvedTarget.lon : 80.9462;
      let cName = finalCityName || (typeof resolvedTarget === 'string' ? resolvedTarget : 'Device Location');
      let sName = finalStateName || '';

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max,precipitation_probability_max,sunrise,sunset&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto`
      );
      if (!res.ok) throw new Error('Failed to fetch fallback meteorological telemetry');
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

      const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const forecastList: ForecastDay[] = [];

      for (let i = 0; i < 7; i++) {
        const dateObj = new Date();
        dateObj.setDate(now.getDate() + i);
        const dayLabel = i === 0 ? 'Today' : `${daysShort[dateObj.getDay()]}`;
        const dayFullLabel = daysFull[dateObj.getDay()];
        const dateNum = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;
        const dayCode = daily?.weather_code?.[i] ?? 2;
        const dayMax = Math.round(daily?.temperature_2m_max?.[i] ?? cTemp + 2 - i);
        const dayMin = Math.round(daily?.temperature_2m_min?.[i] ?? cTemp - 2 - i);
        const popVal = Math.round(daily?.precipitation_probability_max?.[i] ?? (dayCode >= 51 ? 70 : 15));
        const humVal = Math.min(95, 65 + i * 3);

        const condStr = 
          dayCode === 0 ? 'Clear Sky' :
          dayCode === 1 ? 'Mostly Clear' :
          dayCode === 2 ? 'Partly Cloudy' :
          dayCode === 3 ? 'Overcast Cloudy' :
          dayCode >= 51 && dayCode <= 65 ? 'Rain Showers' :
          dayCode >= 80 ? 'Heavy Downpour' :
          dayCode >= 95 ? 'Thunderstorms' : 'Mild Atmosphere';

        forecastList.push({
          dayName: dayLabel,
          dateStr: dateNum,
          fullDate: `${dayFullLabel}, ${dateNum}`,
          high: dayMax,
          low: dayMin,
          hasSun: dayCode === 0 || dayCode === 1 || dayCode === 2,
          hasRain: dayCode >= 51,
          condition: condStr,
          humidity: humVal,
          windSpeed: 10 + (i % 4) * 2,
          windDirection: 'SW',
          pop: popVal,
          uvIndex: Math.round(daily?.uv_index_max?.[i] ?? 5),
          pressureHpa: Math.round(current?.surface_pressure ?? 1012),
          dewPoint: cTemp - Math.round((100 - humVal) / 5),
          visibilityKm: 10,
          sunriseTime: daily?.sunrise?.[i] ? new Date(daily.sunrise[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '05:40 AM',
          sunsetTime: daily?.sunset?.[i] ? new Date(daily.sunset[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '06:40 PM',
          morning: { temp: dayMin + 2, condition: 'Clear Morning', code: 0, pop: Math.round(popVal * 0.3) },
          afternoon: { temp: dayMax, condition: condStr, code: dayCode, pop: popVal },
          evening: { temp: Math.round((dayMax + dayMin) / 2), condition: 'Mild Air', code: 1, pop: Math.round(popVal * 0.5) },
          night: { temp: dayMin, condition: 'Calm Night', code: 0, pop: Math.round(popVal * 0.2) },
          jarvisSummary: `${dayFullLabel} forecast for ${cName}: Ambient high of ${dayMax}°C, low of ${dayMin}°C with ${condStr.toLowerCase()}. Precipitation index at ${popVal}%.`
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
      else if (code >= 51 && code <= 65) cond = 'Rain Showers';
      else if (code >= 80) cond = 'Heavy Rain';
      else if (code >= 95) cond = 'Thunderstorm';

      const hum = Math.round(current?.relative_humidity_2m ?? 78);

      setWeather(prev => ({
        city: finalCityName || cName,
        state: finalStateName || sName,
        timeStr: timeFormatted,
        tempC: cTemp,
        tempF: fTemp,
        highC: hTemp,
        lowC: lTemp,
        feelsLikeC: feelsLike,
        condition: cond,
        weatherCode: code,
        humidity: hum,
        windSpeedKm: Math.round(current?.wind_speed_10m ?? 14),
        windDirection: 'SW',
        uvIndex: Math.round(daily?.uv_index_max?.[0] ?? 5),
        pressureHpa: Math.round(current?.surface_pressure ?? 1012),
        visibilityKm: 10,
        dewPointC: cTemp - Math.round((100 - hum) / 5),
        sunriseTime: daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '05:38 AM',
        sunsetTime: daily?.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '06:42 PM',
        aqi: 'Moderate (AQI 92)',
        updatedText: 'Fallback meteorological stream',
        forecast: forecastList.length > 0 ? forecastList : prev.forecast,
        hourly: hourlyPoints.length > 0 ? hourlyPoints : prev.hourly,
      }));
    } catch (e: any) {
      console.warn('Weather fetch fallback:', e);
      if (!errorMessage) {
        setErrorMessage(e?.message || 'Unable to retrieve meteorological observation');
      }
    } finally {
      setIsLoading(false);
    }
  }, [errorMessage, saveToRecent]);

  // Initial Auto-Detection of Real Device Location
  useEffect(() => {
    if (autoTrackedRef.current) return;
    autoTrackedRef.current = true;
    let isMounted = true;

    const autoTrackDevice = async () => {
      try {
        const detected = await openWeatherService.detectDeviceLocation();
        if (!isMounted) return;
        if (locationModeRef.current === 'custom') return;

        if (detected.source === 'gps') {
          setLocationMode('live_gps');
        } else if (detected.source === 'ip') {
          setLocationMode('ip_auto');
        }

        activeLocationRef.current = {
          target: { lat: detected.lat, lon: detected.lon },
          city: detected.city,
          state: detected.country
        };
        await fetchWeather({ lat: detected.lat, lon: detected.lon }, detected.city, detected.country);
      } catch (e) {
        console.warn('Auto device track fallback:', e);
        if (isMounted) {
          fetchWeather({ lat: 26.8467, lon: 80.9462 }, 'Lucknow', 'Uttar Pradesh');
        }
      }
    };

    autoTrackDevice();
    return () => { isMounted = false; };
  }, [fetchWeather]);

  // SYSTEMATIC CONTROL: Subscribe to JARVIS Weather Control Service Actions
  useEffect(() => {
    const unsubscribeAction = weatherControlService.subscribeAction((action: WeatherControlAction) => {
      switch (action.type) {
        case 'OPEN_MODAL':
          toggleModal(true);
          break;
        case 'CLOSE_MODAL':
          toggleModal(false);
          break;
        case 'SET_CITY':
          setLocationMode('custom');
          locationModeRef.current = 'custom';
          setSelectedCity({ name: action.city, state: action.state, lat: 0, lon: 0 });
          fetchWeather(action.city, action.city, action.state || '');
          break;
        case 'TRACK_GPS':
          handleUseCurrentGeolocation();
          break;
        case 'SET_UNIT':
          setUnit(action.unit);
          break;
        case 'TOGGLE_UNIT':
          setUnit(prev => prev === 'C' ? 'F' : 'C');
          break;
        case 'SELECT_DAY':
          setSelectedDayIdx(action.index);
          break;
        case 'INSPECT_DAY':
          setSelectedDayIdx(action.index);
          setIsDayDeepDiveOpen(true);
          break;
        case 'CLOSE_DAY_INSPECTION':
          setIsDayDeepDiveOpen(false);
          break;
        case 'TOGGLE_SEARCH':
          setIsSearching(action.open !== undefined ? action.open : !isSearching);
          break;
        case 'TOGGLE_KEY_DRAWER':
          setShowKeyInput(action.open !== undefined ? action.open : !showKeyInput);
          break;
        case 'REFRESH_WEATHER':
          if (activeLocationRef.current) {
            fetchWeather(activeLocationRef.current.target, activeLocationRef.current.city, activeLocationRef.current.state);
          } else {
            fetchWeather({ lat: 26.8467, lon: 80.9462 }, 'Lucknow', 'Uttar Pradesh');
          }
          break;
        case 'SPEAK_WEATHER':
          handleAskJarvis(action.queryType || 'all', action.dayIndex);
          break;
      }
    });

    return () => unsubscribeAction();
  }, [fetchWeather, isSearching, showKeyInput]);

  // Live Location Selection Handler
  const handleSelectLocation = (loc: { name: string; state?: string; country?: string; lat: number; lon: number }) => {
    setLocationMode('custom');
    locationModeRef.current = 'custom';
    setSelectedCity(loc);
    activeLocationRef.current = {
      target: { lat: loc.lat, lon: loc.lon },
      city: loc.name,
      state: loc.state || loc.country
    };
    saveToRecent(loc);
    setIsSearching(false);
    setCustomSearchQuery('');
    setSearchSuggestions([]);
    fetchWeather({ lat: loc.lat, lon: loc.lon }, loc.name, loc.state || loc.country);
  };

  const handleCustomCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    
    if (searchSuggestions.length > 0) {
      handleSelectLocation(searchSuggestions[0]);
      return;
    }

    const query = customSearchQuery.trim();
    setLocationMode('custom');
    locationModeRef.current = 'custom';
    setSelectedCity({ name: query, lat: 0, lon: 0 });
    activeLocationRef.current = {
      target: query,
      city: query,
      state: ''
    };
    setIsSearching(false);
    setCustomSearchQuery('');
    setSearchSuggestions([]);
    await fetchWeather(query, query, '');
  };

  const handleUseCurrentGeolocation = async () => {
    setIsLoading(true);
    setIsSearching(false);
    setCustomSearchQuery('');
    setSearchSuggestions([]);
    try {
      const detected = await openWeatherService.detectDeviceLocation();
      const mode = detected.source === 'gps' ? 'live_gps' : 'ip_auto';
      setLocationMode(mode);
      locationModeRef.current = mode;
      setSelectedCity(null);
      activeLocationRef.current = {
        target: { lat: detected.lat, lon: detected.lon },
        city: detected.city,
        state: detected.country
      };
      await fetchWeather({ lat: detected.lat, lon: detected.lon }, detected.city, detected.country);
    } catch (err: any) {
      setErrorMessage(`Location track failed: ${err.message || 'GPS Signal Timeout'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Live Duplex Voice Mode Trigger
  const handleToggleLiveDuplex = () => {
    if (handleStartLive) {
      handleStartLive();
    } else {
      handleToggleVoiceInput();
    }
  };

  // Browser Web Speech Recognition (Mic Input)
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (isVoiceListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsVoiceListening(false);
      return;
    }

    if (!SpeechRecognition) {
      if (handleStartLive) {
        handleStartLive();
      } else {
        setErrorMessage('Voice recognition not supported in browser. You can type your question directly below.');
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Compatible with Hindi, Hinglish & English

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceTranscript('');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setQuickVoicePrompt(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event);
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
        setVoiceTranscript((prev) => {
          if (prev && prev.trim()) {
            const query = prev.trim();
            if (onSendMessage) {
              onSendMessage(query);
            } else if (onAskJarvisWeather) {
              onAskJarvisWeather(query);
            }
          }
          return '';
        });
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition initiation error:', err);
      setIsVoiceListening(false);
      if (handleStartLive) {
        handleStartLive();
      }
    }
  };

  // Ask JARVIS Vocal Report Handler
  const handleAskJarvis = (queryType: string = 'all', dayIdx?: number) => {
    const targetDay = dayIdx !== undefined ? weather.forecast[dayIdx] : weather.forecast[selectedDayIdx];
    
    let speechPrompt = '';
    if (dayIdx !== undefined && targetDay) {
      speechPrompt = `JARVIS, give me a detailed weather intelligence briefing for ${targetDay.fullDate || targetDay.dayName} in ${weather.city}, ${weather.state}. Temperature range is ${displayTemp(targetDay.high, unit)}°${unit} to ${displayTemp(targetDay.low, unit)}°${unit}, condition is ${targetDay.condition}, rain probability is ${targetDay.pop}%, humidity is ${targetDay.humidity}%. Include practical guidance for Virat Sir in your Charon voice.`;
    } else if (queryType === 'rain_prediction') {
      speechPrompt = `JARVIS, report rain and precipitation probability for ${weather.city}. Current rain probability is ${weather.forecast[0]?.pop || 20}%. Give immediate forecast.`;
    } else {
      if (lastReport && lastReport.success) {
        speechPrompt = openWeatherService.generateJarvisWeatherSpeech(lastReport, queryType);
      } else {
        speechPrompt = `JARVIS, give me a complete detailed weather report for ${weather.city}, ${weather.state}. Current temperature is ${displayTemp(weather.tempC, unit)}°${unit}, condition is ${weather.condition}, feels like ${displayTemp(weather.feelsLikeC, unit)}°${unit}, humidity is ${weather.humidity}%, and wind speed is ${weather.windSpeedKm} km/h.`;
      }
    }

    if (onAskJarvisWeather) {
      onAskJarvisWeather(speechPrompt);
    } else if (onSendMessage) {
      onSendMessage(speechPrompt);
    }
  };

  // Left-Side Quick Command Input Submit
  const handleQuickCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVoicePrompt.trim()) return;
    const prompt = quickVoicePrompt.trim();
    setQuickVoicePrompt('');

    // If query is a direct city name like "Mumbai" or "Tokyo", switch to it directly
    const lower = prompt.toLowerCase();
    if (lower.startsWith('weather in ') || lower.startsWith('forecast for ')) {
      const c = prompt.replace(/^(weather in|forecast for)\s+/i, '');
      fetchWeather(c, c, '');
    } else if (onSendMessage) {
      onSendMessage(prompt);
    } else if (onAskJarvisWeather) {
      onAskJarvisWeather(prompt);
    }
  };

  // API Key Saving
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weatherKeyInput.trim()) return;
    setIsKeySaving(true);
    try {
      openWeatherService.setApiKey(weatherKeyInput.trim());
      setShowKeyInput(false);
      setWeatherKeyInput('');
      if (activeLocationRef.current) {
        fetchWeather(activeLocationRef.current.target, activeLocationRef.current.city, activeLocationRef.current.state);
      }
    } catch (err: any) {
      setErrorMessage(`Key configuration failed: ${err?.message}`);
    } finally {
      setIsKeySaving(false);
    }
  };

  const selectedDay = weather.forecast[selectedDayIdx] || weather.forecast[0];

  return (
    <>
      {/* 1. COMPACT FLOATING TOP-RIGHT BADGE (When Weather modal is closed) */}
      <div className="inline-flex items-center relative z-30">
        <button 
          type="button"
          onClick={() => toggleModal(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950/90 border border-cyan-500/40 text-slate-100 text-xs font-semibold backdrop-blur-xl shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all cursor-pointer group hover:scale-105 active:scale-95"
          title="Click to expand Full Meteorological Atmosphere Workspace"
        >
          <Soft3DCloud
            size="sm"
            hasSun={weather.weatherCode === 1 || weather.weatherCode === 2}
            hasRain={weather.weatherCode >= 51}
          />
          <div className="flex items-center gap-1.5 font-sans">
            <span className="font-bold text-white tracking-tight">{weather.city}:</span>
            <span className="font-extrabold text-cyan-300">
              {displayTemp(weather.tempC, unit)}°{unit}
            </span>
            <span className="text-[10px] text-slate-300 hidden sm:inline">{weather.condition}</span>
          </div>
          <Maximize2 className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform ml-0.5" />
        </button>
      </div>

      {/* 2. FULL WORKSPACE WEATHER MODAL (Edge-to-Edge Full Screen matching System Console Panels) */}
      {isFullOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-[#010814]/98 backdrop-blur-3xl animate-in fade-in duration-300 overflow-hidden font-sans select-none text-white max-h-screen no-scrollbar scrollbar-none">
          
          {/* Soft Radial Ambient Aura Glows (Matching Memory & Task Panels) */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse -z-10" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/12 blur-3xl pointer-events-none -z-10" />

          {/* 1. TOP STATUS & NAVIGATION HUD (EXACT SYSTEM CONSOLE & TASK PANEL STANDARD) */}
          <header className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)] w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
                <CloudSun className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                    METEOROLOGICAL ATMOSPHERE
                  </h1>
                  <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {locationMode === 'live_gps' ? 'LIVE GPS ACTIVE' : locationMode === 'ip_auto' ? 'DEVICE IP AUTO' : 'CUSTOM STATION'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span className="text-white font-bold">{weather.city}{weather.state ? `, ${weather.state}` : ''}</span>
                  <span>•</span>
                  <span>ECMWF & OpenWeather Synced</span>
                  <span>•</span>
                  <span className="text-cyan-400">{weather.tempC}°C ({weather.tempF}°F) • {weather.condition}</span>
                </p>
              </div>
            </div>

            {/* City Switcher + Temperature Unit Switcher + Close Button */}
            <div className="flex items-center gap-2.5">
              {/* City Search Dropdown Trigger */}
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => setIsSearching(!isSearching)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 font-black" />
                  <span>CHANGE CITY</span>
                </button>

                {/* City Search Dropdown Menu */}
                {isSearching && (
                  <div 
                    ref={searchDropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-2 w-80 sm:w-96 p-3 rounded-2xl bg-slate-950/98 border border-cyan-400/60 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl z-50 animate-in fade-in zoom-in-95 duration-150 text-white ring-1 ring-cyan-500/30 no-scrollbar scrollbar-none"
                  >
                    <form onSubmit={handleCustomCitySubmit} className="mb-2">
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50">
                        <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Type any city (e.g. Mumbai, Tokyo, London)..."
                          value={customSearchQuery}
                          onChange={(e) => setCustomSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                          autoFocus
                        />
                        {isSearchingSuggestions && (
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                        )}
                        <button
                          type="submit"
                          disabled={!customSearchQuery.trim()}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-[11px] transition-all shrink-0 cursor-pointer"
                        >
                          Search
                        </button>
                      </div>
                    </form>

                    {/* GPS Location Button */}
                    <button
                      type="button"
                      onClick={handleUseCurrentGeolocation}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 mb-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>Track Real GPS Device Location</span>
                    </button>

                    {/* Preset Popular Locations */}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                      Popular Cities
                    </p>
                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto no-scrollbar scrollbar-none">
                      {POPULAR_CITIES.map((c) => (
                        <button
                          key={`modal-preset-${c.name}`}
                          type="button"
                          onClick={() => handleSelectLocation(c)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-left transition-colors truncate cursor-pointer ${
                            selectedCity?.name === c.name
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                              : 'text-slate-300 hover:bg-cyan-950/50 hover:text-white bg-slate-900/60 border border-white/5 hover:border-cyan-500/30'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Unit Toggle Button (°C / °F) */}
              <button
                type="button"
                onClick={() => {
                  const nextUnit = unit === 'C' ? 'F' : 'C';
                  setUnit(nextUnit);
                  weatherControlService.dispatch({ type: 'SET_UNIT', unit: nextUnit });
                }}
                className="p-2 rounded-xl text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer font-bold text-xs flex items-center gap-1"
                title="Toggle Temperature Unit (°C / °F)"
              >
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span>°{unit}</span>
              </button>

              {/* Refresh weather button */}
              <button
                type="button"
                onClick={() => {
                  if (activeLocationRef.current) {
                    fetchWeather(activeLocationRef.current.target, activeLocationRef.current.city, activeLocationRef.current.state);
                  } else {
                    fetchWeather({ lat: 26.8467, lon: 80.9462 }, 'Lucknow', 'Uttar Pradesh');
                  }
                }}
                disabled={isLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer"
                title="Refresh Weather Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-300' : ''}`} />
              </button>

              {/* Close Weather Workspace Modal */}
              <button
                type="button"
                onClick={() => toggleModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                title="Close Weather (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Alert / Notice Banner if error */}
          {errorMessage && (
            <div className="w-full max-w-4xl mx-auto my-0.5 px-3 py-1 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center justify-between backdrop-blur-md z-10 animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <CloudAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-red-300 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* MAIN BODY: 2-COLUMN BALANCED ZERO-OVERFLOW FULL-SCREEN LAYOUT */}
          <div className="w-full flex-1 px-4 sm:px-6 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-stretch min-h-0 overflow-hidden">
            
            {/* ======================================================== */}
            {/* LEFT COLUMN: WORKABLE JARVIS CORE CONTROL & VOICE HUB     */}
            {/* ======================================================== */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-[#030d1a]/95 border border-cyan-500/35 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,242,255,0.15)] relative overflow-hidden group">
              
              {/* Subtle ambient core glow in background */}
              <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

              {/* JARVIS Core Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20 shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-orbitron font-extrabold text-[11px] tracking-widest text-cyan-300 uppercase">
                    JARVIS CORE // LIVE VOICE
                  </span>
                </div>
                <span className={`flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isLive 
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                    : isVoiceListening
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                      : status === JarvisStatus.SPEAKING
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                        : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isLive ? 'bg-emerald-400 animate-ping' : isVoiceListening ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 animate-pulse'
                  }`} />
                  {isLive ? 'LIVE DUPLEX' : isVoiceListening ? 'LISTENING (MIC)' : status === JarvisStatus.SPEAKING ? 'SPEAKING' : 'ONLINE'}
                </span>
              </div>

              {/* Central Interactive Workable JARVIS Holographic Reactor Orb & Live Voice Hub */}
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-gradient-to-b from-cyan-950/40 to-slate-950/60 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,255,0.15)] shrink-0">
                <div 
                  onClick={handleToggleLiveDuplex}
                  className="flex items-center gap-3 cursor-pointer group/orb"
                  title="Click to Connect / Disconnect Live Voice Core"
                >
                  {/* 3D Animated Orb Sphere */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0 group-hover/orb:scale-105 transition-transform duration-300">
                    {/* Outer spinning dashed ring */}
                    <div className={`absolute inset-0 rounded-full border border-dashed ${
                      isLive ? 'border-emerald-400/90 animate-[spin_4s_linear_infinite]' : isVoiceListening ? 'border-amber-400/90 animate-[spin_5s_linear_infinite]' : 'border-cyan-400/70 animate-[spin_8s_linear_infinite]'
                    }`} />
                    {/* Inner counter-rotating ring */}
                    <div className={`absolute inset-[3px] rounded-full border-2 border-transparent ${
                      isLive ? 'border-t-emerald-300 border-b-emerald-500 animate-[spin_2s_linear_infinite_reverse]' : 'border-t-cyan-300 border-b-cyan-500 animate-[spin_4s_linear_infinite_reverse]'
                    }`} />
                    {/* Glowing Core */}
                    <div className={`w-6 h-6 rounded-full transition-all duration-300 ${
                      isLive 
                        ? 'bg-[radial-gradient(circle_at_30%_30%,#ecfdf5_0%,#10b981_50%,#047857_100%)] shadow-[0_0_15px_#10b981,0_0_25px_rgba(16,185,129,0.7)] animate-pulse'
                        : isVoiceListening
                          ? 'bg-[radial-gradient(circle_at_30%_30%,#fef3c7_0%,#f59e0b_50%,#b45309_100%)] shadow-[0_0_15px_#f59e0b,0_0_25px_rgba(245,158,11,0.7)] animate-ping'
                          : 'bg-[radial-gradient(circle_at_30%_30%,#e0f2fe_0%,#00f2ff_40%,#0284c7_85%,#031937_100%)] shadow-[0_0_12px_#00f2ff,0_0_20px_rgba(0,242,255,0.7)] animate-pulse'
                    }`} />
                  </div>

                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-orbitron font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                        {isLive ? 'LIVE VOICE ACTIVE' : isVoiceListening ? 'LISTENING TO SPEECH' : 'JARVIS VOICE CORE'}
                      </span>
                      <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    </div>
                    
                    {/* Animated Audio Equalizer Waveform Bars */}
                    <div className="flex items-center gap-1 my-1">
                      {[0.4, 0.9, 0.6, 1.0, 0.7, 0.8, 0.5, 0.9].map((heightFactor, i) => (
                        <div
                          key={`eq-${i}`}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isLive 
                              ? 'bg-emerald-400 animate-pulse' 
                              : isVoiceListening
                                ? 'bg-amber-400 animate-bounce'
                                : status === JarvisStatus.SPEAKING
                                  ? 'bg-cyan-400 animate-pulse'
                                  : 'bg-cyan-500/30'
                          }`}
                          style={{
                            height: isLive || isVoiceListening || status === JarvisStatus.SPEAKING
                              ? `${Math.max(4, Math.round(14 * heightFactor * ((micLevel || 30) / 40)))}px`
                              : '4px',
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                      <span className="text-[9px] text-cyan-300/80 font-mono ml-1 font-bold">
                        {isLive ? 'DUPLEX AUDIO 60 FPS' : isVoiceListening ? 'RECORDING MIC' : 'CHARON NEURAL'}
                      </span>
                    </div>

                    <p className="text-[10px] text-cyan-200/70 font-medium truncate">
                      {isLive 
                        ? 'Speak freely — JARVIS will respond live'
                        : isVoiceListening 
                          ? 'Listening... Speak your weather question'
                          : 'Tap below to speak or start live conversation'}
                    </p>
                  </div>
                </div>

                {/* Primary Voice Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-cyan-500/20">
                  {/* 1. Live Duplex Button */}
                  <button
                    type="button"
                    onClick={handleToggleLiveDuplex}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-orbitron font-bold transition-all cursor-pointer shadow-sm ${
                      isLive
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:border-cyan-300'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-spin' : 'text-cyan-400'}`} />
                    <span>{isLive ? 'DISCONNECT LIVE' : 'CONNECT LIVE'}</span>
                  </button>

                  {/* 2. Direct Speech Mic Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-orbitron font-bold transition-all cursor-pointer shadow-sm ${
                      isVoiceListening
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 text-white border border-cyan-400/50 hover:border-cyan-300'
                    }`}
                  >
                    {isVoiceListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 animate-bounce text-slate-950" />
                        <span>STOP MIC</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                        <span>SPEAK VIA MIC</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Live Speech Transcript Pill (If recording) */}
              {(isVoiceListening || voiceTranscript) && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/70 border border-amber-400/50 text-amber-200 text-xs font-medium backdrop-blur-md animate-in fade-in shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="truncate flex-1 font-mono text-[11px]">
                    {voiceTranscript ? `Transcribing: "${voiceTranscript}"` : 'Listening to your voice... Speak now in Hindi or English'}
                  </span>
                  {isVoiceListening && (
                    <button 
                      onClick={() => handleToggleVoiceInput()} 
                      className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 hover:bg-amber-400/40 text-[10px] font-bold"
                    >
                      Done
                    </button>
                  )}
                </div>
              )}

              {/* Fast Weather Voice Directives */}
              <div className="flex flex-col gap-1 shrink-0">
                <span className="text-[10px] font-orbitron font-bold text-cyan-300/80 uppercase tracking-wider px-1">
                  Quick Meteorological Directives
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* 1. Rain & Storm Check */}
                  <button
                    type="button"
                    onClick={() => handleAskJarvis('rain_prediction')}
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/35 hover:border-blue-400 text-blue-200 text-[11px] font-bold transition-all text-left cursor-pointer shadow-sm group/btn"
                  >
                    <CloudRain className="w-3.5 h-3.5 text-blue-400 group-hover/btn:scale-110 transition-transform shrink-0" />
                    <span className="truncate">🌧️ Baarish Check</span>
                  </button>

                  {/* 2. Full Vocal Breakdown */}
                  <button
                    type="button"
                    onClick={() => handleAskJarvis('all')}
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-200 text-[11px] font-bold transition-all text-left cursor-pointer shadow-sm group/btn"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 group-hover/btn:scale-110 transition-transform shrink-0" />
                    <span className="truncate">🔊 Vocal Briefing</span>
                  </button>

                  {/* 3. Re-track Real GPS */}
                  <button
                    type="button"
                    onClick={handleUseCurrentGeolocation}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 hover:border-emerald-400 text-emerald-200 text-[11px] font-bold transition-all text-left cursor-pointer shadow-sm group/btn"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-emerald-400 shrink-0 ${isLoading ? 'animate-spin' : 'group-hover/btn:scale-110 transition-transform'}`} />
                    <span className="truncate">📍 GPS Re-track</span>
                  </button>

                  {/* 4. Unit Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextUnit = unit === 'C' ? 'F' : 'C';
                      setUnit(nextUnit);
                      weatherControlService.dispatch({ type: 'SET_UNIT', unit: nextUnit });
                    }}
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 hover:border-purple-400 text-purple-200 text-[11px] font-bold transition-all text-left cursor-pointer shadow-sm group/btn"
                  >
                    <Thermometer className="w-3.5 h-3.5 text-purple-400 group-hover/btn:scale-110 transition-transform shrink-0" />
                    <span className="truncate">Unit: °{unit}</span>
                  </button>
                </div>
              </div>

              {/* JARVIS Micro Command Input with Direct Mic Control */}
              <form onSubmit={handleQuickCommandSubmit} className="shrink-0">
                <div className="flex items-center gap-1.5 bg-black/70 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50">
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    className={`p-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                      isVoiceListening 
                        ? 'bg-amber-500 text-slate-950 animate-ping' 
                        : 'text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                    title="Tap to speak with Mic"
                  >
                    <Mic className={`w-3.5 h-3.5 ${isVoiceListening ? 'animate-bounce' : 'animate-pulse'}`} />
                  </button>
                  <input
                    type="text"
                    placeholder="Ask JARVIS (e.g. Kal baarish hogi? / Weather in Delhi)..."
                    value={quickVoicePrompt}
                    onChange={(e) => setQuickVoicePrompt(e.target.value)}
                    className="w-full bg-transparent text-[11px] text-white placeholder-cyan-300/40 focus:outline-none font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!quickVoicePrompt.trim()}
                    className="p-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold transition-all cursor-pointer shrink-0"
                    title="Send to JARVIS"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>

              {/* Telemetry Stream Badge */}
              <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300/70 pt-1 border-t border-cyan-500/15 shrink-0">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  {dataSource === 'OPENWEATHER_API' ? 'OpenWeather Live API' : 'Autonomous Fallback'}
                </span>
                <span className="text-slate-400 truncate max-w-[120px]">Lat: {weather.city}</span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT/CENTER: ATMOSPHERIC HERO OR DAY DEEP DIVE VIEW     */}
            {/* ======================================================== */}
            <div className="lg:col-span-8 flex flex-col justify-between p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-lg">
              
              {/* Soft Radial Ambient Aura Glow */}
              <div className="absolute w-52 h-52 rounded-full bg-cyan-500/15 blur-3xl -z-10 animate-pulse pointer-events-none" />

              {!isDayDeepDiveOpen ? (
                /* Standard Real-time Observation Hero */
                <div className="flex flex-col justify-between h-full items-center text-center">
                  
                  {/* Top: 3D Cloud + Temp + Condition */}
                  <div className="flex flex-col items-center justify-center my-auto w-full">
                    <div className="relative flex items-center justify-center my-1 sm:my-2 transform hover:scale-105 transition-transform duration-300">
                      <Soft3DCloud
                        size="hero"
                        hasSun={weather.weatherCode === 1 || weather.weatherCode === 2}
                        hasRain={weather.weatherCode >= 51}
                        weatherCode={weather.weatherCode}
                      />
                    </div>

                    {/* Giant Temperature */}
                    <div className="flex items-start justify-center">
                      <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                        {displayTemp(weather.tempC, unit)}
                      </span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-cyan-300 tracking-tight ml-1">
                        °{unit}
                      </span>
                    </div>

                    {/* Condition Title */}
                    <div className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-md mt-0.5">
                      {weather.condition}
                    </div>

                    {/* Thermal Range */}
                    <div className="text-xs font-semibold text-slate-300 tracking-wide mt-0.5">
                      High <span className="text-white font-bold">{displayTemp(weather.highC, unit)}°{unit}</span> • Low <span className="text-white font-bold">{displayTemp(weather.lowC, unit)}°{unit}</span> • Feels like <span className="text-white font-bold">{displayTemp(weather.feelsLikeC, unit)}°{unit}</span>
                    </div>
                  </div>

                  {/* Meteorological Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-2xl mt-2 pt-2 border-t border-white/5 shrink-0">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 backdrop-blur-md text-xs font-medium border border-white/5">
                      <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div className="flex flex-col text-left truncate">
                        <span className="text-slate-400 text-[9px] uppercase font-bold">Humidity</span>
                        <span className="text-white font-bold text-xs">{weather.humidity}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 backdrop-blur-md text-xs font-medium border border-white/5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div className="flex flex-col text-left truncate">
                        <span className="text-slate-400 text-[9px] uppercase font-bold">Wind</span>
                        <span className="text-white font-bold text-xs">{weather.windSpeedKm} km/h {weather.windDirection}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 backdrop-blur-md text-xs font-medium border border-white/5">
                      <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="flex flex-col text-left truncate">
                        <span className="text-slate-400 text-[9px] uppercase font-bold">UV Index</span>
                        <span className="text-white font-bold text-xs">{weather.uvIndex} (Mod)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 backdrop-blur-md text-xs font-medium border border-white/5">
                      <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="flex flex-col text-left truncate">
                        <span className="text-slate-400 text-[9px] uppercase font-bold">Air Quality</span>
                        <span className="text-white font-bold text-xs">{weather.aqi}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Expanded Day Deep Dive Inspection (Inline inside Right Column, ZERO extra page scroll!) */
                selectedDay && (
                  <div className="flex flex-col justify-between h-full w-full animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-orbitron font-extrabold text-cyan-300">
                          {selectedDay.fullDate || selectedDay.dayName} // INSPECTION
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                          High {displayTemp(selectedDay.high, unit)}° / Low {displayTemp(selectedDay.low, unit)}°
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAskJarvis('all', selectedDayIdx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/40 cursor-pointer shadow-sm"
                          title="Vocalize this specific day forecast"
                        >
                          <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                          <span>Vocalize</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDayDeepDiveOpen(false)}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold transition-colors"
                          title="Back to current observation"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>

                    {/* 4-Segment Progression (Morning, Afternoon, Evening, Night) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1.5">
                      {[
                        { label: 'Morning (08:00)', data: selectedDay.morning, icon: Sun },
                        { label: 'Afternoon (14:00)', data: selectedDay.afternoon, icon: CloudSun },
                        { label: 'Evening (18:00)', data: selectedDay.evening, icon: Sunset },
                        { label: 'Night (22:00)', data: selectedDay.night, icon: Sunrise },
                      ].map((seg, i) => (
                        <div key={i} className="flex flex-col p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{seg.label}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-black text-white">{displayTemp(seg.data?.temp || selectedDay.high, unit)}°{unit}</span>
                            <span className="text-[10px] font-bold text-cyan-300 truncate max-w-[70px]">{seg.data?.condition}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-300 font-mono">
                            <CloudRain className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Rain: {seg.data?.pop || 10}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Atmospheric Vital Metrics + JARVIS Assessment Note */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1.5 border-t border-white/10 items-center shrink-0">
                      {/* Metric Chips */}
                      <div className="md:col-span-6 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                          💧 Humidity: <b className="text-white">{selectedDay.humidity}%</b>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                          💨 Wind: <b className="text-white">{selectedDay.windSpeed} km/h</b>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                          ☀️ UV: <b className="text-amber-300">{selectedDay.uvIndex || 5}</b>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                          🌅 Sunrise: <b className="text-white">{selectedDay.sunriseTime || '05:38 AM'}</b>
                        </span>
                      </div>

                      {/* JARVIS Assessment Speech Box */}
                      <div className="md:col-span-6 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-200 flex items-start gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <p className="leading-snug line-clamp-2">
                          <b className="text-cyan-300">JARVIS:</b> {selectedDay.jarvisSummary || 'Atmospheric parameters nominal.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* BOTTOM SECTION: DETAILED & CAPABLE 7-DAY FORECAST CARDS   */}
          {/* ======================================================== */}
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-1.5 z-10 shrink-0 pt-1 border-t border-white/10">
            
            {/* Header with quick action info */}
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-extrabold text-slate-300 uppercase tracking-widest px-1">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                7-Day Meteorological Intelligence
              </span>
              <span className="text-[10px] font-medium text-slate-400 normal-case hidden sm:inline">
                Click any day card to inspect hourly breakdown & JARVIS assessment
              </span>
            </div>

            {/* Highly Detailed 7-Day Forecast Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weather.forecast.map((item, idx) => {
                const isSelected = selectedDayIdx === idx && isDayDeepDiveOpen;
                return (
                  <button
                    key={`day-${idx}-${item.dayName}`}
                    type="button"
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      setIsDayDeepDiveOpen(true);
                      weatherControlService.dispatch({ type: 'SELECT_DAY', index: idx });
                    }}
                    className={`flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border text-left group relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/90 to-slate-900/95 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,255,0.35)] ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/70 hover:bg-slate-900/80 border-white/10 hover:border-cyan-500/40 text-slate-200 backdrop-blur-md hover:scale-[1.02]'
                    }`}
                  >
                    {/* Top Tag: Day Name & Date */}
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-[10px] sm:text-xs font-black tracking-tight ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                        {item.dayName}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                        {item.dateStr}
                      </span>
                    </div>

                    {/* 3D Weather Cloud */}
                    <div className="my-1 group-hover:scale-110 transition-transform">
                      <Soft3DCloud
                        size="sm"
                        hasSun={item.hasSun}
                        hasRain={item.hasRain}
                      />
                    </div>

                    {/* Condition Text */}
                    <span className="text-[9px] sm:text-[10px] font-bold text-center leading-none truncate w-full text-slate-200">
                      {item.condition}
                    </span>

                    {/* High / Low Temperature with Visual Gradient Thermal Bar */}
                    <div className="w-full flex items-center justify-between mt-1 pt-1 border-t border-white/10 text-[9px] sm:text-[11px] font-black">
                      <span className="text-white">{displayTemp(item.high, unit)}°</span>
                      <div className="flex-1 mx-1 h-1 rounded-full bg-slate-800 overflow-hidden relative">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-amber-400"
                          style={{ width: `${Math.min(100, Math.max(30, item.high * 2.5))}%` }}
                        />
                      </div>
                      <span className="text-slate-400 font-bold">{displayTemp(item.low, unit)}°</span>
                    </div>

                    {/* Micro Metrics Badges Grid on Card */}
                    <div className="w-full grid grid-cols-2 gap-0.5 mt-1 pt-0.5 border-t border-white/5 text-[8px] sm:text-[9px] font-mono">
                      <div className="flex items-center gap-0.5 text-cyan-300 truncate" title="Precipitation Probability">
                        <CloudRain className="w-2 h-2 shrink-0" />
                        <span>{item.pop}%</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-slate-300 truncate" title="Wind Speed">
                        <Wind className="w-2 h-2 shrink-0 text-slate-400" />
                        <span>{item.windSpeed}k</span>
                      </div>
                    </div>

                    {/* Selected Active Indicator */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-bl-md shadow-[0_0_8px_#00f2ff]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Telemetry Footer Status */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] sm:text-[10px] text-slate-400">
              <span className={`flex items-center gap-1 font-semibold ${
                dataSource === 'OPENWEATHER_API' 
                  ? 'text-emerald-400' 
                  : 'text-cyan-400'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                <span>JARVIS METEOROLOGICAL TELEMETRY ENGINE ACTIVE</span>
              </span>
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">ESC</kbd> or click X to return
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default WeatherPanel;
