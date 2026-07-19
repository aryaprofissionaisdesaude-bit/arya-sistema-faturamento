/**
 * ============================================================
 * ÁRYA SAÚDE
 * VALIDAÇÕES — CADASTROS
 * ARQUIVO: RN_Validacoes_Cadastros.gs
 * ============================================================
 *
 * Responsabilidades:
 * - validar paciente;
 * - validar profissional;
 * - validar convênio;
 * - validar procedimento;
 * - padronizar retorno de erros e avisos.
 *
 * Funções internas usam o prefixo:
 * rncad
 */


/* ============================================================
 * PACIENTE
 * ============================================================
 */

function rncadValidarPaciente_(
  idPaciente
) {
  var resultado = {
    valido:
      false,

    erros:
      [],

    avisos:
      [],

    paciente:
      null
  };

  var idNormalizado =
    rncNormalizarId_(
      idPaciente
    );

  if (!idNormalizado) {
    resultado.erros.push(
      'Paciente não informado.'
    );

    return resultado;
  }

  try {
    var paciente =
      rnPacientesBuscarPorId(
        idNormalizado
      );

    if (!paciente) {
      resultado.erros.push(
        'Paciente não encontrado.'
      );

      return resultado;
    }

    if (!paciente.ativo) {
      resultado.erros.push(
        'O paciente está inativo.'
      );
    }

    resultado.paciente =
      paciente;
  } catch (erroPaciente) {
    resultado.erros.push(
      erroPaciente.message
    );
  }

  resultado.valido =
    resultado.erros.length === 0;

  return resultado;
}


function rncadExigirPacienteValido_(
  idPaciente
) {
  var resultado =
    rncadValidarPaciente_(
      idPaciente
    );

  if (!resultado.valido) {
    throw new Error(
      resultado.erros.join(' | ')
    );
  }

  return resultado.paciente;
}


/* ============================================================
 * PROFISSIONAL
 * ============================================================
 */

function rncadValidarProfissional_(
  idProfissional
) {
  var resultado = {
    valido:
      false,

    erros:
      [],

    avisos:
      [],

    profissional:
      null
  };

  var idNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  if (!idNormalizado) {
    resultado.erros.push(
      'Profissional não informado.'
    );

    return resultado;
  }

  try {
    var profissional =
      rnUsuariosBuscarProfissionalPorId(
        idNormalizado
      );

    if (!profissional) {
      resultado.erros.push(
        'Profissional não encontrado.'
      );

      return resultado;
    }

    var ativo =
      typeof profissional.ativo ===
        'undefined'
        ? true
        : Boolean(
            profissional.ativo
          );

    if (!ativo) {
      resultado.erros.push(
        'O profissional está inativo.'
      );
    }

    resultado.profissional =
      profissional;
  } catch (erroProfissional) {
    resultado.erros.push(
      erroProfissional.message
    );
  }

  resultado.valido =
    resultado.erros.length === 0;

  return resultado;
}


function rncadExigirProfissionalValido_(
  idProfissional
) {
  var resultado =
    rncadValidarProfissional_(
      idProfissional
    );

  if (!resultado.valido) {
    throw new Error(
      resultado.erros.join(' | ')
    );
  }

  return resultado.profissional;
}


/* ============================================================
 * CONVÊNIO
 * ============================================================
 */

function rncadValidarConvenio_(
  idConvenio
) {
  var resultado = {
    valido:
      false,

    erros:
      [],

    avisos:
      [],

    convenio:
      null
  };

  var idNormalizado =
    rncNormalizarId_(
      idConvenio
    );

  if (!idNormalizado) {
    resultado.erros.push(
      'Convênio não informado.'
    );

    return resultado;
  }

  try {
    var convenio =
      rnConveniosBuscarPorId(
        idNormalizado
      );

    if (!convenio) {
      resultado.erros.push(
        'Convênio não encontrado.'
      );

      return resultado;
    }

    if (!convenio.ativo) {
      resultado.erros.push(
        'O convênio está inativo.'
      );
    }

    resultado.convenio =
      convenio;
  } catch (erroConvenio) {
    resultado.erros.push(
      erroConvenio.message
    );
  }

  resultado.valido =
    resultado.erros.length === 0;

  return resultado;
}


function rncadExigirConvenioValido_(
  idConvenio
) {
  var resultado =
    rncadValidarConvenio_(
      idConvenio
    );

  if (!resultado.valido) {
    throw new Error(
      resultado.erros.join(' | ')
    );
  }

  return resultado.convenio;
}


/* ============================================================
 * PROCEDIMENTO
 * ============================================================
 */

function rncadValidarProcedimento_(
  dados
) {
  var resultado = {
    valido:
      false,

    erros:
      [],

    avisos:
      [],

    procedimento:
      null,

    dadosNormalizados:
      {}
  };

  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    resultado.erros.push(
      'Informe os dados do procedimento.'
    );

    return resultado;
  }

  var idProfissional =
    rncNormalizarId_(
      dados.idProfissional
    );

  var idProcedimento =
    rncNormalizarId_(
      dados.idProcedimento
    );

  var tipoAtendimento =
    rncNormalizarTipoAtendimento_(
      dados.tipoAtendimento
    );

  var idConvenio =
    rncNormalizarId_(
      dados.idConvenio
    );

  resultado.dadosNormalizados = {
    idProfissional:
      idProfissional,

    idProcedimento:
      idProcedimento,

    tipoAtendimento:
      tipoAtendimento,

    idConvenio:
      idConvenio
  };

  try {
    var validacao =
      rnProcedimentosValidarSelecao({
        idProfissional:
          idProfissional,

        idProcedimento:
          idProcedimento,

        tipoAtendimento:
          tipoAtendimento,

        idConvenio:
          idConvenio
      });

    resultado.valido =
      validacao.valido;

    resultado.erros =
      validacao.erros || [];

    resultado.avisos =
      validacao.avisos || [];

    resultado.procedimento =
      validacao.procedimento || null;
  } catch (erroProcedimento) {
    resultado.erros.push(
      erroProcedimento.message
    );

    resultado.valido =
      false;
  }

  return resultado;
}


function rncadExigirProcedimentoValido_(
  dados
) {
  var resultado =
    rncadValidarProcedimento_(
      dados
    );

  if (!resultado.valido) {
    throw new Error(
      resultado.erros.join(' | ')
    );
  }

  return resultado.procedimento;
}