'use strict';


import * as functions from 'firebase-functions';
import * as myFirebase from './firebase';
import {setReview, updatePublicProfileDocWithReview, sendReviewNotification} from './review';
import {sendNotificationAfterExchangeRequestUpdated} from './notification';
import {createMoneyDoc} from './money'

// in order for the initialization in firebase to be called
myFirebase.init()

import {getLocationFromPlaceId, handleAutoComplete} from './google_maps_api';
import { print } from 'util';
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
      /*
      const myAdmin = require('firebase-admin');
      const db = myAdmin.firestore();
      const doc = await db.collection('production').doc('production').collection('reviews').doc('3').get();
      if (doc.exists) {
        const reviews = doc.data();
        console.log(reviews)

    }
    */
      await sendReviewNotification();
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
  await sendNotificationAfterExchangeRequestUpdated(change, context);
});

exports.sendReviewNotification = functions.pubsub.schedule('0 20 * * *')
  .timeZone('Asia/Jerusalem') // Users can choose timezone - default is America/Los_Angeles
  .onRun(async (context) => {
    await sendReviewNotification();
  return null;
});


export const privateProfileUpdated = functions.firestore.document('production/production/private-profiles/{guid}').onWrite(async (change, context) => {
  console.log('privateProfileUpdated')
  await createMoneyDoc(change);
});


