import {IMAGES_BUCKET_NAME,LOW_RES_IMAGES_BUCKET_NAME,storageRef, db } from './firebase';
const path = require('path');
const os = require('os');
const fs = require('fs');


export async function downloadFileFromStorage(storageFileName : string, bucketName: string): Promise<string> {
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
  
  export async function uploadFileUsingBufferToStorage(buffer: Buffer, storageFileName : string, bucketName: string): Promise<boolean> {
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
    return uploadFileToStorage(tempFilePath, storageFileName, bucketName);
  }
  
  export async function fileExistsInStorage(storageFileName : string, bucketName: string): Promise<boolean> {
    return await downloadFileFromStorage(storageFileName, bucketName)  != null;
  }
  
  export async function uploadFileToStorage(localFileName: string, storageFileName : string, bucketName: string): Promise<boolean> {
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
  
  