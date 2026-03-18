import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Mail, Zap, ArrowLeft, Loader2, CheckCircle, Phone, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendPasswordResetNotification, sendPasswordResetSMS, sendPasswordResetPushNotification } from '../services/notifications';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [resetBy, setResetBy] = useState<'email' | 'phone'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [sentMethod, setSentMethod] = useState<'email' | 'phone'>('email');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let targetEmail = email;

            if (resetBy === 'phone') {
                // Find user by phone number
                const q = query(collection(db, 'users'), where('phone', '==', phone));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    throw new Error('This phone number is not registered.');
                }
                
                const userData = querySnapshot.docs[0].data();
                targetEmail = userData.email;
            }

            // 1. Firebase generates the secure link for the original email
            await sendPasswordResetEmail(auth, targetEmail);
            
            // 2. EmailJS sends a secondary notification/alert
            await sendPasswordResetNotification(targetEmail);

            // 3. If chosen phone, send SMS alert too
            if (resetBy === 'phone') {
                await sendPasswordResetSMS(phone);
            }

            // 4. Trigger Browser Push Notification
            sendPasswordResetPushNotification();

            setSentMethod(resetBy);
            setSent(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send reset instructions.');
        } finally {
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
                    <div className="logo cursor-pointer" onClick={() => navigate('/')} style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                        <Zap className="text-primary" fill="currentColor" size={32} />
                        <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>FLASH DELIVERY</span>
                    </div>
                    <h1>Reset Password</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>We'll send you a reset link to your Gmail.</p>
                </div>

                {sent ? (
                    <div className="success-view" style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <CheckCircle size={64} className="text-primary" />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Check your {sentMethod === 'email' ? 'Email' : 'Phone'}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            {sentMethod === 'email' 
                                ? `We've sent a password reset link to ${email}.`
                                : `We've sent an SMS confirmation to ${phone} and the reset link to your registered Gmail.`
                            }
                        </p>
                        <button className="btn btn-primary full-width" onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <>
                        {error && <div className="error-badge" style={{ marginBottom: '1rem', color: '#e63946', fontSize: '0.85rem', background: 'rgba(230, 57, 70, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

                        <div className="reset-methods" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <button 
                                type="button" 
                                className={`btn ${resetBy === 'email' ? 'btn-primary' : 'btn-outline'} full-width`}
                                onClick={() => setResetBy('email')}
                                style={{ flex: 1 }}
                            >
                                <Mail size={18} /> Email
                            </button>
                            <button 
                                type="button" 
                                className={`btn ${resetBy === 'phone' ? 'btn-primary' : 'btn-outline'} full-width`}
                                onClick={() => setResetBy('phone')}
                                style={{ flex: 1 }}
                            >
                                <Smartphone size={18} /> Phone
                            </button>
                        </div>

                        <form onSubmit={handleReset}>
                            {resetBy === 'email' ? (
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label>Email Address</label>
                                    <div className="input-with-icon" style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="email"
                                            placeholder="Enter your Gmail"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={{ paddingLeft: '40px' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
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
                            )}

                            <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                            </button>
                            
                            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                Remembered it? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Back to Login</Link>
                            </div>

                            <button type="button" className="btn btn-outline full-width" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                                <ArrowLeft size={18} /> Cancel
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
