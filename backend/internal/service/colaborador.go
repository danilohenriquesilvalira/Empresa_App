package service

import (
	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/repository"
	"errors"
)

type ColaboradorService struct {
	colaboradorRepo *repository.ColaboradorRepository
}

func NewColaboradorService(colaboradorRepo *repository.ColaboradorRepository) *ColaboradorService {
	return &ColaboradorService{colaboradorRepo: colaboradorRepo}
}

func (s *ColaboradorService) GetByID(id int) (*model.Colaborador, error) {
	return s.colaboradorRepo.GetByID(id)
}

func (s *ColaboradorService) Update(colaborador *model.Colaborador) error {
	// Validar dados
	if colaborador.Nome == "" {
		return errors.New("nome é obrigatório")
	}

	return s.colaboradorRepo.Update(colaborador)
}

func (s *ColaboradorService) Create(colaborador *model.Colaborador) error {
	// Validar dados
	if colaborador.Nome == "" {
		return errors.New("nome é obrigatório")
	}

	if colaborador.Email == "" {
		return errors.New("email é obrigatório")
	}

	if colaborador.Senha == "" {
		return errors.New("senha é obrigatória")
	}

	return s.colaboradorRepo.Create(colaborador)
}
