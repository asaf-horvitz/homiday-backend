'use strict';


const sha256 = require('js-sha256');
const sharp = require('sharp');
const tempfile = require('tempfile');

const fs = require('fs');

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME, db } from './firebase';
import {fileExistsInStorage, uploadFileUsingBufferToStorage,uploadFileToStorage} from './firebase_storage'


export async function getUserProfileReponse(userId : String) : Promise<any> {
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();
    if (!doc.exists)
      return null;    
    return doc.data();
}

async function insertImageToBucket(bufferBase64: string) : Promise<string> {
  const profileImageSha256 = await sha256(bufferBase64);
  if (await fileExistsInStorage(profileImageSha256,IMAGES_BUCKET_NAME)) 
    return profileImageSha256;
  const inputJpg: string = tempfile();
  const outputJpg: string = tempfile();

  const buff = await new Buffer(bufferBase64, 'base64');

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
  if (request.body.profileImage !== undefined) {
    request.body.profileImageSha256 = await insertImageToBucket(request.body.profileImage);
    delete(request.body.profileImage)
  }

  const imagesSha256List = new Array();

  for (const imageBase64 of request.body.images) 
  {
    if (imageBase64 == '') continue;
    const imageSha256 = await insertImageToBucket(imageBase64);
    imagesSha256List.push(imageSha256);
  }
  delete(request.body.images)
  request.body.imagesSha256 = imagesSha256List;
  await docRef.set(request.body);
  return 'OK';
}
