import { initializeMap } from './map.js';
import { fetchStations } from './markers.js';
import { setupSearch } from './search.js';

const initApp = () => {
    const map = initializeMap();
    fetchStations(map);
    setupSearch(map);
};

document.addEventListener('DOMContentLoaded', initApp);
