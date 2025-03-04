// Make the paper scope global, by injecting it into window:
paper.install(window);

var zoomlevel = 200;
var maze = new Maze(zoomlevel); //CANVAS_H = 600 -> 3 blocks high

var user = window.prompt("Enter your unique username:")
var chosen_color = window.prompt("Enter your color preference: \n\nred, orange, yellow, green, blue, indigo, or violet\n");
// TODO Check if color is valid, throw error if not
let user_color = "/addUserColor" + "/" + user + "/" + chosen_color
$.post(user_color)

// $( function ) runs once the DOM is ready:
$(() => {
  paper.setup("myCanvas");
  requestGrid(-3, -3);
});

zoomMaze = () => {
  zoomlevel /= 2;
  if (zoomlevel < 20) {
    zoomlevel = 200;
  }
  maze.zoom(zoomlevel);
};

computeUnit = (requestX, requestY) => {
  return {
    col: Math.floor( ((requestX + BLOCK_C) / BLOCK_W) + 0.5 ),
    row: Math.floor( ((requestY + BLOCK_C) / BLOCK_W) + 0.5 ),
  };
};

grid = {};
gridColors = {};
requestX = -3;
requestY = -3;
x = 0;
y = 0;

(minX = 0), (maxX = 0), (minY = 0), (maxY = 0);

requestGrid = (requestX, requestY) => {
  console.log(`RequestGrid(${requestX}, ${requestY})`);
  let gen_seg_request = "/" + user + "/generateSegment"
  $.get(gen_seg_request, computeUnit(requestX, requestY))
    .done(function (data) {
      // get origin information for the maze segment
      var ox = data["originX"] ?? 0;
      var oy = data["originY"] ?? 0;
      
      // adjust the request's x and y based on segment origin
      let gridUnit = computeUnit(requestX, requestY);
      let ry = (gridUnit.row * BLOCK_W) - 3;
      let rx = (gridUnit.col * BLOCK_W) - 3;
      
      // verify we don't have a multiblock segment with no origin
      let geom = data["geom"];
      if (!(geom.length == BLOCK_W && geom[0].length == BLOCK_W)) {
        if (!("originX" in data && "originY" in data)) {
          alert(
            "WARNING: origin X and Y not specified for multiblock maze segment"
          );
          return false;
        }
      }

      // populate the local grid as necessary
      for (let curY = 0; curY < geom.length; curY++) {
        let g = geom[curY];

        for (let curX = 0; curX < g.length; curX++) {
          let c = g[curX];

          if (!grid[curX + rx]) {
            grid[curX + rx] = {};
          }
          grid[rx + curX][ry + curY] = c;

          if (rx + curX < minX) {
            minX = rx + curX;
          }
          if (rx + curX > maxX) {
            maxX = rx + curX;
          }
          if (ry + curY < minY) {
            minY = ry + curY;
          }
          if (ry + curY > maxY) {
            maxY = ry + curY;
          }
        }
      }

      console.log(grid);

      let gridString = gridUnit["col"] + "," + gridUnit["row"];
      if ("color" in data) { // If color is passed through with data (if block has already been generated)
        gridColors[gridString] = data["color"]
      } else { // If this is the first time the block is being generated
        gridColors[gridString] = chosen_color
      }

      // actually add the block to the grid for rendering purposes
      maze.addBlock(rx, ry, geom);
    })
    .fail(function (data) {
      $("#maze").html(`<hr><h3>Error</h3><p>${JSON.stringify(data["Data"])}</p>`);
    });
};

expandGrid = (dX, dY) => {
  if (dX == 1) {
    requestGrid(x, y - 3);
  }
  if (dX == -1) {
    requestGrid(x - 6, y - 3);
  }
  if (dY == 1) {
    requestGrid(x - 3, y);
  }
  if (dY == -1) {
    requestGrid(x - 3, y - 6);
  }
};

move = (dX, dY) => {
  if (!grid[x] || !grid[x][y]) {
    return false; //ignore key events if our current maze section isn't loaded
  }

  x += dX;
  y += dY;

  if (!grid[x] || !grid[x][y]) {
    console.log("Expand Grid!");
    expandGrid(dX, dY);
  }

  maze.renderPlayer(x, y);
};

document.onkeydown = (e) => {
  let sq = parseInt(grid[x][y], 16);
  let wallNorth = sq & 8;
  let wallEast = sq & 4;
  let wallSouth = sq & 2;
  let wallWest = sq & 1;

  if (e.keyCode == "38" && !wallNorth) {
    move(0, -1);
  } else if (e.keyCode == "40" && !wallSouth) {
    move(0, 1);
  } else if (e.keyCode == "37" && !wallWest) {
    move(-1, 0);
  } else if (e.keyCode == "39" && !wallEast) {
    move(1, 0);
  } else if (e.keyCode == "90") {
    zoomMaze();
  }
};
