import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Lock, LogOut, Map, Home as HomeIcon, Eye, EyeOff, Package, 
    Phone as PhoneIcon, User as UserIcon, Clock, Loader2, Copy, Star, Truck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { notifyStatusUpdate } from '../services/notifications';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';

const Admin = () => {
    const navigate = useNavigate();
    const ADMIN_EMAIL = 'flashdeliveries20@gmail.com';
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
    const [showPassword, setShowPassword] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const lastOrderIdRef = useRef<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerOrders, setCustomerOrders] = useState<any[]>([]);

    // Request permission for sound/notifications on login
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Verify admin role in Firestore
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().role === 'admin') {
                        setIsLoggedIn(true);
                        setIsAdmin(true);
                        if (Notification.permission === 'default') {
                            Notification.requestPermission();
                        }
                    } else {
                        // Not an admin
                        setIsLoggedIn(false);
                        setIsAdmin(false);
                        if (userDoc.exists()) {
                            alert("Access Denied: You do not have admin privileges.");
                        } else {
                            alert("User profile not found. Access denied.");
                        }
                        signOut(auth);
                    }
                } catch (err) {
                    console.error("Error verifying admin role:", err);
                    signOut(auth);
                }
            } else {
                setIsLoggedIn(false);
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let unsubscribe: () => void;
        if (isLoggedIn) {
            // Read from Firestore instead of localStorage
            const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedOrders: any[] = [];
                let newOrderDetected = false;
                let latestOrder: any = null;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedOrders.push({ ...data, id: doc.id });

                    if (!latestOrder) latestOrder = { ...data, id: doc.id };
                });

                // Check if the newest order is actually new to us
                if (latestOrder && lastOrderIdRef.current && latestOrder.id !== lastOrderIdRef.current) {
                    newOrderDetected = true;
                }

                // Initialize ref on first load
                if (!lastOrderIdRef.current && fetchedOrders.length > 0) {
                    lastOrderIdRef.current = fetchedOrders[0].id;
                }

                if (newOrderDetected && latestOrder) {
                    // Trigger Notification
                    if (Notification.permission === 'granted') {
                        new Notification("New Order Received!", {
                            body: `Order #${latestOrder.id.slice(-6)}: ${latestOrder.type} from ${latestOrder.customerPhone}`,
                            icon: '/pwa-icon.png'
                        });
                    }

                    // Simple Beep Sound
                    try {
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const oscillator = audioCtx.createOscillator();
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                        oscillator.connect(audioCtx.destination);
                        oscillator.start();
                        oscillator.stop(audioCtx.currentTime + 0.2);
                    } catch (e) {
                        console.log("Audio alert blocked by browser policy");
                    }

                    lastOrderIdRef.current = latestOrder.id;
                }

                setOrders(fetchedOrders);
            }, (error: any) => {
                console.error("Firestore Error:", error);
                // Instead of a blocking alert, we'll log it and maybe show a notice in the UI
                if (error.code === 'permission-denied') {
                    console.error("Permission denied. Ensure your Firestore rules are correctly set for admin access.");
                }
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isLoggedIn]);

    // Fetch Customers
    useEffect(() => {
        let unsubscribe: () => void;
        if (isLoggedIn && activeTab === 'customers') {
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedUsers: any[] = [];
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.email !== ADMIN_EMAIL) {
                        fetchedUsers.push({ ...userData, id: doc.id });
                    }
                });
                setCustomers(fetchedUsers);
            }, (error) => {
                console.error("Error fetching customers: ", error);
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isLoggedIn, activeTab]);

    const getCustomerOrderCount = (customerId: string) => {
        return orders.filter(o => o.customerId === customerId).length;
    };

    const viewCustomerOrders = (customer: any) => {
        const history = orders.filter(o => o.customerId === customer.uid || o.customerId === customer.id);
        setCustomerOrders(history);
        setSelectedCustomer(customer);
    };

    const loadOrders = () => {
        // Now handled by real-time listener
        console.log("Orders refresh triggered, but already using real-time listener.");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
            // The useEffect listener will handle the role verification and state update
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsLoggedIn(false);
            setIsAdmin(false);
            navigate('/login');
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const updateOrderStatus = async (order: any, newStatus: string) => {
        try {
            const orderRef = doc(db, 'orders', order.id);
            const updates: any = { status: newStatus };

            // If admin marks as completed, assume it's paid (especially for COD)
            if (newStatus === 'Completed') {
                updates.paymentStatus = 'Paid';
            }

            await updateDoc(orderRef, updates);

            // Notify Customer of Status Change
            await notifyStatusUpdate(order, newStatus);
        } catch (error) {
            console.error("Error updating order: ", error);
            alert("Failed to update status.");
        }
    };

    const copyTrackingLink = (orderId: string) => {
        const link = `${window.location.origin}/tracking/${orderId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert("Tracking link copied to clipboard!");
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    const clearOrders = async () => {
        if (window.confirm('Are you sure you want to clear all orders? This deletes them from the database permanently.')) {
            try {
                const q = query(collection(db, 'orders'));
                const querySnapshot = await getDocs(q);
                const batch = writeBatch(db);
                querySnapshot.forEach((d) => {
                    batch.delete(doc(db, 'orders', d.id));
                });
                await batch.commit();
            } catch (error) {
                console.error("Error clearing orders:", error);
                alert("Failed to clear orders.");
            }
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="admin-login-container">
                <form className="admin-login-card glass" onSubmit={handleLogin}>
                    <div className="login-header">
                        <Lock size={40} className="text-primary" />
                        <h1>Admin Login</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Secure Dashboard Access</p>
                    </div>
                    <div className="form-group">
                        <label>Admin Password</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="btn-ghost sm"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', padding: '5px' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login to Dashboard'}
                    </button>
                    <button type="button" className="btn btn-outline full-width" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                        <HomeIcon size={18} /> Back to Home
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <nav className="admin-nav glass">
                <div className="container nav-content">
                    <div className="logo cursor-pointer">
                        <span>FLASH ADMIN</span>
                    </div>
                    <div className="nav-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline sm" onClick={() => navigate('/')}>
                            <HomeIcon size={16} /> Home
                        </button>
                        <button className="btn btn-outline sm" onClick={handleLogout}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container dashboard-content">
                <div className="tab-switcher glass" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', padding: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('orders')}
                        style={{ flex: 1 }}
                    >
                        Live Orders
                    </button>
                    <button
                        className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('customers')}
                        style={{ flex: 1 }}
                    >
                        Customer List
                    </button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card glass">
                        <h3>Total Orders</h3>
                        <p className="large-text">{orders.length}</p>
                    </div>
                    <div className="stat-card glass">
                        <h3>Pending</h3>
                        <p className="large-text">{orders.filter(o => o.status === 'Pending').length}</p>
                    </div>
                    <div className="stat-card glass">
                        <h3>Total Revenue</h3>
                        <p className="large-text">GHS {orders.filter(o => o.status === 'Completed').reduce((acc, o) => acc + (o.total || 0), 0)}</p>
                    </div>
                </div>

                {activeTab === 'orders' ? (
                    <section className="orders-section glass">
                        <div className="section-header">
                            <h2>Live Orders</h2>
                            <div className="header-buttons">
                                <button className="btn btn-outline sm" onClick={clearOrders}>Clear All</button>
                                <button className="btn btn-primary sm" onClick={loadOrders}>Refresh</button>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ref/Time</th>
                                        <th>Customer</th>
                                        <th>Service</th>
                                        <th>Feedback</th>
                                        <th>Payment/Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>No orders found</td>
                                        </tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.id}>
                                                <td>
                                                    <div className="order-id">#{order.id.slice(-6)}</div>
                                                    <div className="order-time" style={{ fontSize: '0.7rem', color: '#888' }}>
                                                        {new Date(order.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong>{order.customerPhone}</strong>
                                                    <div className="order-location" style={{ fontSize: '0.8rem' }}>{order.location}</div>
                                                </td>
                                                <td>
                                                    <span className="service-type">
                                                        {order.type === 'gas' ? 'Gas Refill' : 
                                                         order.subtype === 'food' ? 'Delivery (Food)' : 'Delivery (Package)'}
                                                    </span>
                                                    <div className="order-details" style={{ fontSize: '0.8rem', color: '#666' }}>
                                                        {order.type === 'gas' && order.gasAmount && (
                                                            <div style={{ fontWeight: 'bold', color: '#e63946', marginTop: '2px' }}>Amount: GHS {order.gasAmount}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {order.rating ? (
                                                        <div className="feedback-preview">
                                                            <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginBottom: '4px' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={12} fill={i < order.rating ? 'currentColor' : 'none'} />
                                                                ))}
                                                            </div>
                                                            {order.customerComment && (
                                                                <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.customerComment}>
                                                                    "{order.customerComment}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: '#ccc' }}>No rating yet</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="payment-info" style={{ fontWeight: '600' }}>GHS {order?.total || 0}</div>
                                                    <select
                                                        className={`status-select ${(order?.status || 'Pending').toLowerCase().replace(' ', '-')}`}
                                                        value={order?.status || 'Pending'}
                                                        onChange={(e) => updateOrderStatus(order, e.target.value)}
                                                        style={{ marginTop: '5px', width: '100%', fontSize: '0.8rem' }}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <a href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary sm" style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>
                                                            WhatsApp
                                                        </a>
                                                        <button onClick={() => copyTrackingLink(order.id)} className="btn btn-outline sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                                            <Copy size={12} /> Link
                                                        </button>
                                                        <button onClick={() => navigate('/tracking/' + order.id)} className="btn btn-ghost sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                                            <Map size={12} /> Map
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <section className="customers-section glass">
                        <div className="section-header">
                            <h2>Customer List</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{customers.length} registered users</p>
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Contact</th>
                                        <th>Joined</th>
                                        <th>Orders</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No customers found</td>
                                        </tr>
                                    ) : (
                                        customers.map(customer => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div 
                                                        style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary)' }} 
                                                        onClick={() => viewCustomerOrders(customer)}
                                                        title="Click to view order history"
                                                    >
                                                        {customer.name || 'Anonymous'} <Eye size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>ID: {customer.id.slice(0, 8)}...</div>
                                                </td>
                                                <td>
                                                    <div>{customer.email}</div>
                                                    <div style={{ color: 'var(--primary)', fontWeight: '600' }}>{customer.phone || 'No Phone'}</div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>
                                                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="badge-btn"
                                                        onClick={() => viewCustomerOrders(customer)}
                                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        {getCustomerOrderCount(customer.uid || customer.id)} Orders
                                                    </button>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${customer.role === 'admin' ? 'completed' : 'pending'}`}>
                                                        {customer.role || 'customer'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Customer Orders Modal */}
                <AnimatePresence>
                    {selectedCustomer && (
                        <div className="order-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
                            <div className="order-modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
                                    <div>
                                        <h2 style={{ margin: 0 }}>{selectedCustomer.name}'s History</h2>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedCustomer.email}</p>
                                    </div>
                                    <button className="btn-ghost" onClick={() => setSelectedCustomer(null)}><LogOut size={24} style={{ transform: 'rotate(180deg)' }} /></button>
                                </div>
                                
                                <div className="customer-orders-list" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '0.5rem' }}>
                                    {customerOrders.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem' }}>No orders found for this customer.</div>
                                    ) : (
                                        customerOrders.map(order => (
                                            <Fragment key={order?.id || Math.random()}>
                                            <div className="order-item-mini glass" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                        {order?.type === 'gas' ? 'Gas Refill' : (order?.subtype === 'food' ? 'Food' : 'Package')}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {order?.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '800', color: 'var(--primary)' }}>GHS {order?.total || 0}</div>
                                                    <div className={`status-badge ${(order?.status || 'Pending').toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.7rem' }}>{order?.status || 'Pending'}</div>
                                                    {order?.rating && (
                                                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginTop: '4px', justifyContent: 'flex-end' }}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={10} fill={i < order.rating ? 'currentColor' : 'none'} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {order?.customerComment && (
                                                <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', paddingLeft: '1rem', borderLeft: '2px solid var(--primary)', marginBottom: '0.5rem' }}>
                                                    "{order.customerComment}"
                                                </div>
                                            )}
                                            </Fragment>
                                        ))
                                    )}
                                </div>
                                
                                <button className="btn btn-primary full-width" style={{ marginTop: '1.5rem' }} onClick={() => setSelectedCustomer(null)}>
                                    Close History
                                </button>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Admin;
