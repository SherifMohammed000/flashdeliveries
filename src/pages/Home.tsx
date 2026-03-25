import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Flame, X, Package, Zap, Clock, Phone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyNewOrder } from '../services/notifications';
import { initializePaystack } from '../services/payment';
import { db, auth } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { reverseGeocode } from '../services/map';
import { LocationInput } from '../components/LocationInput';
import { MapPicker } from '../components/MapPicker';

// Gas Station coordinates
const GAS_STATION_COORDS = { lat: 6.594328090420445, lng: 0.47206001606121806 };

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'gas' | 'delivery' | null>(null);
    const [deliverySubtype, setDeliverySubtype] = useState<'package' | 'food' | null>(null);
    const [gasLocation, setGasLocation] = useState<string>('');
    const [gasLocationCoords, setGasLocationCoords] = useState<[number, number] | null>(null);
    const [deliveryPickupLocation, setDeliveryPickupLocation] = useState<string>('');
    const [deliveryPickupCoords, setDeliveryPickupCoords] = useState<[number, number] | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo'>('cod');
    const [calculating, setCalculating] = useState(false);
    const [fee, setFee] = useState<{min: number, max: number} | null>(null);
    const [gasAmount, setGasAmount] = useState<number | ''>('');
    const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [mapPickerTarget, setMapPickerTarget] = useState<'pickup' | 'destination'>('pickup');

    useEffect(() => {
        const checkAuthPersistence = () => {
            const loginTime = localStorage.getItem('fdel_login_time');
            const orderCount = parseInt(localStorage.getItem('fdel_order_count') || '0');
            
            if (loginTime) {
                const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                if (now - parseInt(loginTime) > threeDaysInMs) {
                    auth.signOut();
                    localStorage.removeItem('fdel_login_time');
                    localStorage.removeItem('fdel_order_count');
                    navigate('/login');
                    return true;
                }
            }
            
            if (orderCount >= 5) {
                auth.signOut();
                localStorage.removeItem('fdel_login_time');
                localStorage.removeItem('fdel_order_count');
                navigate('/login?signout=reason_limit');
                return true;
            }
            return false;
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (checkAuthPersistence()) return;
                setCurrentUser(user);
                setEmail(user.email || '');
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Re-calculate fee whenever coordinates or service type changes
    useEffect(() => {
        const currentPickupCoords = activeTab === 'gas' ? gasLocationCoords : deliveryPickupCoords;
        
        let totalDist = 0;

        if (activeTab === 'gas') {
            if (currentPickupCoords) {
                totalDist = calculateDistance(
                    currentPickupCoords[1], currentPickupCoords[0],
                    GAS_STATION_COORDS.lat, GAS_STATION_COORDS.lng
                );
            }
        } else if (activeTab === 'delivery') {
            // For flash deliveries, we must consider the trip from Gas Station -> Pickup -> Destination
            if (currentPickupCoords) {
                totalDist += calculateDistance(
                    currentPickupCoords[1], currentPickupCoords[0],
                    GAS_STATION_COORDS.lat, GAS_STATION_COORDS.lng
                );
            }
            if (currentPickupCoords && destinationCoords) {
                totalDist += calculateDistance(
                    currentPickupCoords[1], currentPickupCoords[0],
                    destinationCoords[1], destinationCoords[0]
                );
            } else if (!currentPickupCoords && destinationCoords) {
                totalDist += calculateDistance(
                    destinationCoords[1], destinationCoords[0],
                    GAS_STATION_COORDS.lat, GAS_STATION_COORDS.lng
                );
            }
        }

        if (totalDist > 0) {
            let minFee = 5;
            let maxFee = 10;
            
            // 0 - 2km: 5 to 10
            // 2 - 4km: 10 to 15
            // 4 - 6km: 15 to 20
            // etc...
            // Safely round up the distance into integer tiers of 2km jumps
            const bracket = Math.ceil(totalDist / 2.0); 
            // e.g., totalDist 1.5 -> bracket 1 -> 5 to 10
            // totalDist 2.5 -> bracket 2 -> 10 to 15
            // totalDist 5.0 -> bracket 3 -> 15 to 20
            
            const tierMultiplier = Math.max(1, bracket);
            minFee = (tierMultiplier - 1) * 5 + 5;  
            maxFee = (tierMultiplier - 1) * 5 + 10;

            setFee({ min: minFee, max: maxFee });
        } else {
            setFee(null); // Keep price blank until valid location selected
        }
    }, [gasLocationCoords, deliveryPickupCoords, destinationCoords, activeTab]);


    const handleGetPickupLocation = () => {
        if ("geolocation" in navigator) {
            setCalculating(true);
            navigator.geolocation.getCurrentPosition((position) => {
                reverseGeocode(position.coords.latitude, position.coords.longitude).then(address => {
                    const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                    if (activeTab === 'gas') {
                        setGasLocation(address);
                        setGasLocationCoords(coords);
                    } else {
                        setDeliveryPickupLocation(address);
                        setDeliveryPickupCoords(coords);
                    }
                    setCalculating(false);
                });
            }, (error) => {
                console.error(error);
                alert("Location access denied. Please enter your address manually.");
                setCalculating(false);
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handleGetDestinationLocation = () => {
        if ("geolocation" in navigator) {
            setCalculating(true);
            navigator.geolocation.getCurrentPosition((position) => {
                reverseGeocode(position.coords.latitude, position.coords.longitude).then(address => {
                    setDestination(address);
                    const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                    setDestinationCoords(coords);
                    setCalculating(false);
                });
            }, (error) => {
                console.error(error);
                alert("Location access denied. Please enter your address manually.");
                setCalculating(false);
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handlePaystackPayment = () => {
        const totalAmount = activeTab === 'gas' ? (fee?.max || 0) + (Number(gasAmount) || 0) : (fee?.max || 0);

        initializePaystack(
            totalAmount,
            email || 'customer@example.com',
            (response: any) => {
                console.log('Payment successful. Reference: ' + response.reference);
                completeOrder(response.reference);
            }
        );
    };

    const completeOrder = async (paymentRef?: string) => {
        setIsSubmitting(true);

        const currentUserId = auth.currentUser?.uid || currentUser?.uid;

        if (!currentUserId) {
            alert("Order Error: You are not logged in correctly. Please refresh and try again.");
            setIsSubmitting(false);
            return;
        }

        const orderData = {
            id: Math.floor(Math.random() * 1000000).toString(),
            type: activeTab,
            subtype: deliverySubtype,
            location: activeTab === 'gas' ? gasLocation : deliveryPickupLocation,
            destination: activeTab === 'delivery' ? destination : 'Gas Station',
            fee: fee?.max,
            feeRange: `${fee?.min} - ${fee?.max}`,
            gasAmount: activeTab === 'gas' ? gasAmount : null,
            total: activeTab === 'gas' ? (fee?.max || 0) + (Number(gasAmount) || 0) : (fee?.max || 0),
            paymentMethod,
            paymentStatus: paymentMethod === 'momo' ? 'Paid' : 'Pending',
            paymentRef: paymentRef || 'N/A',
            customerPhone: phone || 'No Phone',
            customerEmail: email || 'No Email',
            customerId: currentUserId,
            locationCoords: activeTab === 'gas' ? gasLocationCoords : deliveryPickupCoords,
            destinationCoords,
            status: paymentMethod === 'momo' ? 'Completed' : 'Pending',
            timestamp: new Date().toISOString()
        };

        console.log('Order Placed:', orderData);

        let orderId = orderData.id;
        try {
            const docRef = await addDoc(collection(db, 'orders'), orderData);
            orderId = docRef.id;
            console.log('Order saved to Cloud (Firestore) successfully');
        } catch (error) {
            console.error('Database Error:', error);
            alert("Connection error: We couldn't save your order to your account. Please check your internet and try again.");
            setIsSubmitting(false);
            return;
        }

        // Send notifications and wait for them to finish before navigating
        await notifyNewOrder(orderData);

        // Track order count for auto-logout rule
        const currentCount = parseInt(localStorage.getItem('fdel_order_count') || '0');
        localStorage.setItem('fdel_order_count', (currentCount + 1).toString());

        setIsSubmitting(false);
        navigate(`/success?id=${orderId}`);
    };


    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentMethod === 'momo') {
            handlePaystackPayment();
        } else {
            completeOrder();
        }
    };

    return (
        <div className="home-container">
            <header className="glass">
                <div className="container header-content">
                    <div className="logo cursor-pointer" onClick={() => navigate('/home')}>
                        <span>FLASH DELIVERIES</span>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-ghost sm" onClick={() => navigate('/orders')}>
                            <Clock size={16} /> My Orders
                        </button>
                        <a href="tel:0557138306" className="btn btn-ghost sm">
                            <Phone size={16} /> Hotline
                        </a>
                        <a href="https://wa.me/233557138306" className="btn btn-ghost sm">
                            <MessageCircle size={16} /> WhatsApp
                        </a>
                        <button className="btn btn-ghost sm" onClick={() => auth.signOut()}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="container main-content">
                <div className="services-grid">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="service-card glass"
                        onClick={() => setActiveTab('gas')}
                    >
                        <div className="service-icon gas-icon">
                            <Flame size={32} />
                        </div>
                        <h2>Fast Gas Refill</h2>
                        <p>Running out of gas? We'll refill it for you in minutes.</p>
                        <button className="btn btn-primary">Order Now</button>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="service-card glass"
                        onClick={() => setActiveTab('delivery')}
                    >
                        <div className="service-icon delivery-icon">
                            <Truck size={32} />
                        </div>
                        <h2>Pick Up & Delivery</h2>
                        <p>Send packages or order food. Fast and reliable.</p>
                        <button className="btn btn-primary" onClick={() => setActiveTab('delivery')}>Select Service</button>
                    </motion.div>
                </div>

                <AnimatePresence>
                    {activeTab === 'delivery' && !deliverySubtype && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="selection-overlay"
                        >
                            <div className="selection-blurred-bg" style={{ backgroundImage: 'url(/hero-img.png)' }} />
                            <div className="selection-content">
                                <button className="close-selection-btn" onClick={() => setActiveTab(null)}><X size={32} /></button>
                                <motion.h1 
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="selection-title"
                                >
                                    Choose Delivery Type
                                </motion.h1>
                                <div className="selection-grid">
                                    <motion.div 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="selection-card"
                                        onClick={() => setDeliverySubtype('package')}
                                    >
                                        <div className="selection-card-icon-wrap package">
                                            <Package size={48} />
                                        </div>
                                        <div className="selection-card-info">
                                            <h3>Package Delivery</h3>
                                            <p>Send or receive items across the city</p>
                                        </div>
                                    </motion.div>
                                    <motion.div 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="selection-card"
                                        onClick={() => setDeliverySubtype('food')}
                                    >
                                        <div className="selection-card-icon-wrap food">
                                            <div className="icon-group">
                                                <Zap size={24} className="badge-icon" />
                                                <Truck size={48} />
                                            </div>
                                        </div>
                                        <div className="selection-card-info">
                                            <h3>Food Delivery</h3>
                                            <p>Hot, fresh meals from your favorites</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {( (activeTab === 'gas') || (activeTab === 'delivery' && deliverySubtype) ) && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="order-modal-backdrop"
                        >
                            <div className="order-modal glass image-free-modal">
                                <div className="order-modal-header clean">
                                    <div className="order-modal-title-clean">
                                        <div className="icon-box">
                                            {activeTab === 'gas' ? <Flame size={24} /> : 
                                             deliverySubtype === 'food' ? <Truck size={24} /> : <Package size={24} />}
                                        </div>
                                        <h3>
                                            {activeTab === 'gas' ? 'Gas Refill Order' : 
                                             deliverySubtype === 'food' ? 'Food Delivery Order' : 'Package Delivery Order'}
                                        </h3>
                                    </div>
                                    <button className="close-btn" onClick={() => {
                                        setActiveTab(null);
                                        setDeliverySubtype(null);
                                    }}><X /></button>
                                </div>

                                <div className="order-form-container scrollable">
                                    <form onSubmit={handleSubmitOrder}>
                                        <div className="form-group-row">
                                            <div className="form-group">
                                                <label>Phone Number</label>
                                                <input
                                                    type="tel"
                                                    placeholder="024 XXX XXXX"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Email Address</label>
                                                <input
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>{activeTab === 'gas' ? 'Cylinder Pickup Location' : 'Pickup Location'}</label>
                                            <LocationInput
                                                value={activeTab === 'gas' ? gasLocation : deliveryPickupLocation}
                                                onChange={activeTab === 'gas' ? setGasLocation : setDeliveryPickupLocation}
                                                onSelectAddress={(addr, coords) => {
                                                    if (activeTab === 'gas') {
                                                        setGasLocation(addr);
                                                        setGasLocationCoords(coords || null);
                                                    } else {
                                                        setDeliveryPickupLocation(addr);
                                                        setDeliveryPickupCoords(coords || null);
                                                    }
                                                }}
                                                placeholder="Enter pickup address"
                                                onGetCurrentLocation={handleGetPickupLocation}
                                                onOpenMap={() => {
                                                    setMapPickerTarget('pickup');
                                                    setShowMapPicker(true);
                                                }}
                                                proximity={activeTab === 'gas' ? gasLocationCoords : deliveryPickupCoords}
                                            />
                                        </div>

                                        {activeTab === 'gas' && (
                                            <div className="form-group">
                                                <label>Amount to Refill (GHS)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter exact amount (e.g. 100)"
                                                    value={gasAmount}
                                                    onChange={(e) => setGasAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                                    required
                                                    min="1"
                                                />
                                            </div>
                                        )}

                                        {activeTab === 'delivery' && (
                                            <div className="form-group">
                                                <label>Delivery Destination</label>
                                                <LocationInput
                                                    value={destination}
                                                    onChange={setDestination}
                                                    onSelectAddress={(addr, coords) => {
                                                        setDestination(addr);
                                                        setDestinationCoords(coords || null);
                                                    }}
                                                    placeholder="Enter destination address"
                                                    onGetCurrentLocation={handleGetDestinationLocation}
                                                    onOpenMap={() => {
                                                        setMapPickerTarget('destination');
                                                        setShowMapPicker(true);
                                                    }}
                                                    proximity={deliveryPickupCoords}
                                                />
                                            </div>
                                        )}


                                        {fee !== null && (
                                            <div className="fee-summary animate-fade-in">
                                                <div className="fee-row">
                                                    <span>Delivery Fee:</span>
                                                    <strong>GHS {fee.min}.00 - {fee.max}.00</strong>
                                                </div>
                                                {activeTab === 'gas' && (
                                                    <div className="fee-row">
                                                        <span>Gas Refill Amount:</span>
                                                        <strong>GHS {gasAmount || 0}.00</strong>
                                                    </div>
                                                )}
                                                <div className="fee-row total">
                                                    <span>Total to Pay:</span>
                                                    <strong>
                                                        GHS {activeTab === 'gas' ? fee.min + (Number(gasAmount) || 0) : fee.min}.00 
                                                        - 
                                                        {activeTab === 'gas' ? fee.max + (Number(gasAmount) || 0) : fee.max}.00
                                                    </strong>
                                                </div>
                                                {paymentMethod === 'momo' && (
                                                    <div className="fee-row text-primary" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                                        *Momo payments capture the max value of the range (GHS {activeTab === 'gas' ? fee.max + (Number(gasAmount) || 0) : fee.max}.00).
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="payment-options">
                                            <label>Payment Method</label>
                                            <div className="radio-group">
                                                <label className={`radio-label ${paymentMethod === 'cod' ? 'active' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value="cod"
                                                        checked={paymentMethod === 'cod'}
                                                        onChange={() => setPaymentMethod('cod')}
                                                    />
                                                    <span>Pay on Delivery</span>
                                                </label>
                                                <label className={`radio-label ${paymentMethod === 'momo' ? 'active' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value="momo"
                                                        checked={paymentMethod === 'momo'}
                                                        onChange={() => setPaymentMethod('momo')}
                                                    />
                                                    <span>Momo (Paystack)</span>
                                                </label>
                                            </div>
                                        </div>

                                        <button type="submit" className="btn btn-primary full-width" disabled={calculating}>
                                            {calculating ? 'Positioning...' : 'Confirm Order'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <MapPicker 
                    isOpen={showMapPicker}
                    onClose={() => setShowMapPicker(false)}
                    initialCoords={mapPickerTarget === 'pickup' ? (activeTab === 'gas' ? gasLocationCoords : deliveryPickupCoords) : destinationCoords}
                    title={mapPickerTarget === 'pickup' ? "Select Pickup Location" : "Select Delivery Destination"}
                    onSelect={(addr, coords) => {
                        if (mapPickerTarget === 'pickup') {
                            if (activeTab === 'gas') {
                                setGasLocation(addr);
                                setGasLocationCoords(coords);
                            } else {
                                setDeliveryPickupLocation(addr);
                                setDeliveryPickupCoords(coords);
                            }
                        } else {
                            setDestination(addr);
                            setDestinationCoords(coords);
                        }
                    }}
                />
            </main>

            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="loading-overlay"
                    >
                        <div className="loader-spinner"></div>
                        <div className="loading-text">
                            <h2>Confirming Your Order</h2>
                            <p>Please wait while we process your request...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default Home;
