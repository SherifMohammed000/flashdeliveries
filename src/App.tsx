import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import AnimatedBackground from './components/AnimatedBackground';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Success from './pages/Success';
import Tracking from './pages/Tracking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Orders from './pages/Orders';
import { RegistrationPrompt } from './services/NotificationPrompt';
import './App.css';

function App() {
  const [showSplashScreen, setShowSplashScreen] = useState(() => {
    // Check if the app is running in standalone mode (installed PWA)
    // Add safety checks for media query support and navigator properties
    try {
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || 
                          (window.navigator && (window.navigator as any).standalone === true);
      return isStandalone;
    } catch (e) {
      console.warn('PWA mode detection failed, defaulting to regular web mode.', e);
      return false;
    }
  });

  useEffect(() => {
    if (!showSplashScreen) return;

    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showSplashScreen]);


  return (
    <Router>
      <div id="app-root-container">
        <AnimatePresence mode="wait">
          {showSplashScreen ? (
            <SplashScreen key="splash" />
          ) : (
            <motion.div 
              key="main-app-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="app-main-content"
            >
              <AnimatedBackground />
              <RegistrationPrompt />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/success" element={<Success />} />
                <Route path="/tracking/:orderId" element={<Tracking />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;


