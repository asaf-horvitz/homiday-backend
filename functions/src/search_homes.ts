import { db } from './firebase';
import {getLocationFromPlaceId } from './google_maps_api';



export async function searchHomesNow(placeId : string, startDateList : any, endDateList : any, filters : any) {
    const place : {} = await getLocationFromPlaceId(placeId)

    let query = db.collection('users');    
    Object.keys(place['regions']).forEach(function(key) {
        query = query.where('location.geoLocation.regions.' + key, '==', place['regions'][key])
    });

    const results = await query.get();
    const jsonResults: any[] = [];
    results.forEach(doc => {
        jsonResults.push(doc.data())
      });
      return jsonResults
}