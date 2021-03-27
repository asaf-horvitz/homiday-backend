
import { sendTheNotification } from './notification';
import {Environment} from './environment'

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

export async function setReview(request, envProd: boolean) {
    const userIdToReview = request.body.userIdToReview; 
    const reviewerId = request.body.reviewerId
    const exchangeDocId = request.body.exchangeDocId
    request.body['msgTime'] = myAdmin.firestore.Timestamp.now()
    let date : Date = new Date(request.body['startExchange'])  
    request.body['startExchange'] = myAdmin.firestore.Timestamp.fromDate(date)
    date = new Date(request.body['endExchange'])  
    request.body['endExchange'] = myAdmin.firestore.Timestamp.fromDate(date)

    const success : boolean = await setReviewFilledInExchangeMsg(exchangeDocId, reviewerId, userIdToReview, envProd)
    console.log('done writing to exchange msg')
    if (!success) return

    // todo check user is same and has confirmed exchange request
    console.log('writing to reviews collection')
    await writeRevieInsideReviewerDoc(request, envProd)
    await writeRevieInsideMyDetails(request, envProd)
    console.log('done writing to reviews collection')
    await updatePublicProfileDocWithReview(userIdToReview, 'public-profiles', envProd)
    await updatePublicProfileDocWithReview(userIdToReview, 'private-profiles', envProd)
    await updatePublicProfileDocWithReview(reviewerId, 'public-profiles', envProd)
    await updatePublicProfileDocWithReview(reviewerId, 'private-profiles', envProd)
}

function getDocPathInCollection(docId, envProd: boolean) {
    return db.doc(Environment.getFullPath(envProd, 'reviews/' + docId));
}

async function writeRevieInsideMyDetails(request, envProd: boolean) {
    const body = request.body;

    // todo - make sure this users id are valid !!!
    const userIdToReview = body.userIdToReview; 
    const reviewerId = body.reviewerId

    const doc = await getDocPathInCollection(reviewerId, envProd).get();
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
        await getDocPathInCollection(reviewerId, envProd).update(map);     
    }
    else {
        map[REVIEWS_ON_ME] = {}
        await getDocPathInCollection(reviewerId, envProd).set(map);
    }
}

async function setReviewFilledInExchangeMsg(exchangeDocId : String, reviewerId : String, userIdToReview : String, envProd: boolean) : Promise<boolean> {
    console.log('setReviewFilledInExchangeMsg 1')
    const exchangeDoc  = await db.doc(Environment.getFullPath(envProd, 'msgs/msgs/exchange-msgs/' + exchangeDocId)).get();
    
    console.log('setReviewFilledInExchangeMsg 2')
    if (!exchangeDoc.exists)
        return false;
    
        console.log('setReviewFilledInExchangeMsg 3')
    const json = exchangeDoc.data();
    if (json['status'] !== 'enumMsgStatus.confirmed') return false

    const map = {}
    if (json['from'] === reviewerId) {
        map[FROM_REVIEW_FILLED] = true
    }
    else if (json['to'] === reviewerId) {
        map[TO_REVIEW_FILLED] = true
    }
    else 
        return false

    db.doc(Environment.getFullPath(envProd, 'msgs/msgs/exchange-msgs/' + exchangeDocId)).update(map);
    console.log('updating exchange msg ' + exchangeDocId)
    return true;

}

export async function updatePublicProfileDocWithReview(userId, profileCollection, envProd: boolean) {
    const collectionName = Environment.getFullPath(envProd, profileCollection)
    const querySnapshot  = await db.collection(collectionName).where('userId', '==', userId).get();
    console.log('updating review in profile: ' + collectionName + ', for user ' + userId);
    querySnapshot.forEach(async (doc) => {
        const docId = doc.id;

        const userReviewDetailsDoc = await db.doc(Environment.getFullPath(envProd,  'reviews/' + userId)).get();
        if (!userReviewDetailsDoc.exists) {
            console.log('didnt find review doc for user ' + userId);
            return;
        }
        const profile = doc.data();
        profile['userReviewDetails'] = userReviewDetailsDoc.data();
        await db.doc(collectionName + '/' + docId).set(profile);
        console.log('update profile for user ' + userId);
        return;
      });
      console.log('**** didnt update profile for user ' + userId);
    }

async function writeRevieInsideReviewerDoc(request, envProd: boolean) {
    const body = request.body;
    // todo - make sure this users id are valid !!!
    const userIdToReview = body.userIdToReview; 
    const reviewerId = body.reviewerId

    const doc = await getDocPathInCollection(userIdToReview, envProd).get();
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
        await getDocPathInCollection(userIdToReview, envProd).update(map)
    }
    else {
        map[REVIEWS_I_MADE] = {}
        await getDocPathInCollection(userIdToReview, envProd).set(map)
    }
}

export async function sendReviewNotification(envProd : boolean) {
    console.log('inside')
        
    const querySnapshot  = await db.collection(Environment.getFullPath(envProd, 'msgs/msgs/exchange-msgs')).get();
    
    querySnapshot.forEach(async (doc) => {
        const json = doc.data()
        await sendNotificationToSingleUser(true, json, doc.id, envProd);
        await sendNotificationToSingleUser(false, json, doc.id, envProd);
    });
}

async function sendNotificationToSingleUser(from : boolean, json : {}, exchangeDocId : String, envProd: boolean) : Promise<boolean> {
    const endExchangeDate = json['endExchange']
    const status = json['status']

    if (!status.includes('confirm')) return false

    const currSeconds = (new Date(Date.now())).getTime() / 1000;


    if (endExchangeDate.seconds + (24*60*60) > currSeconds) 
        return false
    
    if (json[getReviewFilledFieldName(from)] === true) 
        return false
    if (json[getNotificationTimeFieldName(from)] === undefined || json[getNotificationTimeFieldName(from)] === null) 
        return false

    console.log('send review notification to ' + json[getUserIdFieldName(from)]);

    await sendNotificationOperation(json[getUserIdFieldName(from)], envProd);

    const map = {}
    map[getNotificationTimeFieldName(from)] = myAdmin.firestore.Timestamp.now()

    await myAdmin.firestore().doc(Environment.getFullPath(envProd,  'msgs/msgs/exchange-msgs/' + exchangeDocId)).update(map);
    console.log('notification sent for exchange doc ' + exchangeDocId)    

    return true;
}

async function sendNotificationOperation(userId: String, envProd: boolean) {
    const title = 'איך הייתה ההחלפה שלכם ?';
    const content = 'הכנסו לאפליקציה ומלאו חוות דעת'
    await sendTheNotification(userId, title, content,envProd);
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
