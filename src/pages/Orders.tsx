import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Zap, Clock, Package, XCircle, LogOut, User as UserIcon, Loader2, ArrowLeft, Star, Phone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RatingSystem from '../components/RatingSystem';
import { notifyStatusUpdate } from '../services/notifications';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                // Simplified query to avoid index issues
                const q = query(
                    collection(db, 'orders'),
                    where('customerId', '==', user.uid)
                );

                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const orderData: any[] = [];
                    snapshot.forEach((doc) => {
                        // Ensure the Firestore doc ID (doc.id) is the one we use, NOT the field named 'id'
                        orderData.push({ ...doc.data(), id: doc.id });
                    });
                    
                    // Sort in memory instead of Firestore to bypass composite index requirement
                    orderData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    
                    setOrders(orderData);
                    setLoading(false);
                }, (err) => {
                    console.error("Orders listener error:", err);
                    setLoading(false);
                });

                return () => unsubscribeOrders();
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    const handleCancelOrder = async (order: any) => {
        if (!order || !order.id) {
            alert("Error: Order reference is missing.");
            return;
        }

        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        try {
            const currentUserId = auth.currentUser?.uid;
            console.log("DIAGNOSTIC - User ID:", currentUserId);
            console.log("DIAGNOSTIC - Order ID:", order.id);
            console.log("DIAGNOSTIC - Order customerId:", order.customerId);

            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                status: 'Cancelled'
            });

            await notifyStatusUpdate(order, 'Cancelled');
            alert('Order cancelled successfully.');
        } catch (error: any) {
            console.error("Cancellation Technical Details:", error);
            // Help the user identify if it's a security rule issue
            if (error.code === 'permission-denied') {
                alert("Security Error: You don't have permission to cancel this order. Please check your account or contact support.");
            } else {
                alert(`Failed to cancel order: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/')
    }

    if (loading) {
        return (
            <div className="loading-overlay">
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="home-container">
            <header className="glass">
                <div className="container header-content">
                    <div className="logo cursor-pointer" onClick={() => navigate('/home')}>
                        <Zap className="text-primary" fill="currentColor" />
                        <span>FLASH ORDERS</span>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-ghost sm" onClick={() => navigate('/home')} title="Back to Home">
                            <ArrowLeft size={20} />
                        </button>
                        <a href="tel:0557138306" className="btn btn-ghost sm" title="Call Hotline">
                            <Phone size={20} />
                        </a>
                        <a href="https://wa.me/233557138306" className="btn btn-ghost sm" title="WhatsApp Us">
                            <MessageCircle size={20} />
                        </a>
                        <button className="btn btn-ghost sm" onClick={handleLogout} title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container main-content" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
                <button 
                    className="btn btn-ghost sm" 
                    onClick={() => navigate('/home')}
                    style={{ marginBottom: '1rem', padding: '0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}
                >
                    <ArrowLeft size={16} /> Back to Home
                </button>
                <div className="profile-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="user-avatar" style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <UserIcon size={32} style={{ margin: 'auto' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>{user?.displayName || 'Flash Customer'}</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
                    </div>
                </div>

                <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Order History</h3>
                    <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {orders.length} Orders
                    </span>
                </div>

                <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.length === 0 ? (
                        <div className="empty-orders glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '24px' }}>
                            <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                            <h4>No orders yet</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Start your first delivery or gas refill now!</p>
                            <button className="btn btn-primary" onClick={() => navigate('/home')}>Great, let's go!</button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <motion.div 
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="order-card glass"
                                style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
                            >
                                <div className="order-type-icon" style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    background: order.type === 'gas' ? 'rgba(230, 57, 70, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: order.type === 'gas' ? 'var(--primary)' : '#3b82f6'
                                }}>
                                    {order.type === 'gas' ? <Zap size={24} /> : <Package size={24} />}
                                </div>

                                <div className="order-main-info" style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <h4 style={{ margin: 0 }}>{order.type === 'gas' ? 'Gas Refill' : 'Package Delivery'}</h4>
                                        <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        <Clock size={12} />
                                        {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="order-price-info" style={{ textAlign: 'right', minWidth: '100px' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>GHS {order.total}.00</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.paymentMethod === 'cod' ? 'Pay on Delivery' : 'Paid via MOMO'}</div>
                                </div>

                                <div className="order-actions" style={{ width: '100%', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>Ref:</span> #{order.id.slice(-6).toUpperCase()}
                                    </div>
                                    {order.status === 'Pending' && (
                                        <button 
                                            className="btn btn-outline sm" 
                                            style={{ color: '#ef4444', borderColor: '#ef4444', background: 'transparent' }}
                                            onClick={() => handleCancelOrder(order)}
                                        >
                                            <XCircle size={14} /> Cancel Order
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {order.status === 'Completed' && !order.rating && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="order-rating-inline"
                                            style={{ width: '100%', marginTop: '1rem' }}
                                        >
                                            <RatingSystem orderId={order.id} />
                                        </motion.div>
                                    )}

                                    {order.rating && (
                                        <div className="order-rating-display" style={{ width: '100%', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '4px', color: '#f59e0b' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={16} fill={i < order.rating ? 'currentColor' : 'none'} />
                                                ))}
                                            </div>
                                            {order.customerComment && (
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    "{order.customerComment}"
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default Orders;
