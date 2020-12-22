
const myAdmin = require('firebase-admin');

export async function sendTheNotification(userId : String, title: String, content: string) {
    const userDoc = await myAdmin.firestore().doc('production/production/notification-tokens/' + userId).get();
    const fcmToken = userDoc.get('token');
    const message = {
        notification: {
            title: title,
            body: content,
        },
        data: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        token: fcmToken,
    }
    const response = await myAdmin.messaging().send(message);
    console.log(response)
}
