import { useState, useEffect, useRef } from 'react';

// ── OpenWeatherMap Free API ──────────────────────────────────────────────────
// Sign up at https://openweathermap.org/api to get your free API key
// Free tier: 1,000 calls/day, 60 calls/minute
const OWM_API_KEY = import.meta.env.VITE_OWM_API_KEY || '';

// In-memory cache to avoid redundant API calls
const weatherCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(null); // track what we last fetched

  useEffect(() => {
    if (!OWM_API_KEY || !lat || !lng) return;

    // Round coords to 2 decimals for cache key (nearby temples share weather)
    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

    // Skip if we already fetched this exact location
    if (fetchedRef.current === cacheKey && weather) return;

    // Check cache
    const cached = weatherCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setWeather(cached.data);
      fetchedRef.current = cacheKey;
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OWM_API_KEY}&units=metric`,
      { signal: controller.signal }
    )
      .then(res => res.json())
      .then(data => {
        if (data.cod === 200) {
          const parsed = {
            temp: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind_speed: Math.round(data.wind.speed * 3.6), // m/s → km/h
            description: data.weather[0]?.description || '',
            icon: data.weather[0]?.icon || '01d',
            main: data.weather[0]?.main || '',
            visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // metres → km
          };
          weatherCache[cacheKey] = { data: parsed, timestamp: Date.now() };
          setWeather(parsed);
          fetchedRef.current = cacheKey;
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('Weather API error:', err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lng]);

  return { weather, loading };
}
