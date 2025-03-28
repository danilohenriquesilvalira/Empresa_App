package config

import (
	"os"
	"strconv"
)

// Config contém todas as configurações da aplicação
type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	Auth     AuthConfig
	Storage  StorageConfig
}

// DatabaseConfig contém as configurações do banco de dados
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

// ServerConfig contém as configurações do servidor HTTP
type ServerConfig struct {
	Port         string
	ReadTimeout  int
	WriteTimeout int
	IdleTimeout  int
}

// AuthConfig contém as configurações de autenticação
type AuthConfig struct {
	JWTSecret         string
	TokenExpiration   int
	RefreshSecret     string
	RefreshExpiration int
}

// StorageConfig contém as configurações de armazenamento de arquivos
type StorageConfig struct {
	UploadDir    string
	MaxFileSize  int64
	AllowedTypes []string
}

// Load carrega todas as configurações do ambiente
func Load() *Config {
	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			Name:     getEnv("DB_NAME", "empresa_app"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			ReadTimeout:  getEnvAsInt("SERVER_READ_TIMEOUT", 15),
			WriteTimeout: getEnvAsInt("SERVER_WRITE_TIMEOUT", 15),
			IdleTimeout:  getEnvAsInt("SERVER_IDLE_TIMEOUT", 60),
		},
		Auth: AuthConfig{
			JWTSecret:         getEnv("JWT_SECRET", "seu_segredo_jwt_aqui"),
			TokenExpiration:   getEnvAsInt("TOKEN_EXPIRATION", 24),
			RefreshSecret:     getEnv("REFRESH_SECRET", "seu_segredo_refresh_aqui"),
			RefreshExpiration: getEnvAsInt("REFRESH_EXPIRATION", 168),
		},
		Storage: StorageConfig{
			UploadDir:   getEnv("UPLOAD_DIR", "uploads"),
			MaxFileSize: getEnvAsInt64("MAX_FILE_SIZE", 10*1024*1024),
			AllowedTypes: []string{
				"application/pdf",
				"image/jpeg",
				"image/png",
			},
		},
	}
}

// Helpers para obter variáveis de ambiente
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseInt(valueStr, 10, 64); err == nil {
		return value
	}
	return defaultValue
}
