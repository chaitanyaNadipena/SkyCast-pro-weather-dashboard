const API_KEY = "2cd17ba1588887db7d809dc0ebb9613d";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/* =========================
   DOM REFERENCES
========================= */
const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const weatherContent = document.getElementById("weatherContent");
const currentDateBadge = document.getElementById("currentDateBadge");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const weatherIcon = document.getElementById("weatherIcon");
const weatherCondition = document.getElementById("weatherCondition");
const weatherDescription = document.getElementById("weatherDescription");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const updatedTime = document.getElementById("updatedTime");
const tempMax = document.getElementById("tempMax");
const tempMin = document.getElementById("tempMin");
const pressure = document.getElementById("pressure");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const visibility = document.getElementById("visibility");
const sunrise = document.getElementById("sunrise");
const weatherInsight = document.getElementById("weatherInsight");
const weatherStatusBadge = document.getElementById("weatherStatusBadge");
const visualTitle = document.getElementById("visualTitle");
const todayOutlook = document.getElementById("todayOutlook")

const quickCityButtons = document.querySelectorAll(".quick-city-btn");

/* Map detail panel */
const mapPlaceName = document.getElementById("mapPlaceName");
const mapPlaceSubtext = document.getElementById("mapPlaceSubtext");
const mapLat = document.getElementById("mapLat");
const mapLon = document.getElementById("mapLon");
const mapTemp = document.getElementById("mapTemp");
const mapCondition = document.getElementById("mapCondition");
const mapHumidity = document.getElementById("mapHumidity");
const mapWind = document.getElementById("mapWind");

/* Rating */
const starButtons = document.querySelectorAll(".star-btn");
const ratingMessage = document.getElementById("ratingMessage");

/* =========================
   STATE
========================= */
let weatherMap = null;
let mapMarker = null;

