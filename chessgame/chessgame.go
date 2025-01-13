package chessgame

import "sync"

type Chessgame struct {
	sync.Mutex
	Moves     []string
	Variant   string
	GameState []string
	White     string
	Black     string
}

func CreateChessGame(variant, initialPos, white, black string) Chessgame {
	if initialPos == "" {
		initialPos = "RNBKQBNR|PPPPPPPP|........|........|........|........|pppppppp|rnbkqbnr"
	}
	if variant == "" {
		variant = "classic"
	}
	return Chessgame{
		Variant:   variant,
		Moves:     nil,
		GameState: initialPos,
		White:     white,
		Black:     black,
	}
}

func (*Chessgame) MakeMove(string) error {
	return nil
}
