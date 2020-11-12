

const admin = require('firebase-admin');
const fs = require("fs"); // Or `import fs from "fs";` with ESM
const credentialFile = 'c:/Users/asafh/work/projects/firebase.json'

if (fs.existsSync(credentialFile)) {
    admin.initializeApp({credential: admin.credential.cert(credentialFile)});
}
else {
    admin.initializeApp()
}


export const db = admin.firestore();

export let storageRef = admin.storage();

export const IMAGES_BUCKET_NAME = "homiday-images"
export const LOW_RES_IMAGES_BUCKET_NAME = "homiday-low-res-images"

export function init() {
    console.log('initializing...')
}

