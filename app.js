// Initial icon size (will be scaled based on zoom)
var defaultIconSize = 16;

// Define a function to calculate icon size based on zoom level
function calculateIconSize(zoom) {
    return defaultIconSize * Math.pow(1.2, zoom - 12);  // Scale the icon size based on zoom
}

// Define function to create marker icons dynamically
function createStationIcon(isCollected, zoom) {
    var iconSize = calculateIconSize(zoom);
    return L.divIcon({
        html: `
            <div style="text-align:center;">
                <img src="${isCollected ? 'full-radio.png' : 'empty-radio.png'}" width="${iconSize}" height="${iconSize}">
            </div>`,
        iconAnchor: [iconSize / 2, iconSize],  // Anchor the icon to the bottom center
        className: '',  // Clear default Leaflet styling
        iconSize: [iconSize, iconSize]
    });
}

// Create the Leaflet map and center it around the Imperial Palace in Tokyo
var map = L.map('map').setView([35.682839, 139.759455], 13);  // Centered around the Imperial Palace

// Use CartoDB light tiles for the base map
L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);

// Variable to store all markers
var markers = [];
var stationNames = new Set(); // To track unique station names
var maxDisplayedMarkers = 300; // Maximum number of markers to display

// Create a search bar element
var searchBar = L.control({ position: 'topright' });
searchBar.onAdd = function() {
    var div = L.DomUtil.create('div', 'search-bar');
    div.innerHTML = `
        <input type="text" id="stationSearch" placeholder="Search for a station...">
        <div id="suggestions" style="border: 1px solid #ccc; display: none; position: absolute; background: white; z-index: 1000;"></div>
    `;
    return div;
};
searchBar.addTo(map);

// Function to fetch excluded lines from no-stamps-lines.json
function fetchExcludedLines() {
    return fetch('no-stamps-lines.json')
        .then(response => response.json())
        .then(data => data.map(line => line.line_code)); // Return array of line codes
}

// Handle search functionality
document.getElementById('stationSearch').addEventListener('keyup', function(event) {
    var searchTerm = event.target.value.toLowerCase();
    var suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = ''; // Clear previous suggestions
    suggestionsDiv.style.display = 'none'; // Hide suggestions by default

    // Filter markers based on search term
    var filteredMarkers = markers.filter(marker => {
        // Use a temporary variable to avoid accessing HTML content
        var stationName = marker.getPopup().getContent().replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
        return stationName.toLowerCase().includes(searchTerm);
    }).slice(0, 3); // Limit to 3 results

    // Show suggestions
    if (filteredMarkers.length > 0) {
        suggestionsDiv.style.display = 'block'; // Show suggestions
        filteredMarkers.forEach(marker => {
            var stationName = marker.getPopup().getContent().replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags
            var suggestionItem = document.createElement('div');
            suggestionItem.textContent = stationName;
            suggestionItem.style.cursor = 'pointer';
            suggestionItem.onclick = function() {
                // Center the map on the selected station and highlight it
                map.setView(marker.getLatLng(), 13); // Center the map on the station
                highlightStation(marker); // Highlight the station
                suggestionsDiv.innerHTML = ''; // Clear suggestions after selection
                suggestionsDiv.style.display = 'none'; // Hide suggestions
                document.getElementById('stationSearch').value = ''; // Clear search input
            };
            suggestionsDiv.appendChild(suggestionItem);
        });
    }
});

// Function to highlight a station
function highlightStation(marker) {
    // Set a temporary highlight style
    marker.setOpacity(0.5); // Make the marker semi-transparent
    setTimeout(() => {
        marker.setOpacity(1); // Reset to full opacity after a short delay
    }, 1000);
}

