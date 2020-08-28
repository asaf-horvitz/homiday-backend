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


admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();


// if you need to use the Firebase Admin SDK, uncomment the following:
// import * as admin from 'firebase-admin'


// Create and Deploy Cloud Function with TypeScript using script that is
// defined in functions/package.json:
//    cd functions
//    npm run deploy

console.log('555');
const GOOGLE_API = 'AIzaSyAKJiNmu2tVrAtNn04T_AF3lvOsbo_Y2Ow';


handleAutoComplete('12321232', 'ramat');

export const helloWorld2 = functions.https.onRequest((request, response) => {

  (async () => {
    const docRef = db.collection('users').doc('alovelace3');
    try {
    await docRef.set(request.body);
      console.log('done writing');
    }
    catch (ex) {
        console.log('Error!!!');
        console.log(ex);         
    }
    console.log('Test!');
  })();

 response.send('success');
});

function FormatString(str: string, ...val: string[]) {
  for (let index = 0; index < val.length; index++) {
    str = str.replace(`{${index}}`, val[index]);
  }
  return str;
}
async function handleAutoComplete(sessionId : string, word: string)  {
  let url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input="{0}"&key={1}&sessiontoken={2}';  
  url = FormatString(url, word, GOOGLE_API, sessionId);

  console.log('before');
  const res = await axios.post(url);
  if (res.status == 200) {
    console.log(res.data);
    if (Object.keys(res).includes('data') && Object.keys(res.data).includes('predictions')) {
      console.log('very good');
      const presictions: JSON[] = Array.of(res.data.predictions);
      console.log(presictions.length);
    }

    

  }
  console.log(res);


  

}

export const autoComplete = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      await handleAutoComplete('12321312312', 'ramat');
      response.send('success');
    }
    catch (ex) {
        console.log('Error!!!');
        console.log(ex);         
        response.send('fail');
      }
    console.log('Test!');
  })();

});

/*
(async () => {
    while (true) {

    console.log('111');
    await delay(1000);}})();
*/