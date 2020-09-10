'use strict';

import * as functions from 'firebase-functions';
const delay = require('delay');
const axios = require('axios')

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
import {getLocationFromPlaceId, handleAutoComplete} from './auto_complete';
import {getUserProfileReponse, setUserProfileReponse} from './profile_managment';
import {getImagesFromCloud} from './get_images';
import { storage } from 'firebase-admin';
import { json } from 'express';
import { TSMap } from "typescript-map"

const path = require('path');
const os = require('os');
const fs = require('fs');

export const getLocation = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      let body = request.body;
      let results: {} = await getLocationFromPlaceId(body.placeId);

      response.send(results);
    }
    catch (ex) {
        console.log(ex);         
        response.send({});
      }
  })();
});

export const setUserProfile = functions.https.onRequest((request, response) => {
  (async () => {
    try {
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

export const autoComplete = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      let body = request.body;
      let results: [] = await handleAutoComplete(body.sessionId, body.place);

      response.send(results);
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        response.send({});
      }
  })();
});