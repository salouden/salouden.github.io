// lines.js
export const addTrainLinesToMap = (map) => {
    fetch('./data/railroad-section.geojson') 
        .then(response => response.json())
        .then(data => {
            const colorPalette = [
                '#FF4500', '#FF6F00', '#FFA500', '#FFC300', '#FFD700',
                '#FFF700', '#D4FF00', '#A8FF00', '#7FFF00', '#50FF00',
                '#00FF50', '#00FF87', '#00FFB2', '#00FFD4', '#00FFEB',
                '#00E5FF', '#00CFFF', '#00AFFF', '#0087FF', '#005FFF',
                '#003AFF', '#2A00FF', '#5400FF', '#7500FF', '#9A00FF',
                '#BF00FF', '#DF00FF', '#FF00E0', '#FF00B2', '#FF0087'
            ]
            ; // Array of colors for the lines
            const lineColorMap = {}; // To store line colors by line name

            data.features.forEach((feature, index) => {
                const lineName = feature.properties.路線名; // Accessing the line name
                const coordinates = feature.geometry.coordinates;

                // Assign a color to the line if not already assigned
                if (!lineColorMap[lineName]) {
                    lineColorMap[lineName] = colorPalette[index % colorPalette.length]; // Cycle through colors
                }

                const lineStyle = {
                    color: lineColorMap[lineName],
                    weight: 2, // Adjust thickness of the line
                    opacity: 0.8
                };

                // Create a polyline for the train line and add it to the map
                const polyline = L.polyline(coordinates.map(coord => [coord[1], coord[0]]), lineStyle).addTo(map);
        

                // Bind a popup to the polyline for displaying the line name
                polyline.bindPopup(`<strong>${lineName}</strong>`);

                // Add event listeners for mouseover and mouseout to handle popup display
                polyline.on('mouseover', () => polyline.openPopup());
                polyline.on('mouseout', () => polyline.closePopup());

            });
        })
        .catch(error => console.error('Error loading train lines:', error));
};
