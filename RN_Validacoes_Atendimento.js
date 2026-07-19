/**
 * ============================================================
 * ÁRYA SAÚDE
 * VALIDAÇÕES — ATENDIMENTO
 * ARQUIVO: RN_Validacoes_Atendimento.gs
 * ============================================================
 *
 * Responsabilidades:
 * - validar o conjunto completo do atendimento;
 * - normalizar dados;
 * - coordenar paciente, profissional, convênio e procedimento;
 * - impedir combinações inválidas;
 * - preparar dados seguros para sessões, protocolos e guias.
 *
 * Funções internas usam o prefixo:
 * rnaAtendimento
 */


/* ============================================================
 * VALIDAÇÃO PRINCIPAL
 * ============================================================
 */

function rnaAtendimentoValidar_(dados) {
  rnaAtendimentoExigirDependencias_();

  var resultado = {
    valido:
      false,

    erros:
      [],

    avisos:
      [],

    dadosNormalizados:
      {},

    paciente:
      null,

    profissional:
      null,

    convenio:
      null,

    procedimento:
      null
  };

  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    resultado.erros.push(
      'Informe os dados do atendimento.'
    );

    return resultado;
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  var idPaciente =
    rncNormalizarId_(
      dados.idPaciente
    );

  var idProfissional =
    rncNormalizarId_(
      dados.idProfissional ||
      contexto.idProfissional
    );

  var tipoAtendimento =
    rncNormalizarTipoAtendimento_(
      dados.tipoAtendimento
    );

  var idConvenio =
    rncNormalizarId_(
      dados.idConvenio
    );

  var idProcedimento =
    rncNormalizarId_(
      dados.idProcedimento
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  resultado.dadosNormalizados = {
    idPaciente:
      idPaciente,

    idProfissional:
      idProfissional,

    tipoAtendimento:
      tipoAtendimento,

    idConvenio:
      idConvenio,

    idProcedimento:
      idProcedimento
  };

  if (!idPaciente) {
    resultado.erros.push(
      'Paciente não informado.'
    );
  }

  if (!idProfissional) {
    resultado.erros.push(
      'Profissional não informado.'
    );
  }

  if (!idProcedimento) {
    resultado.erros.push(
      'Procedimento não informado.'
    );
  }

  if (
    tipoAtendimento !==
      tipoParticular &&
    tipoAtendimento !==
      tipoConvenio
  ) {
    resultado.erros.push(
      'Tipo de atendimento inválido.'
    );
  }

  if (
    tipoAtendimento ===
      tipoConvenio &&
    !idConvenio
  ) {
    resultado.erros.push(
      'Convênio não informado.'
    );
  }

  if (
    tipoAtendimento ===
      tipoParticular &&
    idConvenio
  ) {
    resultado.avisos.push(
      'O ID do convênio foi ignorado porque o atendimento é particular.'
    );

    idConvenio = '';

    resultado
      .dadosNormalizados
      .idConvenio = '';
  }

  if (resultado.erros.length) {
    return resultado;
  }

  rnaAtendimentoValidarProfissional_(
    resultado,
    idProfissional,
    contexto
  );

  rnaAtendimentoValidarPaciente_(
    resultado,
    idPaciente,
    idProfissional
  );

  if (
    tipoAtendimento ===
    tipoConvenio
  ) {
    rnaAtendimentoValidarConvenio_(
      resultado,
      idConvenio,
      idPaciente
    );
  }

  rnaAtendimentoValidarProcedimento_(
    resultado,
    idProfissional,
    idProcedimento,
    tipoAtendimento,
    idConvenio
  );

  rnaAtendimentoValidarCoerenciaPaciente_(
    resultado,
    tipoAtendimento,
    idConvenio
  );

  resultado.valido =
    resultado.erros.length === 0;

  return resultado;
}


/* ============================================================
 * ATENDIMENTO DO PROFISSIONAL ATUAL
 * ============================================================
 */

function rnaAtendimentoValidarAtual_(
  dados
) {
  var contexto =
    rnUsuariosExigirProfissionalVinculado();

  var dadosPreparados =
    Object.assign(
      {},
      dados || {},
      {
        idProfissional:
          contexto.idProfissional
      }
    );

  return rnaAtendimentoValidar_(
    dadosPreparados
  );
}


/* ============================================================
 * EXIGÊNCIAS
 * ============================================================
 */

function rnaAtendimentoExigirValido_(
  dados
) {
  var resultado =
    rnaAtendimentoValidar_(
      dados
    );

  if (!resultado.valido) {
    throw new Error(
      'Atendimento inválido: ' +
      resultado.erros.join(' | ')
    );
  }

  return resultado;
}


function rnaAtendimentoExigirAtualValido_(
  dados
) {
  var resultado =
    rnaAtendimentoValidarAtual_(
      dados
    );

  if (!resultado.valido) {
    throw new Error(
      'Atendimento inválido: ' +
      resultado.erros.join(' | ')
    );
  }

  return resultado;
}


/* ============================================================
 * PROFISSIONAL
 * ============================================================
 */

function rnaAtendimentoValidarProfissional_(
  resultado,
  idProfissional,
  contexto
) {
  var validacao =
    rncadValidarProfissional_(
      idProfissional
    );

  if (!validacao.valido) {
    resultado.erros =
      resultado.erros.concat(
        validacao.erros
      );

    return;
  }

  resultado.profissional =
    validacao.profissional;

  if (
    !contexto.administrativo &&
    rncChave_(
      contexto.idProfissional
    ) !==
    rncChave_(
      idProfissional
    )
  ) {
    resultado.erros.push(
      'O usuário conectado não pode criar atendimento para outro profissional.'
    );
  }
}


/* ============================================================
 * PACIENTE
 * ============================================================
 */

function rnaAtendimentoValidarPaciente_(
  resultado,
  idPaciente,
  idProfissional
) {
  var validacao =
    rncadValidarPaciente_(
      idPaciente
    );

  if (!validacao.valido) {
    resultado.erros =
      resultado.erros.concat(
        validacao.erros
      );

    return;
  }

  resultado.paciente =
    validacao.paciente;

  var podeAcessar =
    rnPacientesProfissionalPodeAcessar(
      idProfissional,
      idPaciente
    );

  if (!podeAcessar) {
    resultado.erros.push(
      'O profissional informado não possui acesso ao paciente.'
    );
  }
}


/* ============================================================
 * CONVÊNIO
 * ============================================================
 */

function rnaAtendimentoValidarConvenio_(
  resultado,
  idConvenio,
  idPaciente
) {
  var validacao =
    rncadValidarConvenio_(
      idConvenio
    );

  if (!validacao.valido) {
    resultado.erros =
      resultado.erros.concat(
        validacao.erros
      );

    return;
  }

  resultado.convenio =
    validacao.convenio;

  try {
    var cadastroPaciente =
      rnConveniosValidarCadastroPaciente(
        idPaciente
      );

    if (!cadastroPaciente.valido) {
      resultado.erros =
        resultado.erros.concat(
          cadastroPaciente.erros
        );
    }

    if (
      cadastroPaciente.avisos &&
      cadastroPaciente.avisos.length
    ) {
      resultado.avisos =
        resultado.avisos.concat(
          cadastroPaciente.avisos
        );
    }
  } catch (erroConvenioPaciente) {
    resultado.erros.push(
      erroConvenioPaciente.message
    );
  }
}


/* ============================================================
 * PROCEDIMENTO
 * ============================================================
 */

function rnaAtendimentoValidarProcedimento_(
  resultado,
  idProfissional,
  idProcedimento,
  tipoAtendimento,
  idConvenio
) {
  var validacao =
    rncadValidarProcedimento_({
      idProfissional:
        idProfissional,

      idProcedimento:
        idProcedimento,

      tipoAtendimento:
        tipoAtendimento,

      idConvenio:
        idConvenio
    });

  if (!validacao.valido) {
    resultado.erros =
      resultado.erros.concat(
        validacao.erros
      );

    return;
  }

  resultado.procedimento =
    validacao.procedimento;

  if (
    validacao.avisos &&
    validacao.avisos.length
  ) {
    resultado.avisos =
      resultado.avisos.concat(
        validacao.avisos
      );
  }
}


/* ============================================================
 * COERÊNCIA COM O CADASTRO DO PACIENTE
 * ============================================================
 */

function rnaAtendimentoValidarCoerenciaPaciente_(
  resultado,
  tipoAtendimento,
  idConvenio
) {
  if (!resultado.paciente) {
    return;
  }

  var paciente =
    resultado.paciente;

  var tipoPaciente =
    rncNormalizarTipoAtendimento_(
      paciente.tipoAtendimentoPadrao
    );

  var convenioPaciente =
    rncNormalizarId_(
      paciente.idConvenio
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  if (
    tipoPaciente &&
    tipoPaciente !==
      tipoAtendimento
  ) {
    resultado.avisos.push(
      'A modalidade selecionada é diferente da modalidade padrão cadastrada para o paciente.'
    );
  }

  if (
    tipoAtendimento ===
      tipoConvenio &&
    convenioPaciente &&
    rncChave_(convenioPaciente) !==
      rncChave_(idConvenio)
  ) {
    resultado.avisos.push(
      'O convênio selecionado é diferente do convênio padrão cadastrado para o paciente.'
    );
  }

  if (
    tipoAtendimento ===
      tipoParticular &&
    convenioPaciente
  ) {
    resultado.avisos.push(
      'O paciente possui convênio cadastrado, mas este atendimento será particular.'
    );
  }
}


/* ============================================================
 * DEPENDÊNCIAS
 * ============================================================
 */

function rnaAtendimentoValidarDependencias_() {
  var dependencias = {
    RNConfig:
      typeof ARYA_RN_CONFIG !==
        'undefined' &&
      typeof rncNormalizarId_ ===
        'function',

    RNUsuarios:
      typeof rnUsuariosObterContextoAtual ===
        'function',

    RNPacientes:
      typeof rnPacientesProfissionalPodeAcessar ===
        'function',

    RNConvenios:
      typeof rnConveniosValidarCadastroPaciente ===
        'function',

    RNProcedimentos:
      typeof rnProcedimentosValidarSelecao ===
        'function',

    ValidacoesCadastros:
      typeof rncadValidarPaciente_ ===
        'function'
  };

  var ausentes =
    Object.keys(
      dependencias
    ).filter(
      function(nome) {
        return !dependencias[nome];
      }
    );

  return {
    valido:
      ausentes.length === 0,

    ausentes:
      ausentes,

    dependencias:
      dependencias
  };
}


function rnaAtendimentoExigirDependencias_() {
  var resultado =
    rnaAtendimentoValidarDependencias_();

  if (!resultado.valido) {
    throw new Error(
      'Dependências ausentes no módulo de validações de atendimento: ' +
      resultado.ausentes.join(', ') +
      '.'
    );
  }
}