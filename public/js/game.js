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
  display;
  // NOTE: html element that displays the chessgame
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

  constructor(chessboardDisplay) {
    this.display = chessboardDisplay;
  }
}
chessBoard = new ChessGame(chessboardDisplay);

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

gamechessBoardDisplay.addEventListener("mousemove", (e) => {
  squareCoordinateDisplay.innerHTML = getSquareCoordinates({
    x: e.offsetX,
    y: e.offsetY,
    width: chessBoardDisplayWidth,
  });
});
