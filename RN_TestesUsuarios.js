/**
 * ============================================================
 * ÁRYA SAÚDE
 * TESTES DO MÓDULO DE USUÁRIOS
 * ARQUIVO: RN_TestesUsuarios.gs
 * ============================================================
 *
 * DEPENDÊNCIAS:
 * - Database.gs
 * - RN_Config.gs
 * - RN_Usuarios.gs
 *
 * Este arquivo não grava nem altera dados.
 */


/**
 * Testa se as abas necessárias existem.
 *
 * @return {Object}
 */
function testeUsuarios01DiagnosticarAbas() {
  var abas = [
    rncNomeAba_('USUARIOS'),
    rncNomeAba_('PROFISSIONAIS')
  ];

  var resultado = {
    sucesso: true,
    teste: 'Diagnóstico das abas de usuários',
    abas: []
  };

  abas.forEach(function(nomeAba) {
    var existe = dbAbaExiste(nomeAba);

    if (!existe) {
      resultado.sucesso = false;
    }

    resultado.abas.push({
      nome: nomeAba,
      existe: existe,
      cabecalhos: existe
        ? dbObterCabecalhos(nomeAba)
        : []
    });
  });

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/**
 * Testa a identificação do usuário conectado.
 *
 * @return {Object}
 */
function testeUsuarios02ContextoAtual() {
  var contexto =
    rnUsuariosObterContextoPublicoAtual();

  var resultado = {
    sucesso: true,
    teste: 'Contexto do usuário atual',
    contexto: contexto
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/**
 * Testa o vínculo do usuário com um profissional.
 *
 * Um usuário administrativo pode não possuir profissional
 * vinculado. Isso não será considerado erro.
 *
 * @return {Object}
 */
function testeUsuarios03ProfissionalVinculado() {
  var contexto =
    rnUsuariosObterContextoAtual();

  var possuiProfissional =
    Boolean(contexto.idProfissional);

  var resultado = {
    sucesso: true,
    teste: 'Profissional vinculado ao usuário',
    email: contexto.email,
    perfil: contexto.perfil,
    possuiProfissionalVinculado: possuiProfissional,
    profissional: possuiProfissional
      ? rnUsuariosObterProfissionalAtual()
      : null,
    observacao: possuiProfissional
      ? ''
      : 'O usuário atual não possui profissional vinculado. Isso é permitido para usuários administrativos.'
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/**
 * Executa os três testes em sequência.
 *
 * @return {Object}
 */
function testeUsuarios00ExecutarTodos() {
  var resultado = {
    sucesso: true,
    teste: 'Testes completos do módulo de usuários',
    diagnosticoAbas: null,
    contextoAtual: null,
    profissionalVinculado: null,
    erros: []
  };

  try {
    resultado.diagnosticoAbas =
      testeUsuarios01DiagnosticarAbas();

    if (!resultado.diagnosticoAbas.sucesso) {
      resultado.sucesso = false;
    }
  } catch (erroDiagnostico) {
    resultado.sucesso = false;

    resultado.erros.push(
      'Diagnóstico das abas: ' +
      erroDiagnostico.message
    );
  }

  try {
    resultado.contextoAtual =
      testeUsuarios02ContextoAtual();
  } catch (erroContexto) {
    resultado.sucesso = false;

    resultado.erros.push(
      'Contexto do usuário: ' +
      erroContexto.message
    );
  }

  try {
    resultado.profissionalVinculado =
      testeUsuarios03ProfissionalVinculado();
  } catch (erroProfissional) {
    resultado.sucesso = false;

    resultado.erros.push(
      'Profissional vinculado: ' +
      erroProfissional.message
    );
  }

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}