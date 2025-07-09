package handlers

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type ContainerInfo struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	State       string            `json:"state"`
	Created     string            `json:"created"`
	Ports       []string          `json:"ports"`
	Mounts      []string          `json:"mounts"`
	Labels      map[string]string `json:"labels"`
	NetworkMode string            `json:"network_mode"`
	IPAddress   string            `json:"ip_address"`
	Size        string            `json:"size"`
}

type ImageInfo struct {
	ID          string   `json:"id"`
	Repository  string   `json:"repository"`
	Tag         string   `json:"tag"`
	Size        string   `json:"size"`
	Created     string   `json:"created"`
	VirtualSize string   `json:"virtual_size"`
	Labels      []string `json:"labels"`
}

type NetworkInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Driver   string `json:"driver"`
	Scope    string `json:"scope"`
	Internal bool   `json:"internal"`
	Gateway  string `json:"gateway"`
	Subnet   string `json:"subnet"`
}

type VolumeInfo struct {
	Name       string `json:"name"`
	Driver     string `json:"driver"`
	Mountpoint string `json:"mountpoint"`
	Labels     string `json:"labels"`
	Size       string `json:"size"`
}

type ContainerStats struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	CPUPerc   string  `json:"cpu_perc"`
	MemUsage  string  `json:"mem_usage"`
	MemPerc   string  `json:"mem_perc"`
	NetIO     string  `json:"net_io"`
	BlockIO   string  `json:"block_io"`
	PIDs      string  `json:"pids"`
}

type DockerComposeProject struct {
	Name        string            `json:"name"`
	Path        string            `json:"path"`
	Services    []string          `json:"services"`
	Status      string            `json:"status"`
	Containers  []ContainerInfo   `json:"containers"`
	Networks    []string          `json:"networks"`
	Volumes     []string          `json:"volumes"`
}

// ListContainers returns all containers
func ListContainers(c *gin.Context) {
	cmd := exec.Command("docker", "ps", "-a", "--format", "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.State}}\t{{.CreatedAt}}\t{{.Ports}}\t{{.Mounts}}\t{{.Labels}}\t{{.Networks}}\t{{.Size}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list containers: " + err.Error()})
		return
	}

	var containers []ContainerInfo
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 8 {
			labels := make(map[string]string)
			if len(parts) > 8 && parts[8] != "" {
				labelPairs := strings.Split(parts[8], ",")
				for _, pair := range labelPairs {
					if kv := strings.SplitN(pair, "=", 2); len(kv) == 2 {
						labels[kv[0]] = kv[1]
					}
				}
			}

			container := ContainerInfo{
				ID:          parts[0],
				Name:        parts[1],
				Image:       parts[2],
				Status:      parts[3],
				State:       parts[4],
				Created:     parts[5],
				Ports:       strings.Split(parts[6], ","),
				Mounts:      strings.Split(parts[7], ","),
				Labels:      labels,
				NetworkMode: parts[9],
				Size:        parts[10],
			}
			containers = append(containers, container)
		}
	}

	c.JSON(http.StatusOK, containers)
}

// GetContainer returns detailed information about a specific container
func GetContainer(c *gin.Context) {
	containerID := c.Param("id")
	
	cmd := exec.Command("docker", "inspect", containerID)
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
		return
	}

	var inspectData []interface{}
	if err := json.Unmarshal(output, &inspectData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse container data"})
		return
	}

	c.JSON(http.StatusOK, inspectData[0])
}

