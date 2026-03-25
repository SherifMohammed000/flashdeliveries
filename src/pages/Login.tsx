import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, Lock, Zap, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('signup') === 'success') {
            setSuccessMessage('Account created successfully! Please login.');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists in Firestore, if not create them
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
            }

            navigate('/home');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Google login failed.');
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
                    <h1>Customer Login</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome back! Please enter your details.</p>
                </div>

                {error && <div className="error-badge" style={{ marginBottom: '1rem', color: '#e63946', fontSize: '0.85rem', background: 'rgba(230, 57, 70, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}
                {successMessage && <div className="success-badge" style={{ marginBottom: '1rem', color: '#2e7d32', fontSize: '0.85rem', background: 'rgba(46, 125, 50, 0.1)', padding: '0.5rem', borderRadius: '8px', borderLeft: '4px solid #2e7d32' }}>{successMessage}</div>}

                <form onSubmit={handleLogin}>
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
                        <label>Password</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
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

                    <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                            Forgot password?
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
                    </button>

                    <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                    </div>

                    <button 
                        type="button" 
                        className="btn btn-outline full-width" 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
                        Login with Google
                    </button>
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Sign Up</Link>
                    </div>

                    <button type="button" className="btn btn-outline full-width" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                        <ArrowLeft size={18} /> Back to Home
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
