# nuernberg-umweltdaten-api

> [!IMPORTANT]
> this project is not officially associated with the city of Nuremberg.

The city of Nuremberg, Germany, offers a portal to access environmental data of the various measuring stations
distributed throughout the city on https://www.nuernberg.de/internet/umweltdaten/.

For interactive usage, the data is loaded from an internal HTTP API.

This repository tries to document this internal HTTP API for external usage. This repository therefore does NOT contain
any backend code used to serve the HTTP API.

The shape of the API is documented in TypeScript types for ease of writing and consumption. Furthermore, examples of
usage can be found in `main.mts` and `lib.mts`.

## General API Information

The API in general is located at `https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/`, with various
subpaths pointing to the different endpoints (see below). 

All endpoints seem to accept `POST` requests with a body specifying which data to request as JSON. The response is a
JSON object, which always has the following shape:

```typescript
interface GenericResponse<T> {
    success: number;    // always seems to be either 0 for failure or 1 for success
    message: T;         // The actual response body, often an array
};
```

> [!NOTE]
> Note for non-typescript users: The snippet above defines a generic type. It can be used like this:
> 
> ```typescript
> type SpecificResponse = GenericResponse<{
>     foo: string;
> }[]>
> ```
>
> which would equal the type:
> 
> ```typescript
> type SpecificResponse = {
>     success: number;
>     message: {
>         foo: string;
>     }[];
> }
> ```

As the `success` field communicated success, the HTTP status code always seems to be `200`. 

The API uses keywords in API requests and responses:

- `cat`: presumably short for "category". All measurements are grouped into one of these. `cat` must be specified as a
stringified number.
  - category `0` is used for air measurements (e.G. carbon monoxide, ozone)
  - category `1` is used for weather measurements (e.G. air temperature, air humidity)
  - category `2` is used for water measurements (e.G. water temperature, oxygen)
- `type`: type is used to specify the measuring station. Each measuring station has a short abbreviation (e.G. `FLH`)
that can be obtained with the different endpoints (see below).

## Endpoints

You can find samples for all of these endpoints at `lib.mts`.

### `get_editorial`

**Description**: Returns various, human readable information about all measuring stations.

**Endpoint**: `https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_editorial/`

**Request**:

```typescript
export interface GetEditorialRequest {
    cat?: "0" | "1" | "2", // optional; category to filter by. If omitted, all stations are returned
}
```

**Response**:

```typescript
type GetEditorialResponse = GenericResponse<{
    id_editorial: number,
    name: string,
    subtitle: string,
    description: string,            // HTML description
    is_simple: number,              // always seems to be 0
    image_path: string,             // always seems to be empty
    image_alt: string,              // always seems to be empty
    pdf_path: string | null,        // always seems to be null
    longitude: string,
    latitude: string,
    graph_types: string,            // contains stringified JSON list of shape `string[]`, containing the categories 
                                    // supported by this station
    graph_stations: string,         // contains nested, stringified JSON list of shape `string[][]`, containing the 
                                    // abbreviations for this station
    graph_measures: string,         // contains nested, stringified JSON list of shape `string[][]`, containing the 
                                    // supported measurements by category (the first list contains all supported air 
                                    // measurements, etc)
    selected_categories: string,    // unknown 
    sort_nr: number,                // unknown. possible UI sorting index?
}[]>;
```

<details>
    <summary>curl example</summary>

```bash
curl -XPOST https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_editorial/ -d '{"cat": "1"}'
```

</details>

### `get_measure_editorial`

**Description**: Returns various, human readable information about measurements.

**Endpoint**: `https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_measure_editorial/`

**Request**:

```typescript
export type GetMeasureEditorialRequest = {
    all?: 1,
}
```

**Response**:

```typescript
type GetMeasureEditorialResponse = GenericResponse<{
    id_measure_editorial: number,
    name: string,
    description: string // HTML description
    pdf_path: string,
}[]>;
```

<details>
    <summary>curl example</summary>

```bash
curl -XPOST https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_measure_editorial/ 
```
</details>

### `get_stations`

**Description**: Returns information about stations.

**Endpoint**: `https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_stations/`

**Request**:

```typescript
type GetStationsRequest =
    | {
        all: 1,
    }
    | {
        cat: "0" | "1" | "2",
    }
    | {
        id: string,
        cat: "0" | "1" | "2",
    };
```

**Response**:

```typescript
type GetStationsResponse = GenericResponse<{
    id_station: number;
    name: string;
    station_code?: string;
    measure_list?: string;
}[]>;
```

<details>
    <summary>curl example</summary>

```bash
curl -XPOST https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_stations/ -d '{ "id": "air_temperature", "cat": "1" }'
```
</details>

### `get_measures`

**Description**: Returns latest values of all measurements available at a station.

**Endpoint**: `https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_measures/`

**Request**:

```typescript
type GetMeasuresRequest = {
    type: string,
}

**Response**:

```typescript
export type GetMeasuresResponse = GenericResponse<{
    id_station: string;
    date_entry: string;
    [key: string]: string | number | null;
}[]>;
```

<details>
    <summary>curl example</summary>

```bash
curl -XPOST https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get_measures/ -d '{ "type": "THB" }'
```
</details>


### `get`

**Description**: Returns values of a specific measurements available at a specific station.

**Endpoint**: `https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get/`

**Request**:

```typescript
type GetValuesRequest = {
    cat: "0" | "1" | "2",
    measure: string,
    type: string,
} & ({ 
        date_yesterday: string  // returns data of 24h beginning at date_yesterday. Specified in `%d.%m.%Y %H:%M:%S` 
                                // (german date format). Appears to be in german local time.
    } | {
        days: number // number of days of values to return. max seems to be 30. -1 returns the latest measurement only.
    })

**Response**:

```typescript
type GetValuesResponse = GenericResponse<({
    [key: string]: string | number | null; // key is the name of the requested measure.
} & {
    date_entry: string; // timestamp of the measurement in %d.%m.%Y %H:%M:%S. Appears to be in german local time.
})[]>;
```

<details>
    <summary>curl example</summary>

```bash
curl -XPOST https://microservices.nuernberg.de/umweltdaten/api/umweltdaten/get/ -d '{"cat": "1", "type": "FLH", "measure": "air_temperature", "days": 1}'
```
</details>

## TODOs

- [ ] if possible, it would be nice to provide an OpenAPI spec for the API. However, since I'm not a expert when it
comes to OpenAPI, I would gladly accept contributions here.
