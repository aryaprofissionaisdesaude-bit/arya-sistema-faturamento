/**
 * ============================================================
 * ÁRYA SAÚDE
 * REGRAS DE NEGÓCIO — PACIENTES
 * ARQUIVO: RN_Pacientes.gs
 * ============================================================
 *
 * Este arquivo contém somente a API pública do módulo.
 *
 * A lógica interna está distribuída em:
 * - RN_Pacientes_Core.gs
 * - RN_Pacientes_Acesso.gs
 * - RN_Pacientes_Filtros.gs
 *
 * Não inserir funções internas neste arquivo.
 */


/* ============================================================
 * LISTAGEM
 * ============================================================
 */

/**
 * Lista os pacientes que o usuário conectado pode acessar.
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnPacientesListarAcessiveis(filtros) {
  return rnpCoreListarAcessiveis_(filtros);
}


/**
 * Lista pacientes acessíveis por um profissional específico.
 *
 * @param {string} idProfissional
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnPacientesListarPorProfissional(
  idProfissional,
  filtros
) {
  return rnpCoreListarPorProfissional_(
    idProfissional,
    filtros
  );
}


/**
 * Retorna opções reduzidas de pacientes para menus.
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnPacientesListarOpcoes(filtros) {
  return rnpCoreListarOpcoes_(filtros);
}


/* ============================================================
 * CONSULTA INDIVIDUAL
 * ============================================================
 */

/**
 * Busca paciente por ID e valida o acesso.
 *
 * @param {string} idPaciente
 * @return {Object|null}
 */
function rnPacientesBuscarPorId(idPaciente) {
  return rnpCoreBuscarPorIdComAcesso_(
    idPaciente
  );
}


/**
 * Busca paciente pelo CPF e valida o acesso.
 *
 * @param {string} cpf
 * @return {Object|null}
 */
function rnPacientesBuscarPorCpf(cpf) {
  return rnpCoreBuscarPorCpfComAcesso_(
    cpf
  );
}


/**
 * Exige que o paciente exista e seja acessível.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnPacientesExigirAcesso(idPaciente) {
  return rnpCoreExigirAcesso_(
    idPaciente
  );
}


/**
 * Retorna os dados padrão de atendimento do paciente.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnPacientesObterDadosPadraoAtendimento(
  idPaciente
) {
  return rnpCoreObterDadosPadraoAtendimento_(
    idPaciente
  );
}


/* ============================================================
 * CONTROLE DE ACESSO
 * ============================================================
 */

/**
 * Verifica se o usuário atual pode acessar um paciente.
 *
 * @param {string} idPaciente
 * @return {boolean}
 */
function rnPacientesUsuarioAtualPodeAcessar(
  idPaciente
) {
  return rnpAcessoUsuarioAtualPodeAcessar_(
    idPaciente
  );
}


/**
 * Verifica se um profissional pode acessar um paciente.
 *
 * @param {string} idProfissional
 * @param {string} idPaciente
 * @return {boolean}
 */
function rnPacientesProfissionalPodeAcessar(
  idProfissional,
  idPaciente
) {
  return rnpAcessoProfissionalPodeAcessarPublico_(
    idProfissional,
    idPaciente
  );
}


/**
 * Retorna a origem do acesso ao paciente.
 *
 * Resultados possíveis:
 * - RESPONSAVEL
 * - ASSOCIACAO
 * - RESPONSAVEL_E_ASSOCIACAO
 * - SEM_ACESSO
 *
 * @param {string} idProfissional
 * @param {string} idPaciente
 * @return {string}
 */
function rnPacientesObterOrigemAcesso(
  idProfissional,
  idPaciente
) {
  return rnpAcessoObterOrigemPublica_(
    idProfissional,
    idPaciente
  );
}