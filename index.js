// Weather Forecast App JS
const API_KEY = 'c974972d9e35038f0407f85fcb4d5416';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const unitToggle = document.getElementById('unit-toggle');
const errorMessage = document.getElementById('error-message');

// Recent Cities Dropdown Elements
const recentDropdown = document.getElementById('recent-dropdown');
const recentBtn = recentDropdown.querySelector('button');
const recentList = document.getElementById('recent-list');

let currentUnit = 'metric'; // 'metric' for °C, 'imperial' for °F

// --- RECENT CITIES LOGIC ---

function getRecentCities() {
  return JSON.parse(localStorage.getItem('recentCities') || '[]');
}
function setRecentCities(cities) {
  localStorage.setItem('recentCities', JSON.stringify(cities));
}
function renderRecentCities() {
  const cities = getRecentCities();
  recentList.innerHTML = '';
  if (cities.length === 0) {
    recentDropdown.classList.add('hidden');
    return;
  }
  recentDropdown.classList.remove('hidden');
  recentList.classList.add('hidden'); // Always start hidden
  cities.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.className = 'px-4 py-2 hover:bg-blue-100 cursor-pointer';
    li.onclick = (e) => {
      e.stopPropagation();
      cityInput.value = city;
      fetchWeatherByCity(city);
      recentList.classList.add('hidden');
    };
    recentList.appendChild(li);
  });
}
function addRecentCity(city) {
  let cities = getRecentCities();
  cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());
  cities.unshift(city);
  if (cities.length > 5) cities = cities.slice(0, 5);
  setRecentCities(cities);
  renderRecentCities();
}


// Toggle dropdown open/close
recentBtn.onclick = (e) => {
  e.stopPropagation();
  recentList.classList.toggle('hidden');
};
// Close dropdown when clicking outside
document.addEventListener('click', () => {
  recentList.classList.add('hidden');
});
// On page load, render recent cities
document.addEventListener('DOMContentLoaded', renderRecentCities);

// --- SEARCH LOGIC ---

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError('Please enter a city name.');
    return;
  }
  fetchWeatherByCity(city);
  addRecentCity(city);
});

locationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => showError('Unable to get your location.')
    );
  } else {
    showError('Geolocation is not supported.');
  }
});

unitToggle.addEventListener('click', () => {
  currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
  unitToggle.textContent = currentUnit === 'metric' ? '°C' : '°F';
  // Re-fetch weather for current city or location
  const city = document.getElementById('city-name').textContent;
  if (city && city !== 'City Name') {
    fetchWeatherByCity(city);
  }
});

function fetchWeatherByCity(city) {
  errorMessage.classList.add('hidden');
  fetch(`${BASE_URL}weather?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.cod === 401) {
        showError('Invalid API key. Please check your OpenWeatherMap API key.');
        return;
      }
      if (data.cod !== 200) {
        showError(data.message);
        return;
      }
      updateCurrentWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
    })
    .catch(() => showError('Failed to fetch weather data.'));
}

function fetchWeatherByCoords(lat, lon) {
  errorMessage.classList.add('hidden');
  fetch(`${BASE_URL}weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.cod === 401) {
        showError('Invalid API key. Please check your OpenWeatherMap API key.');
        return;
      }
      if (data.cod !== 200) {
        showError(data.message);
        return;
      }
      updateCurrentWeather(data);
      fetchForecast(lat, lon);
      addRecentCity(data.name);
    })
    .catch(() => showError('Failed to fetch weather data.'));
}

function fetchForecast(lat, lon) {
  fetch(`${BASE_URL}forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== '200') {
        showError('Failed to fetch forecast.');
        return;
      }
      updateForecast(data);
    })
    .catch(() => showError('Failed to fetch forecast.'));
}

function updateCurrentWeather(data) {
  document.getElementById('city-name').textContent = data.name;
  document.getElementById('country').textContent = data.sys.country;
  document.getElementById('date').textContent = new Date().toLocaleDateString();
  document.getElementById('temperature').textContent = Math.round(data.main.temp);
  document.getElementById('description').textContent = data.weather[0].description;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('wind').textContent = `${data.wind.speed} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
  document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  // Update city input value to current city
  if (cityInput) cityInput.value = data.name;

  // Extreme temperature alert
  const alertBox = document.getElementById('alert');
  if ((currentUnit === 'metric' && data.main.temp > 40) || (currentUnit === 'imperial' && data.main.temp > 104)) {
    alertBox.textContent = 'Extreme temperature alert!';
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }
// Set video background according to weather
  setAppBackground(data.weather[0].main.toLowerCase());
}