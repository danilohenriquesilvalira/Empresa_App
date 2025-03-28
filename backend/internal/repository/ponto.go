package repository

import (
	"database/sql"
	"time"

	"empresa-app/backend/internal/model"
)

type PontoRepository struct {
	db *sql.DB
}

func NewPontoRepository(db *sql.DB) *PontoRepository {
	return &PontoRepository{db: db}
}

func (r *PontoRepository) Registrar(ponto *model.RegistroPonto) error {
	var localizacaoBytes []byte
	var err error

	if ponto.Localizacao != nil {
		localizacaoBytes = ponto.Localizacao
	}

	query := `
		INSERT INTO registros_ponto (
			usuario_id, tipo, data_hora, localizacao, ip_origem, 
			dispositivo, observacao
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, criado_em
	`

	err = r.db.QueryRow(
		query,
		ponto.ColaboradorID,
		ponto.Tipo,
		ponto.DataHora,
		localizacaoBytes,
		ponto.IPOrigem,
		ponto.Dispositivo,
		ponto.Observacao,
	).Scan(
		&ponto.ID,
		&ponto.CriadoEm,
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *PontoRepository) Listar(colaboradorID int, data time.Time) ([]*model.RegistroPonto, error) {
	// Obter data no formato YYYY-MM-DD
	dataFormatada := data.Format("2006-01-02")

	query := `
		SELECT 
			id, usuario_id, tipo, data_hora, localizacao, ip_origem, 
			dispositivo, observacao, criado_em
		FROM registros_ponto
		WHERE usuario_id = $1 AND DATE(data_hora) = $2
		ORDER BY data_hora ASC
	`

	rows, err := r.db.Query(query, colaboradorID, dataFormatada)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pontos := []*model.RegistroPonto{}
	for rows.Next() {
		ponto := &model.RegistroPonto{}
		var localizacao []byte

		err := rows.Scan(
			&ponto.ID,
			&ponto.ColaboradorID,
			&ponto.Tipo,
			&ponto.DataHora,
			&localizacao,
			&ponto.IPOrigem,
			&ponto.Dispositivo,
			&ponto.Observacao,
			&ponto.CriadoEm,
		)
		if err != nil {
			return nil, err
		}

		ponto.Localizacao = localizacao
		pontos = append(pontos, ponto)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return pontos, nil
}
