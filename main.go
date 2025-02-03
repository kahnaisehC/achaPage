package main

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"

	"github.com/labstack/echo/v4"
)

var connectionPool = struct {
	sync.RWMutex
	connections map[*websocket.Conn]struct{}
}{
	connections: make(map[*websocket.Conn]struct{}),
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func wsHandler(c echo.Context) error {
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
		_, msg, err := ws.ReadMessage()
		if err != nil {
			return err
		}
		err = sendMessageToAllPool(msg)
		if err != nil {
			return err
		}
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
	fmt.Println("World, Hello")

	e := echo.New()
	t := &Template{
		templates: template.Must(template.ParseGlob("public/views/*.html")),
	}
	e.Renderer = t

	e.Static("/", "public")

	e.GET("/", func(c echo.Context) error {
		return c.Render(http.StatusOK, "index", "hello world")
	})
	e.GET("/game", func(c echo.Context) error {
		return c.Render(http.StatusOK, "game", "hello world")
	})

	e.GET("/ws", wsHandler)
	e.Logger.Fatal(e.Start(":1333"))
}