// StartContainer starts a container
func StartContainer(c *gin.Context) {
	containerID := c.Param("id")
	
	cmd := exec.Command("docker", "start", containerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container started successfully"})
}

// StopContainer stops a container
func StopContainer(c *gin.Context) {
	containerID := c.Param("id")
	
	cmd := exec.Command("docker", "stop", containerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container stopped successfully"})
}

// RestartContainer restarts a container
func RestartContainer(c *gin.Context) {
	containerID := c.Param("id")
	
	cmd := exec.Command("docker", "restart", containerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restart container: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container restarted successfully"})
}

// DeleteContainer removes a container
func DeleteContainer(c *gin.Context) {
	containerID := c.Param("id")
	
	cmd := exec.Command("docker", "rm", "-f", containerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete container: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container deleted successfully"})
}

// ListImages returns all images
func ListImages(c *gin.Context) {
	cmd := exec.Command("docker", "images", "--format", "{{.ID}}\t{{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list images: " + err.Error()})
		return
	}

	var images []ImageInfo
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 5 {
			image := ImageInfo{
				ID:         parts[0],
				Repository: parts[1],
				Tag:        parts[2],
				Size:       parts[3],
				Created:    parts[4],
			}
			images = append(images, image)
		}
	}

	c.JSON(http.StatusOK, images)
}

// PullImage pulls an image
func PullImage(c *gin.Context) {
	var request struct {
		Image string `json:"image"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cmd := exec.Command("docker", "pull", request.Image)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pull image: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image pulled successfully", "output": string(output)})
}

// DeleteImage removes an image
func DeleteImage(c *gin.Context) {
	imageID := c.Param("id")
	
	cmd := exec.Command("docker", "rmi", "-f", imageID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

// ListNetworks returns all networks
func ListNetworks(c *gin.Context) {
	cmd := exec.Command("docker", "network", "ls", "--format", "{{.ID}}\t{{.Name}}\t{{.Driver}}\t{{.Scope}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list networks: " + err.Error()})
		return
	}

	var networks []NetworkInfo
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 4 {
			network := NetworkInfo{
				ID:     parts[0],
				Name:   parts[1],
				Driver: parts[2],
				Scope:  parts[3],
			}
			networks = append(networks, network)
		}
	}

	c.JSON(http.StatusOK, networks)
}

// CreateNetwork creates a new network
func CreateNetwork(c *gin.Context) {
	var request struct {
		Name   string `json:"name"`
		Driver string `json:"driver"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	args := []string{"network", "create"}
	if request.Driver != "" {
		args = append(args, "--driver", request.Driver)
	}
	args = append(args, request.Name)

	cmd := exec.Command("docker", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create network: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Network created successfully", "id": strings.TrimSpace(string(output))})
}

// DeleteNetwork removes a network
func DeleteNetwork(c *gin.Context) {
	networkID := c.Param("id")
	
	cmd := exec.Command("docker", "network", "rm", networkID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete network: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Network deleted successfully"})
}

// ListVolumes returns all volumes
func ListVolumes(c *gin.Context) {
	cmd := exec.Command("docker", "volume", "ls", "--format", "{{.Name}}\t{{.Driver}}\t{{.Mountpoint}}\t{{.Labels}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list volumes: " + err.Error()})
		return
	}

	var volumes []VolumeInfo
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 4 {
			volume := VolumeInfo{
				Name:       parts[0],
				Driver:     parts[1],
				Mountpoint: parts[2],
				Labels:     parts[3],
			}
			volumes = append(volumes, volume)
		}
	}

	c.JSON(http.StatusOK, volumes)
}

// CreateVolume creates a new volume
func CreateVolume(c *gin.Context) {
	var request struct {
		Name   string `json:"name"`
		Driver string `json:"driver"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	args := []string{"volume", "create"}
	if request.Driver != "" {
		args = append(args, "--driver", request.Driver)
	}
	args = append(args, request.Name)

	cmd := exec.Command("docker", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create volume: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Volume created successfully", "name": strings.TrimSpace(string(output))})
}

// DeleteVolume removes a volume
func DeleteVolume(c *gin.Context) {
	volumeName := c.Param("name")
	
	cmd := exec.Command("docker", "volume", "rm", volumeName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete volume: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Volume deleted successfully"})
}

// GetContainerStats returns container statistics
func GetContainerStats(c *gin.Context) {
	cmd := exec.Command("docker", "stats", "--no-stream", "--format", "{{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}\t{{.PIDs}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get container stats: " + err.Error()})
		return
	}

	var stats []ContainerStats
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 8 {
			stat := ContainerStats{
				ID:       parts[0],
				Name:     parts[1],
				CPUPerc:  parts[2],
				MemUsage: parts[3],
				MemPerc:  parts[4],
				NetIO:    parts[5],
				BlockIO:  parts[6],
				PIDs:     parts[7],
			}
			stats = append(stats, stat)
		}
	}

	c.JSON(http.StatusOK, stats)
}

// CreateContainer creates a new container
func CreateContainer(c *gin.Context) {
	var request struct {
		Name        string            `json:"name"`
		Image       string            `json:"image"`
		Command     string            `json:"command"`
		Ports       []string          `json:"ports"`
		Volumes     []string          `json:"volumes"`
		Environment []string          `json:"environment"`
		Network     string            `json:"network"`
		AutoRestart bool              `json:"auto_restart"`
		Labels      map[string]string `json:"labels"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	args := []string{"run", "-d"}
	
	if request.Name != "" {
		args = append(args, "--name", request.Name)
	}
	
	for _, port := range request.Ports {
		args = append(args, "-p", port)
	}
	
	for _, volume := range request.Volumes {
		args = append(args, "-v", volume)
	}
	
	for _, env := range request.Environment {
		args = append(args, "-e", env)
	}
	
	if request.Network != "" {
		args = append(args, "--network", request.Network)
	}
	
	if request.AutoRestart {
		args = append(args, "--restart", "always")
	}
	
	for key, value := range request.Labels {
		args = append(args, "--label", fmt.Sprintf("%s=%s", key, value))
	}
	
	args = append(args, request.Image)
	
	if request.Command != "" {
		args = append(args, strings.Fields(request.Command)...)
	}

	cmd := exec.Command("docker", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create container: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container created successfully", "id": strings.TrimSpace(string(output))})
}

// GetContainerLogs returns container logs
func GetContainerLogs(c *gin.Context) {
	containerID := c.Param("id")
	
	tail := c.DefaultQuery("tail", "100")
	follow := c.DefaultQuery("follow", "false")
	
	args := []string{"logs", "--tail", tail}
	if follow == "true" {
		args = append(args, "-f")
	}
	args = append(args, containerID)

	cmd := exec.Command("docker", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get container logs: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": string(output)})
}

// StreamContainerLogs streams container logs via WebSocket
func StreamContainerLogs(c *gin.Context) {
	containerID := c.Param("id")
	
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade to websocket: %v", err)
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "logs", "-f", containerID)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Error: "+err.Error()))
		return
	}

	if err := cmd.Start(); err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Error: "+err.Error()))
		return
	}

	go func() {
		defer cancel()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			line := scanner.Text()
			if err := conn.WriteMessage(websocket.TextMessage, []byte(line)); err != nil {
				return
			}
		}
	}
}

