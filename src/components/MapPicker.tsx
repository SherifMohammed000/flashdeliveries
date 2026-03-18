import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, reverseGeocode } from '../services/map';
import { X, MapPin, Check, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: string, coords: [number, number]) => void;
    initialCoords?: [number, number] | null;
    title?: string;
}

export const MapPicker = ({ isOpen, onClose, onSelect, initialCoords, title = "Select Location" }: MapPickerProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(initialCoords || null);
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (!isOpen || !mapContainer.current) return;

        // Default center (Accra if no initialCoords)
        const center = initialCoords || [-0.1870, 5.6037];

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12', // Updated to satellite style with street labels
            center: center,
            zoom: 15, // Slightly closer zoom for satellite view
            trackResize: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Force a resize when the map loads and after a delay to ensure container is ready
        map.current.on('load', () => {
            map.current?.resize();
        });

        if (initialCoords) {
            marker.current = new mapboxgl.Marker({ color: '#e63946' })
                .setLngLat(initialCoords)
                .addTo(map.current);
            updateAddress(initialCoords[1], initialCoords[0]);
        }

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            setSelectedCoords([lng, lat]);
            
            if (marker.current) {
                marker.current.setLngLat([lng, lat]);
            } else {
                marker.current = new mapboxgl.Marker({ color: '#e63946' })
                    .setLngLat([lng, lat])
                    .addTo(map.current!);
            }

            // Check if the user clicked directly on a map label (e.g., a specific business, POI, or road)
            const features = map.current?.queryRenderedFeatures(e.point);
            const clickedLabel = features?.find(f => f.properties && f.properties.name);

            if (clickedLabel && clickedLabel.properties?.name) {
                setAddress(clickedLabel.properties.name);
            } else {
                updateAddress(lat, lng);
            }
        });

        const timer = setTimeout(() => {
            map.current?.resize();
        }, 300);

        return () => {
            clearTimeout(timer);
            map.current?.remove();
        };
    }, [isOpen]);

    const updateAddress = async (lat: number, lng: number) => {
        setLoading(true);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setLoading(false);
    };

    const handleConfirmValue = () => {
        if (selectedCoords && address) {
            onSelect(address, selectedCoords);
            onClose();
        }
    };

    const handleGetCurrentLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { longitude, latitude } = position.coords;
                setSelectedCoords([longitude, latitude]);
                
                if (map.current) {
                    map.current.flyTo({ center: [longitude, latitude], zoom: 16 });
                    
                    if (marker.current) {
                        marker.current.setLngLat([longitude, latitude]);
                    } else {
                        marker.current = new mapboxgl.Marker({ color: '#e63946' })
                            .setLngLat([longitude, latitude])
                            .addTo(map.current);
                    }
                }
                updateAddress(latitude, longitude);
                setIsLocating(false);
            }, (err) => {
                console.error(err);
                setIsLocating(false);
                alert("Could not get your location.");
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="map-picker-overlay">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="map-picker-card glass"
                    >
                        <div className="map-picker-header">
                            <h3>{title}</h3>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </div>

                        <div className="map-picker-container">
                            <div ref={mapContainer} className="map-picker-view" />
                            <button 
                                className="map-current-location-btn"
                                onClick={handleGetCurrentLocation}
                                disabled={isLocating}
                            >
                                {isLocating ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} />}
                            </button>
                        </div>

                        <div className="map-picker-footer">
                            <div className="selected-address-info">
                                <MapPin size={18} className="text-primary" />
                                <div className="address-text">
                                    {loading ? 'Finding address...' : (address || 'Tap on the map to select a point')}
                                </div>
                            </div>
                            <button 
                                className="btn btn-primary full-width"
                                disabled={!selectedCoords || loading}
                                onClick={handleConfirmValue}
                            >
                                <Check size={18} /> Confirm Location
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
