package spdk

import (
	"encoding/json"
	"log"
	"net"
	"time"

	"github.com/Jeffail/gabs/v2"
)

var SPDK_SERVER_ADDR = "/var/tmp/spdk.sock"

var SpdkConn net.Conn = nil

func dial() error {
	serverType := "unix"
	if SPDK_SERVER_ADDR[0:1] != "/" {
		serverType = "tcp"
	}

	conn, err := net.Dial(serverType, SPDK_SERVER_ADDR)
	if err != nil {
		log.Println("Unable to connect to SPDK RPC server: " + serverType + "://" + SPDK_SERVER_ADDR)
		return err
	}
	SpdkConn = conn
	return nil
}

func request(payload []byte) (*gabs.Container, error) {
	var err error
	if SpdkConn == nil {
		err = dial()
		if err != nil {
			return nil, err
		}
	}
	_, err = SpdkConn.Write(payload)
	if err != nil {
		SpdkConn.Close()
		SpdkConn = nil
		return nil, err
	}

	SpdkConn.SetReadDeadline(time.Now().Add(time.Second))
	decoder := json.NewDecoder(SpdkConn)

	val, err := gabs.ParseJSONDecoder(decoder)
	if err != nil {
		SpdkConn.Close()
		SpdkConn = nil
	}
	return val, err
}
