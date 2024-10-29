# Autorouting API

This document describes the tscircuit autorouting API endpoints and data formats.

## Overview

For autorouting development, you only need to implement `/autorouting/solve`
and accept the [`SimpleRouteJson`](./module/lib/solver-utils/SimpleRouteJson.ts) format,
you do not need to implement Circuit Json handling or other parts of the API.

## Endpoints

### POST `$BASE/autorouting/solve`

Synchronously solve a routing problem. This will only return fast enough for
smaller problems (<100 traces), use `/autorouting/autorouting_tasks/create` for larger
problems.

`/autorouting/solve` accepts either `input_simple_route_json` or `input_circuit_json` in the json
request body, don't provide both. The server will infer the response format from the request.

`/autorouting/solve` returns a `autorouting_result` object.

There can be an `{ error }` field on the response if there was an issue preventing
routing. If `{ error }` is on the response there will be no partial results.

Partial results are possible, errors or notices appear on the `autorouting_result` object.

#### Example Requests

```
REQUEST:
POST /autorouting/solve
{
  "input_simple_route_json": { ... }
}

RESPONSE:
{
  "autorouting_result": {
     output_simple_route_json: { ... }
  }
}
```
