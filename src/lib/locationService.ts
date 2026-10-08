/**
 * Layanan GPS, Geocoding, dan Cuaca Real-Time.
 * Menggunakan browser Geolocation API + BigDataCloud reverse geocode + Open-Meteo live weather API.
 */

export interface UserLocationData {
  city: string;
  locality?: string;
  country: string;
  lat: number;
  lon: number;
  weatherText?: string;
  temperature?: number;
  condition?: string;
  lastUpdated: number;
}

const LOCATION_STORAGE_KEY = "waguri_cached_user_location";

// Konversi WMO Weather Code ke deskripsi bahasa Indonesia santai
export function decodeWeatherCode(code: number): string {
  switch (code) {
    case 0:
      return "cerah";
    case 1:
      return "sebagian besar cerah";
    case 2:
      return "cerah berawan";
    case 3:
      return "berawan tebal";
    case 45:
    case 48:
      return "berkabut";
    case 51:
    case 53:
    case 55:
      return "gerimis santai";
    case 61:
      return "hujan ringan";
    case 63:
      return "hujan sedang";
    case 65:
      return "hujan lebat";
    case 80:
    case 81:
    case 82:
      return "hujan deras";
    case 95:
    case 96:
    case 99:
      return "hujan badai petir";
    default:
      return "berawan";
  }
}

/** Ambil data lokasi terakhir yang tersimpan di cache lokal */
export function getCachedUserLocation(): UserLocationData | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserLocationData;
  } catch {
    return null;
  }
}

/** Simpan data lokasi ke cache lokal */
export function setCachedUserLocation(data: UserLocationData): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Gagal menyimpan cache lokasi:", err);
  }
}

/** Ambil cuaca terkini dari Open-Meteo untuk koordinat tertentu */
export async function fetchLiveWeather(lat: number, lon: number): Promise<{
  weatherText: string;
  temperature: number;
  condition: string;
} | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    const current = json.current;
    if (!current) return null;

    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature ?? temp);
    const condition = decodeWeatherCode(current.weather_code ?? 0);
    const humidity = current.relative_humidity_2m ?? 0;
    const wind = Math.round(current.wind_speed_10m ?? 0);

    const weatherText = `Suhu ${temp}°C (terasa ${feelsLike}°C), kondisi ${condition}, kelembapan ${humidity}%, kecepatan angin ${wind} km/jam`;
    return {
      weatherText,
      temperature: temp,
      condition,
    };
  } catch (err) {
    console.warn("Gagal mengambil data cuaca Open-Meteo:", err);
    return null;
  }
}

/** Ambil nama kota dari koordinat menggunakan BigDataCloud API */
export async function reverseGeocode(lat: number, lon: number): Promise<{
  city: string;
  locality?: string;
  country: string;
}> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || "Kota Kamu";
      const locality = data.locality || data.principalSubdivision || "";
      const country = data.countryName || "Indonesia";
      return { city, locality, country };
    }
  } catch (err) {
    console.warn("Reverse geocode BigDataCloud error:", err);
  }

  // Fallback nama kota dari timezone browser
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const tzCity = tz.split("/")[1]?.replace(/_/g, " ") || "Indonesia";
  return { city: tzCity, country: "Indonesia" };
}

/** Minta izin GPS dan perbarui data lokasi serta cuaca terkini */
export async function requestAndRefreshLocation(): Promise<UserLocationData> {
  if (!("geolocation" in navigator)) {
    throw new Error("Perangkat tidak mendukung GPS/Geolocation.");
  }

  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 10 * 60 * 1000, // cache 10 menit
    });
  });

  const lat = Number(pos.coords.latitude.toFixed(4));
  const lon = Number(pos.coords.longitude.toFixed(4));

  const geo = await reverseGeocode(lat, lon);
  const weather = await fetchLiveWeather(lat, lon);

  const locData: UserLocationData = {
    city: geo.city,
    locality: geo.locality,
    country: geo.country,
    lat,
    lon,
    weatherText: weather?.weatherText,
    temperature: weather?.temperature,
    condition: weather?.condition,
    lastUpdated: Date.now(),
  };

  setCachedUserLocation(locData);
  return locData;
}

/**
 * Buat string konteks lokasi & cuaca real-time untuk diinjeksi ke AI.
 * Jika lokasi belum diambil atau izin belum diberikan, gunakan deteksi timezone lokal.
 */
export async function getLiveLocationContextString(
  enabled: boolean = true
): Promise<string | null> {
  if (!enabled) return null;

  let loc = getCachedUserLocation();

  // Jika cache sudah lebih dari 2 jam atau belum ada cuaca, coba perbarui di background
  const isOld = !loc || Date.now() - loc.lastUpdated > 2 * 60 * 60 * 1000;

  if (!loc && "geolocation" in navigator) {
    try {
      loc = await requestAndRefreshLocation();
    } catch {
      // User mungkin menolak atau belum izinkan, fallback ke timezone
    }
  } else if (isOld && loc) {
    // Refresh weather asynchronously
    fetchLiveWeather(loc.lat, loc.lon).then((w) => {
      if (w && loc) {
        loc.weatherText = w.weatherText;
        loc.temperature = w.temperature;
        loc.condition = w.condition;
        loc.lastUpdated = Date.now();
        setCachedUserLocation(loc);
      }
    }).catch(() => {});
  }

  if (loc) {
    let text = `Lokasi pengguna: ${loc.city}${loc.locality && loc.locality !== loc.city ? ` (${loc.locality})` : ""}, ${loc.country} (lat: ${loc.lat}, lon: ${loc.lon}).`;
    if (loc.weatherText) {
      text += ` Cuaca real-time saat ini di kota pengguna: ${loc.weatherText}.`;
    }
    return text;
  }

  // Fallback timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  return `Lokasi zona waktu pengguna: ${tz}.`;
}
