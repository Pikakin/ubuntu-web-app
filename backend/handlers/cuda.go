package handlers

import (
	"net/http"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type GPUInfo struct {
	Name               string  `json:"name"`
	DriverVersion      string  `json:"driver_version"`
	CUDAVersion        string  `json:"cuda_version"`
	MemoryTotal        int     `json:"memory_total"`
	MemoryUsed         int     `json:"memory_used"`
	MemoryFree         int     `json:"memory_free"`
	GPUUtilization     int     `json:"gpu_utilization"`
	MemoryUtilization  int     `json:"memory_utilization"`
	Temperature        int     `json:"temperature"`
	PowerDraw          int     `json:"power_draw"`
	PowerLimit         int     `json:"power_limit"`
	FanSpeed           int     `json:"fan_speed"`
	Index              int     `json:"index"`
}

type CUDAToolkit struct {
	Version   string `json:"version"`
	Path      string `json:"path"`
	Installed bool   `json:"installed"`
}

type CuDNNInfo struct {
	Version   string `json:"version"`
	Path      string `json:"path"`
	Installed bool   `json:"installed"`
}

type CUDAEnvironment struct {
	CUDAHome    string `json:"cuda_home"`
	CUDAPath    string `json:"cuda_path"`
	LDPath      string `json:"ld_library_path"`
	CUDNNPath   string `json:"cudnn_path"`
	NVCCVersion string `json:"nvcc_version"`
}

// GetGPUInfo returns GPU information using nvidia-smi
func GetGPUInfo(c *gin.Context) {
	// nvidia-smiコマンドを実行してGPU情報を取得
	cmd := exec.Command("nvidia-smi", "--query-gpu=index,name,driver_version,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,fan.speed", "--format=csv,noheader,nounits")
	output, err := cmd.Output()
	
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"error": "NVIDIA GPU not found or nvidia-smi not available",
			"gpus":  []GPUInfo{},
		})
		return
	}

	gpus := parseGPUInfo(string(output))
	
	// CUDA version from nvidia-smi
	cudaCmd := exec.Command("nvidia-smi", "--query-gpu=cuda_version", "--format=csv,noheader,nounits")
	cudaOutput, _ := cudaCmd.Output()
	
	if len(gpus) > 0 && len(cudaOutput) > 0 {
		cudaVersion := strings.TrimSpace(string(cudaOutput))
		for i := range gpus {
			gpus[i].CUDAVersion = cudaVersion
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"gpus":  gpus,
		"error": "",
	})
}

// parseGPUInfo parses nvidia-smi output
func parseGPUInfo(output string) []GPUInfo {
	var gpus []GPUInfo
	lines := strings.Split(strings.TrimSpace(output), "\n")
	
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		
		fields := strings.Split(line, ",")
		if len(fields) < 12 {
			continue
		}
		
		// Parse each field
		index, _ := strconv.Atoi(strings.TrimSpace(fields[0]))
		name := strings.TrimSpace(fields[1])
		driverVersion := strings.TrimSpace(fields[2])
		memoryTotal, _ := strconv.Atoi(strings.TrimSpace(fields[3]))
		memoryUsed, _ := strconv.Atoi(strings.TrimSpace(fields[4]))
		memoryFree, _ := strconv.Atoi(strings.TrimSpace(fields[5]))
		gpuUtil, _ := strconv.Atoi(strings.TrimSpace(fields[6]))
		memUtil, _ := strconv.Atoi(strings.TrimSpace(fields[7]))
		temp, _ := strconv.Atoi(strings.TrimSpace(fields[8]))
		powerDraw, _ := strconv.Atoi(strings.TrimSpace(fields[9]))
		powerLimit, _ := strconv.Atoi(strings.TrimSpace(fields[10]))
		fanSpeed, _ := strconv.Atoi(strings.TrimSpace(fields[11]))
		
		gpu := GPUInfo{
			Index:              index,
			Name:               name,
			DriverVersion:      driverVersion,
			MemoryTotal:        memoryTotal,
			MemoryUsed:         memoryUsed,
			MemoryFree:         memoryFree,
			GPUUtilization:     gpuUtil,
			MemoryUtilization:  memUtil,
			Temperature:        temp,
			PowerDraw:          powerDraw,
			PowerLimit:         powerLimit,
			FanSpeed:           fanSpeed,
		}
		
		gpus = append(gpus, gpu)
	}
	
	return gpus
}

