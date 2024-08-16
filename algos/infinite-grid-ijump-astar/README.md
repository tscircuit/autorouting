# IJumpAutorouter

Read more about this solver here: https://blog.autorouting.com/p/the-intersection-jump-autorouter

The input to this solver is [Circuit JSON (soup)](https://github.com/tscircuit/soup)

## Usage

```ts
import { autoroute } from "@tscircuit/infgrid-ijump-astar"

const pcbTraces = autoroute(circuitJson)
```
