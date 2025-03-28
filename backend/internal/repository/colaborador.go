package repository

import (
	"database/sql"
	"errors"

	"golang.org/x/crypto/bcrypt"

	"empresa-app/backend/internal/model"
)

type ColaboradorRepository struct {
	db *sql.DB
}

func NewColaboradorRepository(db *sql.DB) *ColaboradorRepository {
	return &ColaboradorRepository{db: db}
}

func (r *ColaboradorRepository) GetByID(id int) (*model.Colaborador, error) {
	query := `
		SELECT id, uuid, nome, email, cargo_id, data_admissao, status, 
		       foto_perfil, telefone, dados_bancarios, criado_em, atualizado_em
		FROM usuarios
		WHERE id = $1
	`

	colaborador := &model.Colaborador{}
	err := r.db.QueryRow(query, id).Scan(
		&colaborador.ID,
		&colaborador.UUID,
		&colaborador.Nome,
		&colaborador.Email,
		&colaborador.CargoID,
		&colaborador.DataAdmissao,
		&colaborador.Status,
		&colaborador.FotoPerfil,
		&colaborador.Telefone,
		&colaborador.DadosBancarios,
		&colaborador.CriadoEm,
		&colaborador.AtualizadoEm,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("colaborador não encontrado")
		}
		return nil, err
	}

	return colaborador, nil
}

func (r *ColaboradorRepository) GetByEmail(email string) (*model.Colaborador, error) {
	query := `
		SELECT id, uuid, nome, email, senha, cargo_id, data_admissao, status, 
		       foto_perfil, telefone, dados_bancarios, criado_em, atualizado_em
		FROM usuarios
		WHERE email = $1
	`

	colaborador := &model.Colaborador{}
	err := r.db.QueryRow(query, email).Scan(
		&colaborador.ID,
		&colaborador.UUID,
		&colaborador.Nome,
		&colaborador.Email,
		&colaborador.Senha,
		&colaborador.CargoID,
		&colaborador.DataAdmissao,
		&colaborador.Status,
		&colaborador.FotoPerfil,
		&colaborador.Telefone,
		&colaborador.DadosBancarios,
		&colaborador.CriadoEm,
		&colaborador.AtualizadoEm,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("colaborador não encontrado")
		}
		return nil, err
	}

	return colaborador, nil
}

func (r *ColaboradorRepository) Create(colaborador *model.Colaborador) error {
	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(colaborador.Senha), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO usuarios (
			nome, email, senha, cargo_id, data_admissao, status,
			foto_perfil, telefone, dados_bancarios
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, uuid, criado_em, atualizado_em
	`

	err = r.db.QueryRow(
		query,
		colaborador.Nome,
		colaborador.Email,
		string(hashedPassword),
		colaborador.CargoID,
		colaborador.DataAdmissao,
		colaborador.Status,
		colaborador.FotoPerfil,
		colaborador.Telefone,
		colaborador.DadosBancarios,
	).Scan(
		&colaborador.ID,
		&colaborador.UUID,
		&colaborador.CriadoEm,
		&colaborador.AtualizadoEm,
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *ColaboradorRepository) Update(colaborador *model.Colaborador) error {
	query := `
		UPDATE usuarios
		SET nome = $1, cargo_id = $2, status = $3, foto_perfil = $4, 
		    telefone = $5, dados_bancarios = $6, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING atualizado_em
	`

	err := r.db.QueryRow(
		query,
		colaborador.Nome,
		colaborador.CargoID,
		colaborador.Status,
		colaborador.FotoPerfil,
		colaborador.Telefone,
		colaborador.DadosBancarios,
		colaborador.ID,
	).Scan(&colaborador.AtualizadoEm)

	if err != nil {
		return err
	}

	return nil
}

func (r *ColaboradorRepository) VerifyPassword(storedHash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
}

// GetByIDWithPassword obtém o colaborador por ID incluindo a senha hasheada
func (r *ColaboradorRepository) GetByIDWithPassword(id int) (*model.Colaborador, error) {
	query := `
		SELECT id, uuid, nome, email, senha, cargo_id, data_admissao, status, 
		       foto_perfil, telefone, dados_bancarios, criado_em, atualizado_em
		FROM usuarios
		WHERE id = $1
	`

	colaborador := &model.Colaborador{}
	err := r.db.QueryRow(query, id).Scan(
		&colaborador.ID,
		&colaborador.UUID,
		&colaborador.Nome,
		&colaborador.Email,
		&colaborador.Senha,
		&colaborador.CargoID,
		&colaborador.DataAdmissao,
		&colaborador.Status,
		&colaborador.FotoPerfil,
		&colaborador.Telefone,
		&colaborador.DadosBancarios,
		&colaborador.CriadoEm,
		&colaborador.AtualizadoEm,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("colaborador não encontrado")
		}
		return nil, err
	}

	return colaborador, nil
}

// UpdatePassword atualiza apenas a senha do colaborador
func (r *ColaboradorRepository) UpdatePassword(id int, hashedPassword string) error {
	query := `
		UPDATE usuarios
		SET senha = $1, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	result, err := r.db.Exec(query, hashedPassword, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("colaborador não encontrado")
	}

	return nil
}
