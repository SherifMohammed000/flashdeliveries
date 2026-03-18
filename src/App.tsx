import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
    // Only show splash screen if the app is running in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
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
            <>
              <AnimatedBackground />
              <div key="main-app" className="app-main-content">
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
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;


