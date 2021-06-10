/*
const myAdmin = require('firebase-admin');
import {ExchangeMsg} from './exchange_msgs'
import {Environment} from './environment'
import {sendTheNotification} from './notification'
const db = myAdmin.firestore();

const geoTz = require('geo-tz')

const userIdLatLonMap = new Map()
const usersToSendNotificationTo = new Set()

const PHONE_NOTIFICATION_SENT_TO = 'To'
const PHONE_NOTIFICATION_SENT_FROM = 'From'

export async function sendNotificationIfPhoneWasTransfered(envProd: boolean)  {


    await getAllProfiles(envProd)

    const PHONE_NOTIFICATION_SENT = 'PhoneNotificationSent'

    const collectionName = Environment.getFullPath(envProd, 'msgs/msgs/chat-msgs/')
    const querySnapshot  = await db.collection(collectionName).where(PHONE_NOTIFICATION_SENT, '!=', 'ToFrom').get();

    const timestampNow = myAdmin.firestore.Timestamp.now().

    querySnapshot.forEach(async (doc) => {
        const msgDetails = doc.data();

        const to = msgDetails['to']
        const from = msgDetails['from']
        const msg = msgDetails['msg']
        const msgTime = msgDetails['msgTime']
        const phoneNotificationSent = msgDetails[PHONE_NOTIFICATION_SENT]

        const docId = doc.id;
        
        if (!checkIfNumber(msg)) {
            db.doc(collectionName + doc.id).update({PHONE_NOTIFICATION_DONE_CATEGORY : 'yes'})
            return
        }

        addUsersToSendNotificationTo(to, from, phoneNotificationSent)
    });

    sendNotificationsToALlUsers(usersToSendNotificationTo, envProd)
}

function enoughTimeElapsedSinceSendingPhoneNumber(msgTime) : boolean{
    return true;
}

function addUsersToSendNotificationTo(to, from, phoneNotificationSent) {
    if (phoneNotificationSent == undefined) {
        usersToSendNotificationTo.add(to)
        usersToSendNotificationTo.add(from)
        return;
    }
    if (phoneNotificationSent != PHONE_NOTIFICATION_SENT_TO)
        usersToSendNotificationTo.add(to)
    if (phoneNotificationSent != PHONE_NOTIFICATION_SENT_FROM)        
        usersToSendNotificationTo.add(from)

}

async function sendNotificationsToALlUsers(usersToSendNotificationTo, envProd: boolean) {

    for (const userId in usersToSendNotificationTo) {
        if (!timeToSendMsgToUser(userId)) continue
        sendTheNotification(userId, 'new message from homiday', 'did you exchange ?', envProd)
    }
}

function timeToSendMsgToUser(userId : String) : boolean{
    const latLon = userIdLatLonMap.get(userId)
    const timezone  = geoTz(latLon[0], latLon[1])
    let date_string = new Date().toLocaleString("en-US", { timeZone: timezone });
    let curr_date = new Date(date_string);
    // hours as (HH) format
    let hours : Number = Number(("0" + curr_date.getHours()).slice(-2))

    return (hours >= 19 && hours < 21)

}

async function getAllProfiles(envProd: boolean)  {

    const collectionName = Environment.getFullPath(envProd, 'private-profiles/')

    const querySnapshot  = await db.collection(collectionName).get();

    querySnapshot.forEach(async (doc) => {
        const data = doc.data()
        const lat: Number = data['location/geoLocation/lat']
        const lon: Number = data['location/geoLocation/lon']

        userIdLatLonMap.set(doc.id,[lat, lon])
    });
}

function checkIfNumber(msg: String) : boolean {
    const MAX_LETTERS_TO_CHECK = 14;
    const MIN_DIGITS = 9
    const isDigitList  = []
    for (let letter of msg) {
        isDigitList.push(checkIfLetterIsDigit(letter))        
    }

    for (let ix=0; ix < isDigitList.length; ix++) {
        let count = MAX_LETTERS_TO_CHECK
        let digitsNumber = 0
        for (let currLetter=ix; currLetter < isDigitList.length && count >=0; currLetter++) {
            count--
            if (isDigitList[currLetter] == true) digitsNumber++
            if (digitsNumber == MIN_DIGITS) return true
        }
    }
    return false;
}

function checkIfLetterIsDigit(letter : String) : boolean{
    switch (letter) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '7':
        case '8':
        case '9':
            return true
    default:
        return true;
    }
}
*/