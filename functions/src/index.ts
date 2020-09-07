'use strict';

const delay = require('delay');
const util = require('util');
const axios = require('axios')
var sha256 = require('js-sha256');

import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
const serviceAccount = require('c:/Users/asafh/work/projects/firebase.json');
import {getLocationFromPlaceId, handleAutoComplete} from './auto_complete';
import { storage } from 'firebase-admin';

const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();

var storageRef = admin.storage();
var bucket = storageRef.bucket('homiday-images');

const IMAGES_BUCKET_NAME = "homiday-images"

async function downloadFile(storageFileName : string, bucketName: string): Promise<string> {
  try {
    var bucket = storageRef.bucket(bucketName);
    const tempFilePath : string = path.join(os.tmpdir(), storageFileName);  
    await bucket.file(storageFileName).download({destination: tempFilePath});
    return tempFilePath;
  }
  catch (ex) {
     console.log(ex)
    return null;
  }
}

async function uploadFileUsingBuffer(buffer: Buffer, storageFileName : string, bucketName: string): Promise<boolean> {
  const tempFilePath : string = path.join(os.tmpdir(), storageFileName);
  fs.open(tempFilePath, 'w', function(err, fd) {
    if (err) {
        throw 'could not open file: ' + err;
    }

    // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
        if (err) throw 'error writing file: ' + err;
        fs.close(fd, function() {
            console.log('wrote the file successfully');
        });
    });
  });
  return uploadFile(tempFilePath, storageFileName, bucketName);
}

async function fileExists(storageFileName : string, bucketName: string): Promise<boolean> {
  return await downloadFile(storageFileName, bucketName)  != null;
}


async function uploadFile(localFileName: string, storageFileName : string, bucketName: string): Promise<boolean> {
  try {
    var bucket = storageRef.bucket(bucketName);
    await bucket.upload(localFileName, {destination: storageFileName});
  return true;
  }
  catch (ex) {
    console.log(ex)
    return false;
  }
}

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
      
      let profileImageSha256 = sha256(request.body.profileImage);
      if (!await fileExists(profileImageSha256,IMAGES_BUCKET_NAME)) {
        let buff = new Buffer(request.body.profileImage, 'base64');
        await uploadFileUsingBuffer(buff, profileImageSha256, IMAGES_BUCKET_NAME);
      }
      request.body.profileImageSha256 = profileImageSha256;
      let imagesSha256List = new Array();
      for (let imageBase64 of request.body.images) 
      {
        let imageSha256 = sha256(imageBase64);
        imagesSha256List.push(imageSha256);
        if (!await fileExists(imageBase64,IMAGES_BUCKET_NAME)) {
          let buff = new Buffer(imageBase64, 'base64');
          await uploadFileUsingBuffer(buff, imageSha256, IMAGES_BUCKET_NAME);
        }
      }
      request.body.images = 'use only for profile update';
      request.body.profileImage = 'use only for profile update';
      request.body.imagesSha256 = imagesSha256List;
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
        return response.send(null);
      
      return response.send(doc.data());
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