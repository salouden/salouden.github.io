export const initializeMap = () => {
    const map = L.map('map').setView([35.682839, 139.759455], 13);  // Center around Imperial Palace

    // Use CartoDB light tiles for the base map
    L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    return map;
};
