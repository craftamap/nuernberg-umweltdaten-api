//cat: 0
export const measure_air_codes = ["benzene", "particulate_matter_pm2_5", "particulate_matter_pm10", "carbon_monoxide", "ozone", "nitrogen_dioxide", "nitrogen_monoxide"] as const;
//cat: 1
export const measure_weather_codes = ["global_radiation", "air_pressure", "air_humidity", "air_temperature", "wind_speed_peak", "precipitation", "wind_speed", "wind_direction", "uv_index"] as const;
//cat: 2
export const measure_water_codes = ["ammonium", "conductivity", "nitrate", "phosphorous", "ph", "oxygen", "turbidity", "temperature"] as const;

export type Measure = typeof measure_air_codes[number] | typeof measure_weather_codes[number] | typeof measure_water_codes[number];

export type Cat = "0" | "1" | "2";

export interface GenericResponse<T> {
    success: number;
    message: T;
};

export type GetStationsRequest =
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

export type GetStationsResponse = GenericResponse<{
    id_station: number;
    name: string;
    station_code: string;
    measure_list: string;
}[]>;

export type GetMeasuresRequest = {
    type: string,
}

export type GetMeasuresResponse = GenericResponse<{
    id_station: string;
    date_entry: string;
    [key: string]: string | number | null;
}[]>;

export type GetValuesRequest = {
    cat: Cat,
    measure: Measure,
    type: string,
} & ({ date_yesterday: string } | { days: number })

export type GetValuesResponse<T extends string> = GenericResponse<({
    [key in T]: string | number | null;
} & {
    date_entry: string;
})[]>;

export type GetEditorialRequest = {
    cat?: Cat,
}

export type GetEditorialResponse = GenericResponse<{
    id_editorial: number,
    name: string,
    subtitle: string,
    description: string,
    is_simple: number,
    image_path: string,
    image_alt: string,
    pdf_path: string | null,
    longitude: string,
    latitude: string,
    /** JSON list */
    graph_types: string,
    /** JSON list */
    graph_stations: string,
    /** JSON list */
    graph_measures: string,
    /** JSON list */
    selected_categories: string,
    sort_nr: number,
}[]>;


export type GetMeasureEditorialRequest = {
    all?: 1,
}

export type GetMeasureEditorialResponse = GenericResponse<{
    id_measure_editorial: number,
    name: string,
    description: string
    pdf_path: string,
}[]>;


export async function getStations(cat?: Cat, type?: string): Promise<GetStationsResponse> {
    const response = await fetch("https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_stations/", {
        method: 'POST',
        body: JSON.stringify({
            ...(cat
                ? { cat: cat, type: type }
                : { "all": 1 }
            )
        } satisfies GetStationsRequest),
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

export async function getMeasures(stationCode: string): Promise<GetMeasuresResponse> {
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

export async function getValues<T extends Measure>(stationCode: string, measure: T, days: number = 30): Promise<GetValuesResponse<T>> {
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
        throw new Error(`failed to get values: ${response.ok} ${await response.text()}`);
    }
    const responseBody = await response.json() as GenericResponse<unknown>;

    if (!responseBody.success) {
        throw new Error(`failed to get values: ${response.ok} ${await responseBody.message}`);
    }

    return responseBody as GetValuesResponse<T>;
}

export async function getEditorial(category: Cat | undefined = undefined): Promise<GetEditorialResponse> {
    const response = await fetch("https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_editorial/", {
        method: 'POST',
        body: JSON.stringify({
            ...(category ? { cat: category } : {}),
        } satisfies GetEditorialRequest),
        headers: { 'content-type': 'application/json' }
    })

    if (!response.ok) {
        throw new Error(`failed to get editorial: ${response.ok} ${await response.text()}`);
    }
    const responseBody = await response.json() as GenericResponse<unknown>;

    if (!responseBody.success) {
        throw new Error(`failed to get editorial: ${response.ok} ${await responseBody.message}`);
    }

    return responseBody as GetEditorialResponse;
}

export async function getMeasureEditorial(): Promise<GetMeasureEditorialResponse> {
    const response = await fetch("https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_measure_editorial/", {
        method: 'POST',
        body: JSON.stringify({
            "all": 1,
        } satisfies GetMeasureEditorialRequest),
        headers: { 'content-type': 'application/json' }
    })

    if (!response.ok) {
        throw new Error(`failed to get measure editorial: ${response.ok} ${await response.text()}`);
    }
    const responseBody = await response.json() as GenericResponse<unknown>;

    if (!responseBody.success) {
        throw new Error(`failed to get measure editorial: ${response.ok} ${await responseBody.message}`);
    }

    return responseBody as GetMeasureEditorialResponse;
}
