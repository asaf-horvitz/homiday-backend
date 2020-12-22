'use strict';


import * as functions from 'firebase-functions';
import * as myFirebase from './firebase';
import {setReview, updatePublicProfileDocWithReview, sendReviewNotification} from './review';
import {sendTheNotification} from './notification';

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
  try{
    const admin = require('firebase-admin');
    
    const to = change.after.get('to');
    const from = change.after.get('from');
    console.log(change.after.data() );
    console.log('from : ' + from );
    console.log('to : ' + to );
    console.log('mUid : ' + context.params.mUid);
    
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
});

exports.sendReviewNotification = functions.pubsub.schedule('0 20 * * *')
  .timeZone('Asia/Jerusalem') // Users can choose timezone - default is America/Los_Angeles
  .onRun(async (context) => {
    await sendReviewNotification();
  return null;
});


