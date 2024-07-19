# autorouting-dataset

A dataset of autorouting problems for benchmarking. Autorouting
is the drawing of traces (wires) across a 2d surface to connect
copper pads together. Traces can go underneath pads using a
copper-plated hole called a "via". Traces must also avoid "obstacles"
which are other pads or blocked areas where a trace cannot pass
such as a hole or region designated for an antenna.

There are different classifications of problems, each problem
applies to a different autorouting scenario. A perfect autorouter
can solve all of these problems, but partial autorouting is
very useful for human-assisted routing.

| Problem | Description | Difficulty |
| ------- | ----------- | ---------- |
| `single-trace` | Route a single trace through obstacles | Easy |
| `single-multi-point-trace` | Route a single trace through multiple points | Easy |
| `multi-trace` | Route multiple traces to pairs of points, without crossing traces | Medium |
| `multi-layer-trace` | Route a trace through multiple layers to connect two points | Easy |
| `multi-trace-multi-point` | Route multiple traces to groups of points, without crossing traces | Medium |
| `multi-layer-multi-trace` | Route multiple traces to pairs of points, without crossing traces across layers | Hard |
| `multi-layer-multi-trace-multi-point` | Route multiple traces, through multiple places, to groups of points, without crossing traces | Hard |

