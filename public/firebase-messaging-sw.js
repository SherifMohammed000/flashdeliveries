// Give the service worker access to Firebase Messaging.
// Note: These must be the 'compat' versions to work as a standalone script.
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// These credentials must match your project configuration.
firebase.initializeApp({
    apiKey: "AIzaSyAIvJxW3yCQRY8pdC1Brw-5TJl-BBkknHI",
    authDomain: "fdel-b335c.firebaseapp.com",
    projectId: "fdel-b335c",
    storageBucket: "fdel-b335c.firebasestorage.app",
    messagingSenderId: "1057536524913",
    appId: "1:1057536524913:web:1b20f2aa748f00227d91d0",
    measurementId: "G-B2X73160N1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'Flash Delivery Alert';
    const notificationOptions = {
        body: payload.notification?.body || 'You have an update regarding your delivery.',
        icon: '/pwa-icon.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
