'use strict';


import * as functions from 'firebase-functions';
import * as myFirebase from './firebase';
import {setReview, sendReviewNotification} from './review';
import {sendNotificationAfterExchangeRequestUpdated} from './notification';
import {Profiles} from './profiles'

// in order for the initialization in firebase to be called
myFirebase.init()

const REGION = 'us-east1'

import {getLocationFromPlaceId, handleAutoComplete} from './google_maps_api';
//import { admin } from 'firebase-admin/lib/credential';

export const getLocationDetailsFromPlaceId = functions.region(REGION).https.onRequest(async (request, response) => {
    try {    
      const locationDetails = await getLocationFromPlaceId(request.body.placeId);
      response.send(locationDetails);
    }
    catch (ex) {
      console.log(ex);         
      response.status(500).send(ex);
    }
  });

export const autoComplete = functions.region(REGION).https.onRequest(async (request, response) => {  
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

export const test = functions.region(REGION).https.onRequest(async (request, response) => {
    try {
      response.send('ok');
      console.log('OK');         
    }
    catch (ex) {
        console.log(ex);         
        response.status(500).send(ex);
      }
  });

  export const profileDelSpecificOne = functions.region(REGION).https.onRequest(async (request, response) => {
    try {
      const body = request.body;
      const responseTxt = await (new Profiles()).deleteProfileRequest(body.version, body.code,body.userId)
      response.send(responseTxt);
      console.log(responseTxt);         
    }
    catch (ex) {
        console.log(ex);         
        response.status(500).send(ex);
      }
  });

exports.writeReviewOnExchange = functions.region(REGION).https.onRequest(async (request, response) => {
    try {
      const envProd : boolean = request.body['production'];
      await setReview(request, envProd);
      response.send('done');
    }
    catch (ex) {
      console.log(ex);         
      response.status(500).send(ex);
  }
})

export const listenToExchangeMsgDebug = functions.region(REGION).firestore.document('debug/debug/msgs/msgs/exchange-msgs/{mUid}').onWrite(async (change, context) => {
  await sendNotificationAfterExchangeRequestUpdated(change, context, false);
});

export const listenToExchangeMsgProduction = functions.region(REGION).firestore.document('production/production/msgs/msgs/exchange-msgs/{mUid}').onWrite(async (change, context) => {
  await sendNotificationAfterExchangeRequestUpdated(change, context, true);
});

// todo - need to do it every hour according to the time zone of each profile in the exchange
exports.sendReviewNotification = functions.region(REGION).pubsub.schedule('0 20 * * *')
  .timeZone('Asia/Jerusalem') // Users can choose timezone - default is America/Los_Angeles
  .onRun(async (context) => {
    await sendReviewNotification(true);
    await sendReviewNotification(false);

  return null;
});


/*
export const privateProfileUpdated = functions.region(REGION).firestore.document('production/production/private-profiles/{guid}').onWrite(async (change, context) => {
  console.log('production privateProfileUpdated')
  await createMoneyDoc(change);
});
*/


