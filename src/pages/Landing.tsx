import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Zap, Shield, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Capture the install prompt at module level so we never miss it
// even if it fires before the component mounts.
let _deferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    // Dispatch a custom event so mounted components can react
    window.dispatchEvent(new Event('pwa-install-ready'));
});

const Landing = () => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(_deferredPrompt);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Check if already installed/in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setInstalled(true);
        }

        const onReady = () => setDeferredPrompt(_deferredPrompt);
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
            _deferredPrompt = null;
        };

        window.addEventListener('pwa-install-ready', onReady);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('pwa-install-ready', onReady);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstalled(true);
                console.log('User accepted the install prompt');
            }
            setDeferredPrompt(null);
            _deferredPrompt = null;
        } else if (isIOS) {
            // Show iOS specific instructions
            setShowIOSPrompt(true);
        } else {
            // Fallback: guide the user to the browser menu
            alert('To install: open your browser menu (⋮ or share icon) and tap "Install app" or "Add to Home Screen".');
        }
    };

    return (
        <div className="landing-container">
            <nav className="glass">
                <div className="container nav-content">
                    <div className="logo">
                        <Zap className="text-primary" fill="currentColor" />
                        <span>FLASH DELIVERIES</span>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-outline sm" onClick={() => navigate('/login')}>
                            Login
                        </button>
                        <button className="btn btn-primary sm" onClick={() => navigate('/home')}>
                            Order Now
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                <section className="hero">
                    <div className="container hero-content">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="hero-text"
                            style={{ textAlign: 'center' }}
                        >
                            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Fastest Deliveries <span className="text-primary">In Flash.</span></h1>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', marginInline: 'auto' }}>Gas refill or package delivery across the city in record time.</p>

                            <div className="hero-actions" style={{ justifyContent: 'center', gap: '0.5rem' }}>
                                <button className="btn btn-primary lg" onClick={() => navigate('/home')}>
                                    Get Started
                                </button>
                                {!installed && (
                                    <button
                                        className="btn btn-outline lg"
                                        onClick={handleInstallClick}
                                    >
                                        <Download size={18} /> Install
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="hero-image"
                            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}
                        >
                            <img src="/hero-img.png" alt="Flash Delivery Hero" className="floating" style={{ maxWidth: '200px' }} />
                        </motion.div>
                    </div>
                </section>

                <section className="features">
                    <div className="container">
                        <h2 className="section-title">Why Choose Us?</h2>
                        <div className="features-grid">
                            <div className="feature-card glass">
                                <div className="feature-icon"><Zap /></div>
                                <h3>Lightning Fast</h3>
                                <p>We prioritize speed. Your orders are assigned to the nearest rider instantly.</p>
                            </div>
                            <div className="feature-card glass">
                                <div className="feature-icon"><Shield /></div>
                                <h3>Secure Handling</h3>
                                <p>Your items are safe with us. We provide insurance for all deliveries.</p>
                            </div>
                            <div className="feature-card glass">
                                <div className="feature-icon"><Clock /></div>
                                <h3>24/7 Service</h3>
                                <p>Day or night, we are here to serve your delivery needs.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="glass">
                <div className="container footer-content">
                    <p>&copy; 2026 Flash Deliveries. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <button className="btn btn-outline sm" onClick={() => navigate('/admin')}>Admin Login</button>
                    </div>
                </div>
            </footer>

            <AnimatePresence>
                {showIOSPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ios-prompt-overlay"
                        onClick={() => setShowIOSPrompt(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="ios-prompt-modal glass"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="ios-prompt-header">
                                <h3>Install Flash Delivery</h3>
                                <button className="close-btn" onClick={() => setShowIOSPrompt(false)}><X size={20} /></button>
                            </div>
                            <div className="ios-prompt-body">
                                <p>Install this app on your iPhone for a better experience and quick access.</p>
                                <div className="ios-steps">
                                    <div className="ios-step">
                                        <div className="step-number">1</div>
                                        <p>Tap the <strong>Share</strong> button <span className="ios-icon">⎋</span> at the bottom of your screen.</p>
                                    </div>
                                    <div className="ios-step">
                                        <div className="step-number">2</div>
                                        <p>Scroll down and select <strong>Add to Home Screen</strong> <span className="ios-icon">+</span>.</p>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary full-width" onClick={() => setShowIOSPrompt(false)}>Got it!</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Landing;
