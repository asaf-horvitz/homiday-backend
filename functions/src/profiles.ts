const myAdmin = require('firebase-admin');
import {Environment} from './environment'

export class Profiles {

    DEL_PROD_CODE :String = 'delprod723';
    DEL_DEBUG_CODE :String = 'del1111';
    ENV_PROD = true
    async deleteProfileRequest(version : String, code : String, userId : String) {
        console.log('request to delete profile ' + userId);         
        if (version === 'production' && code === this.DEL_PROD_CODE) {
            console.log('production deleting profile ' + userId);         
            await this._deleteProfile(userId, this.ENV_PROD)
            return 'deleted'
        }
        if (version === 'debug' && code === this.DEL_DEBUG_CODE) {
            console.log('debug deleting profile ' + userId);         
            await this._deleteProfile(userId, !this.ENV_PROD)
            return 'deleted'
        }
        return 'error';
    } 

    async _deleteProfile(userId : String, env: boolean) {
        await myAdmin.firestore().doc(Environment.getFullPath(env, 'private-profiles/' + userId)).delete();
        await myAdmin.firestore().doc(Environment.getFullPath(env, 'public-profiles/' + userId)).delete();        
    }
}