/**
 * ============================================================
 * ÁRYA SAÚDE
 * REGRAS DE NEGÓCIO — PROCEDIMENTOS
 * ARQUIVO: RN_Procedimentos.gs
 * ============================================================
 *
 * Este arquivo contém somente a API pública do módulo.
 *
 * A lógica interna está distribuída em:
 * - RN_Procedimentos_Core.gs
 * - RN_Procedimentos_Habilitacoes.gs
 * - RN_Procedimentos_Convenios.gs
 *
 * Não inserir funções internas neste arquivo.
 */


/* ============================================================
 * LISTAGEM GERAL
 * ============================================================
 */

/**
 * Lista procedimentos cadastrados.
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnProcedimentosListar(filtros) {
  return rnrCoreListar_(
    filtros
  );
}


/**
 * Lista somente procedimentos ativos.
 *
 * @return {Object[]}
 */
function rnProcedimentosListarAtivos() {
  return rnrCoreListarAtivos_();
}


/**
 * Lista opções reduzidas de procedimentos.
 *
 * @return {Object[]}
 */
function rnProcedimentosListarOpcoesGerais() {
  return rnrCoreListarOpcoesGerais_();
}


/* ============================================================
 * CONSULTA INDIVIDUAL
 * ============================================================
 */

/**
 * Busca procedimento por ID.
 *
 * @param {string} idProcedimento
 * @return {Object|null}
 */
function rnProcedimentosBuscarPorId(
  idProcedimento
) {
  return rnrCoreBuscarPorIdPublico_(
    idProcedimento
  );
}


/**
 * Exige que o procedimento exista.
 *
 * @param {string} idProcedimento
 * @return {Object}
 */
function rnProcedimentosExigirExistente(
  idProcedimento
) {
  return rnrCoreExigirExistente_(
    idProcedimento
  );
}


/**
 * Exige que o procedimento exista e esteja ativo.
 *
 * @param {string} idProcedimento
 * @return {Object}
 */
function rnProcedimentosExigirAtivo(
  idProcedimento
) {
  return rnrCoreExigirAtivo_(
    idProcedimento
  );
}


/* ============================================================
 * PROFISSIONAL
 * ============================================================
 */

/**
 * Lista procedimentos do profissional atual.
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnProcedimentosListarDoProfissionalAtual(
  filtros
) {
  return rnrCoreListarDoProfissionalAtual_(
    filtros
  );
}


/**
 * Lista procedimentos de um profissional.
 *
 * @param {string} idProfissional
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnProcedimentosListarDoProfissional(
  idProfissional,
  filtros
) {
  return rnrCoreListarDoProfissional_(
    idProfissional,
    filtros
  );
}


/* ============================================================
 * PARTICULAR
 * ============================================================
 */

/**
 * Lista procedimentos particulares do profissional atual.
 *
 * @return {Object[]}
 */
function rnProcedimentosListarParticularesAtual() {
  return rnrCoreListarParticularesAtual_();
}


/**
 * Lista procedimentos particulares de um profissional.
 *
 * @param {string} idProfissional
 * @return {Object[]}
 */
function rnProcedimentosListarParticulares(
  idProfissional
) {
  return rnrCoreListarParticulares_(
    idProfissional
  );
}


/* ============================================================
 * CONVÊNIO
 * ============================================================
 */

/**
 * Lista procedimentos conveniados do profissional atual.
 *
 * @param {string} idConvenio
 * @return {Object[]}
 */
function rnProcedimentosListarConvenioAtual(
  idConvenio
) {
  return rnrCoreListarConvenioAtual_(
    idConvenio
  );
}


/**
 * Lista procedimentos conveniados de um profissional.
 *
 * @param {string} idProfissional
 * @param {string} idConvenio
 * @return {Object[]}
 */
function rnProcedimentosListarConvenio(
  idProfissional,
  idConvenio
) {
  return rnrCoreListarConvenio_(
    idProfissional,
    idConvenio
  );
}


/**
 * Lista opções para a interface.
 *
 * @param {string} tipoAtendimento
 * @param {string=} idConvenio
 * @return {Object[]}
 */
function rnProcedimentosListarOpcoesAtual(
  tipoAtendimento,
  idConvenio
) {
  return rnrCoreListarOpcoesAtual_(
    tipoAtendimento,
    idConvenio
  );
}


/* ============================================================
 * VALIDAÇÃO
 * ============================================================
 */

/**
 * Verifica se o procedimento está permitido.
 *
 * @param {string} idProfissional
 * @param {string} idProcedimento
 * @param {string} tipoAtendimento
 * @param {string=} idConvenio
 * @return {boolean}
 */
function rnProcedimentosEstaPermitido(
  idProfissional,
  idProcedimento,
  tipoAtendimento,
  idConvenio
) {
  return rnrCoreEstaPermitido_(
    idProfissional,
    idProcedimento,
    tipoAtendimento,
    idConvenio
  );
}


/**
 * Exige que o procedimento esteja permitido.
 *
 * @param {string} idProfissional
 * @param {string} idProcedimento
 * @param {string} tipoAtendimento
 * @param {string=} idConvenio
 * @return {Object}
 */
function rnProcedimentosExigirPermitido(
  idProfissional,
  idProcedimento,
  tipoAtendimento,
  idConvenio
) {
  return rnrCoreExigirPermitido_(
    idProfissional,
    idProcedimento,
    tipoAtendimento,
    idConvenio
  );
}


/**
 * Valida uma seleção de procedimento.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnProcedimentosValidarSelecao(
  dados
) {
  return rnrCoreValidarSelecao_(
    dados
  );
}