// ListDockerComposeProjects lists Docker Compose projects
func ListDockerComposeProjects(c *gin.Context) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get home directory"})
		return
	}

	var projects []DockerComposeProject
	
	// Search for docker-compose.yml files
	searchPaths := []string{
		homeDir,
		"/opt",
		"/var/lib/docker/compose",
	}

	for _, searchPath := range searchPaths {
		filepath.Walk(searchPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil
			}
			
			if info.Name() == "docker-compose.yml" || info.Name() == "docker-compose.yaml" {
				project := DockerComposeProject{
					Name: filepath.Base(filepath.Dir(path)),
					Path: path,
				}
				
				// Get project status
				cmd := exec.Command("docker", "compose", "-f", path, "ps", "--format", "json")
				if output, err := cmd.Output(); err == nil {
					var containers []interface{}
					if json.Unmarshal(output, &containers) == nil {
						project.Status = "running"
					}
				}
				
				projects = append(projects, project)
			}
			
			return nil
		})
	}

	c.JSON(http.StatusOK, projects)
}

// GetDockerComposeProject returns details of a specific project
func GetDockerComposeProject(c *gin.Context) {
	projectPath := c.Query("path")
	if projectPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project path is required"})
		return
	}

	// Read docker-compose.yml content
	content, err := os.ReadFile(projectPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project file not found"})
		return
	}

	// Get project status
	cmd := exec.Command("docker", "compose", "-f", projectPath, "ps", "--format", "json")
	psOutput, _ := cmd.Output()

	var containers []interface{}
	json.Unmarshal(psOutput, &containers)

	project := DockerComposeProject{
		Name:       filepath.Base(filepath.Dir(projectPath)),
		Path:       projectPath,
		Containers: []ContainerInfo{},
	}

	c.JSON(http.StatusOK, gin.H{
		"project":  project,
		"content":  string(content),
		"containers": containers,
	})
}

