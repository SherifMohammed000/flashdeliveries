import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, MessageCircle, Phone } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Only show on relevant pages
    const showNav = ['/home', '/orders', '/profile'].includes(location.pathname) || location.pathname.startsWith('/tracking');
    if (!showNav) return null;

    return (
        <nav className="bottom-nav animate-fade-in-up">
            <button 
                className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`} 
                onClick={() => navigate('/home')}
            >
                <Home size={22} />
                <span>Home</span>
            </button>
            <button 
                className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`} 
                onClick={() => navigate('/orders')}
            >
                <ClipboardList size={22} />
                <span>My Orders</span>
            </button>
            <a href="tel:0557138306" className="nav-item">
                <Phone size={22} />
                <span>Call Us</span>
            </a>
            <a href="https://wa.me/233557138306" className="nav-item" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={22} />
                <span>WhatsApp</span>
            </a>
        </nav>
    );
};

export default BottomNav;
