package chessgame

import (
	"errors"
	"fmt"
	"strconv"
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

type Chessgame struct {
	Moves       []string
	Variant     string
	GameState   string
	WhiteUserId int
	BlackUserId int
	BoardState  []uint64
	CastleState int8
}

func CreateChessGame(variant, initialPos string, white, black int) Chessgame {
	fmt.Print(strconv.FormatBool(true))
	boardSize := 8
	boardState := make([]uint64, 12)
	if initialPos == "" {
		initialPos = "RNBKQBNR|PPPPPPPP|........|........|........|........|pppppppp|rnbkqbnr"
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
			continue
		}
		if initialPos[i] == '.' {
			boardCol++
			continue
		}
		var bitPosition uint64 = (1 << (boardCol + boardSize*boardRow))
		boardState[charToPiece[initialPos[i]]-1] |= bitPosition
		boardCol++
	}
	return Chessgame{
		Variant:     variant,
		Moves:       nil,
		GameState:   initialPos,
		WhiteUserId: white,
		BlackUserId: black,
		BoardState:  boardState,
	}
}

func pairToInt(sq pair) int8 {
	return (sq.col + sq.row*8)
}

func (chessgame *Chessgame) getSquare(sq pair) int8 {
	var ret int8 = 0
	for i, val := range chessgame.BoardState {
		if ((val >> (sq.col + sq.row*8)) & 1) == 1 {
			ret = int8(i + 1)
			break
		}
	}
	return ret
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
	piece := chessgame.getSquare(prevSquare)
	if piece == 0 {
		return errors.New("no piece in found in previous pair")
	}
	fmt.Println(prevSquare)
	fmt.Println(piece)

	switch piece {
	case WKING:
		movements := []pair{
			{
				col: 0,
				row: 1,
			},
			{
				col: 0,
				row: -1,
			},
			{
				col: 1,
				row: 1,
			},
			{
				col: 1,
				row: -1,
			},
			{
				col: 1,
				row: 0,
			},
			{
				col: -1,
				row: 1,
			},
			{
				col: -1,
				row: 0,
			},
			{
				col: -1,
				row: -1,
			},
		}
		fmt.Print(movements)
	}
	for i := 0; i < len(chessgame.BoardState); i++ {
		chessgame.BoardState[i] &= (^uint64(0) ^ 1<<pairToInt(nextSquare))
	}
	fmt.Println(strconv.FormatUint(chessgame.BoardState[piece-1], 2))
	chessgame.BoardState[piece-1] |= uint64(1 << pairToInt(nextSquare))
	chessgame.BoardState[piece-1] &= (^uint64(0) ^ 1<<pairToInt(prevSquare))
	fmt.Println(strconv.FormatUint(chessgame.BoardState[piece-1], 2))

	return nil
}
