
export const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN";

export const reverseGeocode = async (lat: number, lng: number) => {
    try {
        // Broaden search to ensure we get something, prioritized in JS
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=GH`);
        const data = await response.json();

        if (data.message === 'Invalid Token' || response.status === 401) {
            console.error('CRITICAL: Mapbox Token is invalid.');
            return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        if (data.features && data.features.length > 0) {
            // Priority order for best human-readable description
            const poi = data.features.find((f: any) => f.place_type.includes('poi'));
            const address = data.features.find((f: any) => f.place_type.includes('address'));
            const neighborhood = data.features.find((f: any) => f.place_type.includes('neighborhood'));
            const district = data.features.find((f: any) => f.place_type.includes('district'));
            const locality = data.features.find((f: any) => f.place_type.includes('locality'));
            const place = data.features.find((f: any) => f.place_type.includes('place'));

            const bestFeature = poi || address || neighborhood || district || locality || place || data.features[0];
            return bestFeature.place_name;
        }

        // Ultimate fallback: Raw coordinates are better than a generic message
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
        console.error('Mapbox Reverse Geocoding Error:', error);
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
};

export const searchPlace = async (query: string, proximity?: [number, number]) => {
    if (!query) return [];
    try {
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=10&country=GH&types=address,poi,neighborhood,place`;

        if (proximity) {
            url += `&proximity=${proximity[0]},${proximity[1]}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        return data.features || [];
    } catch (error) {
        console.error('Mapbox Search Error:', error);
        return [];
    }
};
