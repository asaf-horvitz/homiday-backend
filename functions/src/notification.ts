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

export async function sendNotificationAfterExchangeRequestUpdated(change, context) {
    try{    
        const to = change.after.get('to');
        const from = change.after.get('from');
        const status = change.after.get('status');

        if (status == 'enumMsgStatus.confirmed') 

        console.log(change.after.data() );
        
        const title = 'msg from ' + from;
        let content ='Exchange msg';

        const confirm = change.after.get('confirm');
        const canceled = change.after.get('canceled');

        if (confirm === 'true'){
        console.log('conifirm : True');
        content = 'Exchange msg Confirm! ';
        }

        if (canceled === 'true'){
        console.log('Canceled : True');
        content = 'Exchange msg Canceled! ';
        }
        
        await sendTheNotification(to, title, content)
    }
    catch (ex) {
    console.log(ex);         
    }

}
