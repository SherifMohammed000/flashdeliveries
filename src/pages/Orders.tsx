import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { 
    Zap, 
    Package, 
    Clock, 
    User as UserIcon,
    LogOut,
    Star,
    ArrowLeft
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                const q = query(
                    collection(db, 'orders'),
                    where('customerId', '==', user.uid),
                    orderBy('timestamp', 'desc')
                );

                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    console.log(`Fetched ${snapshot.docs.length} orders for user:`, user.uid);
                    const ordersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setOrders(ordersData);
                    setLoading(false);
                    setError(null);
                }, (err) => {
                    console.error("Orders Snapshot Error:", err);
                    setError("Unable to load orders. You might need to create a Firestore index (check the console for a link) or your session has expired.");
                    setLoading(false);
                });

                return () => unsubscribeOrders();
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    const handleRateOrder = async (orderId: string, rating: number) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { rating });
            console.log('Rated order:', orderId, rating);
        } catch (err) {
            console.error("Error rating order:", err);
        }
    };

    if (loading) {
        return (
            <div className="orders-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="home-container" style={{ paddingTop: '1rem', minHeight: '100dvh', WebkitOverflowScrolling: 'touch' }}>
            <main className="container main-content" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '6rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <button 
                        onClick={() => navigate('/home')}
                        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem 0' }}
                    >
                        <ArrowLeft size={18} /> Back to Home
                    </button>
                </div>

                <div className="profile-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '1rem', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div className="user-avatar" style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <UserIcon size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{user?.displayName || 'Flash Customer'}</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Order History</h3>
                    <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {orders.length} Total
                    </span>
                </div>

                {error && (
                    <div style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <AnimatePresence>
                        {orders.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="no-orders-card glass"
                                style={{ textAlign: 'center', padding: '3rem 1rem', borderRadius: '20px' }}
                            >
                                <Package size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <h3 style={{ color: 'var(--text-muted)' }}>No orders yet</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>When you place an order, it will appear here.</p>
                                <button className="btn btn-primary sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/home')}>Start Ordering</button>
                            </motion.div>
                        ) : (
                            orders.map((order, index) => (
                                <motion.div 
                                    key={order.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="order-card glass"
                                    style={{ padding: '1rem', borderRadius: '20px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
                                >
                                    <div className="order-type-icon" style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        background: order.type === 'gas' ? 'rgba(230, 57, 70, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: order.type === 'gas' ? 'var(--primary)' : '#3b82f6'
                                    }}>
                                        {order.type === 'gas' ? <Zap size={18} /> : <Package size={18} />}
                                    </div>

                                    <div className="order-main-info" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{order.type === 'gas' ? 'Gas Refill' : 'Delivery'}</h4>
                                            <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            <Clock size={10} />
                                            {new Date(order.timestamp).toLocaleDateString()}
                                            {order.rating && (
                                                <span style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '2px', color: '#ffc107', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                    <Star size={12} fill="#ffc107" /> {order.rating}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="order-price-info" style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>GHS {order.total}</div>
                                        {order.status === 'Completed' && !order.rating && (
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                {[1,2,3,4,5].map(star => (
                                                    <button 
                                                        key={star}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRateOrder(order.id, star);
                                                        }}
                                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ddd' }}
                                                    >
                                                        <Star size={14} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Orders;
