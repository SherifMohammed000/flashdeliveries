import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <motion.div 
      className="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background Layers */}
      <div className="splash-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="splash-mesh"></div>
      
      <div className="splash-content">
        <motion.div 
          className="splash-logo-container"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="splash-logo-glow" />
          <Zap size={80} className="splash-logo" fill="currentColor" />
        </motion.div>
        
        <motion.h1 
          className="splash-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          FLASH <span className="highlight">DELIVERIES</span>
        </motion.h1>
        
        <motion.div 
          className="loading-bar-container"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "280px", opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.div 
            className="loading-bar-progress"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              delay: 1, 
              duration: 3.5,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        <motion.p
          className="splash-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          Lightning fast, every time.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;

