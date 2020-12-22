'use strict';


import * as functions from 'firebase-functions';
import * as myFirebase from './firebase';
import {setReview, updatePublicProfileDocWithReview} from './review';

// in order for the initialization in firebase to be called
myFirebase.init()

import {getLocationFromPlaceId, handleAutoComplete} from './google_maps_api';
//import { admin } from 'firebase-admin/lib/credential';

export const getLocationDetailsFromPlaceId = functions.https.onRequest(async (request, response) => {
    try {    
      const locationDetails = await getLocationFromPlaceId(request.body.placeId);
      response.send(locationDetails);
    }
    catch (ex) {
      console.log(ex);         
      response.status(500).send(ex);
    }
  });

export const autoComplete = functions.https.onRequest(async (request, response) => {  
    try {
      const body = request.body;
      const results: [] = await handleAutoComplete(body.sessionId, body.place);
      response.send(results);
    }
    catch (ex) {
        console.log(ex);    
        response.status(500).send(ex);
    }
  });

export const test = functions.https.onRequest(async (request, response) => {
    try {
      const myAdmin = require('firebase-admin');
      const db = myAdmin.firestore();
      const doc = await db.collection('production').doc('production').collection('reviews').doc('3').get();
      if (doc.exists) {
        const reviews = doc.data();
        console.log(reviews)
    }

      response.send('ok');
      console.log('OK');         
    }
    catch (ex) {
        console.log(ex);         
        response.status(500).send(ex);
      }
  });

exports.writeReviewOnExchange = functions.https.onRequest(async (request, response) => {
    try {
      await setReview(request);
      response.send('done');
    }
    catch (ex) {
      console.log(ex);         
      response.status(500).send(ex);
  }
})

// update review in public profile each time user updates the profile
exports.updateProfile = functions.firestore
  .document('production/production/public-profiles/{userIDGuid}')
    .onWrite(async (change, context) => {
  try {
    const userId = change.after.data().userId;
    await updatePublicProfileDocWithReview(userId)
  }
  catch (ex) {
    console.log(ex);         
  }
})


export const sendNotificationToFCMToken2 = functions.firestore.document('production/production/msgs/msgs/exchange-msgs/{mUid}').onWrite(async (change, context) => {
  try{
    const admin = require('firebase-admin');
    
    const to = change.after.get('to');
    const from = change.after.get('from');
    console.log(change.after.data() );
    console.log('from : ' + from );
    console.log('to : ' + to );
    console.log('mUid : ' + context.params.mUid);
    
    var title = 'msg from ' + from;
    var content ='Exchange msg';

    const confirm = change.after.get('confirm');
    const canceled = change.after.get('canceled');

    if (confirm == 'true'){
      console.log('conifirm : True');
      content = 'Exchange msg Confirm! ';
    }

    if (canceled == 'true'){
      console.log('Canceled : True');
      content = 'Exchange msg Canceled! ';
    }
    
    let userDoc = await admin.firestore().doc(`production/production/notification-tokens/${to}`).get();
    let fcmToken = userDoc.get('token');
    console.log('fcm : ' + fcmToken);
    var message = {
        notification: {
            title: title,
            body: content,
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        token: fcmToken,

    }

    let response = await admin.messaging().send(message);
    console.log(response);

}
catch (ex) {
    console.log(ex);         
  }
});
