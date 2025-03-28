package service

import (
	"empresa-app/backend/internal/model"
	"empresa-app/backend/internal/repository"
	"errors"

	"golang.org/x/crypto/bcrypt"
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

// AlterarSenha altera a senha do colaborador
func (s *ColaboradorService) AlterarSenha(id int, senhaAtual, novaSenha string) error {
	// Validar tamanho da senha
	if len(novaSenha) < 6 {
		return errors.New("nova senha deve ter pelo menos 6 caracteres")
	}

	// Obter colaborador com senha
	// Como não existe GetByIDWithPassword, vamos usar GetByID e depois buscar a senha
	colaborador, err := s.colaboradorRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Como o repositório não tem o método para verificar senha diretamente,
	// vamos buscar novamente o colaborador pelo email para obter a senha
	colaboradorComSenha, err := s.colaboradorRepo.GetByEmail(colaborador.Email)
	if err != nil {
		return err
	}

	// Verificar senha atual
	if !s.colaboradorRepo.VerifyPassword(colaboradorComSenha.Senha, senhaAtual) {
		return errors.New("senha atual incorreta")
	}

	// Hash da nova senha
	hashedSenha, err := bcrypt.GenerateFromPassword([]byte(novaSenha), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Como não existe UpdatePassword, vamos usar Update para atualizar o colaborador completo
	colaborador.Senha = string(hashedSenha)
	return s.colaboradorRepo.Update(colaborador)
}
