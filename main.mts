interface GenericResponse<T> {
    success: number;
    message: T;
};

//cat: 0
const measure_air_codes = ["benzene", "particulate_matter_pm2_5", "particulate_matter_pm10", "carbon_monoxide", "ozone", "nitrogen_dioxide", "nitrogen_monoxide"] as const;
//cat: 1
const measure_weather_codes = ["global_radiation", "air_pressure", "air_humidity", "air_temperature", "wind_speed_peak", "precipitation", "wind_speed", "wind_direction", "uv_index"] as const;
//cat: 2
const measure_water_codes = ["ammonium", "conductivity", "nitrate", "phosphorous", "ph", "oxygen", "turbidity", "temperature"] as const;

type Measure = typeof measure_air_codes[number] | typeof measure_weather_codes[number] | typeof measure_water_codes[number];

type Cat = "0" | "1" | "2";

type GetStationsRequest =
    | {
        all: 1,
    }
    | {
        cat: Cat,
    }
    | {
        id: Measure,
        cat: Cat,
    };

type GetStationsResponse = GenericResponse<{
    id_station: number;
    name: string;
    station_code: string;
    measure_list: string;
}[]>;

type GetMeasuresRequest = {
    type: string,
}

type GetMeasuresResponse = GenericResponse<{
    id_station: string;
    date_entry: string;
    [key: string]: string | number | null;
}[]>;

type GetValuesRequest = {
    cat: Cat,
    measure: Measure,
    type: string,
} & ({ date_yesterday: string } | { days: number })

type GetValuesResponse<T extends string> = GenericResponse<({
    [key in T]: string | number | null;
} & {
    date_entry: string;
})[]>;



async function getStations(): Promise<GetStationsResponse> {
    const response = await fetch("https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_stations/", {
        method: 'POST',
        body: JSON.stringify({ "all": 1 } satisfies GetStationsRequest),
        headers: { 'content-type': 'application/json' }
    })

    if (!response.ok) {
        throw new Error(`failed to get stations: ${response.ok} ${await response.text()}`);
    }
    const responseBody = await response.json() as GenericResponse<unknown>;

    if (!responseBody.success) {
        throw new Error(`failed to get stations: ${response.ok} ${await responseBody.message}`);
    }

    return responseBody as GetStationsResponse;
}

async function getMeasures(stationCode: string): Promise<GetMeasuresResponse> {
    const response = await fetch("https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_measures/", {
        method: 'POST',
        body: JSON.stringify({ "type": stationCode } satisfies GetMeasuresRequest),
        headers: { 'content-type': 'application/json' }
    })

    if (!response.ok) {
        throw new Error(`failed to get measures: ${response.ok} ${await response.text()}`);
    }
    const responseBody = await response.json() as GenericResponse<unknown>;

    if (!responseBody.success) {
        throw new Error(`failed to get measures: ${response.ok} ${await responseBody.message}`);
    }

    return responseBody as GetMeasuresResponse;
}

async function getValues<T extends Measure>(stationCode: string, measure: T, days: number = 30): Promise<GetValuesResponse<T>> {
    let category: 0 | 1 | 2 = 2;
    if (measure_air_codes.includes(measure as typeof measure_air_codes[number])) {
        category = 0;
    } else if (measure_weather_codes.includes(measure as typeof measure_weather_codes[number])) {
        category = 1;
    }
    const response = await fetch("https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get/", {
        method: 'POST',
        body: JSON.stringify({ "type": stationCode, "cat": `${category}`, measure, days } satisfies GetValuesRequest),
        headers: { 'content-type': 'application/json' }
    })

    if (!response.ok) {
        throw new Error(`failed to get measures: ${response.ok} ${await response.text()}`);
    }
    const responseBody = await response.json() as GenericResponse<unknown>;

    if (!responseBody.success) {
        throw new Error(`failed to get measures: ${response.ok} ${await responseBody.message}`);
    }

    return responseBody as GetValuesResponse<T>;
}

const stations = await getStations()

console.log(stations);

const stationCode = stations.message[6].station_code;
console.log(await getMeasures(stationCode))
console.log(await getValues(stationCode, "oxygen", 30))
