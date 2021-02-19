const myAdmin = require('firebase-admin');
import {ExchangeMsg} from './exchange_msgs'
import {Environment} from './environment'

export async function sendTheNotification(userId : String, title: String, content: string, envProd: boolean) {
    const userDoc = await myAdmin.firestore().doc(Environment.getFullPath(envProd, 'notification-tokens/' + userId)).get();
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

export async function sendNotificationAfterExchangeRequestUpdated(change, context, envProd) {
    try{    
        let exchangeMsg = new ExchangeMsg(change)

        console.log(change.after.data() );
        
        // todo - translation        
        const title = 'Exchange update';
        const msg = 'press to view update'
        await sendTheNotification(exchangeMsg.from(), title, msg, envProd)

        /*
        if (exchangeMsg.confirm())
            await sendTheNotification(exchangeMsg.from(), title, 'Exchange msg confirm', envProd)

        else if (exchangeMsg.cancel()) 
            await sendTheNotification(exchangeMsg.to(), title, 'Exchange msg canceled', envProd)

        else if (exchangeMsg.decline())
            await sendTheNotification(exchangeMsg.from(), title, 'Exchange msg decline', envProd)

        else if (exchangeMsg.inProgress()) 
            await sendTheNotification(exchangeMsg.to(), title, 'New exchange request',envProd)
        */
    }
    catch (ex) {
    console.log(ex);         
    }
}
