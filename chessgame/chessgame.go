package chessgame

import (
	"errors"
	"fmt"
)

const (
	WKING = iota + 1
	WQUEEN
	WROOK
	WBISHOP
	WKNIGHT
	WPAWN
	BKING
	BQUEEN
	BROOK
	BBISHOP
	BKNIGHT
	BPAWN
)

var charToPiece map[byte]int = map[byte]int{
	'R': WROOK,
	'N': WKNIGHT,
	'B': WBISHOP,
	'Q': WQUEEN,
	'K': WKING,
	'P': WPAWN,
	'r': BROOK,
	'n': BKNIGHT,
	'b': BBISHOP,
	'q': BQUEEN,
	'k': BKING,
	'p': BPAWN,
}

type pair struct {
	col int8
	row int8
}

func addPair(a, b pair) pair {
	return pair{
		col: a.col + b.col,
		row: a.row + b.row,
	}
}

type Chessgame struct {
	Moves                []string
	Variant              string
	GameState            string
	WhiteUserId          int
	BlackUserId          int
	WhiteToMove          bool
	BoardState           []uint64
	CastleEnPassantState uint8
	BlackKingCastle      bool
	BlackQueenCastle     bool
	WhiteKingCastle      bool
	WhiteQueenCastle     bool
	EnPassantSquare      pair
}

func CreateChessGame(variant, initialPos string, white, black int) Chessgame {
	boardSize := 8
	boardState := make([]uint64, 12)
	if initialPos == "" {
		initialPos = "RNBQRBNR|PPPPPPPP|........|........|........|........|pppppppp|rnbkqbnr"
	}
	if variant == "" {
		variant = "classic"
	}
	boardCol := 0
	boardRow := 0
	for i := 0; i < len(initialPos); i++ {
		if initialPos[i] == '|' {
			boardRow++
			boardCol = 0
			fmt.Println()
			continue
		}
		if initialPos[i] == '.' {
			boardCol++
			fmt.Printf("%v\t", 0)
			continue
		}
		var bitPosition uint64 = (1 << (boardCol + boardSize*boardRow))
		fmt.Printf("%v\t", charToPiece[initialPos[i]]-1)
		boardState[charToPiece[initialPos[i]]-1] |= bitPosition
		boardCol++
	}
	return Chessgame{
		Variant:              variant,
		Moves:                nil,
		GameState:            initialPos,
		WhiteUserId:          white,
		BlackUserId:          black,
		BoardState:           boardState,
		WhiteToMove:          true,
		CastleEnPassantState: uint8(0),
	}
}

func pairToInt(sq pair) int8 {
	return (sq.col + sq.row*8)
}

// NOTE: 0 0 0 0 0 0 0 0
// 0: short white castle availability
// 0: long white castle availability
// 0: short black castle availability
// 0: long black castle availability
// 0: {
// 0: { bitwise value of the column of the last pawn moved
// 0: { all zeroes for no previous two step pawn move
// 0: {
func (chessgame *Chessgame) InBounds(square pair) bool {
	return (square.col > -1 &&
		square.col < 8 &&
		square.row > -1 &&
		square.row < 8)
}

func (chessgame *Chessgame) SquareIsThreatenedByPieces(square pair, pieces []int) bool {
	fmt.Println("A SQUARE IS CHEKCING FOR THREATS`")
	for v, piece := range pieces {
		fmt.Println(piece)
		fmt.Println(v)
	}
	return false
}

func (chessgame *Chessgame) getSquare(sq pair) int8 {
	if sq.col > 7 || sq.row > 7 || sq.col < 0 || sq.row < 0 {
		return -1
	}
	var ret int8 = 0
	for i, val := range chessgame.BoardState {
		if ((val >> (sq.col + sq.row*8)) & 1) == 1 {
			ret = int8(i + 1)
			break
		}
	}
	return ret
}

func isWhite(piece int8) bool {
	return piece < 7
}

func (chessgame *Chessgame) PrintBoard() {
	for sq := 0; sq < 64; sq++ {
		piece := 0
		for i, val := range chessgame.BoardState {
			if val>>(sq)&1 == 1 {
				piece = i
			}
		}
		if sq%8 == 0 {
			fmt.Println()
		}
		fmt.Printf("%d\t", piece)
	}
}

