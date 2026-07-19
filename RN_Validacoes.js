/**
 * ============================================================
 * ÁRYA SAÚDE
 * REGRAS DE NEGÓCIO — VALIDAÇÕES
 * ARQUIVO: RN_Validacoes.gs
 * ============================================================
 *
 * Este arquivo contém somente a API pública do módulo.
 *
 * A lógica interna está distribuída em:
 * - RN_Validacoes_Atendimento.gs
 * - RN_Validacoes_Cadastros.gs
 *
 * Não inserir funções internas neste arquivo.
 */


/* ============================================================
 * ATENDIMENTO
 * ============================================================
 */

/**
 * Valida todos os dados necessários para um atendimento.
 *
 * Dados esperados:
 *
 * {
 *   idPaciente: "",
 *   idProfissional: "",
 *   tipoAtendimento: "PARTICULAR" ou "CONVENIO",
 *   idConvenio: "",
 *   idProcedimento: ""
 * }
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidacoesValidarAtendimento(dados) {
  return rnaAtendimentoValidar_(
    dados
  );
}


/**
 * Exige que os dados do atendimento sejam válidos.
 *
 * Em caso de erro, interrompe a execução.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidacoesExigirAtendimentoValido(
  dados
) {
  return rnaAtendimentoExigirValido_(
    dados
  );
}


/**
 * Valida atendimento usando o profissional atual.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidacoesValidarAtendimentoAtual(
  dados
) {
  return rnaAtendimentoValidarAtual_(
    dados
  );
}


/**
 * Exige atendimento válido usando o profissional atual.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidacoesExigirAtendimentoAtualValido(
  dados
) {
  return rnaAtendimentoExigirAtualValido_(
    dados
  );
}


/* ============================================================
 * PACIENTE
 * ============================================================
 */

/**
 * Valida o paciente para uso em atendimento.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnValidacoesValidarPaciente(
  idPaciente
) {
  return rncadValidarPaciente_(
    idPaciente
  );
}


/**
 * Exige paciente válido e acessível.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnValidacoesExigirPacienteValido(
  idPaciente
) {
  return rncadExigirPacienteValido_(
    idPaciente
  );
}


/* ============================================================
 * PROFISSIONAL
 * ============================================================
 */

/**
 * Valida o profissional.
 *
 * @param {string} idProfissional
 * @return {Object}
 */
function rnValidacoesValidarProfissional(
  idProfissional
) {
  return rncadValidarProfissional_(
    idProfissional
  );
}


/**
 * Exige profissional válido.
 *
 * @param {string} idProfissional
 * @return {Object}
 */
function rnValidacoesExigirProfissionalValido(
  idProfissional
) {
  return rncadExigirProfissionalValido_(
    idProfissional
  );
}


/* ============================================================
 * CONVÊNIO
 * ============================================================
 */

/**
 * Valida o convênio.
 *
 * @param {string} idConvenio
 * @return {Object}
 */
function rnValidacoesValidarConvenio(
  idConvenio
) {
  return rncadValidarConvenio_(
    idConvenio
  );
}


/**
 * Exige convênio válido e ativo.
 *
 * @param {string} idConvenio
 * @return {Object}
 */
function rnValidacoesExigirConvenioValido(
  idConvenio
) {
  return rncadExigirConvenioValido_(
    idConvenio
  );
}


/* ============================================================
 * PROCEDIMENTO
 * ============================================================
 */

/**
 * Valida um procedimento para profissional e modalidade.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidacoesValidarProcedimento(
  dados
) {
  return rncadValidarProcedimento_(
    dados
  );
}


/**
 * Exige procedimento permitido.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidacoesExigirProcedimentoValido(
  dados
) {
  return rncadExigirProcedimentoValido_(
    dados
  );
}