/* =========================
   HEADER DATE
========================= */
function updateHeaderDate() {
  const now = new Date();

  currentDateBadge.textContent = now.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* =========================
   UI STATES
========================= */
function showLoading() {
  loadingState.classList.remove("hidden");
  errorState.classList.add("hidden");
  weatherContent.classList.add("hidden");

  searchBtn.disabled = true;
  searchBtn.textContent = "Loading...";
}

function showError(message) {
  loadingState.classList.add("hidden");
  weatherContent.classList.add("hidden");
  errorState.classList.remove("hidden");

  errorMessage.textContent = message;
  searchBtn.disabled = false;
  searchBtn.textContent = "Search Weather";
}

function showWeather() {
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  weatherContent.classList.remove("hidden");

  searchBtn.disabled = false;
  searchBtn.textContent = "Search Weather";
}

/* =========================
   HELPERS
========================= */
function formatTime(unixTime, timezoneOffset) {
  const utcMilliseconds = unixTime * 1000;
  const localTime = new Date(utcMilliseconds + timezoneOffset * 1000);

  return localTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function formatCoordinate(value, type = "lat") {
  if (typeof value !== "number") return "--";

  const direction =
    type === "lat"
      ? value >= 0
        ? "N"
        : "S"
      : value >= 0
      ? "E"
      : "W";

  return `${Math.abs(value).toFixed(3)}° ${direction}`;
}

function getWeatherStatus(data) {
  const condition = data.weather[0].main.toLowerCase();
  const temp = Math.round(data.main.temp);

  if (condition.includes("thunder")) return "Storm Alert";
  if (condition.includes("rain")) return "Rainy";
  if (condition.includes("cloud")) return "Cloudy";
  if (condition.includes("clear") && temp >= 32) return "Sunny";
  if (condition.includes("clear")) return "Clear";
  if (temp <= 18) return "Cool";
  return "Stable";
}

function getVisualTitle(data) {
  const condition = data.weather[0].main.toLowerCase();

  if (condition.includes("rain")) return "Current Rain Summary";
  if (condition.includes("cloud")) return "Current Cloud Summary";
  if (condition.includes("clear")) return "Current Clear Sky Summary";
  if (condition.includes("mist") || condition.includes("fog")) return "Current Visibility Summary";
  return "Current Weather Summary";
}

/* =========================
   KEEP SAME SUNSET THEME
   (No random background changes)
========================= */
function getWeatherTheme() {
  return {
    image:
      "https://images.stockcake.com/public/f/7/d/f7d1bd4a-a856-4f3a-a581-6cb7ad2022f3_large/clouds-paint-sunset-stockcake.jpg",
    overlay:
      "linear-gradient(145deg, rgba(24, 10, 12, 0.26), rgba(24, 10, 12, 0.48))",
  };
}

/* =========================
   WEATHER SUMMARY
========================= */
function buildInsight(data) {
  const temp = Math.round(data.main.temp);
  const feels = Math.round(data.main.feels_like);
  const humidityValue = data.main.humidity;
  const windValue = Math.round(data.wind.speed * 3.6);
  const description = data.weather[0].description;
  const city = data.name;

  return `${city} currently has ${description} conditions with a temperature of ${temp}°C, feels like ${feels}°C, humidity at ${humidityValue}% and wind speed of ${windValue} km/h.`;
}
function buildTodayOutlook(data) {
  const temp = Math.round(data.main.temp);
  const condition = data.weather[0].main.toLowerCase();
  const humidity = data.main.humidity;
  const wind = Math.round(data.wind.speed * 3.6);

  if (condition.includes("rain")) {
    return "Light rain is expected today. Carry an umbrella and allow extra travel time.";
  }

  if (condition.includes("thunder")) {
    return "Thunderstorms are likely today. Stay indoors during lightning activity.";
  }

  if (condition.includes("clear")) {
    return `Clear skies with temperatures around ${temp}°C. Great conditions for outdoor activities.`;
  }

  if (condition.includes("cloud")) {
    return `Mostly cloudy with temperatures around ${temp}°C. Comfortable weather with ${humidity}% humidity and gentle ${wind} km/h winds.`;
  }

  return `Pleasant weather is expected today with temperatures near ${temp}°C.`;
}

/* =========================
   WEATHER RENDER
========================= */
function renderWeather(data) {
  cityName.textContent = data.name;
  countryName.textContent = data.sys.country;
  weatherCondition.textContent = data.weather[0].main;
  weatherDescription.textContent = data.weather[0].description;

  temperature.textContent = Math.round(data.main.temp);
  feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  tempMax.textContent = `${Math.round(data.main.temp_max)}°C`;
  tempMin.textContent = `${Math.round(data.main.temp_min)}°C`;
  pressure.textContent = `${data.main.pressure} hPa`;

  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);

  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIcon.alt = data.weather[0].description;

  updatedTime.textContent = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  weatherStatusBadge.textContent = getWeatherStatus(data);
  visualTitle.textContent = getVisualTitle(data);
  weatherInsight.textContent = buildInsight(data);
  todayOutlook.textContent = buildTodayOutlook(data);

  applyWeatherTheme();
  showWeather();
}

function applyWeatherTheme() {
  const weatherMainPanel = document.getElementById("weatherMainPanel");
  if (!weatherMainPanel) return;

  const theme = getWeatherTheme();

  weatherMainPanel.style.background = `
    ${theme.overlay},
    url("${theme.image}") center / cover no-repeat
  `;
}

/* =========================
   MAP DETAIL PANEL
========================= */
function updateMapDetails(data) {
  if (!mapPlaceName) return;

  mapPlaceName.textContent = `${data.name}, ${data.sys.country}`;
  mapPlaceSubtext.textContent = `${data.weather[0].main} • ${data.weather[0].description}`;

  mapLat.textContent = formatCoordinate(data.coord.lat, "lat");
  mapLon.textContent = formatCoordinate(data.coord.lon, "lon");
  mapTemp.textContent = `${Math.round(data.main.temp)}°C`;
  mapCondition.textContent = data.weather[0].main;
  mapHumidity.textContent = `${data.main.humidity}%`;
  mapWind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
}

/* =========================
   API CALLS
========================= */
async function fetchWeather(city) {
  if (!city.trim()) {
    showError("Please enter a city name before searching.");
    return;
  }

  showLoading();

  try {
    let queryCity = city.trim();

    /* Fix for India search */
    if (queryCity.toLowerCase() === "india") {
      queryCity = "New Delhi";
    }

    const response = await fetch(
      `${BASE_URL}?q=${encodeURIComponent(queryCity)}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("City not found. Please enter a valid city name.");
      }
      throw new Error("Unable to fetch weather data right now. Please try again.");
    }

    const data = await response.json();

    renderWeather(data);
    updateMapDetails(data);

    if (weatherMap) {
      weatherMap.setView([data.coord.lat, data.coord.lon], 8);
      updateMapMarker(data.coord.lat, data.coord.lon, data.name, data.weather[0].main);
    }
  } catch (error) {
    console.error("City weather fetch error:", error);
    showError(error.message || "Something went wrong while fetching weather data.");
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showLoading();

  try {
    const response = await fetch(
      `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("Unable to fetch weather for the selected map location.");
    }

    const data = await response.json();

    renderWeather(data);
    updateMapDetails(data);
    updateMapMarker(lat, lon, data.name, data.weather[0].main);
  } catch (error) {
    console.error("Map weather fetch error:", error);
    showError(error.message || "Unable to fetch map weather details.");
  }
}

/* =========================
   MAP
========================= */
function updateMapMarker(lat, lon, placeName = "Selected Location", condition = "Weather") {
  if (!weatherMap) return;

  if (mapMarker) {
    weatherMap.removeLayer(mapMarker);
  }

  mapMarker = L.marker([lat, lon]).addTo(weatherMap);
  mapMarker.bindPopup(`<strong>${placeName}</strong><br>${condition}`).openPopup();
}

function initializeMap() {
  const mapContainer = document.getElementById("weatherMap");
  if (!mapContainer || typeof L === "undefined") return;

  weatherMap = L.map("weatherMap", {
    zoomControl: true,
    attributionControl: true,
  }).setView([20.5937, 78.9629], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(weatherMap);

  weatherMap.on("click", async (event) => {
    const { lat, lng } = event.latlng;
    await fetchWeatherByCoords(lat, lng);
  });
}


/* =========================
   RATING
========================= */
function initializeRating() {
  if (!starButtons.length || !ratingMessage) return;

  starButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const rating = Number(button.dataset.rate);

      starButtons.forEach((star) => {
        const starValue = Number(star.dataset.rate);
        if (starValue <= rating) {
          star.classList.add("active");
        } else {
          star.classList.remove("active");
        }
      });

      ratingMessage.textContent = `Thank you! You rated this app ${rating}/5.`;
    });
  });
}

/* =========================
   CONNECT LINKS
========================= */
function initializeConnectLinks() {
  const connectButtons = document.querySelectorAll(".connect-btn");

  if (connectButtons.length >= 2) {
    connectButtons[0].href = "https://github.com/chaitanyaNadipena";
    connectButtons[1].href = "https://www.linkedin.com/in/nadipena-chaitanya-585892417/";
  }
}

/* =========================
   EVENTS
========================= */
weatherForm.addEventListener("submit", (event) => {
  event.preventDefault();
  fetchWeather(cityInput.value);
});

quickCityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCity = button.dataset.city;
    cityInput.value = selectedCity;
    fetchWeather(selectedCity);
  });
});

/* =========================
   INIT
========================= */
updateHeaderDate();
initializeMap();
initializeRating();
initializeConnectLinks();
fetchWeather("Hyderabad");