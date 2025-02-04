export const createStationIcon = (isCollected, zoom) => {
    const defaultIconSize = 16; // Initial icon size
    const iconSize = defaultIconSize * Math.pow(1.2, zoom - 12);  // Scale the icon size based on zoom

    return L.divIcon({
        html: `
            <div style="text-align:center;">
                <img src="${isCollected ? '/img/full-radio.png' : '/img/empty-radio.png'}" width="${iconSize}" height="${iconSize}">
            </div>`,
        iconAnchor: [iconSize / 2, iconSize],  // Anchor the icon to the bottom center
        className: '',  // Clear default Leaflet styling
        iconSize: [iconSize, iconSize]
    });
};
