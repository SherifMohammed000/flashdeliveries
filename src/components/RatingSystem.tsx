import React, { useState } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notifyFeedbackSubmitted } from '../services/notifications';
import './RatingSystem.css';

interface RatingSystemProps {
    orderId: string;
    onComplete?: () => void;
}

const RatingSystem: React.FC<RatingSystemProps> = ({ orderId, onComplete }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!orderId) {
            alert("Error: Order ID is missing for feedback.");
            return;
        }

        if (rating === 0) {
            alert("Please select a star rating first.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                rating,
                customerComment: comment,
                ratedAt: new Date().toISOString()
            });
            
            // Trigger Admin Notifications
            await notifyFeedbackSubmitted(orderId, rating, comment);
            
            setSubmitted(true);
            if (onComplete) {
                setTimeout(onComplete, 2000);
            }
        } catch (err: any) {
            console.error('Error submitting rating: ', err);
            if (err.code === 'permission-denied') {
                alert("Security Error: Your account doesn't have permission to update this order with feedback. Please check your Firestore Security Rules.");
            } else {
                alert(`Submission Failed: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-container glass">
            <AnimatePresence mode="wait">
                {!submitted ? (
                    <motion.div 
                        key="rating-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rating-form"
                    >
                        <h3>Rate your delivery</h3>
                        <p>How was your experience with Flash Deliveries?</p>
                        
                        <div className="stars-row">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${(hover || rating) >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star 
                                        size={32} 
                                        fill={(hover || rating) >= star ? 'currentColor' : 'none'} 
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="comment-section">
                            <label>
                                <MessageSquare size={16} />
                                Add a comment (optional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What went well? What can we improve?"
                                className="rating-textarea"
                            />
                        </div>

                        <button 
                            className="btn btn-primary full-width"
                            disabled={rating === 0 || isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            <Send size={18} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="thank-you"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="thank-you-note"
                    >
                        <div className="success-check">✓</div>
                        <h3>Feedback Submitted!</h3>
                        <p>Thank you for helping us be lightning fast, every time.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RatingSystem;
