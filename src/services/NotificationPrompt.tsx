import { useEffect } from 'react';
import { db, messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export const RegistrationPrompt = () => {
    useEffect(() => {
        const requestPermission = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // USER: Replace with your VAPID key
                    const token = await getToken(messaging, {
                        vapidKey: 'BGZzBAFF9rLmIVINHsT8gfvmJ45vI6ZM-B72wikjkx71E4B-S9XiKPqyPTT_JDZeu2aJtH9RfPV_F8NmIQRsPQs'
                    });

                    if (token) {
                        console.log('Firebase Push Notification Token Retrieved:', token);
                        // Store the token in Firestore to broadcast messages later
                        const tokensRef = collection(db, 'push_tokens');
                        const q = query(tokensRef, where('token', '==', token));
                        const querySnapshot = await getDocs(q);

                        if (querySnapshot.empty) {
                            await addDoc(tokensRef, {
                                token: token,
                                createdAt: new Date().toISOString()
                            });
                            console.log('Token successfully stored in Firestore.');
                        } else {
                            console.log('Token already exists in Firestore.');
                        }
                    }
                } else {
                    console.log('Unable to get permission to notify.');
                }
            } catch (err) {
                console.error('An error occurred while retrieving token. ', err);
            }
        };

        requestPermission();

        // Handle incoming messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            // In a real app, you might show a toast notification here
            if (payload.notification) {
                new Notification(payload.notification.title || 'New Notification', {
                    body: payload.notification.body,
                    icon: '/icon-192x192.png'
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return null;
};
