import { getEditorial, getMeasureEditorial, getMeasures, getStations, getValues } from './lib.mjs'

console.log('getEditorial:', await getEditorial())
console.log('getMeasureEditorial:', await getMeasureEditorial())
const stations = await getStations()

console.log('getStations:', stations);

const stationCode = stations.message[6].station_code;
console.log("getMeasures:", await getMeasures(stationCode))
console.log("getValues:", await getValues(stationCode, "oxygen", 30))