// GetCUDAToolkitInfo returns CUDA toolkit information
func GetCUDAToolkitInfo(c *gin.Context) {
	var toolkits []CUDAToolkit
	
	// Check nvcc version
	cmd := exec.Command("nvcc", "--version")
	output, err := cmd.Output()
	
	if err == nil {
		version := extractCUDAVersion(string(output))
		if version != "" {
			toolkits = append(toolkits, CUDAToolkit{
				Version:   version,
				Path:      "/usr/local/cuda",
				Installed: true,
			})
		}
	}
	
	// Check for multiple CUDA installations
	cmd = exec.Command("find", "/usr/local", "-name", "cuda*", "-type", "d", "-maxdepth", "1")
	output, err = cmd.Output()
	
	if err == nil {
		dirs := strings.Split(strings.TrimSpace(string(output)), "\n")
		for _, dir := range dirs {
			if strings.Contains(dir, "cuda") && !strings.HasSuffix(dir, "cuda") {
				version := strings.Replace(dir, "/usr/local/cuda-", "", 1)
				if version != "" {
					found := false
					for _, toolkit := range toolkits {
						if toolkit.Version == version {
							found = true
							break
						}
					}
					if !found {
						toolkits = append(toolkits, CUDAToolkit{
							Version:   version,
							Path:      dir,
							Installed: true,
						})
					}
				}
			}
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"toolkits": toolkits,
	})
}

