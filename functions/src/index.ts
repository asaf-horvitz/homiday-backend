'use strict';

import * as functions from 'firebase-functions';

import {getLocationFromPlaceId, handleAutoComplete} from './google_maps_api';
import {getUserProfileReponse, setUserProfileReponse} from './profile_managment';
import {getImagesFromCloud} from './get_images';
import {searchHomesNow} from './search_homes';
//import { admin } from 'firebase-admin/lib/credential';

const SEARCH_ONLY_CITIES = true;
export const setUserProfile = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      const userId = request.body.userId;
      await setUserProfileReponse(request, response);
    response.send('OK');
    }
    catch (ex) {
        console.log('Error!!!' + ex);
        response.send({});
      }
  })();
});

export const getImages = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      return await getImagesFromCloud(request.body.imagesSha256, response);
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        return response.send('error');
      }
  })();
});

export const getLocationDetailsFromPlaceId = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      var locationDetails = await getLocationFromPlaceId(request.body.placeId);
      return response.send(locationDetails);
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        return response.send(null);
      }
  })();
});

export const getUserProfile = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      return response.send(await getUserProfileReponse(request.body.userId));
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        return response.send(null);
      }
  })();
});

export const searchHomes = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      var x = await getLocationFromPlaceId("ChIJ9auRY3EdHBURMyOMe_aRB10")
      
      const body = request.body;
      const placeId = body.placeId
      const startDateList = body.startDateList
      const endDateList = body.startDateList
      const filters = body.filters
      
      const profiles = await searchHomesNow(placeId, startDateList, endDateList, filters);
      response.send(profiles);
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        response.send({});
      }
  })();
});

export const autoComplete = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      let body = request.body;
      let results: [] = await handleAutoComplete(body.sessionId, body.place,!SEARCH_ONLY_CITIES);

      response.send(results);
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        response.send({});
      }
  })();
});

export const test = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      response.send('ok');
      console.log('OK');         
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        response.send({});
      }
  })();
});

exports.review = functions.https.onRequest((request, response) => {
  (async () => {
      try {
        let body = request.body;
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
          let x = reviews[review];
          let currentGrades : number[] = reviews[review]['grades'] as number[];
          for (let grade of currentGrades) {
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
          console.log('Error!!!' + ex);
          response.send({});
      }
  })();
});


exports.updateUser = functions.firestore.document('production/{id}').onWrite(async (change, context) => {
      const myAdmin = require('firebase-admin');
      const db = myAdmin.firestore();
      const before = change.before.data();
      const after = change.after.data();
      //await db.collection('production').doc('production').collection('reviews').doc();
  

      await db.collection('testfs').add({'asaf444': '666'})
      // ... Your code here
      console.log('insideeeeee'); 
    });
