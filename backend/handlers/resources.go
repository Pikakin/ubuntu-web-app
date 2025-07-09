package handlers

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type SystemResources struct {
	CPU     CPUStats       `json:"cpu"`
	Memory  MemoryStats    `json:"memory"`
	Disk    []DiskStats    `json:"disk"`
	Network []NetworkStats `json:"network"`
}

type CPUStats struct {
	Usage       float64       `json:"usage"`
	Cores       int           `json:"cores"`
	LoadAverage [3]float64    `json:"load_average"`
	Processes   []ProcessInfo `json:"processes"`
}

type MemoryStats struct {
	Total     uint64  `json:"total"`
	Available uint64  `json:"available"`
	Used      uint64  `json:"used"`
	Cached    uint64  `json:"cached"`
	Buffers   uint64  `json:"buffers"`
	Swap      SwapStats `json:"swap"`
}

type SwapStats struct {
	Total uint64 `json:"total"`
	Used  uint64 `json:"used"`
	Free  uint64 `json:"free"`
}

type DiskStats struct {
	Device     string  `json:"device"`
	Mountpoint string  `json:"mountpoint"`
	Filesystem string  `json:"filesystem"`
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Available  uint64  `json:"available"`
	Usage      float64 `json:"usage"`
}

type NetworkStats struct {
	Interface string `json:"interface"`
	RxBytes   uint64 `json:"rx_bytes"`
	TxBytes   uint64 `json:"tx_bytes"`
	RxPackets uint64 `json:"rx_packets"`
	TxPackets uint64 `json:"tx_packets"`
	Status    string `json:"status"`
}

