# Generalized Astar README

This is a short introduction to our GeneralizedAstar class. This is a class you
can extend to create lots of different algorithms. Let's review how A\* works
and why and how you might want to extend it.

## Autorouting and A\*, what paths are we finding?

We have a list of squares (pads) that we want to connect with wires (traces),
we know the location of the pads but we don't know what the traces should look
like. The GeneralizedAstar class has an opinionated way of finding all the traces,
it says:

1. let's just go through each pair of connected pads
2. find the approximate shortest path between the pads, make that path a trace,
3. repeat until we've routed the entire board

You can extend the GeneralizedAstar class to change how step 2 works. You'd
think this would be a pretty straightforward process and for many pathfinding
solvers it is, but we want to make it _crazy fast_ and that's where things get
tricky.

## A brief introduction to A\*

A\* is a really good pathfinding algorithm, here's how it works:

- store a queue of points, at the beginning it's just the starting point
- go to the starting point and find all of it's neighbors, score each neighbor
  with TWO costs
  - the `g` cost is the distance it's taken to get the that neighbor so far
  - the `h` cost which is a guess for how far that neighbor is from the goal
- insert each new neighbor into the queue with it's total cost `g + h`
- select the point with the lowest cost from the queue and repeat!

This is a much faster than other approaches of exploring paths. We even employ
some optimizations like the "greedy multipler" to make A\* run even faster (but
sometimes return less-than-optimal results)

## Customizing `GeneralizedAstar`

There are a couple ways that you can customize `GeneralizedAstar` to try out
new algorithms:

- Override `getNeighbors` to change how you find the neighbors of a point
- Override `computeH` to change how you guess at the distance to the goal
- Override `computeG` to change how you compute the distance of a point so far

Here are examples of reasons you might change or override each of these:

- Override `computeH` and `computeG` to add penalties for vias
- Override `getNeighbors` to calculate the next neighbors by finding line
  intersections using the [intersection jumping technique](https://blog.autorouting.com/p/the-intersection-jump-autorouter)
- Override `getNeighbors` to consider "bus lanes" or diagonal movements

## What you can't do with `GeneralizedAstar`

- Customize which traces are selected to go first (for this, we recommend
  a higher-level algorithm that _orchestrates_ a `GeneralizedAstar` autorouter)

## Show me an example of extending `GeneralizedAstar`

Sure! Here's a version of `GeneralizedAstar` that does a fairly standard
grid-based search (however, unlike many grid-searches, this one can operate
on an infinitely sized grid!)

```tsx
export class InfiniteGridAutorouter extends GeneralizedAstarAutorouter {
  getNeighbors(node: Node): Array<Point> {
    const dirs = [
      { x: 0, y: this.GRID_STEP },
      { x: this.GRID_STEP, y: 0 },
      { x: 0, y: -this.GRID_STEP },
      { x: -this.GRID_STEP, y: 0 },
    ]

    return dirs
      .filter(
        (dir) => !this.obstacles!.isObstacleAt(node.x + dir.x, node.y + dir.y)
      )
      .map((dir) => ({
        x: node.x + dir.x,
        y: node.y + dir.y,
      }))
  }
}
```

## Glossary

If you're trying to understand `GeneralizedAstar`, it can help to know these
terms:

- `closedSet` - The set of explored points
- `openSet` - The set of unexplored points
- `GREEDY_MULTIPLIER` - By default set to `1.1`, this makes the algorithm find
  suboptimal paths because it will act more greedily, it can dramatically
  increase the speed of the algorithm
