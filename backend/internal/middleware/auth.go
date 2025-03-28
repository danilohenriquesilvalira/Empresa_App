package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"empresa-app/backend/internal/service"
)

var authService *service.AuthService

func SetAuthService(svc *service.AuthService) {
	authService = svc
}

func AuthMiddleware() gin.HandlerFunc {
	if authService == nil {
		panic("AuthService não foi configurado para o middleware")
	}

	return func(c *gin.Context) {
		// Obter token do cabeçalho
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
			c.Abort()
			return
		}

		// Extrair token do cabeçalho "Bearer {token}"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		token := tokenParts[1]
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
			c.Abort()
			return
		}

		// Validar token
		claims, err := authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido: " + err.Error()})
			c.Abort()
			return
		}

		// Obter ID do usuário e cargo do token
		userID, ok := claims["id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido: ID não encontrado"})
			c.Abort()
			return
		}

		cargoID, ok := claims["cargo_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido: Cargo não encontrado"})
			c.Abort()
			return
		}

		// Armazenar dados no contexto
		c.Set("colaborador_id", int(userID))
		c.Set("cargo_id", int(cargoID))

		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin (cargo 2, 5 ou 6)
		cargoID, exists := c.Get("cargo_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
			c.Abort()
			return
		}

		isAdmin := cargoID.(int) == 2 || cargoID.(int) == 5 || cargoID.(int) == 6
		if !isAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão de administrador"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func CurrentUser(c *gin.Context) (int, error) {
	userID, exists := c.Get("colaborador_id")
	if !exists {
		return 0, errors.New("usuário não autenticado")
	}
	return userID.(int), nil
}
