'use strict';


const sha256 = require('js-sha256');
const util = require('util');
const sharp = require('sharp');
const tempfile = require('tempfile');

const path = require('path');
const os = require('os');
const fs = require('fs');

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
import {downloadFileFromStorage,fileExistsInStorage, uploadFileUsingBufferToStorage,uploadFileToStorage} from './firebase_storage'


export async function getUserProfileReponse(userId : String) : Promise<any> {
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();
    if (!doc.exists)
      return null;    
    return doc.data();
}

async function insertImageToBucket(bufferBase64: string) : Promise<string> {
  let profileImageSha256 = await sha256(bufferBase64);
  if (await fileExistsInStorage(profileImageSha256,IMAGES_BUCKET_NAME)) 
    return profileImageSha256;
  const inputJpg: string = tempfile();
  const outputJpg: string = tempfile();

  let buff = await new Buffer(bufferBase64, 'base64');

  fs.writeFileSync(inputJpg,buff);
  
  await sharp(inputJpg).jpeg({quality: 50}).toFile(outputJpg);
  
  await uploadFileToStorage(outputJpg, profileImageSha256, LOW_RES_IMAGES_BUCKET_NAME);
  await uploadFileUsingBufferToStorage(buff, profileImageSha256, IMAGES_BUCKET_NAME);
  fs.unlinkSync(inputJpg)
  fs.unlinkSync(outputJpg)
  return profileImageSha256;
}

export async function setUserProfileReponse(request : any, response: any) : Promise<any> {
  const docRef = db.collection('users').doc(request.body.userId);
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
  return 'OK';
}
