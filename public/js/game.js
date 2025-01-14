let p1_input = document.getElementById("playeroneinput");
let p1_div = document.getElementById("playeronediv");
let p1_button = document.getElementById("playeronebutton");
let p2_input = document.getElementById("playertwoinput");
let p2_div = document.getElementById("playertwodiv");
let p2_button = document.getElementById("playertwobutton");

let squareCoordinateDisplay = document.getElementById(
  "squareCoordinateDisplay",
);

let ws;

let gameCanvas = document.getElementById("canvas");
let gameBackground = new Image();
console.log(gameBackground);
console.log(gameCanvas);
let gameCanvasCtx = gameCanvas.getContext("2d");
gameBackground.src = "assets/horsey.jpg";
let canvasWidth = gameCanvas.height;
let canvasHeight = gameCanvas.width;
let imageWidth = gameBackground.width;
let imageHeight = gameBackground.height;

gameBackground.onload = () => {
  gameCanvasCtx.drawImage(
    gameBackground,
    0,
    0,
    imageWidth,
    imageHeight,
    0,
    0,
    canvasWidth,
    canvasHeight,
  );
};

class ChessGame {
  constructor() {
  }
}
class Square {
  x;
  y;
  width;
  constructor({ x, y, width }) {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  center() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.width / 2,
    };
  }
}
let boardSquares = new Map();

for (let colCoorASCII = "a".charCodeAt(0), i = 0; i < 8; colCoorASCII++, i++) {
  for (let rowCoor = "1", j = 0; j < 8; rowCoor++, j++) {
    let colCoor = String.fromCharCode(colCoorASCII);
    let width = canvasWidth;
    boardSquares.set(
      colCoor.concat("", rowCoor),
      new Square(
        {
          x: (width * j) / 8,
          y: (width * i) / 8,
          width: width / 8,
        },
      ),
    );
  }
}

console.log(boardSquares);
function getSquareCoordinates({ x, y, width }) {
  retX = 8;
  retY = 8;
  for (let i = 1; i < 8; i++) {
    if (x < (i * width)) {
      retX = i;
      break;
    }
  }

  for (let i = 1; i < 8; i++) {
    if (y < (i * width)) {
      retY = i;
      break;
    }
  }

  let squareCoordinate = String.fromCharCode("h".charCodeAt() - retX + 1)
    .concat(
      retY,
    );

  return squareCoordinate;
}
gameCanvas.addEventListener("mousemove", (e) => {
  squareCoordinateDisplay.innerHTML = getSquareCoordinates({
    x: e.offsetX,
    y: e.offsetY,
    width: canvasWidth / 8,
  });
});

function connect() {
  ws = new WebSocket("/ws");
  ws.onopen = function () {
    console.log("Connected or something");
  };

  ws.onmessage = function (event) {
    let information = event.data;
    if (information[1] == "1") {
      p1_div.innerHTML += `<p>${event.data}\n</p>`;
    } else {
      p2_div.innerHTML += `<p>${event.data}\n</p>`;
    }
  };

  ws.onclose = function () {
    console.log("Trying to reconnect...");
    setTimeout(connect, 1000);
  };

  ws.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
}

p1_button.addEventListener("click", function () {
  let input = p1_input.value;
  ws.send("p1" + input);
  p1_input.value = "";
});

p2_button.addEventListener("click", function () {
  let input = p2_input.value;
  ws.send("p2" + input);
  p2_input.value = "";
});

connect();
