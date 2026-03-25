import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, googleProvider } from '../services/firebase';
import { 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, ArrowLeft, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
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
        if (params.get('reset') === 'success') {
            setSuccessMessage('Password reset email sent! Check your inbox.');
        }
        
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home');
        } catch (err: any) {
            console.error(err);
            setError('Invalid email or password. Please try again.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
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
                    <h1>Welcome Back</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to continue to Flash Deliveries.</p>
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

                    <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                        <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>
                            Forgot Password?
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
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
                    onClick={handleGoogleLogin} 
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" width="18" alt="Google" style={{ marginRight: '8px' }} />
                    Continue with Google
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Sign Up</Link>
                </div>

                <button type="button" className="btn btn-ghost full-width" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Back to Home
                </button>
            </motion.div>
        </div>
    );
};

export default Login;
