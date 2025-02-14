const MOVE_VERSION = "0";
const GAME_ID = document.getElementById("gamejs").getAttribute("data-game_id");
console.log(GAME_ID);

const chessboardDisplay = document.getElementById("chessboard");
const [
  WKING,
  WQUEEN,
  WROOK,
  WBISHOP,
  WKNIGHT,
  WPAWN,
] = [
    1,
    2,
    3,
    4,
    5,
    6,
  ];
const [
  BKING,
  BQUEEN,
  BROOK,
  BBISHOP,
  BKNIGHT,
  BPAWN,
] = [
    7,
    8,
    9,
    10,
    11,
    12,
  ];

const pieceNames = [
  undefined,
  "wK",
  "wQ",
  "wR",
  "wB",
  "wN",
  "wP",
  "bK",
  "bQ",
  "bR",
  "bB",
  "bN",
  "bP",
];

const ws = new WebSocket("/ws/" + GAME_ID);

function arrayCoordToChessCoord(row, col) {
  return String.fromCharCode(col + "a".charCodeAt()) +
    String.fromCharCode(row + "1".charCodeAt());
}

function separateElements(move) {
  switch (move.charAt(0)) {
    case "0":
      return [
        move.charAt(1) + move.charAt(2),
        move.charAt(3) + move.charAt(4),
        move.charCodeAt(5) - "0".charCodeAt(),
      ];
    default:
      return ["a1", "a1", 0];
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

  boardState = [
    [WROOK, WKNIGHT, WBISHOP, WQUEEN, WKING, WBISHOP, WKNIGHT, WROOK],
    [WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, WPAWN],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, BPAWN],
    [BROOK, BKNIGHT, BBISHOP, BQUEEN, BKING, BBISHOP, BKNIGHT, BROOK],
  ];
  // NOTE: the board is reflected so the coordinates match the coordinates
  // a1 == 00; b1 == 01 ... h1 == 07
  // a2 == 10; b2 == 11 ... h2 == 17
  // ...
  // a8 == 70; b8 == 71 ... h8 == 77
  //
  piecesDisplays = new Map();

  constructor(chessboardDisplay) {
    this.display = chessboardDisplay;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = this.boardState[i][j];
        if (piece !== 0) {
          const coordinate = String.fromCharCode(j + "a".charCodeAt()) +
            String.fromCharCode(i + "1".charCodeAt());
          this.piecesDisplays.set(
            coordinate,
            this.createImage(piece, coordinate),
          );
        }
      }
    }
  }

  /**
   * @param {string} move
   */

  checkMoveLegality(move) {
    console.log(move);
    const version = move.charAt(0);
    let canMove = false;
    let row, col;
    switch (version) {
      case "0": {
        const fromColumn = move.charCodeAt(1) - "a".charCodeAt();
        const fromRow = move.charCodeAt(2) - "1".charCodeAt();
        const toColumn = move.charCodeAt(3) - "a".charCodeAt();
        const toRow = move.charCodeAt(4) - "1".charCodeAt();
        if (fromColumn === toColumn && fromRow === toRow) return false;
        const piece = this.boardState[fromRow][fromColumn];
        if (piece === 0) return false;
        if (this.whiteToMove && piece > 6) {
          console.log("white to move!");
          return false;
        }
        if (!this.whiteToMove && piece < 7) {
          console.log("black to move!");
          return false;
        }

        console.log(toColumn, toRow);
        console.log(piece);

        switch (piece) {
          case BQUEEN:
          case BROOK:
            row = fromRow, col = fromColumn;
            while ((row + 1) < 8) {
              row++;
              console.log("up:", col, row);
              if (this.boardState[row][col] > 7) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 8
              ) {
                break;
              }
            }

            row = fromRow, col = fromColumn;
            while ((row - 1) > -1) {
              row--;
              console.log("down:", col, row);

              if (this.boardState[row][col] > 7) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 8
              ) {
                break;
              }
            }

            row = fromRow, col = fromColumn;
            while ((col - 1) > -1) {
              col--;
              console.log("left:", col, row);
              if (this.boardState[row][col] > 7) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 8
              ) {
                break;
              }
            }

            row = fromRow, col = fromColumn;
            while ((col + 1) < 8) {
              col++;
              console.log("right:", col, row);
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 8
              ) {
                break;
              }
            }
            if (!canMove && piece === BROOK) {
              return false;
            }
            if (piece === BROOK) break;
          /* falls through*/
          case BBISHOP: {
            row = fromRow, col = fromColumn;
            while ((row + 1) < 8 && (col + 1) < 8) {
              row++;
              col++;
              console.log("up-left: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
            }
            row = fromRow, col = fromColumn;
            while ((row - 1) > -1 && (col + 1) < 8) {
              row--;
              col++;
              console.log("down-left: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
            }
            row = fromRow, col = fromColumn;
            while ((row - 1) > -1 && (col - 1) > -1) {
              row--;
              col--;
              console.log("down-right: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
            }
            row = fromRow, col = fromColumn;
            while ((row + 1) < 8 && (col - 1) > -1) {
              row++;
              col--;
              console.log("up-right: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
            }
            if (!canMove) return false;

            break;
          }

          case BKNIGHT: {
            row = fromRow, col = fromColumn;
            let movements = [
              [2, 1],
              [2, -1],
              [1, 2],
              [-1, 2],
              [-2, 1],
              [-2, -1],
              [1, -2],
              [-1, -2],
            ];
            for (const [rowPlus, colPlus] of movements) {
              if (
                (row + rowPlus) < 0 || (row + rowPlus) > 7 ||
                (col + colPlus) < 0 || (col + colPlus) > 7
              ) continue;
              if (this.boardState[row + rowPlus][col + colPlus] > 6) continue;
              if (toRow === (row + rowPlus) && toColumn === (col + colPlus)) {
                canMove = true;
              }
            }
            if (!canMove) return false;
            break;
          }
          case BKING: {
            row = fromRow, col = fromColumn;
            let movements = [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ];
            for (const [rowPlus, colPlus] of movements) {
              if (
                (row + rowPlus) < 0 || (row + rowPlus) > 7 ||
                (col + colPlus) < 0 || (col + colPlus) > 7
              ) continue;
              console.log("move: ", row + rowPlus, col + colPlus);
              if (this.boardState[row + rowPlus][col + colPlus] > 7) continue;
              if (toRow === (row + rowPlus) && toColumn === (col + colPlus)) {
                canMove = true;
              }
            }
            if (!canMove) return false;
            break;
          }
          case BPAWN: {
            row = fromRow, col = fromColumn;
            if (this.boardState[fromRow - 1][col] === 0) {
              if (row - 1 === toRow && toColumn === col) {
                canMove = true;
              }
              if (
                row === 6 && this.boardState[row - 2][col] === 0 &&
                row - 2 === toRow && toColumn === col
              ) {
                canMove = true;
              }
            }
            if (
              this.boardState[row - 1][col - 1] !== 0 &&
              this.boardState[row - 1][col - 1] < 7 && toRow === row - 1 &&
              toColumn === col - 1
            ) {
              canMove = true;
            }
            if (
              this.boardState[row - 1][col + 1] !== 0 &&
              this.boardState[row - 1][col + 1] < 7 && toRow === row - 1 &&
              toColumn === col + 1
            ) {
              canMove = true;
            }
            if (!canMove) return false;
            // TODO: Handle en passant
            break;
          }
          case WQUEEN:
          case WROOK:
            row = fromRow, col = fromColumn;
            while ((row + 1) < 8) {
              row++;
              console.log("up:", col, row);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              // if there is a black piece in the next square
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) {
                break;
              }
            }

            row = fromRow, col = fromColumn;
            while ((row - 1) > -1) {
              row--;
              console.log("down:", col, row);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              // if there is a black piece in the next square
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) {
                break;
              }
            }
            row = fromRow, col = fromColumn;
            while ((col - 1) > -1) {
              col--;
              console.log("left:", col, row);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              // if there is a black piece in the next square
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) {
                break;
              }
            }

            row = fromRow, col = fromColumn;
            while ((col + 1) < 8) {
              col++;
              console.log("right:", col, row);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) {
                break;
              }
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              // if there is a black piece in the next square
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) {
                break;
              }
            }
            if (!canMove && piece === WROOK) {
              return false;
            }
            if (piece === WROOK) break;
          /* falls through*/

          case WBISHOP: {
            row = fromRow, col = fromColumn;
            while ((row + 1) < 8 && (col + 1) < 8) {
              row++;
              col++;
              console.log("up-left: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
            }
            row = fromRow, col = fromColumn;
            while ((row - 1) > -1 && (col + 1) < 8) {
              row--;
              col++;
              console.log("down-left: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
            }
            row = fromRow, col = fromColumn;
            while ((row - 1) > -1 && (col - 1) > -1) {
              row--;
              col--;
              console.log("down-right: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
            }
            row = fromRow, col = fromColumn;
            while ((row + 1) < 8 && (col - 1) > -1) {
              row++;
              col--;
              console.log("up-right: ", row, col);
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] < 7
              ) break;
              if (row === toRow && col === toColumn) {
                canMove = true;
                break;
              }
              if (
                this.boardState[row][col] !== 0 && this.boardState[row][col] > 6
              ) break;
            }
            if (!canMove) return false;

            break;
          }
          case WKNIGHT: {
            row = fromRow, col = fromColumn;
            let movements = [
              [2, 1],
              [2, -1],
              [1, 2],
              [-1, 2],
              [-2, 1],
              [-2, -1],
              [1, -2],
              [-1, -2],
            ];
            for (const [rowPlus, colPlus] of movements) {
              if (
                (row + rowPlus) < 0 || (row + rowPlus) > 7 ||
                (col + colPlus) < 0 || (col + colPlus) > 7
              ) continue;
              if (
                this.boardState[row + rowPlus][col + colPlus] !== 0 &&
                this.boardState[row + rowPlus][col + colPlus] < 7
              ) continue;
              if (toRow === (row + rowPlus) && toColumn === (col + colPlus)) {
                canMove = true;
              }
            }
            if (!canMove) return false;
            break;
          }
          case WKING: {
            row = fromRow, col = fromColumn;
            let movements = [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ];
            for (const [rowPlus, colPlus] of movements) {
              if (
                (row + rowPlus) < 0 || (row + rowPlus) > 7 ||
                (col + colPlus) < 0 || (col + colPlus) > 7
              ) continue;

              console.log("move: ", row + rowPlus, col + colPlus);
              if (
                this.boardState[row + rowPlus][col + colPlus] !== 0 &&
                this.boardState[row + rowPlus][col + colPlus] < 7
              ) continue;
              if (toRow === (row + rowPlus) && toColumn === (col + colPlus)) {
                canMove = true;
              }
            }
            if (!canMove) return false;
            break;
          }
          case WPAWN: {
            row = fromRow, col = fromColumn;
            if (this.boardState[row + 1][col] === 0) {
              if (row + 1 === toRow && toColumn === col) {
                canMove = true;
              }
              if (
                row === 1 && this.boardState[row + 2][col] === 0 &&
                row + 2 === toRow && toColumn === col
              ) {
                canMove = true;
              }
            }
            if (
              this.boardState[row + 1][col - 1] > 6 && toRow === row + 1 &&
              toColumn === col - 1
            ) {
              canMove = true;
            }
            if (
              this.boardState[row + 1][col + 1] > 6 && toRow === row + 1 &&
              toColumn === col + 1
            ) {
              canMove = true;
            }
            if (!canMove) return false;
            // TODO: Handle en passant
            break;
          }
        }
        let nextBoardState = [];
        for (const row of this.boardState) {
          nextBoardState.push([...row]);
        }
        //TODO: handle en passant
        nextBoardState[toRow][toColumn] = this.boardState[fromRow][fromColumn];
        nextBoardState[fromRow][fromColumn] = 0;
        if (this.whiteToMove) {
          let kingRow = -1;
          let kingCol = -1;

          for (let kRow = 0; kRow < 8; kRow++) {
            for (let kCol = 0; kCol < 8; kCol++) {
              if (nextBoardState[kRow][kCol] === WKING) {
                kingRow = kRow;
                kingCol = kCol;
                break;
              }
              if (kingRow !== -1) break;
            }
          }
          console.log(
            "the king is on: ",
            arrayCoordToChessCoord(kingRow, kingCol),
          );

          // check for rooks
          let movements = [
            [-1, 0],
            [1, 0],
            [0, 1],
            [0, -1],
          ];
          for (const [rowPlus, colPlus] of movements) {
            row = kingRow, col = kingCol;
            while (
              (row + rowPlus) < 8 && (row + rowPlus) > -1 &&
              (col + colPlus) < 8 && (col + colPlus) > -1
            ) {
              row += rowPlus;
              col += colPlus;
              // if there is a black piece in the next square
              if (
                nextBoardState[row][col] === BROOK ||
                nextBoardState[row][col] === BQUEEN
              ) {
                return false;
              }
              if (nextBoardState[row][col] !== 0) {
                break;
              }
            }
          }

          // check for bishops
          movements = [
            [-1, 1],
            [1, 1],
            [1, -1],
            [-1, -1],
          ];
          for (const [rowPlus, colPlus] of movements) {
            row = kingRow, col = kingCol;
            while (
              (row + rowPlus) < 8 && (row + rowPlus) > -1 &&
              (col + colPlus) < 8 && (col + colPlus) > -1
            ) {
              row += rowPlus;
              col += colPlus;
              // if there is a black piece in the next square
              if (
                nextBoardState[row][col] === BBISHOP ||
                nextBoardState[row][col] === BQUEEN
              ) {
                return false;
              }
              if (nextBoardState[row][col] !== 0) {
                break;
              }
            }
          }
          // check for pawns

          if (
            kingRow + 1 < 8 && kingCol + 1 < 8 &&
            nextBoardState[kingRow + 1][kingCol + 1] === BPAWN
          ) {
            console.log("pawn check");
            return false;
          }
          if (
            kingRow + 1 < 8 && kingCol - 1 > -1 &&
            nextBoardState[kingRow + 1][kingCol - 1] === BPAWN
          ) {
            console.log("pawn check");
            return false;
          }

          // check for king
          movements = [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ];
          for (const [rowPlus, colPlus] of movements) {
            if (
              kingRow + rowPlus > 7 || kingRow + rowPlus < 0 ||
              kingCol + colPlus > 7 || kingCol + colPlus < 0
            ) {
              continue;
            }
            if (
              nextBoardState[kingRow + rowPlus][kingCol + colPlus] === BKING
            ) {
              return false;
            }
          }
          // check for knights

          movements = [
            [2, 1],
            [2, -1],
            [1, 2],
            [-1, 2],
            [-2, 1],
            [-2, -1],
            [1, -2],
            [-1, -2],
          ];
          for (const [rowPlus, colPlus] of movements) {
            if (
              kingRow + rowPlus > 7 || kingRow + rowPlus < 0 ||
              kingCol + colPlus > 7 || kingCol + colPlus < 0
            ) {
              continue;
            }
            if (
              nextBoardState[kingRow + rowPlus][kingCol + colPlus] === BKNIGHT
            ) {
              return false;
            }
          }
        } else {
          // check for black to move
          let kingRow = -1;
          let kingCol = -1;

          for (let kRow = 0; kRow < 8; kRow++) {
            for (let kCol = 0; kCol < 8; kCol++) {
              if (nextBoardState[kRow][kCol] === BKING) {
                kingRow = kRow;
                kingCol = kCol;
                break;
              }
              if (kingRow !== -1) break;
            }
          }
          console.log(
            "the king is on: ",
            arrayCoordToChessCoord(kingRow, kingCol),
          );

          // check for rooks
          let movements = [
            [-1, 0],
            [1, 0],
            [0, 1],
            [0, -1],
          ];
          for (const [rowPlus, colPlus] of movements) {
            row = kingRow, col = kingCol;
            while (
              (row + rowPlus) < 8 && (row + rowPlus) > -1 &&
              (col + colPlus) < 8 && (col + colPlus) > -1
            ) {
              row += rowPlus;
              col += colPlus;
              // if there is a black piece in the next square
              if (
                nextBoardState[row][col] === WROOK ||
                nextBoardState[row][col] === WQUEEN
              ) {
                return false;
              }
              if (nextBoardState[row][col] !== 0) {
                break;
              }
            }
          }

          // check for bishops
          movements = [
            [-1, 1],
            [1, 1],
            [1, -1],
            [-1, -1],
          ];
          for (const [rowPlus, colPlus] of movements) {
            row = kingRow, col = kingCol;
            while (
              (row + rowPlus) < 8 && (row + rowPlus) > -1 &&
              (col + colPlus) < 8 && (col + colPlus) > -1
            ) {
              row += rowPlus;
              col += colPlus;
              // if there is a black piece in the next square
              if (
                nextBoardState[row][col] === WBISHOP ||
                nextBoardState[row][col] === WQUEEN
              ) {
                return false;
              }
              if (nextBoardState[row][col] !== 0) {
                break;
              }
            }
          }
          // check for pawns

          if (
            kingRow - 1 > -1 && kingCol - 1 > -1 &&
            nextBoardState[kingRow - 1][kingCol - 1] === WPAWN
          ) {
            console.log("pawn check");
            return false;
          }
          if (
            kingRow - 1 > -1 && kingCol + 1 < 8 &&
            nextBoardState[kingRow - 1][kingCol + 1] === WPAWN
          ) {
            console.log("pawn check");
            return false;
          }

          // check for king
          movements = [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ];
          for (const [rowPlus, colPlus] of movements) {
            if (
              kingRow + rowPlus > 7 || kingRow + rowPlus < 0 ||
              kingCol + colPlus > 7 || kingCol + colPlus < 0
            ) {
              continue;
            }
            if (
              nextBoardState[kingRow + rowPlus][kingCol + colPlus] === WKING
            ) {
              return false;
            }
          }
          // check for knights

          movements = [
            [2, 1],
            [2, -1],
            [1, 2],
            [-1, 2],
            [-2, 1],
            [-2, -1],
            [1, -2],
            [-1, -2],
          ];
          for (const [rowPlus, colPlus] of movements) {
            if (
              kingRow + rowPlus > 7 || kingRow + rowPlus < 0 ||
              kingCol + colPlus > 7 || kingCol + colPlus < 0
            ) {
              continue;
            }
            if (
              nextBoardState[kingRow + rowPlus][kingCol + colPlus] === WKNIGHT
            ) {
              return false;
            }
          }
        }
        break;
      }
      default: {
        return false;
      }
    }

    return true;
  }

  getSquareCoordinates(coordinates) {
    const x = (coordinates.charCodeAt(0) - 97) * (1 / 8) *
      this.display.offsetWidth + this.display.offsetLeft;
    const y = (coordinates.charCodeAt(1) - 49) * (1 / 8) *
      this.display.offsetHeight + this.display.offsetTop;

    return [x, y];
  }
  getPromotion(fromCoordinate, toCoordinate, piece) {
    const pieceName = pieceNames[piece];
    if (
      pieceName === "bP" &&
      fromCoordinate.charAt(1) === "2" &&
      toCoordinate.charAt(1) === "1"
    ) {
      return BQUEEN;
    }
    if (
      pieceName === "wP" &&
      fromCoordinate.charAt(1) === "7" &&
      toCoordinate.charAt(1) === "8"
    ) {
      return WQUEEN;
    }

    return 0;
  }

  createImage(piece, coordinates = "a1") {
    const pieceInitials = pieceNames[piece];
    const pieceImage = document.createElement("img");
    pieceImage.pieceName = piece;
    pieceImage.src = `/assets/${pieceInitials}.svg`;
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
      pieceImage.style.zIndex = 100;
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
      pieceImage.style.zIndex = 10;

      const cuadrant = this.display.getBoundingClientRect();
      const realTopOffset = cuadrant.y + globalThis.scrollY;
      const realLeftOffset = cuadrant.x + globalThis.scrollX;
      const x = e.pageX - realLeftOffset;
      const y = e.pageY - realTopOffset;
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
          MOVE_VERSION +
          prevCoordinate +
          nextCoordinate,
        )
      ) {
        const promotion = this.getPromotion(
          prevCoordinate,
          nextCoordinate,
          pieceImage.pieceName,
        );

        ws.send(MOVE_VERSION + prevCoordinate + nextCoordinate + promotion);
        // render logic
      }
    });

    return pieceImage;
  }

  initializeBoard() {
  }
  renderBoard() {
    this.display;
    for (const [coordinate, pieceDisplay] of this.piecesDisplays.entries()) {
      this.display.appendChild(pieceDisplay);
    }
  }
}
const chessBoard = new ChessGame(chessboardDisplay);
chessBoard.initializeBoard();
chessBoard.renderBoard();

