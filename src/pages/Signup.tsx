import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, googleProvider } from '../services/firebase';
import { 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, User as UserIcon, Lock, ArrowLeft, Loader2, Eye, EyeOff, Smartphone } from 'lucide-react';
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
                    const user = result.user;
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, 'users', user.uid), {
                            uid: user.uid,
                            name: user.displayName,
                            email: user.email,
                            role: 'customer',
                            createdAt: new Date().toISOString()
                        });
                    }
                    navigate('/home');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message);
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
            
            await updateProfile(user, { displayName: name });
            
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                role: 'customer',
                createdAt: new Date().toISOString()
            });

            // Send notification
            try {
                await sendSMSNotification(phone, `Welcome to Flash Deliveries, ${name}! Your account has been created successfully.`);
                await sendEmailNotification(email, 'Welcome to Flash Deliveries', `<h1>Welcome ${name}!</h1><p>Your account has been created successfully.</p>`);
                await sendWelcomePushNotification(user.uid);
            } catch (notifErr) {
                console.error('Notification Error:', notifErr);
            }

            navigate('/home');
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                await signInWithRedirect(auth, googleProvider);
            } else {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (!userDoc.exists()) {
                    await setDoc(doc(db, 'users', user.uid), {
                        uid: user.uid,
                        name: user.displayName,
                        email: user.email,
                        role: 'customer',
                        createdAt: new Date().toISOString()
                    });
                }
                navigate('/home');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="admin-login-card glass"
            >
                <div className="login-header">
                    <h1>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join Flash Deliveries for faster service.</p>
                </div>

                {error && <div className="error-badge" style={{ marginBottom: '1rem', color: '#e63946', fontSize: '0.85rem', background: 'rgba(230, 57, 70, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Full Name"
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
                                placeholder="Enter your email"
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
                            <Smartphone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="tel"
                                placeholder="024 XXX XXXX"
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
                            <button 
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary full-width" disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </button>
                </form>

                <div className="divider" style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ height: '1px', background: '#ddd', flex: 1 }}></div>
                    <span style={{ fontSize: '0.8rem', color: '#999' }}>OR</span>
                    <div style={{ height: '1px', background: '#ddd', flex: 1 }}></div>
                </div>

                <button 
                    type="button" 
                    className="btn btn-outline full-width" 
                    onClick={handleGoogleSignup} 
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" width="18" alt="Google" style={{ marginRight: '8px' }} />
                    Sign up with Google
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Login</Link>
                </div>

                <button type="button" className="btn btn-ghost full-width" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Back to Home
                </button>
            </motion.div>
        </div>
    );
};

export default Signup;
