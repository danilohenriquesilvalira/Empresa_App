package service

type Services struct {
	Auth        *AuthService
	Colaborador *ColaboradorService
	Documento   *DocumentoService
	Ponto       *PontoService
}
