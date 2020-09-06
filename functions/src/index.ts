/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';


const delay = require('delay');
const util = require('util');
const axios = require('axios')
import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
const serviceAccount = require('c:/Users/asafh/work/projects/firebase.json');
import {getLocationFromPlaceId, handleAutoComplete} from './auto_complete';

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();


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
      const docRef = db.collection('users').doc(userId);
      await docRef.set(request.body);
      response.send('OK');
    }
    catch (ex) {
        console.log('Error!!!' + ex);
        response.send({});
      }
  })();
});

export const getUserProfile = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      let userId = request.body.userId;
      const docRef = db.collection('users').doc(userId);
      const doc = await docRef.get();
      if (!doc.exists)
        return response.send({});
      
      return response.send(doc.data());
    }
    catch (ex) {
        console.log('Error!!!' + ex);         
        return response.send({});
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