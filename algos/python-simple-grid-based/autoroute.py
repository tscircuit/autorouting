import math
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder
from pathfinding.core.diagonal_movement import DiagonalMovement
from typing import List, Dict, Any

def autoroute(input: Dict[str, Any]) -> List[Dict[str, Any]]:
    grid_size = 0.1  # Assume 1 unit grid size
    buffer_size = 0
    bounds_with_buffer = {
        "minX": input["bounds"]["minX"] - buffer_size,
        "maxX": input["bounds"]["maxX"] + buffer_size,
        "minY": input["bounds"]["minY"] - buffer_size,
        "maxY": input["bounds"]["maxY"] + buffer_size,
    }
    width = math.ceil((bounds_with_buffer["maxX"] - bounds_with_buffer["minX"]) / grid_size) + 1
    height = math.ceil((bounds_with_buffer["maxY"] - bounds_with_buffer["minY"]) / grid_size) + 1

    # Initialize grids for each layer
    grids = [Grid(width, height) for _ in range(input["layerCount"])]

    # Mark obstacles
    for obstacle in input["obstacles"]:
        left = math.floor((obstacle["center"]["x"] - obstacle["width"] / 2 - bounds_with_buffer["minX"]) / grid_size)
        right = math.ceil((obstacle["center"]["x"] + obstacle["width"] / 2 - bounds_with_buffer["minX"]) / grid_size)
        top = math.floor((obstacle["center"]["y"] - obstacle["height"] / 2 - bounds_with_buffer["minY"]) / grid_size)
        bottom = math.ceil((obstacle["center"]["y"] + obstacle["height"] / 2 - bounds_with_buffer["minY"]) / grid_size)

        for x in range(left, right + 1):
            for y in range(top, bottom + 1):
                for grid in grids:
                    grid.node(x, y).walkable = False

    finder = AStarFinder(diagonal_movement=DiagonalMovement.only_when_no_obstacle)

    solution = []

    for connection in input["connections"]:
        route = []
        current_layer = 0

        # Create a clone of the current grid for this connection
        connection_grid = grids[current_layer].clone()

        # Make obstacles walkable if they are connected to this trace
        for obstacle in input["obstacles"]:
            if connection["name"] in obstacle.get("connectedTo", []):
                left = math.floor((obstacle["center"]["x"] - obstacle["width"] / 2 - bounds_with_buffer["minX"]) / grid_size)
                right = math.ceil((obstacle["center"]["x"] + obstacle["width"] / 2 - bounds_with_buffer["minX"]) / grid_size)
                top = math.floor((obstacle["center"]["y"] - obstacle["height"] / 2 - bounds_with_buffer["minY"]) / grid_size)
                bottom = math.ceil((obstacle["center"]["y"] + obstacle["height"] / 2 - bounds_with_buffer["minY"]) / grid_size)

                for x in range(left, right + 1):
                    for y in range(top, bottom + 1):
                        connection_grid.node(x, y).walkable = True

        for i in range(len(connection["pointsToConnect"]) - 1):
            start = connection["pointsToConnect"][i]
            end = connection["pointsToConnect"][i + 1]

            start_x = round((start["x"] - bounds_with_buffer["minX"]) / grid_size)
            start_y = round((start["y"] - bounds_with_buffer["minY"]) / grid_size)
            end_x = round((end["x"] - bounds_with_buffer["minX"]) / grid_size)
            end_y = round((end["y"] - bounds_with_buffer["minY"]) / grid_size)

            path, _ = finder.find_path(
                connection_grid.node(start_x, start_y),
                connection_grid.node(end_x, end_y),
                connection_grid
            )

            if path:
                for point in path[1:]:
                    x = point[0] * grid_size + bounds_with_buffer["minX"]
                    y = point[1] * grid_size + bounds_with_buffer["minY"]

                    route.append({
                        "route_type": "wire",
                        "x": x,
                        "y": y,
                        "width": 0.08,  # Assuming a default width
                        "layer": "top",  # TODO: create layer map for "top", "bottom", "inner1", "inner2" etc.
                    })

                # Mark the path as occupied
                for point in path:
                    connection_grid.node(point[0], point[1]).walkable = False
                    grids[current_layer].node(point[0], point[1]).walkable = False

        if route:
            solution.append({
                "type": "pcb_trace",
                "pcb_trace_id": f"pcb_trace_for_{connection['name']}",
                "route": route,
            })

    return solution