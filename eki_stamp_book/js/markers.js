import { createStationIcon } from './utils.js';
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export const markers = [];
const maxDisplayedMarkers = 300;
const db = getDatabase(); // Connexion à Firebase

// Fonction pour marquer une station visitée
const toggleStationCollected = (stationCode) => {
    const stationRef = ref(db, `visited_stations/${stationCode}`);

    get(stationRef).then(snapshot => {
        const isCollected = snapshot.exists() ? !snapshot.val() : true;
        set(stationRef, isCollected);
    });
};

export const fetchStations = (map) => {
    Promise.all([fetch('./data/stations.json'), fetchExcludedLines()])
        .then(([response, excludedLines]) => response.json().then(data => ({ data, excludedLines })))
        .then(({ data, excludedLines }) => {
            data.forEach(stationGroup => {
                stationGroup.stations.forEach(station => {
                    if (!excludedLines.includes(station.line_code)) {
                        createMarker(station, map);
                    }
                });
            });

            loadMarkersInView(map);
            map.on('moveend', () => loadMarkersInView(map));
            map.on('zoomend', () => updateMarkerSizes(map));
        })
        .catch(error => {
            console.error('Erreur chargement des stations:', error);
            alert('Échec du chargement des données.');
        });
};

const createMarker = (station, map) => {
    const stationCode = station.code;
    if (!stationCode || !station.line_code) return;

    const stationName = stationCode.split('.').pop().replace(/([A-Z])/g, ' $1').trim();
    const lat = station.lat, lon = station.lon;

    get(ref(db, `visited_stations/${stationCode}`)).then(snapshot => {
        const isCollected = snapshot.exists() ? snapshot.val() : false;

        const stationMarker = L.marker([lat, lon], {
            icon: createStationIcon(isCollected, map.getZoom())
        });

        stationMarker.bindPopup(`
            <strong>${stationName}</strong><br>
            <span style="font-size: 12px;">Lignes: ${station.line_code.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim()}</span>
        `, { offset: L.point(0, -10) });

        stationMarker.on('click', () => {
            toggleStationCollected(stationCode);
            stationMarker.setIcon(createStationIcon(!isCollected, map.getZoom()));
        });

        markers.push(stationMarker);
        stationMarker.addTo(map);
    });
};

const loadMarkersInView = (map) => {
    const bounds = map.getBounds();
    let displayedMarkers = 0;

    markers.forEach(marker => {
        if (bounds.contains(marker.getLatLng())) {
            if (!map.hasLayer(marker) && displayedMarkers < maxDisplayedMarkers) {
                marker.addTo(map);
                displayedMarkers++;
            }
        } else if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
};

const updateMarkerSizes = (map) => {
    const zoom = map.getZoom();
    markers.forEach(marker => {
        get(ref(db, `visited_stations/${marker.stationName}`)).then(snapshot => {
            const isCollected = snapshot.exists() ? snapshot.val() : false;
            marker.setIcon(createStationIcon(isCollected, zoom));
        });
    });
};

const fetchExcludedLines = () => {
    return fetch('./data/no-stamps-lines.json')
        .then(response => response.json())
        .then(data => data.map(line => line.line_code));
};
