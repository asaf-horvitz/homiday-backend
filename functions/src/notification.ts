const myAdmin = require('firebase-admin');
import {ExchangeMsg} from './exchange_msgs'
import {Environment} from './environment'

export async function sendTheNotification(userId : String, title: String, content: string, envProd: boolean) {
    const userDoc = await myAdmin.firestore().doc(Environment.getFullPath(envProd, 'private-profiles/' + userId)).get();
    const fcmToken = userDoc.get('notificationToken');
    if (fcmToken === undefined) return
    if (fcmToken === '') return

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
        const exchangeMsg = new ExchangeMsg(change)

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


function lastMsgReadTimeDoc(envProd : boolean, userId: string) {
    return myAdmin.firestore().doc(Environment.getFullPath(envProd, 'msgs/msgs/last-msg-read-time/' + userId));
}

export async function sendNotificationForNewConversation(newMsg, envProd : boolean) {
    const receiver : string = newMsg.after.get('to')
    const sender : string = newMsg.after.get('from')
    if (!(await timeToSendMsg(envProd, sender, receiver))) return;

    const userDoc = await myAdmin.firestore().doc(Environment.getFullPath(envProd, 'private-profiles/' + receiver)).get();
    const houseName = userDoc.get('houseName');
    sendTheNotification(receiver, 'new message', houseName, envProd);
}

async function timeToSendMsg(envProd, sender, receiver) {

    const LAST_NOTIFICATION_SENT_FOR_USER = 'lastNotificationSentForUserMap'
    let lastMsgsdoc = await lastMsgReadTimeDoc(envProd, receiver).get();

    if (!lastMsgsdoc.exists) {
        await lastMsgReadTimeDoc(envProd, receiver).set({});
        lastMsgsdoc = await lastMsgReadTimeDoc(envProd, receiver).get();
    } 

    let sendNotificationNow : boolean = false

    const timeSenderMsgReadByReceiver = lastMsgsdoc.data()[sender];
    const lastNotificationSentMap = lastMsgsdoc.data()[LAST_NOTIFICATION_SENT_FOR_USER] === undefined ? {} : lastMsgsdoc.data()[LAST_NOTIFICATION_SENT_FOR_USER]
    // const lastEnterToMsgCenter = lastMsgRead.data()['msg_center'];
    const senderNotificationTime = lastNotificationSentMap[sender]
    if (senderNotificationTime === undefined ) 
        sendNotificationNow = true;
    else if (timeSenderMsgReadByReceiver === undefined)
        sendNotificationNow = false
    else if (timeSenderMsgReadByReceiver > senderNotificationTime)
        sendNotificationNow = true

    if (sendNotificationNow) {
        lastNotificationSentMap[sender] = myAdmin.firestore.Timestamp.now()
        const map = {}
        map[LAST_NOTIFICATION_SENT_FOR_USER] = lastNotificationSentMap
        await lastMsgReadTimeDoc(envProd, receiver).update(map);
    }

    return sendNotificationNow
}
