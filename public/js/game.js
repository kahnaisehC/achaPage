const MOVE_VERSION = "0";

const chessboardDisplay = document.getElementById("chessboard");
const gameBackground = new Image();
gameBackground.src = "assets/horsey.jpg";

const initialPosition = new Map([
  ["a1", "wR"],
  ["b1", "wN"],
  ["c1", "wB"],
  ["d1", "wQ"],
  ["e1", "wK"],
  ["f1", "wB"],
  ["g1", "wN"],
  ["h1", "wR"],
  ["a2", "wP"],
  ["b2", "wP"],
  ["c2", "wP"],
  ["d2", "wP"],
  ["e2", "wP"],
  ["f2", "wP"],
  ["g2", "wP"],
  ["h2", "wP"],
  ["a8", "bR"],
  ["b8", "bN"],
  ["c8", "bB"],
  ["d8", "bQ"],
  ["e8", "bK"],
  ["f8", "bB"],
  ["g8", "bN"],
  ["h8", "bR"],
  ["a7", "bP"],
  ["b7", "bP"],
  ["c7", "bP"],
  ["d7", "bP"],
  ["e7", "bP"],
  ["f7", "bP"],
  ["g7", "bP"],
  ["h7", "bP"],
]);

class Piece {
  constructor(name, display = undefined) {
    this.name = name;
    this.display = display;
  }
}

class ChessGame {
  whiteToMove = true;
  // TODO: make manual hashmap ("a1" => 1; "b1" => 2; "a2" => 9; "h8" => 64;)
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
    this.boardState = new Map();
    // NOTE: html element that displays the chessgame
    for (const [coor, piece] of initialPosition.entries()) {
      this.boardState.set(coor, new Piece(piece));
    }
  }

  /**
   * @param {string} move
   */

  checkMoveLegality(version, pieceDisplay, toCoordinate) {
    const fromCoordinate = pieceDisplay.style.gridArea;
    console.log(pieceDisplay);

    switch (version) {
      case "0":
        return true;
      default:
        return false;
    }
  }

  getSquareCoordinates(coordinates) {
    const x = (coordinates.charCodeAt(0) - 97) * (1 / 8) *
      this.display.offsetWidth + this.display.offsetLeft;
    const y = (coordinates.charCodeAt(1) - 49) * (1 / 8) *
      this.display.offsetHeight + this.display.offsetTop;

    return [x, y];
  }
  getPromotion(fromCoordinate, toCoordinate, pieceName) {
    if (
      pieceName === "bP" &&
      fromCoordinate.charAt(1) === "2" &&
      toCoordinate.charAt(1) === "1"
    ) {
      return "Q";
    }
    if (
      pieceName === "wP" &&
      fromCoordinate.charAt(1) === "7" &&
      toCoordinate.charAt(1) === "8"
    ) {
      return "Q";
    }

    return "_";
  }

  createImage(pieceInitials, coordinates = "a1") {
    const pieceImage = document.createElement("img");
    pieceImage.pieceName = pieceInitials;
    pieceImage.src = `assets/${pieceInitials}.svg`;
    pieceImage.style.zIndex = 1;
    pieceImage.style.top = 0;
    pieceImage.style.left = 0;
    pieceImage.style.height = this.display.offsetHeight / 8;
    pieceImage.style.width = this.display.offsetWidth / 8;
    pieceImage.style.draggable = false;
    pieceImage.style.gridArea = coordinates;
    pieceImage.id = coordinates;
    pieceImage.userSelect = "none";

    pieceImage.addEventListener("drag", (e) => {
      pieceImage.style.position = "absolute";
      pieceImage.style.transform = `translate(${e.pageX - this.display.offsetWidth / 16
        }px, ${e.pageY - this.display.offsetHeight / 16}px)`;
    });

    pieceImage.addEventListener("dragstart", (e) => {
      const emptyImage = new Image();
      emptyImage.src =
        "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
      e.dataTransfer.setDragImage(
        emptyImage,
        globalThis.outerWidth,
        globalThis.outerHeight,
      );
    });

    pieceImage.addEventListener("dragend", (e) => {
      pieceImage.style.position = "static";
      pieceImage.style.transform = "none";

      const cuadrant = this.display.getBoundingClientRect();
      const realTopOffset = cuadrant.y + globalThis.scrollY;
      const realLeftOffset = cuadrant.x + globalThis.scrollX;
      const x = e.pageX - realLeftOffset;
      const y = e.pageY - realTopOffset;
      console.log(realTopOffset, x, y);
      let nextCoordinate = "__";
      let prevCoordinate = pieceImage.id;

      for (let i = 1; i <= 8; i++) {
        if (x < 0 || y < 0) {
          break;
        }
        for (let j = 1; j <= 8; j++) {
          if (
            ((cuadrant.width / 8) * i) >= x &&
            ((cuadrant.height / 8) * j) >= y
          ) {
            nextCoordinate = String.fromCharCode(96 + i) +
              String.fromCharCode(57 - j);
            break;
          }
        }
        if (nextCoordinate !== "__") {
          break;
        }
      }
      if (nextCoordinate === "__") {
        return;
      }

      if (
        this.checkMoveLegality(
          MOVE_VERSION,
          e.target,
          nextCoordinate,
        )
      ) {
        const promotion = this.getPromotion(
          prevCoordinate,
          nextCoordinate,
          pieceImage.pieceName,
        );
        if (promotion !== "_") {
          pieceImage.pieceName = pieceImage.pieceName.charAt() + promotion;
          pieceImage.src = `assets/${pieceImage.pieceName}.svg`;
        }
        pieceImage.style.gridArea = nextCoordinate;
        const pieceToDelete = this.boardState.get(nextCoordinate);
        if (pieceToDelete) {
          pieceToDelete.display.remove();
        }
        this.boardState.delete(nextCoordinate);
        this.boardState.delete(prevCoordinate);
        this.boardState.set(
          nextCoordinate,
          new Piece(
            pieceImage.pieceName,
            pieceImage,
          ),
        );
        pieceImage.id = nextCoordinate;
      }
    });

    return pieceImage;
  }

  initializeBoard() {
    for (const [coordinate, piece] of this.boardState.entries()) {
      console.log(piece);
      const pieceDisplay = this.createImage(piece.name, coordinate);
      this.boardState.get(coordinate).display = pieceDisplay;
      this.display.appendChild(pieceDisplay);
    }
  }
  renderBoard() {
    for (const coordinates of this.boardState.keys()) {
      const piece = this.boardState.get(coordinates);
      console.log(piece);
      piece.display.style.height = this.display.offsetHeight / 8;
      piece.display.style.width = this.display.offsetWidth / 8;
    }
  }
}
const chessBoard = new ChessGame(chessboardDisplay);
chessBoard.initializeBoard();
chessBoard.renderBoard();
