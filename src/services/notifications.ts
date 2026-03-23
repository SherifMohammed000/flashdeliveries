
import emailjs from '@emailjs/browser';

export const sendSMSNotification = async (phone: string, message: string) => {
    // ARKESEL CONFIGURATION (V2 API)
    const API_KEY = 'dWxLYkF1QWJ1VVRVYmhERFp5YXc';
    const SENDER_ID = 'FlashDlvs';

    if (!API_KEY || API_KEY.length < 5) {
        console.warn('SMS skipped: API_KEY is missing');
        return false;
    }

    // 1. Format Phone Number
    let formattedPhone = phone.replace(/\s+/g, '').replace('+', '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '233' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('233')) {
        formattedPhone = '233' + formattedPhone;
    }

    try {
        // 2. Use Arkesel V2 API (JSON based)
        // We use a different proxy to avoid "Failed to fetch" issues
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = 'https://sms.arkesel.com/api/v2/sms/send';

        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
            method: 'POST',
            headers: {
                'api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: SENDER_ID,
                message: message,
                recipients: [formattedPhone]
            })
        });

        const data = await response.json();
        console.log('Arkesel V2 Response:', data);

        if (data.status === 'success' || data.code === 'ok' || data.code === 1000) {
            console.log(`%c[SMS SUCCESS] To: ${formattedPhone}`, 'background: #2e7d32; color: #fff; padding: 2px 5px; border-radius: 3px;');
            return true;
        } else {
            const errorMsg = data.message || JSON.stringify(data);
            console.error('Arkesel SMS Failed:', errorMsg);
            alert("SMS Failed: " + errorMsg);
            return false;
        }
    } catch (error: any) {
        console.error('Arkesel Connection Error:', error);
        // If one proxy fails, we might need another, but let's try this one first
        alert("SMS Connection Error: " + error.message);
        return false;
    }
};

export const sendEmailNotification = async (email: string, subject: string, body: string, customTemplateId?: string) => {
    console.log(`%c[EMAIL ATTEMPT] To: ${email}`, 'background: #457b9d; color: #fff; padding: 2px 5px; border-radius: 3px;');

    const serviceId = 'service_jebhue2';
    const defaultTemplateId = 'template_747ruwm'; // Your default order template
    const publicKey = '80YYVwq8wB1p0mK3H';

    try {
        const result = await emailjs.send(serviceId, customTemplateId || defaultTemplateId, {
            to_email: email,
            subject: subject,
            message: body,
        }, publicKey);

        console.log('%c[EMAIL SUCCESS]', 'background: #2e7d32; color: #fff; padding: 2px 5px; border-radius: 3px;', result);
        return true;
    } catch (error: any) {
        console.error('EmailJS Error:', error);
        return false;
    }
};

export const sendPasswordResetNotification = async (email: string) => {
    const subject = "Password Reset Requested";
    const body = "A password reset link has been triggered for your account. If you do not receive it in your main inbox within 2 minutes, please check your SPAM folder.";

    // Use the specific password reset template
    return await sendEmailNotification(email, subject, body, 'template_sx7gesk');
};

export const sendPasswordResetSMS = async (phone: string) => {
    const message = "Flash Deliveries: A password reset link has been sent to your Gmail. Please check your inbox or SPAM folder to complete the process.";
    return await sendSMSNotification(phone, message);
};

export const sendPasswordResetPushNotification = () => {
    if (Notification.permission === 'granted') {
        new Notification("Password Reset Sent!", {
            body: "Check your Gmail or SPAM folder for the secure reset link.",
            icon: '/pwa-icon.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification("Password Reset Sent!", {
                    body: "Check your Gmail or SPAM folder for the secure reset link.",
                    icon: '/pwa-icon.png'
                });
            }
        });
    }
};

export const sendWelcomePushNotification = (name: string) => {
    if (Notification.permission === 'granted') {
        new Notification("Welcome to Flash!", {
            body: `Hello ${name}! Your account has been successfully created.`,
            icon: '/pwa-icon.png'
        });
    }
};

