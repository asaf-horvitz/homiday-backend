
const admin = require('firebase-admin');
const serviceAccount = require('c:/Users/asafh/work/projects/firebase.json');
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
export const db = admin.firestore();

export var storageRef = admin.storage();

export const IMAGES_BUCKET_NAME = "homiday-images"
export const LOW_RES_IMAGES_BUCKET_NAME = "homiday-low-res-images"

