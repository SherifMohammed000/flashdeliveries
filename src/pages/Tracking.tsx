
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MAPBOX_TOKEN } from '../services/map';
import mapboxgl from 'mapbox-gl';
import { ArrowLeft, Package, MapPin, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

mapboxgl.accessToken = MAPBOX_TOKEN;

const Tracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const mapContainer = useRef<any>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markerPickup = useRef<mapboxgl.Marker | null>(null);
    const markerDestination = useRef<mapboxgl.Marker | null>(null);
    const [showDetails, setShowDetails] = useState(false);


    useEffect(() => {
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            navigate('/admin');
        }
    }, [navigate]);

    useEffect(() => {
        if (!orderId) return;

        const unsub = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
            if (docSnap.exists()) {
                setOrder({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error('Order not found');
            }
            setLoading(false);
        });

        return () => unsub();
    }, [orderId]);

    useEffect(() => {
        if (!order || !mapContainer.current) return;

        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/satellite-streets-v12',
                center: order.locationCoords || [-0.1870, 5.6037], // Default to Accra
                zoom: 13
            });
            map.current.addControl(new mapboxgl.NavigationControl());
        }

        const updateMarkers = () => {
            if (!map.current) return;

            // Pickup Marker (Red)
            if (order.locationCoords) {
                if (!markerPickup.current) {
                    const el = document.createElement('div');
                    el.className = 'marker pickup-marker';
                    markerPickup.current = new mapboxgl.Marker(el)
                        .setLngLat(order.locationCoords)
                        .setPopup(new mapboxgl.Popup().setHTML('<h4>Pickup</h4>'))
                        .addTo(map.current);
                } else {
                    markerPickup.current.setLngLat(order.locationCoords);
                }
            }

            // Destination Marker (Blue)
            if (order.destinationCoords) {
                if (!markerDestination.current) {
                    const el = document.createElement('div');
                    el.className = 'marker destination-marker';
                    markerDestination.current = new mapboxgl.Marker(el)
                        .setLngLat(order.destinationCoords)
                        .setPopup(new mapboxgl.Popup().setHTML('<h4>Destination</h4>'))
                        .addTo(map.current);
                } else {
                    markerDestination.current.setLngLat(order.destinationCoords);
                }
            }

            // Fit bounds if both exist
            if (order.locationCoords && order.destinationCoords) {
                const bounds = new mapboxgl.LngLatBounds()
                    .extend(order.locationCoords)
                    .extend(order.destinationCoords);
                map.current.fitBounds(bounds, { padding: 50 });
            } else if (order.locationCoords) {
                map.current.setCenter(order.locationCoords);
            }
        };

        if (map.current.loaded()) {
            updateMarkers();
        } else {
            map.current.on('load', updateMarkers);
        }

    }, [order]);

    if (loading) return <div className="loading-screen"><div className="loader"></div></div>;
    if (!order) return <div className="error-screen">Order not found.</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#f59e0b';
            case 'Completed': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="tracking-page">
            <header className="glass">
                <div className="container header-content">
                    <button className="btn-icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="header-order-info">
                        <h2>#{orderId?.slice(-6).toUpperCase()}</h2>
                        <span className="status-dot" style={{ backgroundColor: getStatusColor(order.status) }}></span>
                    </div>
                    <button className="btn btn-primary sm" onClick={() => setShowDetails(!showDetails)}>
                        {showDetails ? 'Hide' : 'Info'}
                    </button>
                </div>
            </header>


            <main className="tracking-content">
                <div className="map-wrapper">
                    <div ref={mapContainer} className="map-container" />

                    {showDetails && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="status-card glass"
                        >
                            <div className="status-header">
                                <div className="order-id">
                                    <Package size={20} />
                                    <span>Order Details</span>
                                </div>
                                <div className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                                    {order.status}
                                </div>
                            </div>

                            <div className="tracking-steps">
                                <div className="tracking-point">
                                    <div className="point-icon pickup"><MapPin size={16} /></div>
                                    <div className="point-info">
                                        <label>Pickup</label>
                                        <p>{order.location}</p>
                                    </div>
                                </div>
                                <div className="tracking-line"></div>
                                <div className="tracking-point">
                                    <div className="point-icon destination"><Truck size={16} /></div>
                                    <div className="point-info">
                                        <label>Destination</label>
                                        <p>{order.destination}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="order-summary-footer">
                                <div className="total-price">
                                    <span>Total:</span>
                                    <strong>GHS {order.total}.00</strong>
                                </div>
                                <button className="btn btn-outline sm" onClick={() => setShowDetails(false)}>
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default Tracking;
