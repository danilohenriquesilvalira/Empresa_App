package handler

type Handlers struct {
	Auth        *AuthHandler
	Colaborador *ColaboradorHandler
	Documento   *DocumentoHandler
	Ponto       *PontoHandler
}
