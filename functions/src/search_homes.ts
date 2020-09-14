const sha256 = require('js-sha256');
const util = require('util');
const sharp = require('sharp');
const tempfile = require('tempfile');

const path = require('path');
const os = require('os');
const fs = require('fs');

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
import {downloadFileFromStorage,fileExistsInStorage, uploadFileUsingBufferToStorage,uploadFileToStorage} from './firebase_storage'
import {getLocationFromPlaceId, handleAutoComplete} from './google_maps_api';



export async function searchHomesNow(placeId : string, startDateList : any, endDateList : any, filters : any) {
    let place : {} = await getLocationFromPlaceId(placeId)

    let fetchCondition = {}
    let query = db.collection('users');    
    // search location
    Object.keys(place['regions']).forEach(function(key) {
        query = query.where('location.regions.' + key, '==', place['regions'][key])
    });

    const results = await query.get();
    const jsonResults: any[] = [];
    results.forEach(doc => {
        jsonResults.push(doc.data())
      });
      return jsonResults
}