// SaveDockerComposeProject saves docker-compose.yml content
func SaveDockerComposeProject(c *gin.Context) {
	var request struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := os.WriteFile(request.Path, []byte(request.Content), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project saved successfully"})
}

// DockerComposeUp starts a Docker Compose project
func DockerComposeUp(c *gin.Context) {
	projectPath := c.Query("path")
	if projectPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project path is required"})
		return
	}

	cmd := exec.Command("docker", "compose", "-f", projectPath, "up", "-d")
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start project: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project started successfully", "output": string(output)})
}

// DockerComposeDown stops a Docker Compose project
func DockerComposeDown(c *gin.Context) {
	projectPath := c.Query("path")
	if projectPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project path is required"})
		return
	}

	cmd := exec.Command("docker", "compose", "-f", projectPath, "down")
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop project: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project stopped successfully", "output": string(output)})
}

// DockerComposeRestart restarts a Docker Compose project
func DockerComposeRestart(c *gin.Context) {
	projectPath := c.Query("path")
	if projectPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project path is required"})
		return
	}

	cmd := exec.Command("docker", "compose", "-f", projectPath, "restart")
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restart project: " + string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project restarted successfully", "output": string(output)})
}

// DockerCleanup cleans up unused resources
func DockerCleanup(c *gin.Context) {
	var results = make(map[string]interface{})
	
	// Clean up containers
	cmd := exec.Command("docker", "container", "prune", "-f")
	output, err := cmd.CombinedOutput()
	if err != nil {
		results["containers"] = "Error: " + string(output)
	} else {
		results["containers"] = string(output)
	}
	
	// Clean up images
	cmd = exec.Command("docker", "image", "prune", "-f")
	output, err = cmd.CombinedOutput()
	if err != nil {
		results["images"] = "Error: " + string(output)
	} else {
		results["images"] = string(output)
	}
	
	// Clean up networks
	cmd = exec.Command("docker", "network", "prune", "-f")
	output, err = cmd.CombinedOutput()
	if err != nil {
		results["networks"] = "Error: " + string(output)
	} else {
		results["networks"] = string(output)
	}
	
	// Clean up volumes
	cmd = exec.Command("docker", "volume", "prune", "-f")
	output, err = cmd.CombinedOutput()
	if err != nil {
		results["volumes"] = "Error: " + string(output)
	} else {
		results["volumes"] = string(output)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cleanup completed", "results": results})
}

// GetDockerInfo returns Docker system information
func GetDockerInfo(c *gin.Context) {
	cmd := exec.Command("docker", "info", "--format", "{{json .}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Docker info: " + err.Error()})
		return
	}

	var info interface{}
	if err := json.Unmarshal(output, &info); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Docker info"})
		return
	}

	c.JSON(http.StatusOK, info)
}

// GetDockerVersion returns Docker version information
func GetDockerVersion(c *gin.Context) {
	cmd := exec.Command("docker", "version", "--format", "{{json .}}")
	output, err := cmd.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Docker version: " + err.Error()})
		return
	}

	var version interface{}
	if err := json.Unmarshal(output, &version); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Docker version"})
		return
	}

	c.JSON(http.StatusOK, version)
}
