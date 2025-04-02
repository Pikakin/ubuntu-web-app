package handlers

import (
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

// ExecuteCommand executes a shell command
func ExecuteCommand(c *gin.Context) {
	var request struct {
		Command string `json:"command"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cmd := exec.Command("bash", "-c", request.Command)
	output, err := cmd.CombinedOutput()
	
	// エラーが発生しても出力を返す（500エラーではなく）
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"output": string(output) + "\nError: " + err.Error(),
			"error": true,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"output": string(output),
		"error": false,
	})
}

// GetSystemInfo returns system information
func GetSystemInfo(c *gin.Context) {
	// Get hostname
	hostname, err := exec.Command("hostname").Output()
	if err != nil {
		hostname = []byte("Unknown")
	}

	// Get kernel version
	kernel, err := exec.Command("uname", "-r").Output()
	if err != nil {
		kernel = []byte("Unknown")
	}

	// Get OS info
	osInfo, err := exec.Command("lsb_release", "-d").Output()
	if err != nil {
		osInfo = []byte("Ubuntu")
	}

	c.JSON(http.StatusOK, gin.H{
		"hostname": string(hostname),
		"kernel":   string(kernel),
		"os":       string(osInfo),
		"info": string(hostname) + "\n" + string(kernel) + "\n" + string(osInfo),
	})
}
