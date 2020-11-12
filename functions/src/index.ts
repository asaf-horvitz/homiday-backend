'use strict';

import * as functions from 'firebase-functions';
import * as myFirebase from './firebase';

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
      const body = request.body;
      // todo - make sure this users id are valid !!!
      const userIdToReview = body.userIdToReview; 
      const docId = body.docId;

      const myAdmin = require('firebase-admin');
      const db = myAdmin.firestore();
      const doc = await db.collection('production').doc('production').collection('reviews').doc(docId).get();
      let reviews = {};
      if (doc.exists) {
          reviews = doc.data();
      }

      reviews[userIdToReview] = request.body;

      let totalReviewScore = 0;
      let totalReviews = 0;
      for (const review  in reviews ) {
        const currentGrades : number[] = reviews[review]['grades'] as number[];
        for (const grade of currentGrades) {
              totalReviewScore += grade;
          }
          totalReviews++;
      }
      totalReviewScore = (totalReviewScore / 4) / totalReviews;
      await db.collection('production').doc('production').collection('reviews').doc(userIdToReview).set({
          'totalReviewScore' : totalReviewScore,
          'totalReviews' : totalReviews,
          'reviews' : reviews
      });
      response.send('done');
    }
    catch (ex) {
      console.log(ex);         
      response.status(500).send(ex);
  }
});