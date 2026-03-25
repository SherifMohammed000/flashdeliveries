import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Success = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Order notifications are handled in Home.tsx during the order completion process
    }, []);

    return (
        <div className="success-container animate-fade-in">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="success-content glass"
            >
                <div className="success-icon" style={{ marginBottom: '1rem' }}>
                    <CheckCircle size={60} color="#e63946" />
                </div>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Placed!</h1>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your order has been received. Our rider will contact you shortly.</p>

                <div className="next-steps">
                    <p>You will receive an SMS confirmation in a moment.</p>
                    <div className="action-buttons">
                        <button className="btn btn-primary" onClick={() => navigate('/home')}>
                            <ArrowLeft size={18} /> Back to Home
                        </button>
                        <a href="https://wa.me/233557138306" className="btn btn-outline">
                            <MessageSquare size={18} /> Chat with us
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Success;
