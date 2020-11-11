const axios = require('axios')
const GOOGLE_API = 'AIzaSyAKJiNmu2tVrAtNn04T_AF3lvOsbo_Y2Ow';

export async function getLocationFromPlaceId(placeId: string) {
  let url = 'https://maps.googleapis.com/maps/api/geocode/json?place_id={0}&key={1}&language=en';
    url = FormatString(url, placeId, GOOGLE_API);
    try {
      const res = await axios.post(url);
      console.log('response....')
      const location: {} = {};
      location['lat'] = res.data.results[0].geometry.location.lat;
      location['lon'] = res.data.results[0].geometry.location.lng;
      location['northeastLat'] = (res.data.results[0].geometry.viewport.northeast.lat)
      location['northeastLon'] = (res.data.results[0].geometry.viewport.northeast.lng)
      location['southwestLat'] = (res.data.results[0].geometry.viewport.southwest.lat)
      location['southwestLon'] = (res.data.results[0].geometry.viewport.southwest.lng)
      location['regions'] = {}
      for (const item of res.data.results[0].address_components) {
        location['regions'][item.types[0]] = item.short_name;
      }

      return location
    }
    catch (ex) {
      console.log(ex);
      return {}
    }
  }
  
  function FormatString(str: string, ...val: string[]) {
    for (let index = 0; index < val.length; index++) {
      str = str.replace(`{${index}}`, val[index]);
    }
    return str;
  }
  
  export async function handleAutoComplete(sessionId : string, word: string,searchCitiesOnly: boolean)  {
    let url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input="{0}"&key={1}&sessiontoken={2}';
    url = encodeURI(FormatString(url, word, GOOGLE_API, sessionId));
  
    '&types=(regions)'
    console.log('before');
    const res = await axios.post(url);
    let results: any = [];
    if (res.status == 200) {
      console.log(res.data);
      if (Object.keys(res).includes('data') && Object.keys(res.data).includes('predictions')) {
        const presictions: JSON[] = Array.of(res.data.predictions)[0];
        console.log(presictions.length);
  
        for (let i = 0; i < presictions.length; i++) {
          console.log(presictions[i])
          results.push({placeId: presictions[i]['place_id'], mainText: presictions[i]['structured_formatting']['main_text']
          , secondaryText: presictions[i]['structured_formatting']['secondary_text']});
  
        }      
      }
    }
    return results;
  }
  