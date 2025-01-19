const squareCoordinateDisplay = document.getElementById(
  "squareCoordinateDisplay",
);

const chessboardDisplay = document.getElementById("chessboard");
const gameBackground = new Image();
gameBackground.src = "assets/horsey.jpg";

const initialPosition = new Map([
  ["a1", "wR"],
  ["b1", "wN"],
  ["c1", "wB"],
  ["a8", "bR"],
  ["b8", "bN"],
  ["c8", "bB"],
]);

class Piece {
  constructor(name, display = undefined) {
    this.name = name;
    this.display = display;
  }
}

class ChessGame {
  display;
  // NOTE: html element that displays the chessgame
  whiteToMove = true;
  boardState = new Map([
    ["a1", new Piece("wR")],
    ["b1", new Piece("wN")],
    ["c1", new Piece("wB")],
    ["a8", new Piece("bR")],
    ["b8", new Piece("bN")],
    ["c8", new Piece("bB")],
  ]);
  // TODO: make manual hashmap ("a1" => 1; "b1" => 2; "a2" => 9;)
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
  getSquareCoordinates(coordinates) {
    let x = (coordinates.charCodeAt(0) - 97) * (1 / 8) *
      this.display.offsetWidth + this.display.offsetLeft;
    let y = (coordinates.charCodeAt(1) - 49) * (1 / 8) *
      this.display.offsetHeight + this.display.offsetTop;

    return [x, y];
  }
  createImage(pieceInitials, coordinates = "a1") {
    const [x, y] = this.getSquareCoordinates(coordinates);

    const exampleImage = document.createElement("img");
    exampleImage.src = `assets/${pieceInitials}.svg`;
    exampleImage.style.position = "absolute";
    exampleImage.style.zIndex = 1;
    exampleImage.style.top = 0;
    exampleImage.style.left = 0;
    exampleImage.style.height = this.display.offsetHeight / 8;
    exampleImage.style.width = this.display.offsetWidth / 8;
    exampleImage.style.draggable = false;
    exampleImage.style.transform = `translate(${x}px, ${y}px)`;
    exampleImage.addEventListener("drag", (e) => {
      exampleImage.style.transform = `translate(${e.pageX - this.display.offsetWidth / 16
        }px, ${e.pageY - this.display.offsetHeight / 16}px)`;
    });
    exampleImage.addEventListener("dragstart", (e) => {
      e.dataTransfer.setDragImage(
        e.target,
        window.outerWidth,
        window.outerHeight,
      );
    });
    exampleImage.addEventListener("dragend", () => {
      const [x, y] = this.getSquareCoordinates(coordinates);
      exampleImage.style.transform = `translate(${x}px, ${y}px)`;
    });

    return exampleImage;
  }

  initializeBoard() {
    for (const [coordinate, piece] of this.boardState.entries()) {
      console.log(piece);
      let pieceDisplay = this.createImage(piece.name, coordinate);
      this.boardState.get(coordinate).display = pieceDisplay;
      this.display.appendChild(pieceDisplay);
    }
  }
  renderBoard() {
    for (const coordinates of this.boardState.keys()) {
      let piece = this.boardState.get(coordinates);
      console.log(piece);
      const [x, y] = this.getSquareCoordinates(coordinates);
      piece.display.style.transform = `translate(${x}px, ${y}px)`;
      piece.display.style.height = this.display.offsetHeight / 8;
      piece.display.style.width = this.display.offsetWidth / 8;
    }
  }
}
const chessBoard = new ChessGame(chessboardDisplay);
chessBoard.initializeBoard();
chessBoard.renderBoard();
