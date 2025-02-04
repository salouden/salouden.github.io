import { markers } from './markers.js'; // Import markers from markers.js

export const setupSearch = (map) => {
    const searchInput = document.getElementById('stationSearch');
    const suggestionsDiv = document.getElementById('suggestions');

    searchInput.addEventListener('keyup', function(event) {
        const searchTerm = event.target.value.toLowerCase();
        suggestionsDiv.innerHTML = ''; // Clear previous suggestions
        suggestionsDiv.style.display = 'none'; // Hide suggestions by default

        const filteredMarkers = markers.filter(marker => {
            const stationName = marker.getPopup().getContent().replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags
            return stationName.toLowerCase().includes(searchTerm);
        }).slice(0, 3); // Limit to 3 results

        // Show suggestions
        if (filteredMarkers.length > 0) {
            suggestionsDiv.style.display = 'block'; // Show suggestions
            filteredMarkers.forEach(marker => {
                const stationName = marker.getPopup().getContent().replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags for suggestions
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = stationName;
                suggestionItem.style.cursor = 'pointer';
                suggestionItem.onclick = function() {
                    map.setView(marker.getLatLng(), 13); // Center the map on the station
                    highlightStation(marker); // Highlight the station
                    suggestionsDiv.innerHTML = ''; // Clear suggestions after selection
                    suggestionsDiv.style.display = 'none'; // Hide suggestions
                    searchInput.value = ''; // Clear search input
                };
                suggestionsDiv.appendChild(suggestionItem);
            });
        }
    });
};

// Function to highlight a station
const highlightStation = (marker) => {
    // Set a temporary highlight style
    marker.setOpacity(0.5); // Make the marker semi-transparent
    setTimeout(() => {
        marker.setOpacity(1); // Reset to full opacity after a short delay
    }, 1000);
};
