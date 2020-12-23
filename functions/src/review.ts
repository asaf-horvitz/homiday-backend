
import { sendTheNotification } from './notification';

const myAdmin = require('firebase-admin');

const REVIEWS_I_MADE = 'reviewsIMade';
const REVIEWS_ON_ME = 'reviewsOnMe';
const GRADES = 'grades';
const TOTAL_REVIEW_SCORE = 'totalReviewScore'
const TOTAL_REVIEWS = 'totalReviews'

const db = myAdmin.firestore();


const FROM_REVIEW_FILLED = 'fromReviewFilled'
const TO_REVIEW_FILLED = 'toReviewFilled'
const FROM_REVIEW_SENT_NOTIFICATION_TIME = 'fromReviewSentNotificationTime'
const TO_REVIEW_SENT_NOTIFICATION_TIME = 'toReviewSentNotificationTime'

export async function setReview(request) {
    const userIdToReview = request.body.userIdToReview; 
    const reviewerId = request.body.reviewerId
    const exchangeDocId = request.body.exchangeDocId
    let success : boolean = await setReviewFilledInExchangeMsg(exchangeDocId, reviewerId, userIdToReview)
    if (!success) return

    // todo check user is same and has confirmed exchange request
    await writeRevieInsideReviewerDoc(request)
    await writeRevieInsideMyDetails(request)
    await updatePublicProfileDocWithReview(userIdToReview)
    await updatePublicProfileDocWithReview(reviewerId)
}

function getDocPathInCollection(docId) {
    const db = myAdmin.firestore();
    return db.doc('production/production/reviews/' + docId);
}

async function writeRevieInsideMyDetails(request) {
    const body = request.body;

    // todo - make sure this users id are valid !!!
    const userIdToReview = body.userIdToReview; 
    const reviewerId = body.reviewerId

    const doc = await getDocPathInCollection(reviewerId).get();
    let reviewsIMade = {};
    let fileExists = false;
    if (doc.exists) {
        reviewsIMade = doc.data()[REVIEWS_I_MADE];
        fileExists = true;
    }
    
    reviewsIMade[userIdToReview] = request.body;
    
    const map = {}
    map[REVIEWS_I_MADE] = reviewsIMade
    if (fileExists) {
        await getDocPathInCollection(reviewerId).update(map);     
    }
    else {
        map[REVIEWS_ON_ME] = {}
        await getDocPathInCollection(reviewerId).set(map);
    }
}

async function setReviewFilledInExchangeMsg(exchangeDocId : String, reviewerId : String, userIdToReview : String) : Promise<boolean> {
    const exchangeDoc  = await db.doc('production/production/msgs/msgs/exchange-msgs/' + exchangeDocId).get();
    
    if (!exchangeDoc.exists)
        return false;
    
    const json = exchangeDoc.data();
    if (json['status'] !== 'enumMsgStatus.confirmed') return false
    
    let filledFieldName;
    if (json['from'] == reviewerId) {
        filledFieldName = FROM_REVIEW_FILLED
    }
    else if (json['to'] == reviewerId) {
        filledFieldName = TO_REVIEW_FILLED
    }
    else 
        return false

    db.doc('production/production/msgs/msgs/exchange-msgs/' + exchangeDocId).update({filledFieldName: true});
    return true;

}

export async function updatePublicProfileDocWithReview(userId) {
    const querySnapshot  = await db.collection('production/production/public-profiles').where('userId', '==', userId).get();
    querySnapshot.forEach(async (doc) => {
        const docId = doc.id;

        const userReviewDetailsDoc = await db.doc('production/production/reviews/' + userId).get();
        if (!userReviewDetailsDoc.exists)
        return;
        const profile = doc.data();
        profile['userReviewDetails'] = userReviewDetailsDoc.data();
        await db.doc('production/production/public-profiles/' + docId).set(profile);
      });
}

async function writeRevieInsideReviewerDoc(request) {
    const body = request.body;
    // todo - make sure this users id are valid !!!
    const userIdToReview = body.userIdToReview; 
    const reviewerId = body.reviewerId

    const doc = await getDocPathInCollection(userIdToReview).get();
    let reviewsOnMe = {};
    let fileExists = false;
    if (doc.exists) {
        reviewsOnMe = doc.data().reviewsOnMe;
        fileExists = true;        
    }
    
    reviewsOnMe[reviewerId] = request.body;

    let totalReviewScore = 0;
    let totalReviews = 0;
    for (const reviewer in reviewsOnMe ) {
        const currentGrades : number[] = reviewsOnMe[reviewer][GRADES] as number[];
        for (const grade of currentGrades) {
            totalReviewScore += grade;
        }
        totalReviews++;
    }
    totalReviewScore = (totalReviewScore / 4) / totalReviews;
    const map = {}
    map[TOTAL_REVIEW_SCORE] = totalReviewScore
    map[TOTAL_REVIEWS] = totalReviews
    map[REVIEWS_ON_ME] = reviewsOnMe
    if (fileExists) {
        await getDocPathInCollection(userIdToReview).update(map)
    }
    else {
        map[REVIEWS_I_MADE] = {}
        await getDocPathInCollection(userIdToReview).set(map)
    }
}

export async function sendReviewNotification() {
    console.log('inside')
        
    const db = myAdmin.firestore();
    const querySnapshot  = await db.collection('production/production/msgs/msgs/exchange-msgs').get();
    
    querySnapshot.forEach(async (doc) => {
        const json = doc.data()
        await sendNotificationToSingleUser(true, json, doc.id);
        await sendNotificationToSingleUser(false, json, doc.id);
    });
}

async function sendNotificationToSingleUser(from : boolean, json : {}, exchangeDocId : String) : Promise<boolean> {
    const endExchangeDate = json['endExchange']

    const currSeconds = (new Date(Date.now())).getTime() / 1000;
    if (endExchangeDate.seconds + (24*60*60) > currSeconds) 
        return false

    if (json[getReviewFilledFieldName(from)] !== undefined) 
        return false
    if (json[getNotificationTimeFieldName(from)] !== undefined) 
        return false

    console.log('send review notification to ' + json[getUserIdFieldName(from)]);

    await sendNotificationOperation(json[getUserIdFieldName(from)]);

    let notificationTime = getNotificationTimeFieldName(from)
    await myAdmin.firestore().doc(`production/production/msgs/msgs/exchange-msgs/${exchangeDocId}`).update({notificationTime : currSeconds});
    console.log('notification sent')    

    return true;
}

async function sendNotificationOperation(userId: String, ) {
    const title = 'איך הייתה ההחלפה שלכם ?';
    const content = 'הכנסו לאפליקציה ומלאו חוות דעת'
    await sendTheNotification(userId, title, content);
}

function getNotificationTimeFieldName(from : boolean) : string{
    if (from) return FROM_REVIEW_SENT_NOTIFICATION_TIME;
    return TO_REVIEW_SENT_NOTIFICATION_TIME
}

function getReviewFilledFieldName(from : boolean) : string{
    if (from) return FROM_REVIEW_FILLED;
    return TO_REVIEW_FILLED
}

function getUserIdFieldName(from: boolean) : string{
    if (from) return 'from';
    return 'to'
}
