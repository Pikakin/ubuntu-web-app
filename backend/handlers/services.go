package handlers

import (
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

// ListServices returns a list of system services
func ListServices(c *gin.Context) {
	cmd := exec.Command("bash", "-c", "systemctl list-units --type=service")
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"services": string(output),
	})
}

// GetServiceStatus returns the status of a specific service
func GetServiceStatus(c *gin.Context) {
	service := c.Param("service")
	cmd := exec.Command("bash", "-c", "systemctl status "+service)
	output, err := cmd.CombinedOutput()
	
	// エラーチェックを追加
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
			"status": string(output),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": string(output),
	})
}

// ControlService starts, stops or restarts a service
func ControlService(c *gin.Context) {
	var request struct {
		Service string `json:"service"`
		Action  string `json:"action"` // start, stop, restart
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// アクションの検証
	if request.Action != "start" && request.Action != "stop" && request.Action != "restart" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	cmd := exec.Command("bash", "-c", "systemctl "+request.Action+" "+request.Service)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  err.Error(),
			"output": string(output),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service " + request.Action + " command executed",
		"output":  string(output),
	})
}
