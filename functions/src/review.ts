
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
    const myAdmin = require('firebase-admin');
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
    const myAdmin = require('firebase-admin');
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