type ProcessInfo struct {
	PID     int     `json:"pid"`
	Name    string  `json:"name"`
	User    string  `json:"user"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	VSZ     uint64  `json:"vsz"`
	RSS     uint64  `json:"rss"`
	TTY     string  `json:"tty"`
	Stat    string  `json:"stat"`
	Start   string  `json:"start"`
	Time    string  `json:"time"`
	Command string  `json:"command"`
}

func GetSystemResources(c *gin.Context) {
	resources := SystemResources{
		CPU:     getCPUStats(),
		Memory:  getMemoryStats(),
		Disk:    getDiskStats(),
		Network: getNetworkStats(),
	}

	c.JSON(http.StatusOK, resources)
}

func getCPUStats() CPUStats {
	// Get CPU usage from /proc/stat
	usage := getCPUUsage()
	cores := getCPUCores()
	loadAvg := getLoadAverage()
	processes := getProcesses()

	return CPUStats{
		Usage:       usage,
		Cores:       cores,
		LoadAverage: loadAvg,
		Processes:   processes,
	}
}

func getCPUUsage() float64 {
	// Read /proc/stat to get CPU usage
	data, err := ioutil.ReadFile("/proc/stat")
	if err != nil {
		return 0.0
	}

	lines := strings.Split(string(data), "\n")
	if len(lines) < 1 {
		return 0.0
	}

	// Parse first line (cpu total)
	fields := strings.Fields(lines[0])
	if len(fields) < 8 {
		return 0.0
	}

	user, _ := strconv.ParseUint(fields[1], 10, 64)
	nice, _ := strconv.ParseUint(fields[2], 10, 64)
	system, _ := strconv.ParseUint(fields[3], 10, 64)
	idle, _ := strconv.ParseUint(fields[4], 10, 64)
	iowait, _ := strconv.ParseUint(fields[5], 10, 64)
	irq, _ := strconv.ParseUint(fields[6], 10, 64)
	softirq, _ := strconv.ParseUint(fields[7], 10, 64)

	totalIdle := idle + iowait
	totalNonIdle := user + nice + system + irq + softirq
	total := totalIdle + totalNonIdle

	if total == 0 {
		return 0.0
	}

	return float64(totalNonIdle) / float64(total) * 100.0
}

func getCPUCores() int {
	data, err := ioutil.ReadFile("/proc/cpuinfo")
	if err != nil {
		return 1
	}

	lines := strings.Split(string(data), "\n")
	count := 0
	for _, line := range lines {
		if strings.HasPrefix(line, "processor") {
			count++
		}
	}

	if count == 0 {
		return 1
	}
	return count
}

func getLoadAverage() [3]float64 {
	data, err := ioutil.ReadFile("/proc/loadavg")
	if err != nil {
		return [3]float64{0, 0, 0}
	}

	fields := strings.Fields(string(data))
	if len(fields) < 3 {
		return [3]float64{0, 0, 0}
	}

	load1, _ := strconv.ParseFloat(fields[0], 64)
	load5, _ := strconv.ParseFloat(fields[1], 64)
	load15, _ := strconv.ParseFloat(fields[2], 64)

	return [3]float64{load1, load5, load15}
}

func getProcesses() []ProcessInfo {
	cmd := exec.Command("ps", "aux")
	output, err := cmd.Output()
	if err != nil {
		return []ProcessInfo{}
	}

	lines := strings.Split(string(output), "\n")
	processes := []ProcessInfo{}

	for i, line := range lines {
		if i == 0 || line == "" {
			continue // Skip header and empty lines
		}

		fields := strings.Fields(line)
		if len(fields) < 11 {
			continue
		}

		pid, _ := strconv.Atoi(fields[1])
		cpu, _ := strconv.ParseFloat(fields[2], 64)
		memory, _ := strconv.ParseFloat(fields[3], 64)
		vsz, _ := strconv.ParseUint(fields[4], 10, 64)
		rss, _ := strconv.ParseUint(fields[5], 10, 64)

		command := strings.Join(fields[10:], " ")

		processes = append(processes, ProcessInfo{
			PID:     pid,
			Name:    fields[10],
			User:    fields[0],
			CPU:     cpu,
			Memory:  memory,
			VSZ:     vsz,
			RSS:     rss,
			TTY:     fields[6],
			Stat:    fields[7],
			Start:   fields[8],
			Time:    fields[9],
			Command: command,
		})
	}

	return processes
}

func getMemoryStats() MemoryStats {
	data, err := ioutil.ReadFile("/proc/meminfo")
	if err != nil {
		return MemoryStats{}
	}

	lines := strings.Split(string(data), "\n")
	memInfo := make(map[string]uint64)

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.Split(line, ":")
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		valueStr := strings.TrimSpace(parts[1])
		valueStr = strings.Replace(valueStr, " kB", "", -1)
		
		value, err := strconv.ParseUint(valueStr, 10, 64)
		if err != nil {
			continue
		}

		memInfo[key] = value * 1024 // Convert kB to bytes
	}

	return MemoryStats{
		Total:     memInfo["MemTotal"],
		Available: memInfo["MemAvailable"],
		Used:      memInfo["MemTotal"] - memInfo["MemAvailable"],
		Cached:    memInfo["Cached"],
		Buffers:   memInfo["Buffers"],
		Swap: SwapStats{
			Total: memInfo["SwapTotal"],
			Used:  memInfo["SwapTotal"] - memInfo["SwapFree"],
			Free:  memInfo["SwapFree"],
		},
	}
}

func getDiskStats() []DiskStats {
	cmd := exec.Command("df", "-h")
	output, err := cmd.Output()
	if err != nil {
		return []DiskStats{}
	}

	lines := strings.Split(string(output), "\n")
	diskStats := []DiskStats{}

	for i, line := range lines {
		if i == 0 || line == "" {
			continue // Skip header and empty lines
		}

		fields := strings.Fields(line)
		if len(fields) < 6 {
			continue
		}

		// Parse sizes (remove suffix like M, G, T)
		total := parseSize(fields[1])
		used := parseSize(fields[2])
		available := parseSize(fields[3])
		usageStr := strings.TrimSuffix(fields[4], "%")
		usage, _ := strconv.ParseFloat(usageStr, 64)

		diskStats = append(diskStats, DiskStats{
			Device:     fields[0],
			Mountpoint: fields[5],
			Filesystem: fields[0],
			Total:      total,
			Used:       used,
			Available:  available,
			Usage:      usage,
		})
	}

	return diskStats
}

func parseSize(sizeStr string) uint64 {
	if sizeStr == "-" {
		return 0
	}

	multiplier := uint64(1)
	size := sizeStr

	if strings.HasSuffix(sizeStr, "K") {
		multiplier = 1024
		size = strings.TrimSuffix(sizeStr, "K")
	} else if strings.HasSuffix(sizeStr, "M") {
		multiplier = 1024 * 1024
		size = strings.TrimSuffix(sizeStr, "M")
	} else if strings.HasSuffix(sizeStr, "G") {
		multiplier = 1024 * 1024 * 1024
		size = strings.TrimSuffix(sizeStr, "G")
	} else if strings.HasSuffix(sizeStr, "T") {
		multiplier = 1024 * 1024 * 1024 * 1024
		size = strings.TrimSuffix(sizeStr, "T")
	}

	value, err := strconv.ParseFloat(size, 64)
	if err != nil {
		return 0
	}

	return uint64(value * float64(multiplier))
}

func getNetworkStats() []NetworkStats {
	data, err := ioutil.ReadFile("/proc/net/dev")
	if err != nil {
		return []NetworkStats{}
	}

	lines := strings.Split(string(data), "\n")
	networkStats := []NetworkStats{}

	for i, line := range lines {
		if i < 2 || line == "" {
			continue // Skip header lines and empty lines
		}

		parts := strings.Split(line, ":")
		if len(parts) != 2 {
			continue
		}

		interfaceName := strings.TrimSpace(parts[0])
		fields := strings.Fields(parts[1])

		if len(fields) < 16 {
			continue
		}

		rxBytes, _ := strconv.ParseUint(fields[0], 10, 64)
		rxPackets, _ := strconv.ParseUint(fields[1], 10, 64)
		txBytes, _ := strconv.ParseUint(fields[8], 10, 64)
		txPackets, _ := strconv.ParseUint(fields[9], 10, 64)

		status := "down"
		if rxBytes > 0 || txBytes > 0 {
			status = "up"
		}

		networkStats = append(networkStats, NetworkStats{
			Interface: interfaceName,
			RxBytes:   rxBytes,
			TxBytes:   txBytes,
			RxPackets: rxPackets,
			TxPackets: txPackets,
			Status:    status,
		})
	}

	return networkStats
}

func KillProcess(c *gin.Context) {
	var req struct {
		PID    int    `json:"pid"`
		Signal string `json:"signal"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	signal := req.Signal
	if signal == "" {
		signal = "TERM"
	}

	cmd := exec.Command("kill", "-"+signal, strconv.Itoa(req.PID))
	err := cmd.Run()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to kill process: %s", err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Process %d killed with signal %s", req.PID, signal),
	})
}

func SetProcessPriority(c *gin.Context) {
	var req struct {
		PID      int `json:"pid"`
		Priority int `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cmd := exec.Command("renice", strconv.Itoa(req.Priority), strconv.Itoa(req.PID))
	err := cmd.Run()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to set process priority: %s", err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Process %d priority set to %d", req.PID, req.Priority),
	})
}

func GetDetailedSystemInfo(c *gin.Context) {
	info := make(map[string]interface{})

	// Get hostname
	hostname, _ := os.Hostname()
	info["hostname"] = hostname

	// Get uptime
	uptimeData, _ := ioutil.ReadFile("/proc/uptime")
	if len(uptimeData) > 0 {
		uptimeStr := strings.Fields(string(uptimeData))[0]
		uptime, _ := strconv.ParseFloat(uptimeStr, 64)
		info["uptime"] = uptime
	}

	// Get kernel version
	unameCmd := exec.Command("uname", "-r")
	kernelOutput, _ := unameCmd.Output()
	info["kernel"] = strings.TrimSpace(string(kernelOutput))

	// Get OS info
	osInfo, _ := ioutil.ReadFile("/etc/os-release")
	info["os"] = string(osInfo)

	c.JSON(http.StatusOK, info)
}
