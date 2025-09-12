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

function setAppBackground(condition) {
  // Change video background according to weather
  const video = document.getElementById('weather-video');
  let src = 'Weather_forecast\videos\clear.mp4'; // Default
  switch (condition) {
    case 'rain':
      src = 'Weather_forecast\videos\rain.mp4'; break;
    case 'clouds':
      src = 'Weather_forecast\videos\clouds.mp4'; break;
    case 'snow':
      src = 'Weather_forecast\videos\snow.mp4'; break;
    case 'thunderstorm':
      src = 'Weather_forecast\videos\thunderstorm.mp4'; break;
    case 'mist':
      src = 'Weather_forecast\videos\mist.mp4'; break;
    case 'drizzle':
      src = 'Weather_forecast\videos\drizzel.mp4'; break;
    case 'clear':
    default:
      src = 'Weather_forecast\videos\clear.mp4'; break;
  }
  if (video) {
    const source = video.querySelector('source');
    if (source.src !== src) {
      source.src = src;
      video.load();
    }
  }
}

function updateForecast(data) {
  const forecastEl = document.getElementById('forecast');
  forecastEl.innerHTML = '';
  // Group by day
  const days = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = [];
    days[date].push(item);
  });
    Object.keys(days).slice(0, 5).forEach(date => {
      const dayData = days[date][0];
      forecastEl.innerHTML += `
        <div class="min-w-[220px] max-lg:w-[250px] lg:h-[420px] max-sm:h-[800px ] max-sm:mb-8  max-sm:w-[300px ]  bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-6 flex flex-col items-center border border-white/30 ml-8 lg:mx-2  flex-shrink-0">
          <span class="font-semibold mb-2 text-lg">${new Date(date).toLocaleDateString()}</span>
          <img src="https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png" alt="icon" class="w-20 h-20 mb-2" />
          <span class="text-2xl font-bold mb-2">${Math.round(dayData.main.temp)}${currentUnit === 'metric' ? '°C' : '°F'}</span>
          <span class="capitalize text-gray-700 mb-4">${dayData.weather[0].description}</span>
          <div class="flex flex-col gap-3 mt-auto w-full">
            <div class="flex items-center gap-2 text-gray-700 justify-center">
              <!-- Humidity Icon: Droplet -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3C12 3 6 10.5 6 15a6 6 0 0012 0c0-4.5-6-12-6-12z"/><path d="M12 17a2 2 0 002-2"/></svg>
              <span class="mr-6">Humidity: ${dayData.main.humidity}%</span>
            </div>
            <div class="flex items-center gap-2 text-gray-700 justify-center">
              <!-- Wind Icon: Wind lines -->
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12h13a3 3 0 100-6 3 3 0 00-3 3"/><path d="M4 18h9a2 2 0 100-4 2 2 0 00-2 2"/></svg>
              <span class="mr-6">Wind: ${dayData.wind.speed}${currentUnit === 'metric' ? ' km/h' : ' mph'}</span>
            </div>
          </div>
        </div>
      `;
  });
}

function showError(msg) {
  // Hide weather and forecast sections
  const currentWeather = document.getElementById('current-weather');
  const forecast = document.getElementById('forecast');
  if (currentWeather) currentWeather.classList.add('hidden');
  if (forecast) forecast.classList.add('hidden');
  // Show error message in the center
  errorMessage.textContent = msg;
  errorMessage.className = 'flex items-center justify-center mt-10 mb-10 px-6 py-4 rounded-xl bg-red-100 text-red-700 font-bold text-lg shadow-lg z-30';
  errorMessage.style.display = 'flex';
  errorMessage.classList.remove('hidden');
}

function showWeatherSections() {
  const currentWeather = document.getElementById('current-weather');
  const forecast = document.getElementById('forecast');
  if (currentWeather) currentWeather.classList.remove('hidden');
  if (forecast) forecast.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  errorMessage.style.display = 'none';
}

function hideWeatherSections() {
  const currentWeather = document.getElementById('current-weather');
  const forecast = document.getElementById('forecast');
  if (currentWeather) currentWeather.classList.add('hidden');
  if (forecast) forecast.classList.add('hidden');
  errorMessage.classList.add('hidden');
  errorMessage.style.display = 'none';
}