export const notifyNewOrder = async (orderData: any) => {
    const adminPhone = "233557138306";
    const adminEmail = "flashdeliveries20@gmail.com";

    const pickupLink = orderData.locationCoords ? ` Map: https://www.google.com/maps?q=${orderData.locationCoords[1]},${orderData.locationCoords[0]}` : '';
    const destLink = (orderData.type === 'delivery' && orderData.destinationCoords) ? ` Dest: https://www.google.com/maps?q=${orderData.destinationCoords[1]},${orderData.destinationCoords[0]}` : '';

    const adminMessage = `Flash New ${orderData.type} #${orderData.id.slice(-6)}: ${orderData.customerPhone}. Pickup: ${orderData.location}${pickupLink}${destLink}`;
    const customerMessage = `Flash Deliveries: Your order #${orderData.id.slice(-6)} for ${orderData.type} has been received. Pickup: ${orderData.location}. We will contact you shortly.`;

    // Fire all notifications in parallel for speed
    const notifications = [
        sendSMSNotification(adminPhone, adminMessage),
        sendEmailNotification(adminEmail, "NEW ORDER PLACED", adminMessage),
        sendSMSNotification(orderData.customerPhone, customerMessage)
    ];

    // Add customer email if they provided one
    if (orderData.customerEmail) {
        notifications.push(sendEmailNotification(orderData.customerEmail, "Order Confirmation", customerMessage));
    }

    try {
        await Promise.allSettled(notifications);
    } catch (e) {
        console.error("Some notifications failed to trigger:", e);
    }

    // Trigger Local Browser Notification
    if (Notification.permission === 'granted') {
        new Notification("Order Confirmed!", {
            body: `Your order #${orderData.id.slice(-6)} is being processed.`,
            icon: '/pwa-icon.png'
        });
    }
};
export const notifyStatusUpdate = async (orderData: any, newStatus: string) => {
    const adminPhone = "233557138306";
    const adminEmail = "flashdeliveries20@gmail.com";

    const customerMessage = `Flash Deliveries: Your order #${orderData.id.slice(-6).toUpperCase()} status has been updated to: ${newStatus}.`;
    const adminMessage = `Flash ORDER CANCELLED #${orderData.id.slice(-6).toUpperCase()} by customer ${orderData.customerPhone}.`;

    const notifications = [
        sendSMSNotification(orderData.customerPhone, customerMessage)
    ];

    if (newStatus === 'Cancelled') {
        const cancelSubject = `🚨 URGENT: ORDER CANCELLED #${orderData.id.slice(-6).toUpperCase()}`;
        notifications.push(sendSMSNotification(adminPhone, adminMessage));
        notifications.push(sendEmailNotification(adminEmail, cancelSubject, adminMessage));
    }

    if (orderData.customerEmail) {
        notifications.push(sendEmailNotification(orderData.customerEmail, "Order Status Update", customerMessage));
    }

    try {
        await Promise.allSettled(notifications);
    } catch (e) {
        console.error("Status update notifications failed:", e);
    }
};

export const notifyFeedbackSubmitted = async (orderId: string, rating: number, comment: string) => {
    const adminEmail = "flashdeliveries20@gmail.com";
    const adminPhone = "233557138306";
    
    const shortId = orderId.slice(-6).toUpperCase();
    const adminMessage = `Flash FEEDBACK #${shortId}: ${rating}/5 Stars. Comment: "${comment || 'No comment'}"`.substring(0, 160);
    
    const subject = `NEW FEEDBACK - Order #${shortId}`;
    const body = `Customer provided a ${rating}/5 star rating for order #${shortId}.\n\nComment: ${comment || 'No comment provided.'}`;

    const notifications = [
        sendEmailNotification(adminEmail, subject, body),
        sendSMSNotification(adminPhone, adminMessage)
    ];

    try {
        await Promise.allSettled(notifications);
    } catch (e) {
        console.error("Feedback notifications failed:", e);
    }
};
