

import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
import {downloadFileFromStorage,fileExistsInStorage, uploadFileUsingBufferToStorage,uploadFileToStorage} from './firebase_storage';
import { TSMap } from "typescript-map"
const path = require('path');
const os = require('os');
const fs = require('fs');


export async function getImagesFromCloud(imagesSha256 : Array<string>, response : any) {
    let fileLenArray = new Array();
    let filePathArray = new Array();
    let allFiles = new Buffer('');
    for (let imageSha256 of imagesSha256)
    {
        let filePath: string = await downloadFileFromStorage(imageSha256, LOW_RES_IMAGES_BUCKET_NAME);
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

