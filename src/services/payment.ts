export const initializePaystack = (amount: number, email: string, callback: (ref: any) => void) => {
    // @ts-ignore
    const handler = window.PaystackPop.setup({
        key: 'pk_live_9558918bffd7a70ed407dd8671e8e4d85a15a99d', // Replace with actual public key
        email: email,
        amount: amount * 100, // Paystack expects amount in sub-units (kobo/pesewas)
        currency: 'GHS', // Adjust currency as needed
        callback: function (response: any) {
            callback(response);
        },
        onClose: function () {
            alert('Transaction was not completed, window closed.');
        }
    });
    handler.openIframe();
};
