
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Map } from 'lucide-react';
import { searchPlace } from '../services/map';

interface LocationInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    onSelectAddress?: (address: string, coordinates?: [number, number]) => void;
    onGetCurrentLocation?: () => void;
    onOpenMap?: () => void;
    proximity?: [number, number] | null;
}

export const LocationInput = ({ value, onChange, placeholder, onSelectAddress, onGetCurrentLocation, onOpenMap, proximity }: LocationInputProps) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        onChange(query);
        
        // Clear previous coordinates since the location text has manually changed
        if (onSelectAddress) {
            onSelectAddress(query, undefined);
        }

        if (query.length > 2) {
            setLoading(true);
            const results = await searchPlace(query, proximity || undefined);
            setSuggestions(results);
            setShowSuggestions(true);
            setLoading(false);
        } else {
            setSuggestions([]);
        }
    };

    const handleBlur = () => {
        // Delay hiding suggestions to allow click events on suggestions to fire first
        setTimeout(() => {
            if (showSuggestions && suggestions.length > 0 && onSelectAddress) {
                // Auto-select the first suggestion if they just clicked away without selecting anything
                const topSuggestion = suggestions[0];
                onChange(topSuggestion.place_name);
                onSelectAddress(topSuggestion.place_name, topSuggestion.center);
            }
            setShowSuggestions(false);
        }, 250);
    };

    const handleSelectSuggestion = (suggestion: any) => {
        onChange(suggestion.place_name);
        setSuggestions([]);
        setShowSuggestions(false);
        if (onSelectAddress) {
            onSelectAddress(suggestion.place_name, suggestion.center);
        }
    };

    return (
        <div className="location-input-container" ref={containerRef}>
            <div className="input-with-button">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="location-input"
                    required
                />
                {onGetCurrentLocation && (
                    <button type="button" onClick={onGetCurrentLocation} className="btn-icon" title="Get current location">
                        <MapPin size={20} />
                    </button>
                )}
                {onOpenMap && (
                    <button type="button" onClick={onOpenMap} className="btn-icon" title="Pick from map">
                        <Map size={20} />
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown glass">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="suggestion-item"
                            onClick={() => handleSelectSuggestion(s)}
                        >
                            <MapPin size={16} />
                            <span>{s.place_name}</span>
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="suggestion-loader">
                    <Loader2 className="animate-spin" size={16} />
                </div>
            )}
        </div>
    );
};
