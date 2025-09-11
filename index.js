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