ws.onerror = function() {
  console.error(error);
};

ws.onmessage = (event) => {
  let [prevCoordinate, nextCoordinate, promotion] = separateElements(
    event.data,
  );
  let pieceImage = document.getElementById(prevCoordinate);
  console.log("data: ", event.data);
  console.log(pieceImage);
  if (promotion !== 0) {
    pieceImage.pieceName = promotion;
    pieceImage.src = `/assets/${pieceNames[promotion]}.svg`;
  }
  pieceImage.style.gridArea = nextCoordinate;
  let prevCoordinateRow = prevCoordinate.charCodeAt(1) - "1".charCodeAt();
  let prevCoordinateColumn = prevCoordinate.charCodeAt(0) -
    "a".charCodeAt();
  let nextCoordinateRow = nextCoordinate.charCodeAt(1) - "1".charCodeAt();
  let nextCoordinateColumn = nextCoordinate.charCodeAt(0) -
    "a".charCodeAt();

  chessBoard.boardState[nextCoordinateRow][nextCoordinateColumn] =
    chessBoard.boardState[prevCoordinateRow][prevCoordinateColumn];
  chessBoard.boardState[prevCoordinateRow][prevCoordinateColumn] = 0;
  if (chessBoard.piecesDisplays.get(nextCoordinate) !== undefined) {
    chessBoard.piecesDisplays.get(nextCoordinate).remove();
    chessBoard.piecesDisplays.delete(nextCoordinate);
  }
  chessBoard.piecesDisplays.delete(prevCoordinate);
  chessBoard.piecesDisplays.set(nextCoordinate, pieceImage);
  pieceImage.id = nextCoordinate;
  pieceImage.style.gridArea = nextCoordinate;
  chessBoard.whiteToMove = !chessBoard.whiteToMove;
  console.log(chessBoard.boardState);
};
