import { initializeMap } from './map.js';
import { fetchStations } from './markers.js';
import { setupSearch } from './search.js';
import { addTrainLinesToMap } from './lines.js'; 

const initApp = () => {
    const map = initializeMap();
    fetchStations(map);
    setupSearch(map);
    addTrainLinesToMap(map);
};

document.addEventListener('DOMContentLoaded', initApp);
