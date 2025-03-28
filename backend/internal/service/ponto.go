package service

import (
	"encoding/json"
	"errors"
	"time"

	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/repository"
)

type PontoService struct {
	pontoRepo *repository.PontoRepository
}

func NewPontoService(pontoRepo *repository.PontoRepository) *PontoService {
	return &PontoService{pontoRepo: pontoRepo}
}

func (s *PontoService) Registrar(ponto *model.RegistroPonto) error {
	// Validar tipo
	tiposValidos := map[string]bool{
		"entrada":          true,
		"saida":            true,
		"intervalo_inicio": true,
		"intervalo_fim":    true,
	}

	if !tiposValidos[ponto.Tipo] {
		return errors.New("tipo de registro inválido")
	}

	// Definir data/hora se não fornecida
	if ponto.DataHora.IsZero() {
		ponto.DataHora = time.Now()
	}

	return s.pontoRepo.Registrar(ponto)
}

func (s *PontoService) Listar(colaboradorID int, data time.Time) ([]*model.RegistroPonto, error) {
	// Se data não for fornecida, usar data atual
	if data.IsZero() {
		data = time.Now()
	}

	return s.pontoRepo.Listar(colaboradorID, data)
}

func (s *PontoService) ParseLocalizacao(localizacaoJSON string) ([]byte, error) {
	if localizacaoJSON == "" {
		return nil, nil
	}

	// Verificar se o JSON é válido
	var loc map[string]interface{}
	if err := json.Unmarshal([]byte(localizacaoJSON), &loc); err != nil {
		return nil, err
	}

	return []byte(localizacaoJSON), nil
}