func (chessgame *Chessgame) MakeMove(move []byte) error {
	version := move[0]
	prevSquare := pair{
		col: 0,
		row: 0,
	}
	nextSquare := pair{
		col: 0,
		row: 0,
	}
	// promotion := byte('_')
	switch version {
	case '0':
		prevSquare.col = int8(move[1] - 'a')
		prevSquare.row = int8(move[2] - '1')
		nextSquare.col = int8(move[3] - 'a')
		nextSquare.row = int8(move[4] - '1')
		//	promotion = move[5]
	default:
		return errors.New("not valid version of move for the chessgame")
	}
	// TODO: check player turn
	if !chessgame.InBounds(prevSquare) || !chessgame.InBounds(nextSquare) {
		return errors.New("invalid coordinates")
	}
	piece := chessgame.getSquare(prevSquare)
	// fmt.Println("soy pieza ", piece)
	if piece == 0 {
		return errors.New("no piece in found in previous pair")
	}
	if isWhite(piece) != chessgame.WhiteToMove {
		if isWhite(piece) {
			return errors.New("black to move")
		}
		return errors.New("white to move ")
	}

	canMove := false
	enPassantSquare := pair{-1, -1}
	var movements []pair
	var directions []pair
	chessgame.PrintBoard()
	fmt.Println()

	switch piece {
	case WKING:
		movements = []pair{
			{col: 0, row: 1},
			{col: 0, row: -1},
			{col: 1, row: 1},
			{col: 1, row: -1},
			{col: 1, row: 0},
			{col: -1, row: 1},
			{col: -1, row: 0},
			{col: -1, row: -1},
		}
		if chessgame.WhiteQueenCastle &&
			prevSquare.col == 4 && prevSquare.row == 0 &&
			nextSquare.col == 2 && nextSquare.row == 0 {
			canMove = true
		}
		if chessgame.WhiteKingCastle &&
			prevSquare.col == 4 && prevSquare.row == 0 &&
			nextSquare.col == 6 && nextSquare.row == 0 {
			canMove = true
		}
	case WKNIGHT:
		movements = []pair{
			{col: 1, row: 2},
			{col: -1, row: 2},
			{col: 1, row: -2},
			{col: -1, row: -2},
			{col: 2, row: 1},
			{col: 2, row: -1},
			{col: -2, row: 1},
			{col: -2, row: -1},
		}
	case WPAWN:
		// move one step
		if nextSquare == addPair(prevSquare, pair{row: 1}) && chessgame.getSquare(nextSquare) == 0 {
			canMove = true
		}
		// move two steps
		if nextSquare == addPair(prevSquare, pair{row: 2}) &&
			chessgame.getSquare(nextSquare) == 0 &&
			chessgame.getSquare(addPair(prevSquare, pair{row: 1})) == 0 &&
			prevSquare.row == 1 {
			canMove = true
			enPassantSquare = addPair(prevSquare, pair{row: 1})
		}
		// capture
		if (nextSquare == addPair(prevSquare, pair{row: 1, col: -1}) ||
			nextSquare == addPair(prevSquare, pair{row: 1, col: 1})) &&
			(!isWhite(chessgame.getSquare(nextSquare)) || (nextSquare == chessgame.EnPassantSquare)) {
			canMove = true
		}
		// TODO: handle promotion

	case WQUEEN:
		directions = []pair{
			{col: 0, row: 1},
			{col: 0, row: -1},
			{col: 1, row: 0},
			{col: -1, row: 0},
			{col: 1, row: 1},
			{col: 1, row: -1},
			{col: -1, row: 1},
			{col: -1, row: -1},
		}

	case WROOK:
		directions = []pair{
			{col: 0, row: 1},
			{col: 0, row: -1},
			{col: 1, row: 0},
			{col: -1, row: 0},
		}

	case WBISHOP:
		directions = []pair{
			{col: 1, row: 1},
			{col: 1, row: -1},
			{col: -1, row: 1},
			{col: -1, row: -1},
		}

	case BKING:
		movements = []pair{
			{col: 0, row: 1},
			{col: 0, row: -1},
			{col: 1, row: 1},
			{col: 1, row: -1},
			{col: 1, row: 0},
			{col: -1, row: 1},
			{col: -1, row: 0},
			{col: -1, row: -1},
		}
		if chessgame.BlackQueenCastle &&
			prevSquare.col == 4 && prevSquare.row == 7 &&
			nextSquare.col == 2 && nextSquare.row == 7 {
			canMove = true
		}
		if chessgame.BlackKingCastle &&
			prevSquare.col == 4 && prevSquare.row == 7 &&
			nextSquare.col == 6 && nextSquare.row == 7 {
			canMove = true
		}

	case BKNIGHT:
		movements = []pair{
			{col: 1, row: 2},
			{col: -1, row: 2},
			{col: 1, row: -2},
			{col: -1, row: -2},
			{col: 2, row: 1},
			{col: 2, row: -1},
			{col: -2, row: 1},
			{col: -2, row: -1},
		}

	case BPAWN:
		// one step
		if nextSquare == addPair(prevSquare, pair{row: -1}) && chessgame.getSquare(nextSquare) == 0 {
			canMove = true
		}
		// two steps
		if nextSquare == addPair(prevSquare, pair{row: -2}) && chessgame.getSquare(nextSquare) == 0 && chessgame.getSquare(addPair(prevSquare, pair{row: -1})) == 0 && prevSquare.row == 6 {
			canMove = true
			enPassantSquare = addPair(prevSquare, pair{row: -1})
		}
		// capture
		if (nextSquare == addPair(prevSquare, pair{row: -1, col: -1}) || nextSquare == addPair(prevSquare, pair{row: -1, col: 1})) &&
			(isWhite(chessgame.getSquare(nextSquare)) || (nextSquare == chessgame.EnPassantSquare)) {
			canMove = true
		}

		// TODO: handle promotion

	case BQUEEN:
		directions = []pair{
			{col: 0, row: 1},
			{col: 0, row: -1},
			{col: 1, row: 0},
			{col: -1, row: 0},
			{col: 1, row: 1},
			{col: 1, row: -1},
			{col: -1, row: 1},
			{col: -1, row: -1},
		}

	case BROOK:
		directions = []pair{
			{col: 0, row: 1},
			{col: 0, row: -1},
			{col: 1, row: 0},
			{col: -1, row: 0},
		}

	case BBISHOP:
		directions = []pair{
			{col: 1, row: 1},
			{col: 1, row: -1},
			{col: -1, row: 1},
			{col: -1, row: -1},
		}

	}
	for _, move := range movements {
		if nextSquare == addPair(move, prevSquare) {
			canMove = true
			break
		}
	}
	for _, direction := range directions {
		currSquare := addPair(prevSquare, direction)
		for chessgame.InBounds(currSquare) {
			if chessgame.getSquare(currSquare) != 0 && isWhite(chessgame.getSquare(currSquare)) == isWhite(piece) {
				break
			}
			if nextSquare == currSquare {
				canMove = true
				break
			}
			if chessgame.getSquare(currSquare) != 0 && !isWhite(chessgame.getSquare(currSquare)) == isWhite(piece) {
				break
			}
			currSquare = addPair(currSquare, direction)
		}
	}
	if !canMove {
		return errors.New("invalid move")
	}

	// TODO: Check if castling is legal
	// whiteLongCastle
	// fmt.Printf("%v == %v && %v && %v \n", piece, WKING, prevSquare == pair{row: 0, col: 4}, nextSquare == pair{row: 0, col: 2})
	if (piece == WKING &&
		prevSquare == pair{row: 0, col: 4} &&
		nextSquare == pair{row: 0, col: 2}) {
		blackPieces := []int{
			BPAWN, BROOK, BKNIGHT, BBISHOP, BQUEEN, BKING,
		}
		chessgame.SquareIsThreatenedByPieces(pair{row: 0, col: 3}, blackPieces)
	}
	// whiteShortCastle

	// blackLongCastle
	// blackShortCastle

	// TODO: Check next position legality

	chessgame.WhiteToMove = !chessgame.WhiteToMove
	chessgame.EnPassantSquare = enPassantSquare
	// TODO: update state of castling legality

	// delete any piece in "nextSquare"
	for i := 0; i < len(chessgame.BoardState); i++ {
		chessgame.BoardState[i] &= (^uint64(0) ^ 1<<pairToInt(nextSquare))
	}
	// put "piece" in "nextSquare"
	chessgame.BoardState[piece-1] |= uint64(1 << pairToInt(nextSquare))
	// delete "piece" in "prevSquare"
	chessgame.BoardState[piece-1] &= (^uint64(0) ^ 1<<pairToInt(prevSquare))

	return nil
}
