'use strict';


import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';



export async function getUserProfileReponse(userId : String) : Promise<any> {
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();
    if (!doc.exists)
      return null;    
    return doc.data();
}