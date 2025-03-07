package main

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/kahnaisehC/achaPage/chessgame"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

const GO_SESSION_ID = "GO_SESSION_ID"

type chessGameHandler struct {
	websocket *websocket.Conn
	chessgame chessgame.Chessgame
}

var (
	user_id        = 1
	game_id        = 1
	connectionPool = struct {
		sync.RWMutex
		connections map[*websocket.Conn]struct{}
	}{
		connections: make(map[*websocket.Conn]struct{}),
	}
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func gameHandler(c echo.Context) error {
	return c.Render(http.StatusOK, "game", c.Param("id"))
}

func createLobby(c echo.Context) error {
	game_id++
	return c.Redirect(http.StatusSeeOther, fmt.Sprintf("/game/%v", game_id))
}

func createGameHandler(c echo.Context) error {
	sess, err := session.Get(GO_SESSION_ID, c)
	if err != nil {
		return err
	}
	sess.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7,
		HttpOnly: true,
	}
	if sess.Values[GO_SESSION_ID] == nil {
		sess.Values[GO_SESSION_ID] = user_id
		user_id++
	}
	if err = sess.Save(c.Request(), c.Response().Writer); err != nil {
		return err
	}
	return c.Render(http.StatusOK, "createGame", "")
}

func wsGameHandler(c echo.Context) error {
	// handle no one connected to the websocket (create the websocket)

	// handle if websocket is waiting opponent

	// handle if game is going on
	chessg := chessgame.CreateChessGame("", "", 0, 0)
	chessg.BlackUserId = 1

	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer ws.Close()

	connectionPool.Lock()
	connectionPool.connections[ws] = struct{}{}

	defer func(connection *websocket.Conn) {
		connectionPool.Lock()
		delete(connectionPool.connections, connection)
		connectionPool.Unlock()
	}(ws)
	connectionPool.Unlock()

	for {
		if len(connectionPool.connections) == 0 {
			fmt.Println("no clients connected, closing connection")
			ws.Close()
			return nil
		}
		_, msg, err := ws.ReadMessage()
		if err != nil {
			return err
		}
		if err := chessg.MakeMove(msg); err != nil {
			fmt.Println(err.Error())
			continue
		}
		err = sendMessageToAllPool(msg)
		if err != nil {
			return err
		}
		sess, err := session.Get(GO_SESSION_ID, c)
		if err != nil {
			return err
		}
		fmt.Println(sess.Values["foo"])
		fmt.Printf("%s\n", msg)
	}
}

func sendMessageToAllPool(msg []byte) error {
	connectionPool.RLock()
	defer connectionPool.RUnlock()
	for conn := range connectionPool.connections {
		err := conn.WriteMessage(websocket.TextMessage, (msg))
		if err != nil {
			return err
		}
	}
	return nil
}

type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, e echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
	e := echo.New()
	e.Use(session.Middleware(sessions.NewCookieStore([]byte("secret"))))

	t := &Template{
		templates: template.Must(template.ParseGlob("public/views/*.html")),
	}
	e.Renderer = t

	e.Static("/", "public")

	e.GET("/", func(c echo.Context) error {
		return c.Render(http.StatusOK, "index", "hello world")
	})
	e.GET("/game", createGameHandler)
	e.POST("/game", createLobby)

	e.GET("/game/:id", gameHandler)

	e.GET("/ws/:id", wsGameHandler)
	e.Logger.Fatal(e.Start(":1333"))
}
