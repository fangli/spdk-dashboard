package spdk

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/shirou/gopsutil/v3/mem"
)

type Reactor struct {
	Busy int64
	Idle int64
}

type FrameworkReactors struct {
	Timestamp int64
	Reactors  map[string]Reactor
}

type Bdev struct {
	BytesRead         int64
	BytesWrite        int64
	NumReadOps        int64
	NumWriteOps       int64
	ReadLatencyTicks  int64
	WriteLatencyTicks int64
}

type BdevIostat struct {
	Timestamp int64
	Bdevs     map[string]Bdev
}

type NvmfSubsystemControllers struct {
	Timestamp   int64
	Controllers map[string]map[string][]string
}

type MemInfo struct {
	Total  uint64
	Used   uint64
	Cached uint64
	Free   uint64
}

type SpdkStat struct {
	Success        bool
	ProcessMillSec int64
	Timestamp      int64
	Metrics        map[string]interface{}
}

var NvmfSubsystemsRequest = []byte(`{"jsonrpc": "2.0","method": "nvmf_get_subsystems","id": 1}`)
var NvmfSubsystemControllersRequest = `{"jsonrpc": "2.0","method": "nvmf_subsystem_get_controllers","params":{"nqn":"%s"},"id": 1}`
var FrameworkReactorsRequest = []byte(`{"jsonrpc": "2.0","method": "framework_get_reactors","id": 1}`)
var BdevIostatRequest = []byte(`{"jsonrpc": "2.0","method": "bdev_get_iostat","id": 1}`)

//////////////////////////////

func GetNvmfSubsystems() ([]string, error) {
	ret := []string{}
	raw, err := request(NvmfSubsystemsRequest)
	if err != nil {
		return nil, err
	}
	for _, rawNvmfSubsystem := range raw.Search("result").Children() {
		if rawNvmfSubsystem.Path("subtype").Data().(string) == "NVMe" {
			ret = append(ret, rawNvmfSubsystem.Path("nqn").Data().(string))
		}
	}
	return ret, nil
}

func GetNvmfSubsystemControllers() (*NvmfSubsystemControllers, error) {

	nvmfSubsystemControllers := NvmfSubsystemControllers{
		Timestamp:   time.Now().UnixMilli(),
		Controllers: map[string]map[string][]string{},
	}

	nvmfSubsystems, err := GetNvmfSubsystems()
	if err != nil {
		return nil, err
	}

	for _, nvmfSubsystem := range nvmfSubsystems {
		nvmfSubsystemControllers.Controllers[nvmfSubsystem] = make(map[string][]string)

		raw, err := request([]byte(fmt.Sprintf(NvmfSubsystemControllersRequest, nvmfSubsystem)))
		if err != nil {
			return nil, err
		}

		for _, rawController := range raw.Search("result").Children() {
			nvmfSubsystemControllers.Controllers[nvmfSubsystem][rawController.Path("hostid").Data().(string)] = append(
				nvmfSubsystemControllers.Controllers[nvmfSubsystem][rawController.Path("hostid").Data().(string)],
				rawController.Path("hostnqn").Data().(string))
		}
	}

	return &nvmfSubsystemControllers, nil
}

func GetFrameworkReactors() (*FrameworkReactors, error) {
	raw, err := request(FrameworkReactorsRequest)
	if err != nil {
		return nil, err
	}

	frameworkReactors := FrameworkReactors{
		Timestamp: time.Now().UnixMilli(),
		Reactors:  map[string]Reactor{},
	}

	for _, rawReactor := range raw.Search("result", "reactors").Children() {
		reactor := Reactor{
			Busy: int64(rawReactor.Path("busy").Data().(float64)),
			Idle: int64(rawReactor.Path("idle").Data().(float64)),
		}
		frameworkReactors.Reactors["Reactor-"+strconv.Itoa(int(rawReactor.Path("lcore").Data().(float64)))] = reactor
	}
	return &frameworkReactors, nil
}

func GetBdevIostat() (*BdevIostat, error) {
	raw, err := request(BdevIostatRequest)
	if err != nil {
		return nil, err
	}

	bdevIostat := BdevIostat{
		Timestamp: time.Now().UnixMilli(),
		Bdevs:     map[string]Bdev{},
	}

	for _, rawBdev := range raw.Search("result", "bdevs").Children() {
		bdev := Bdev{
			BytesRead:         int64(rawBdev.Path("bytes_read").Data().(float64)),
			BytesWrite:        int64(rawBdev.Path("bytes_written").Data().(float64)),
			NumReadOps:        int64(rawBdev.Path("num_read_ops").Data().(float64)),
			NumWriteOps:       int64(rawBdev.Path("num_write_ops").Data().(float64)),
			ReadLatencyTicks:  int64(rawBdev.Path("read_latency_ticks").Data().(float64)),
			WriteLatencyTicks: int64(rawBdev.Path("write_latency_ticks").Data().(float64)),
		}
		bdevIostat.Bdevs[rawBdev.Path("name").Data().(string)] = bdev
	}

	return &bdevIostat, nil
}

func GetAllMetrics() []byte {
	ret := map[string]interface{}{}

	t0 := time.Now().UnixMilli()

	frameworkReactors, err := GetFrameworkReactors()
	if err == nil {
		ret["FrameworkReactors"] = frameworkReactors
	}
	bdevIostat, err := GetBdevIostat()
	if err == nil {
		ret["BdevIostat"] = bdevIostat
	}
	nvmfSubsystemControllers, err := GetNvmfSubsystemControllers()
	if err == nil {
		ret["NvmfSubsystemControllers"] = nvmfSubsystemControllers
	}

	v, _ := mem.VirtualMemory()
	ret["SysMemInfo"] = MemInfo{
		Total:  v.Total,
		Used:   v.Used,
		Free:   v.Free,
		Cached: v.Cached,
	}

	spdkStat := SpdkStat{
		Success:        true,
		ProcessMillSec: time.Now().UnixMilli() - t0,
		Timestamp:      time.Now().UnixMilli(),
		Metrics:        ret,
	}

	byteResponse, err := json.Marshal(&spdkStat)
	if err != nil {
		log.Fatal(err)
	}
	return byteResponse

}
