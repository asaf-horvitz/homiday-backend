'use strict';

import * as functions from 'firebase-functions';
const axios = require('axios')

import {getLocationFromPlaceId, handleAutoComplete} from './google_maps_api';
import {getUserProfileReponse, setUserProfileReponse} from './profile_managment';
import {getImagesFromCloud} from './get_images';
import {searchHomesNow} from './search_homes';

const SEARCH_ONLY_CITIES = true;
export const setUserProfile = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      var location = await getLocationFromPlaceId(request.body.placeId)
      request.body.location = location
      let userId = request.body.userId;
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
      await getLocationFromPlaceId('ChIJTbFX6ioxHRURHn9WS3zh798');
      response.send('ok');
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        response.send({});
      }
  })();
});