# JARVIS Full-Screen Meteorological Atmosphere Console
**Document:** `docs/METEOROLOGICAL_CONSOLE.md`  
**Version:** 5.0.0-PRO  
**Classification:** Subsystem Technical Specification  
**Current Date:** August 21, 2026  

---

## 1. Overview & Architecture

The **Meteorological Atmosphere Console** (`components/WeatherModal.tsx`) provides real-time global weather telemetry and situational awareness. It is engineered with an edge-to-edge 3D Canvas visualizer, Open-Meteo live API streaming, and dynamic atmospheric aura lighting.

---

## 2. Core Features & Telemetry Matrices

1. **Live Atmospheric Data Points:**
   - Real-time temperature & apparent heat index ("feels like").
   - Precipitation probability and rain accumulation volume.
   - Wind speed and direction with wind gust monitoring.
   - Relative humidity and dew point.
   - UV index with ultraviolet safety indicators.
   - Atmospheric barometric pressure.
   - Visibility distance (km).
   - Air Quality Index (AQI).
   - Sun status: sunrise, sunset, and solar position angle.

2. **3D Atmospheric Canvas Renderer:**
   - High-performance HTML5 Canvas simulation rendering 5 distinctive particle systems:
     - **Rain / Drizzle:** Vectorized velocity-based water streaks with splash ripples.
     - **Snow / Ice:** Multi-scale tumbling hexagonal snowflake physics.
     - **Thunderstorm:** Randomized electric discharge arcs and viewport flash illumination.
     - **Cloud Drifts:** Soft semi-transparent volumetric fog matrices.
     - **Sunny / Clear:** Radiant solar flare corona and shimmering light shafts.

3. **Dynamic Atmospheric Aura Lighting:**
   - Real-time ambient radial glow behind the viewport matching the active weather state:
     - Clear/Sunny $\rightarrow$ Solar Amber Glow (`#f59e0b`)
     - Rain $\rightarrow$ Deep Cyan/Indigo Aura (`#06b6d4`)
     - Thunder $\rightarrow$ Electric Violet Arc (`#8b5cf6`)
     - Snow $\rightarrow$ Ice Blue Shimmer (`#bae6fd`)
     - Overcast $\rightarrow$ Slate Mist Aura (`#94a3b8`)

4. **Forecast Matrices:**
   - **24-Hour Hourly Trendline:** Smooth temperature curves, precipitation bars, and condition icons.
   - **7-Day Extended Forecast:** High/low temperature ranges, weather descriptions, and precipitation chance.

5. **Severe Weather Sentinel:**
   - Automated alerts for high wind shear, extreme UV index, heavy precipitation, and severe storms.

---

## 3. Keyboard & Voice Commands

- **Voice Command:** *"JARVIS, open weather"* or *"What's the weather in Tokyo?"*
- **HUD Trigger:** Click the Weather button in the top HUD status bar.
- **Escape Key (`Esc`):** Closes the full-screen console smoothly.
