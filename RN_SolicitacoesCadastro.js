/**
 * ============================================================
 * ÁRYA SAÚDE
 * REGRAS DE NEGÓCIO — SOLICITAÇÕES DE CADASTRO
 * ARQUIVO: RN_SolicitacoesCadastro.gs
 * ============================================================
 *
 * Este arquivo contém somente a API pública.
 *
 * A lógica interna está distribuída em:
 * - RN_SolicitacoesCadastro_Core.gs
 * - RN_SolicitacoesCadastro_Aprovacao.gs
 *
 * Não inserir funções internas neste arquivo.
 */


/* ============================================================
 * LISTAGEM
 * ============================================================
 */

/**
 * Lista solicitações de cadastro.
 *
 * Filtros:
 * {
 *   status: "",
 *   nome: "",
 *   cpf: "",
 *   email: "",
 *   incluirFinalizadas: true
 * }
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnSolicitacoesListar(filtros) {
  return rnsCoreListar_(filtros);
}


/**
 * Lista solicitações pendentes.
 *
 * Função sem parâmetros para execução direta.
 *
 * @return {Object[]}
 */
function rnSolicitacoesListarPendentes() {
  return rnsCoreListarPendentes_();
}


/**
 * Lista solicitações em análise.
 *
 * Função sem parâmetros para execução direta.
 *
 * @return {Object[]}
 */
function rnSolicitacoesListarEmAnalise() {
  return rnsCoreListarEmAnalise_();
}


/* ============================================================
 * CONSULTAS
 * ============================================================
 */

/**
 * Busca solicitação por ID.
 *
 * @param {string} idSolicitacao
 * @return {Object|null}
 */
function rnSolicitacoesBuscarPorId(
  idSolicitacao
) {
  return rnsCoreBuscarPorIdPublico_(
    idSolicitacao
  );
}


/**
 * Busca solicitações pelo CPF.
 *
 * @param {string} cpf
 * @return {Object[]}
 */
function rnSolicitacoesBuscarPorCpf(cpf) {
  return rnsCoreBuscarPorCpf_(
    cpf
  );
}


/**
 * Busca solicitações pelo e-mail.
 *
 * @param {string} email
 * @return {Object[]}
 */
function rnSolicitacoesBuscarPorEmail(
  email
) {
  return rnsCoreBuscarPorEmail_(
    email
  );
}


/* ============================================================
 * CADASTRO PÚBLICO
 * ============================================================
 */

/**
 * Registra uma nova solicitação de cadastro.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnSolicitacoesCadastrar(dados) {
  return rnsCoreCadastrar_(
    dados
  );
}


/**
 * Verifica possíveis duplicidades.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnSolicitacoesVerificarDuplicidade(
  dados
) {
  return rnsCoreVerificarDuplicidade_(
    dados
  );
}


/* ============================================================
 * ANÁLISE ADMINISTRATIVA
 * ============================================================
 */

/**
 * Coloca a solicitação em análise.
 *
 * @param {string} idSolicitacao
 * @param {string=} observacao
 * @return {Object}
 */
function rnSolicitacoesIniciarAnalise(
  idSolicitacao,
  observacao
) {
  return rnsAprovacaoIniciarAnalise_(
    idSolicitacao,
    observacao
  );
}


/**
 * Aprova uma solicitação e cria o paciente.
 *
 * Dados:
 * {
 *   idSolicitacao: "",
 *   idProfissionalResponsavel: "",
 *   idsProfissionaisAdicionais: [],
 *   observacao: ""
 * }
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnSolicitacoesAprovar(dados) {
  return rnsAprovacaoAprovar_(
    dados
  );
}


/**
 * Recusa uma solicitação.
 *
 * @param {string} idSolicitacao
 * @param {string} motivo
 * @return {Object}
 */
function rnSolicitacoesRecusar(
  idSolicitacao,
  motivo
) {
  return rnsAprovacaoRecusar_(
    idSolicitacao,
    motivo
  );
}


/**
 * Marca uma solicitação como duplicada.
 *
 * @param {string} idSolicitacao
 * @param {string=} idPacienteExistente
 * @param {string=} observacao
 * @return {Object}
 */
function rnSolicitacoesMarcarDuplicada(
  idSolicitacao,
  idPacienteExistente,
  observacao
) {
  return rnsAprovacaoMarcarDuplicada_(
    idSolicitacao,
    idPacienteExistente,
    observacao
  );
}


/**
 * Retorna os status permitidos.
 *
 * @return {Object[]}
 */
function rnSolicitacoesListarStatus() {
  return rnsCoreListarStatus_();
}
