'use strict';


import * as functions from 'firebase-functions';
import * as myFirebase from './firebase';
import {setReview} from './review';

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
});