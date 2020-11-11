

import {LOW_RES_IMAGES_BUCKET_NAME } from './firebase';
import {downloadFileFromStorage} from './firebase_storage';
import { TSMap } from "typescript-map"
const fs = require('fs');


export async function getImagesFromCloud(imagesSha256 : Array<string>, response : any) {
    const fileLenArray = new Array();
    const filePathArray = new Array();
    let allFiles = new Buffer('');
    for (const imageSha256 of imagesSha256)
    {
        let filePath: string = await downloadFileFromStorage(imageSha256, LOW_RES_IMAGES_BUCKET_NAME);
        if (filePath == null)   
        continue;
        filePathArray.push(filePath)
        let fileLen = 0;
        let fileBuffer = new Buffer('')
        if (filePath != null) {
        fileBuffer = fs.readFileSync(filePath);
        }
        const myMap = new TSMap();
        myMap.set(imageSha256, fileBuffer.byteLength);

        fileLenArray.push(myMap);
        allFiles = Buffer.concat([allFiles, fileBuffer])
    }
    //      response.writeHead(200, {"Content-Type": "application/octet-stream", 'filesList':JSON.stringify(fileLenArray)});
    response.writeHead(200, {"Content-Type": "application/x-binary", 'filesList':JSON.stringify(fileLenArray)});
    response.write(allFiles.toString('binary'), 'binary');
    return response.end();
}

