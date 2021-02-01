const myAdmin = require('firebase-admin');
import {ExchangeMsg} from './exchange_msgs'

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

export async function sendNotificationAfterExchangeRequestUpdated(change, context) {
    try{    
        let exchangeMsg = new ExchangeMsg(change)

        console.log(change.after.data() );
        
        const title = 'Exchange message';

        if (exchangeMsg.confirm())
            await sendTheNotification(exchangeMsg.from(), title, 'Exchange msg confirm')

        else if (exchangeMsg.cancel()) 
            await sendTheNotification(exchangeMsg.to(), title, 'Exchange msg canceled')

        else if (exchangeMsg.decline())
            await sendTheNotification(exchangeMsg.from(), title, 'Exchange msg decline')

        else if (exchangeMsg.inProgress()) 
            await sendTheNotification(exchangeMsg.to(), title, 'New exchange request')
    }
    catch (ex) {
    console.log(ex);         
    }

}
