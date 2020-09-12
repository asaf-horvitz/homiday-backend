const sha256 = require('js-sha256');
const util = require('util');
const sharp = require('sharp');
const tempfile = require('tempfile');

const path = require('path');
const os = require('os');
const fs = require('fs');

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
import {downloadFileFromStorage,fileExistsInStorage, uploadFileUsingBufferToStorage,uploadFileToStorage} from './firebase_storage'



export async function searchHomesNow(placeId : string, startDateList : any, endDateList : any, filters : any) {

}