const p1_input = document.getElementById("playeroneinput");
const p1_div = document.getElementById("playeronediv");
const p1_button = document.getElementById("playeronebutton");
const p2_input = document.getElementById("playertwoinput");
const p2_div = document.getElementById("playertwodiv");
const p2_button = document.getElementById("playertwobutton");

const squareCoordinateDisplay = document.getElementById(
  "squareCoordinateDisplay",
);

let ws;

const chessboardDisplay = document.getElementById("chessboard");
const gameBackground = new Image();
gameBackground.src = "assets/horsey.jpg";

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

class ChessGame {
  topLeftCoordinate = {
    x: 0,
    y: 0,
  };
  whiteToMove = true;
  boardState = new Map();
  // TODO: make manual hashmap
  // NOTE: boardState represents state of the board as key value pairs:
  // "a1": "bK" => means there is a black King on a1
  //
  previousMoves = [];
  castling = (1 << 5) - 1;
  // NOTE: bitwise representation of either players right to castle
  // 1000 => white can castle queenside
  // 0100 => white can castle kingside
  // 0010 => black can castle queenside
  // 0001 => black can castle kingside
  // 1111 => everybody can castle anywhere

  constructor() {
    console.log(this.castling);
  }
}
chessBoard = new ChessGame();

function getSquareCoordinates({ x, y, width }) {
  if ((typeof width) === "string" || width instanceof String) {
    let realWidth = 0;
    for (let i = 0; i < width.length; i++) {
      if (width.charCodeAt(i) > "9".charCodeAt() || width.charCodeAt(i) < "0") {
        break;
      }
      realWidth *= 10;
      realWidth += width.charCodeAt(i) - "0".charCodeAt();
    }
    width = realWidth;
  }
  width /= 8;

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

  const squareCoordinate = String.fromCharCode("h".charCodeAt() - retX + 1)
    .concat(
      retY,
    );
  return squareCoordinate;
}

function createImage(pieceInitials) {
  const exampleImage = document.createElement("img");
  exampleImage.src = `assets/${pieceInitials}.svg`;
  exampleImage.style.zIndex = 10;
  exampleImage.style.position = "relative";
  exampleImage.style.top = 0;
  exampleImage.style.left = 0;

  exampleImage.style.height = "80px";
  exampleImage.style.width = "80px";
  exampleImage.draggable = "true";
  exampleImage.addEventListener("drag", (e) => {
    exampleImage.style.transform = `translate(x, y)`;
    console.log(e);
  });

  return exampleImage;
}

function initializeGame(chessBoardDisplay) {
  chessBoardDisplay.innerHTML = "";
  const blackPieces = [];
  blackPieces.push(createImage("bR"));
  blackPieces.push(createImage("bN"));
  blackPieces.push(createImage("bB"));
  blackPieces.push(createImage("bQ"));
  blackPieces.push(createImage("bK"));
  blackPieces.push(createImage("bB"));
  blackPieces.push(createImage("bN"));
  blackPieces.push(createImage("bR"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));
  blackPieces.push(createImage("bP"));

  const whitePieces = [];

  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wP"));
  whitePieces.push(createImage("wR"));
  whitePieces.push(createImage("wN"));
  whitePieces.push(createImage("wB"));
  whitePieces.push(createImage("wQ"));
  whitePieces.push(createImage("wK"));
  whitePieces.push(createImage("wB"));
  whitePieces.push(createImage("wN"));
  whitePieces.push(createImage("wR"));

  chessBoardDisplay.append(...blackPieces);
  for (let i = 0; i < 32; i++) {
    chessBoardDisplay.appendChild(document.createElement("div"));
  }
  chessBoardDisplay.append(...whitePieces);
}

gamechessBoardDisplay.addEventListener("mousemove", (e) => {
  squareCoordinateDisplay.innerHTML = getSquareCoordinates({
    x: e.offsetX,
    y: e.offsetY,
    width: chessBoardDisplayWidth,
  });
});

initializeGame(gamechessBoardDisplay);

function connect() {
  ws = new WebSocket("/ws");
  ws.onopen = function() {
    console.log("Connected or something");
  };

  ws.onmessage = function(event) {
    const information = event.data;
    if (information[1] == "1") {
      p1_div.innerHTML += `<p>${event.data}\n</p>`;
    } else {
      p2_div.innerHTML += `<p>${event.data}\n</p>`;
    }
  };

  ws.onclose = function() {
    console.log("Trying to reconnect...");
    setTimeout(connect, 1000);
  };

  ws.onerror = function(error) {
    console.error("WebSocket error:", error);
  };
}

p1_button.addEventListener("click", function() {
  const input = p1_input.value;
  ws.send("p1" + input);
  p1_input.value = "";
});

p2_button.addEventListener("click", function() {
  const input = p2_input.value;
  ws.send("p2" + input);
  p2_input.value = "";
});

connect();
