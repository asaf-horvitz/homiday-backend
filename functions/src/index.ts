'use strict';

import * as functions from 'firebase-functions';
const delay = require('delay');
const util = require('util');
const axios = require('axios')
const sha256 = require('js-sha256');
const sharp = require('sharp');
const tempfile = require('tempfile');

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
import {getLocationFromPlaceId, handleAutoComplete} from './auto_complete';
import {getUserProfileReponse} from './profile_managment';
import { storage } from 'firebase-admin';
import { json } from 'express';
import { TSMap } from "typescript-map"

const path = require('path');
const os = require('os');
const fs = require('fs');


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

async function insertImageToBucket(bufferBase64: string) : Promise<string> {
  let profileImageSha256 = await sha256(bufferBase64);
  if (await fileExists(profileImageSha256,IMAGES_BUCKET_NAME)) 
    return profileImageSha256;
  const inputJpg: string = tempfile();
  const outputJpg: string = tempfile();

  let buff = await new Buffer(bufferBase64, 'base64');

  fs.writeFileSync(inputJpg,buff);
  
  await sharp(inputJpg).jpeg({quality: 50}).toFile(outputJpg);
  
  await uploadFile(outputJpg, profileImageSha256, LOW_RES_IMAGES_BUCKET_NAME);
  await uploadFileUsingBuffer(buff, profileImageSha256, IMAGES_BUCKET_NAME);
  fs.unlinkSync(inputJpg)
  fs.unlinkSync(outputJpg)
  return profileImageSha256;
}

export const setUserProfile = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      let userId = request.body.userId;
      const docRef = db.collection('users').doc(userId);
      if (request.body.profileImageSha256 != '') {
        request.body.profileImageSha256 = await insertImageToBucket(request.body.profileImage);
      }

      let imagesSha256List = new Array();

      for (let imageBase64 of request.body.images) 
      {
        if (imageBase64 == '') continue;
        let imageSha256 = await insertImageToBucket(imageBase64);
        imagesSha256List.push(imageSha256);
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

export const getImages = functions.https.onRequest((request, response) => {
  (async () => {
    try {
      let imagesSha256 = request.body.imagesSha256;
      let fileLenArray = new Array();
      let filePathArray = new Array();
      let allFiles = new Buffer('');
      for (let imageSha256 of imagesSha256)
      {
        let filePath: string = await downloadFile(imageSha256, IMAGES_BUCKET_NAME);
        if (filePath == null)
          continue;
        filePathArray.push(filePath)
        let fileLen = 0;
        var fileBuffer = new Buffer('')
        if (filePath != null) {
          fileBuffer = fs.readFileSync(filePath);
        }
        var myMap = new TSMap();
        myMap.set(imageSha256, fileBuffer.byteLength);

        fileLenArray.push(myMap);
        allFiles = Buffer.concat([allFiles, fileBuffer])
      }
//      response.writeHead(200, {"Content-Type": "application/octet-stream", 'filesList':JSON.stringify(fileLenArray)});
      response.writeHead(200, {"Content-Type": "application/x-binary", 'filesList':JSON.stringify(fileLenArray)});
      response.write(allFiles.toString('binary'), 'binary');
      return response.end();
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