import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, googleProvider } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, Lock, User, Zap, ArrowLeft, Loader2, Eye, EyeOff, Phone } from 'lucide-react';
import { sendEmailNotification, sendSMSNotification, sendWelcomePushNotification } from '../services/notifications';
import { motion } from 'framer-motion';

const Signup = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    React.useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    setLoading(true);
                    const user = result.user;
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, 'users', user.uid), {
                            uid: user.uid,
                            name: user.displayName || 'Google User',
                            email: user.email,
                            phone: user.phoneNumber || '',
                            role: 'customer',
                            createdAt: new Date().toISOString()
                        });
                        const welcomeMsg = `Hello ${user.displayName || 'Customer'}, welcome to Flash! Your account has been created via Google.`;
                        Promise.allSettled([
                            sendEmailNotification(user.email || '', "Welcome to Flash", welcomeMsg),
                            sendWelcomePushNotification(user.displayName || 'Customer')
                        ]);
                    }
                    navigate('/home');
                }
            } catch (err: any) {
                console.error("Redirect Result Error:", err);
                setError(err.message || 'Google Sign-up failed.');
            } finally {
                setLoading(false);
            }
        };

        handleRedirectResult();
    }, [navigate]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with name
            await updateProfile(user, { displayName: name });

            // Store extra user info in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                role: 'customer',
                createdAt: new Date().toISOString()
            });

            // Send welcome notifications
            const welcomeMsg = `Hello ${name}, welcome to Flash! Your account has been created. You can now login to place orders.`;
            await Promise.allSettled([
                sendEmailNotification(email, "Welcome to Flash", welcomeMsg),
                sendSMSNotification(phone, `Flash: Welcome ${name}! Your account has been successfully created.`)
            ]);

            // 3. Trigger Local Push Notification
            sendWelcomePushNotification(name);

            // Sign out immediately so they have to log in as requested
            await auth.signOut();
            navigate('/login?signup=success');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create account.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name: user.displayName || 'Google User',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    role: 'customer',
                    createdAt: new Date().toISOString()
                });

                const welcomeMsg = `Hello ${user.displayName || 'Customer'}, welcome to Flash! Your account has been created via Google.`;
                Promise.allSettled([
                    sendEmailNotification(user.email || '', "Welcome to Flash", welcomeMsg),
                    sendWelcomePushNotification(user.displayName || 'Customer')
                ]);
            }

            navigate('/home');
        } catch (err: any) {
            console.error("Popup Error:", err);
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
                try {
                    await signInWithRedirect(auth, googleProvider);
                } catch (redirectErr: any) {
                    setError(redirectErr.message || 'Google Sign-up failed.');
                }
            } else {
                setError(err.message || 'Google Sign-up failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-login-card glass"
            >
                <div className="login-header">
                    <div className="logo cursor-pointer" onClick={() => navigate('/')} style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                        <Zap className="text-primary" fill="currentColor" size={32} />
                        <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>FLASH DELIVERY</span>
                    </div>
                    <h1>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join Flash Deliveries today.</p>
                </div>

                {error && <div className="error-badge" style={{ marginBottom: '1rem', color: '#e63946', fontSize: '0.85rem', background: 'rgba(230, 57, 70, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="tel"
                                placeholder="055 XXX XXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
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

                    <button type="submit" className="btn btn-primary full-width" disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </button>

                    <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                    </div>

                    <button 
                        type="button" 
                        className="btn btn-outline full-width" 
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
                        Sign up with Google
                    </button>
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Login</Link>
                    </div>

                    <button type="button" className="btn btn-outline full-width" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                        <ArrowLeft size={18} /> Back to Home
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Signup;
