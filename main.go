package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"net/http"
	"time"

	"github.com/fangli/spdk-dashboard/spdk"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"
)

var MsgChan chan []byte
var MsgHubChan chan chan []byte

var HTTP_SERVER = "0.0.0.0:8000"

//go:embed public/dist
var EmbedPublic embed.FS

var (
	upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
		return true
	}}
)

func getFileSystem() http.FileSystem {
	fsys, err := fs.Sub(EmbedPublic, "public/dist")
	if err != nil {
		panic(err)
	}
	return http.FS(fsys)
}

func wsHandler(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer ws.Close()

	wsChan := make(chan []byte, 1)
	MsgHubChan <- wsChan
	c.Logger().Info("Created new websocket channel for " + c.Request().RemoteAddr)
	for msg := range wsChan {
		ws.SetWriteDeadline(time.Now().Add(time.Second))
		err = ws.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			break
		}
	}
	c.Logger().Info("Websocket channel closed for " + c.Request().RemoteAddr)
	return nil
}

func getSpdkStat() []byte {
	return spdk.GetAllMetrics()
}

func publisher() {
	for {
		if len(MsgHubChan) > 0 {
			MsgChan <- getSpdkStat()
		}
		time.Sleep(time.Millisecond * 1000)
	}
}

func serveForever() {
	e := echo.New()
	e.HideBanner = true
	assetHandler := http.FileServer(getFileSystem())
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.GET("/*", echo.WrapHandler(assetHandler))
	e.GET("/ws", wsHandler)
	e.Logger.SetLevel(log.WARN)
	e.Logger.Fatal(e.Start(HTTP_SERVER))
}

func dispatcher() {
	for {
		msg := <-MsgChan
		var tmpMsgChans []chan []byte
		hubSize := len(MsgHubChan)
		for i := 0; i < hubSize; i++ {
			aMsgChan := <-MsgHubChan
			if len(aMsgChan) >= 1 {
				close(aMsgChan)
			} else {
				aMsgChan <- msg
				tmpMsgChans = append(tmpMsgChans, aMsgChan)
			}
		}
		for _, t := range tmpMsgChans {
			MsgHubChan <- t
		}
	}
}

func initFlags() {
	fmt.Println("=====================\nSPDK Dashboard Server\n* Check out https://github.com/fangli/spdk-dashboard for details.\n* MIT Licensed\n=====================")
	httpListen := flag.String("http-listen", "0.0.0.0:8000", "Which address and port should we listen to? This must be [address:port]")
	spdkRpc := flag.String("spdk-rpc", "/var/tmp/spdk.sock", "The SPDK RPC server. For example: /var/tmp/spdk.sock for unix socket, 127.0.0.1:1234 for TCP.")

	flag.Parse()

	spdk.SPDK_SERVER_ADDR = *spdkRpc
	HTTP_SERVER = *httpListen

	fmt.Printf("SPDK RPC server set to %s\n", *spdkRpc)
}

func initial() {
	initFlags()

	MsgChan = make(chan []byte)
	MsgHubChan = make(chan chan []byte, 10000)

	go publisher()
	go dispatcher()
}

func main() {
	initial()
	serveForever()
}
