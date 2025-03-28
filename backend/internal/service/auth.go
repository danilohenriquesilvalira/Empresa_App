package service

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/repository"
)

type AuthService struct {
	colaboradorRepo *repository.ColaboradorRepository
}

func NewAuthService(colaboradorRepo *repository.ColaboradorRepository) *AuthService {
	return &AuthService{colaboradorRepo: colaboradorRepo}
}

func (s *AuthService) Login(email, senha string) (*model.LoginResponse, error) {
	colaborador, err := s.colaboradorRepo.GetByEmail(email)
	if err != nil {
		return nil, errors.New("credenciais inválidas")
	}

	// Verificar senha
	if !s.colaboradorRepo.VerifyPassword(colaborador.Senha, senha) {
		return nil, errors.New("credenciais inválidas")
	}

	// Remover senha para não retornar no JSON
	colaborador.Senha = ""

	// Gerar token JWT
	token, err := s.GenerateToken(colaborador.ID, colaborador.CargoID)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		Token: token,
		User:  colaborador,
	}, nil
}

func (s *AuthService) GenerateToken(userID, cargoID int) (string, error) {
	// Obter chave secreta de JWT
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "seu_segredo_jwt_aqui" // Apenas para desenvolvimento
	}

	// Definir tempo de expiração do token
	expirationTime := time.Now().Add(24 * time.Hour)

	// Criar claims
	claims := jwt.MapClaims{
		"id":       userID,
		"cargo_id": cargoID,
		"exp":      expirationTime.Unix(),
	}

	// Criar token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Assinar token
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *AuthService) ValidateToken(tokenString string) (map[string]interface{}, error) {
	// Obter chave secreta de JWT
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "seu_segredo_jwt_aqui" // Apenas para desenvolvimento
	}

	// Analisar token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validar algoritmo de assinatura
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de assinatura inválido")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Verificar se token é válido
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token inválido")
}
