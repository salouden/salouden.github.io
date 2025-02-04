import { createStationIcon } from './utils.js';

export const markers = [];
const maxDisplayedMarkers = 300; // Maximum number of markers to display

export const fetchStations = (map) => {
    Promise.all([fetch('./data/stations.json'), fetchExcludedLines()])
        .then(([response, excludedLines]) => response.json().then(data => ({ data, excludedLines })))
        .then(({ data, excludedLines }) => {
            data.forEach(stationGroup => {
                stationGroup.stations.forEach(station => {
                    // Exclude stations based on line_code
                    if (!excludedLines.includes(station.line_code)) {
                        createMarker(station, map);
                    }
                });
            });

            // Manage markers within map bounds
            loadMarkersInView(map);
            map.on('moveend', () => loadMarkersInView(map));
            map.on('zoomend', () => updateMarkerSizes(map));
        })
        .catch(error => {
            console.error('Error fetching the stations data:', error);
            alert('Failed to load stations data. Please try again later.');
        });
};

const createMarker = (station, map) => {
    const stationCode = station.code;

    // Skip markers for stations with empty code or line_code
    if (!stationCode || !station.line_code) {
        console.warn(`Skipping station with missing code or line:`, station);
        return;
    }
    
    // Extracts station name from the full (line code).(station code) and inserts spaces before caps
    const stationName = stationCode.includes('.') 
        ? stationCode.split('.').pop().replace(/([A-Z])/g, ' $1').trim() 
        : stationCode.replace(/([A-Z])/g, ' $1').trim();

    const lat = station.lat;
    const lon = station.lon;
    const isCollected = localStorage.getItem(stationCode) === "true"; // Use stationCode for retrieval

    const stationMarker = L.marker([lat, lon], {
        icon: createStationIcon(isCollected, map.getZoom())  // Use initial zoom to set size
    });

    stationMarker.stationName = stationName;

    // Formats line name with spaces instead of dots, and inserts spaces before caps
    stationMarker.bindPopup(`
        <strong>${stationName}</strong><br>
        <span style="font-size: 12px;">Lines: ${station.line_code.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim()}</span>
    `, { offset: L.point(0, -10) });

    stationMarker.on('mouseover', () => stationMarker.openPopup());
    stationMarker.on('mouseout', () => stationMarker.closePopup());

    stationMarker.on('click', () => {
        const newState = !isCollected;
        localStorage.setItem(stationCode, newState ? "true" : "false"); // Store based on stationCode
        stationMarker.setIcon(createStationIcon(newState, map.getZoom()));
    });

    markers.push(stationMarker);
    stationMarker.addTo(map);
};

// Function to load markers within the visible map bounds
const loadMarkersInView = (map) => {
    const bounds = map.getBounds();
    let displayedMarkers = 0;

    markers.forEach(marker => {
        if (bounds.contains(marker.getLatLng())) {
            if (!map.hasLayer(marker) && displayedMarkers < maxDisplayedMarkers) {
                marker.addTo(map);
                displayedMarkers++;
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
};

// Function to update marker sizes dynamically based on zoom level
const updateMarkerSizes = (map) => {
    const zoom = map.getZoom();
    markers.forEach(marker => {
        const isCollected = localStorage.getItem(marker.stationName) === "true"; // You may want to keep this for display purposes
        marker.setIcon(createStationIcon(isCollected, zoom));
    });
};

// Function to fetch excluded lines from no-stamps-lines.json
const fetchExcludedLines = () => {
    return fetch('./data/no-stamps-lines.json')
        .then(response => response.json())
        .then(data => data.map(line => line.line_code)); // Return array of line codes
};