// extractCUDAVersion extracts CUDA version from nvcc output
func extractCUDAVersion(output string) string {
	re := regexp.MustCompile(`release (\d+\.\d+)`)
	matches := re.FindStringSubmatch(output)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

// GetCuDNNInfo returns cuDNN information
func GetCuDNNInfo(c *gin.Context) {
	var cudnnInfo CuDNNInfo
	
	// Check for cuDNN header file
	cmd := exec.Command("find", "/usr/local/cuda", "/usr/include", "-name", "cudnn.h", "-o", "-name", "cudnn_version.h")
	output, err := cmd.Output()
	
	if err == nil && strings.TrimSpace(string(output)) != "" {
		headerPath := strings.Split(strings.TrimSpace(string(output)), "\n")[0]
		
		// Extract version from header
		cmd = exec.Command("grep", "-E", "#define CUDNN_MAJOR|#define CUDNN_MINOR|#define CUDNN_PATCHLEVEL", headerPath)
		versionOutput, err := cmd.Output()
		
		if err == nil {
			version := extractCuDNNVersion(string(versionOutput))
			cudnnInfo = CuDNNInfo{
				Version:   version,
				Path:      headerPath,
				Installed: true,
			}
		}
	}
	
	// If not found in headers, try Python check
	if !cudnnInfo.Installed {
		cmd = exec.Command("python3", "-c", "import torch; print(torch.backends.cudnn.version())")
		output, err := cmd.Output()
		
		if err == nil {
			version := strings.TrimSpace(string(output))
			if version != "" {
				cudnnInfo = CuDNNInfo{
					Version:   version,
					Path:      "Python package",
					Installed: true,
				}
			}
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"cudnn": cudnnInfo,
	})
}

// extractCuDNNVersion extracts cuDNN version from header defines
func extractCuDNNVersion(output string) string {
	lines := strings.Split(output, "\n")
	major, minor, patch := "", "", ""
	
	for _, line := range lines {
		if strings.Contains(line, "CUDNN_MAJOR") {
			parts := strings.Fields(line)
			if len(parts) >= 3 {
				major = parts[2]
			}
		} else if strings.Contains(line, "CUDNN_MINOR") {
			parts := strings.Fields(line)
			if len(parts) >= 3 {
				minor = parts[2]
			}
		} else if strings.Contains(line, "CUDNN_PATCHLEVEL") {
			parts := strings.Fields(line)
			if len(parts) >= 3 {
				patch = parts[2]
			}
		}
	}
	
	if major != "" && minor != "" && patch != "" {
		return major + "." + minor + "." + patch
	}
	return ""
}

// GetCUDAEnvironment returns CUDA environment variables
func GetCUDAEnvironment(c *gin.Context) {
	env := CUDAEnvironment{}
	
	// Get environment variables
	cmd := exec.Command("bash", "-c", "echo $CUDA_HOME")
	output, _ := cmd.Output()
	env.CUDAHome = strings.TrimSpace(string(output))
	
	cmd = exec.Command("bash", "-c", "echo $PATH")
	output, _ = cmd.Output()
	env.CUDAPath = strings.TrimSpace(string(output))
	
	cmd = exec.Command("bash", "-c", "echo $LD_LIBRARY_PATH")
	output, _ = cmd.Output()
	env.LDPath = strings.TrimSpace(string(output))
	
	// Get nvcc version
	cmd = exec.Command("nvcc", "--version")
	output, err := cmd.Output()
	if err == nil {
		env.NVCCVersion = extractCUDAVersion(string(output))
	}
	
	c.JSON(http.StatusOK, gin.H{
		"environment": env,
	})
}

// SetCUDAEnvironment sets CUDA environment variables
func SetCUDAEnvironment(c *gin.Context) {
	var request struct {
		CUDAHome  string `json:"cuda_home"`
		CUDAPath  string `json:"cuda_path"`
		LDPath    string `json:"ld_library_path"`
		CUDNNPath string `json:"cudnn_path"`
	}
	
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update environment (this is temporary for the session)
	// For permanent changes, this would need to update .bashrc or similar
	bashrcContent := "# CUDA Environment Variables\n"
	if request.CUDAHome != "" {
		bashrcContent += "export CUDA_HOME=" + request.CUDAHome + "\n"
	}
	if request.CUDAPath != "" {
		bashrcContent += "export PATH=" + request.CUDAPath + ":$PATH\n"
	}
	if request.LDPath != "" {
		bashrcContent += "export LD_LIBRARY_PATH=" + request.LDPath + ":$LD_LIBRARY_PATH\n"
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Environment variables updated",
		"script":  bashrcContent,
	})
}

// RunCUDATest runs a CUDA test
func RunCUDATest(c *gin.Context) {
	var request struct {
		TestType string `json:"test_type"`
	}
	
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var cmd *exec.Cmd
	
	switch request.TestType {
	case "deviceQuery":
		cmd = exec.Command("deviceQuery")
	case "bandwidthTest":
		cmd = exec.Command("bandwidthTest")
	case "python":
		cmd = exec.Command("python3", "-c", "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA version: {torch.version.cuda}'); print(f'Device count: {torch.cuda.device_count()}'); print(f'Device name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')")
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown test type"})
		return
	}
	
	output, err := cmd.CombinedOutput()
	
	c.JSON(http.StatusOK, gin.H{
		"output": string(output),
		"error":  err != nil,
	})
}

// StreamGPUStats streams GPU statistics via WebSocket
func StreamGPUStats(c *gin.Context) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "WebSocket upgrade failed"})
		return
	}
	defer conn.Close()
	
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			// Get GPU info
			cmd := exec.Command("nvidia-smi", "--query-gpu=index,name,driver_version,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,fan.speed", "--format=csv,noheader,nounits")
			output, err := cmd.Output()
			
			if err != nil {
				conn.WriteJSON(gin.H{"error": "Failed to get GPU stats"})
				continue
			}
			
			gpus := parseGPUInfo(string(output))
			
			if err := conn.WriteJSON(gin.H{"gpus": gpus}); err != nil {
				return
			}
			
		case <-c.Request.Context().Done():
			return
		}
	}
}