// Fetch the station data from stations.json
Promise.all([fetch('stations.json'), fetchExcludedLines()])
    .then(([response, excludedLines]) => {
        return response.json().then(data => ({ data, excludedLines }));
    })
    .then(({ data, excludedLines }) => {
        // Store markers but don't add them to the map yet
        data.forEach(stationGroup => {
            stationGroup.stations.forEach(station => {
                var stationCode = station.code;

                // Check if the station belongs to the excluded line code
                if (excludedLines.includes(station.line_code)) {
                    return; // Skip this station
                }

                // Truncate the station.code to exclude the line_code value
                var stationName = stationCode.split('.').pop(); // Get the last part after the last dot

                // Check if the station name is a duplicate
                if (stationNames.has(stationName)) {
                    return; // Skip this duplicate station
                }
                stationNames.add(stationName); // Add to the set of unique station names

                var lat = station.lat;
                var lon = station.lon;

                // Check if the station is already collected from localStorage
                var isCollected = localStorage.getItem(stationName) === "true";

                // Create the marker icon
                var stationMarker = L.marker([lat, lon], {
                    icon: createStationIcon(isCollected, map.getZoom())  // Use initial zoom to set size
                });

                // Bind popup to marker with custom HTML
                var lineCodes = station.line_code || "No lines available"; // Assuming each station has line_code
                stationMarker.bindPopup(`
                    <strong>${stationName}</strong><br>
                    <span style="font-size: 12px;">Lines: ${lineCodes}</span>
                `, { offset: L.point(0, -10) }); // Offset to show popup above the icon

                // Add mouseover and mouseout events to display and hide the popup
                stationMarker.on('mouseover', function() {
                    stationMarker.openPopup(); // Show the station name above the icon
                });

                stationMarker.on('mouseout', function() {
                    stationMarker.closePopup(); // Hide the popup when not hovering
                });

                // Add click event listener to toggle between collected and uncollected
                stationMarker.on('click', function() {
                    // Toggle collected state
                    isCollected = !isCollected;  // Toggle the collected state

                    if (isCollected) {
                        localStorage.setItem(stationName, "true"); // Mark as collected
                    } else {
                        localStorage.setItem(stationName, "false"); // Mark as uncollected
                    }
                    stationMarker.setIcon(createStationIcon(isCollected, map.getZoom())); // Update the icon
                });

                // Store the marker in the markers array
                markers.push(stationMarker);
            });
        });

        // Check if markers are within the visible map bounds
        loadMarkersInView();

        // Add event listener to load markers when the map is moved or zoomed
        map.on('moveend', loadMarkersInView);
        map.on('zoomend', updateMarkerSizes);  // Update icon size on zoom change
    })
    .catch(error => console.error('Error fetching the stations data:', error));

// Function to load filtered markers based on search
function loadFilteredMarkers(filteredMarkers) {
    // Clear all markers from the map
    markers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    // Add the filtered markers to the map
    var markersToDisplay = filteredMarkers.slice(0, maxDisplayedMarkers); // Limit to maxDisplayedMarkers
    markersToDisplay.forEach(marker => {
        marker.addTo(map);
    });
}

// Function to check if a marker is within the map's visible bounds
function loadMarkersInView() {
    var bounds = map.getBounds();  // Get the current visible bounds of the map

    // Arrays to hold collected and unchecked markers
    var collectedMarkers = [];
    var uncheckedMarkers = [];

    // Separate markers into collected and unchecked based on their visibility
    markers.forEach(marker => {
        if (bounds.contains(marker.getLatLng())) {
            if (marker.getIcon().options.html.includes('full-radio.png')) {
                collectedMarkers.push(marker); // Add to collected markers if collected
            } else {
                uncheckedMarkers.push(marker); // Add to unchecked markers
            }
        }
    });

    // Combine collected and unchecked markers, limiting the total displayed
    var markersToDisplay = collectedMarkers.concat(uncheckedMarkers).slice(0, maxDisplayedMarkers);

    // Add only the markers to the map that are within bounds
    markers.forEach(marker => {
        if (markersToDisplay.includes(marker)) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map);  // Add the marker to the map if it's within the bounds
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);  // Remove the marker if it's outside the bounds
            }
        }
    });
}

// Function to update marker sizes dynamically based on zoom level
function updateMarkerSizes() {
    var zoom = map.getZoom();  // Get the current zoom level
    markers.forEach(marker => {
        var isCollected = localStorage.getItem(marker.getPopup().getContent()) === "true";  // Check if station is collected
        marker.setIcon(createStationIcon(isCollected, zoom));  // Update the marker size
    });
}
