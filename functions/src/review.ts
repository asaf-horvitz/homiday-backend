
import { Timestamp } from '@google-cloud/firestore';
import { sendTheNotification } from './notification';

const myAdmin = require('firebase-admin');

const REVIEWS_I_MADE = 'reviewsIMade';
const REVIEWS_ON_ME = 'reviewsOnMe';
const GRADES = 'grades';
const TOTAL_REVIEW_SCORE = 'totalReviewScore'
const TOTAL_REVIEWS = 'totalReviews'



export async function setReview(request) {
    await writeRevieInsideReviewerDoc(request)
    await writeRevieInsideMyDetails(request)
    const userIdToReview = request.body.userIdToReview; 
    const reviewerId = request.body.reviewerId
    await updatePublicProfileDocWithReview(userIdToReview)
    await updatePublicProfileDocWithReview(reviewerId)
}

function getDocPathInCollection(docId) {
    const db = myAdmin.firestore();
    return db.collection('production').doc('production').collection('reviews').doc(docId);
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

export async function updatePublicProfileDocWithReview(userId) {
    const db = myAdmin.firestore();
    const querySnapshot  = await db.collection('production').doc('production').collection('public-profiles').where('userId', '==', userId).get();
    querySnapshot.forEach(async (doc) => {
        const docId = doc.id;

        const userReviewDetailsDoc = await db.collection('production').doc('production').collection('reviews').doc(userId).get();
        if (!userReviewDetailsDoc.exists)
        return;
        const profile = doc.data();
        profile['userReviewDetails'] = userReviewDetailsDoc.data();
        await db.collection('production').doc('production').collection('public-profiles').doc(docId).set(profile);
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

const FROM_REVIEW_FILLED = 'fromReviewFilled'
const TO_REVIEW_FILLED = 'toReviewFilled'
const FROM_REVIEW_SENT_NOTIFICATION_TIME = 'fromReviewSentNotificationTime'
const TO_REVIEW_SENT_NOTIFICATION_TIME = 'toReviewSentNotificationTime'
export async function sendReviewNotification() {
    console.log('inside')
    
    
    const db = myAdmin.firestore();
    const querySnapshot  = await db.collection('production/production/msgs/msgs/exchange-msgs').get();
    
    querySnapshot.forEach(async (doc) => {
        const json = doc.data()
        if (json[FROM_REVIEW_FILLED] !== true) await sendNotificationToSingleUser(true, json, doc.id);
        if (json[TO_REVIEW_FILLED] !== true) await sendNotificationToSingleUser(false, json, doc.id);
    });
}

async function sendNotificationToSingleUser(from : boolean, json : {}, exchangeDocId : String) : Promise<boolean> {
    const endExchangeDate : Timestamp = json['endExchange']
    if (endExchangeDate.seconds + (24*60*60) > Timestamp.now().seconds) return false;
    
    let userId = json['to']
    if (from)
        userId = json['from']

    console.log('send review notification to ' + userId);

    const title = 'איך הייתה ההחלפה שלכם ?';
    const content = 'הכנסו לאפליקציה ומלאו חוות דעת'
    await sendTheNotification(userId, title, content);

    let notificationTime = TO_REVIEW_SENT_NOTIFICATION_TIME
    let reviewFilled = TO_REVIEW_FILLED
    if (from) {
        notificationTime = FROM_REVIEW_SENT_NOTIFICATION_TIME
        reviewFilled = FROM_REVIEW_FILLED
    }
    json[notificationTime] = Timestamp.now()
    json[reviewFilled] = true
    await myAdmin.firestore().doc(`production/production/msgs/msgs/exchange-msgs/${exchangeDocId}`).set(json);
    console.log('notification sent')

    return true;
}
