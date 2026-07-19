/**
 * ============================================================
 * ÁRYA SAÚDE
 * SOLICITAÇÕES DE CADASTRO — APROVAÇÃO
 * ARQUIVO: RN_SolicitacoesCadastro_Aprovacao.gs
 * ============================================================
 *
 * Responsabilidades:
 * - iniciar análise;
 * - aprovar solicitação;
 * - criar paciente;
 * - criar associações adicionais;
 * - recusar solicitação;
 * - marcar solicitação como duplicada.
 *
 * Funções internas usam o prefixo:
 * rnsAprovacao
 */


/* ============================================================
 * INICIAR ANÁLISE
 * ============================================================
 */

function rnsAprovacaoIniciarAnalise_(
  idSolicitacao,
  observacao
) {
  rnUsuariosExigirPerfilAdministrativo();

  var solicitacao =
    rnsAprovacaoExigirSolicitacao_(
      idSolicitacao
    );

  rnsAprovacaoExigirStatusPermitido_(
    solicitacao,
    [
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .PENDENTE
    ]
  );

  var atualizada =
    rnsCoreAtualizarRegistro_(
      idSolicitacao,
      {
        STATUS:
          ARYA_RN_SOLICITACOES_CONFIG
            .STATUS
            .EM_ANALISE,

        OBSERVACOES_ANALISE:
          rncTexto_(
            observacao
          ),

        ANALISADO_POR:
          rnUsuariosObterEmailAtual(),

        DATA_INICIO_ANALISE:
          new Date()
      }
    );

  return rnsCorePrepararRetorno_(
    atualizada
  );
}


/* ============================================================
 * APROVAÇÃO
 * ============================================================
 */

function rnsAprovacaoAprovar_(dados) {
  rnUsuariosExigirPerfilAdministrativo();

  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    throw new Error(
      'Informe os dados da aprovação.'
    );
  }

  var idSolicitacao =
    rncNormalizarId_(
      dados.idSolicitacao
    );

  var idResponsavel =
    rncNormalizarId_(
      dados.idProfissionalResponsavel
    );

  var idsAdicionais =
    Array.isArray(
      dados.idsProfissionaisAdicionais
    )
      ? dados.idsProfissionaisAdicionais
      : [];

  if (!idSolicitacao) {
    throw new Error(
      'Solicitação não informada.'
    );
  }

  if (!idResponsavel) {
    throw new Error(
      'Profissional responsável não informado.'
    );
  }

  var solicitacaoRegistro =
    rnsAprovacaoExigirSolicitacao_(
      idSolicitacao
    );

  var solicitacao =
    rnsCorePrepararRetorno_(
      solicitacaoRegistro
    );

  rnsAprovacaoExigirStatusPermitido_(
    solicitacaoRegistro,
    [
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .PENDENTE,

      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .EM_ANALISE
    ]
  );

  var profissionalResponsavel =
    rnUsuariosBuscarProfissionalPorId(
      idResponsavel
    );

  if (!profissionalResponsavel) {
    throw new Error(
      'O profissional responsável não foi encontrado.'
    );
  }

  var duplicidade =
    rnsCoreVerificarDuplicidade_({
      cpf:
        solicitacao.cpf,

      email:
        solicitacao.email
    });

  var pacienteExistente =
    duplicidade.ocorrencias.find(
      function(ocorrencia) {
        return (
          ocorrencia.origem ===
          'PACIENTES'
        );
      }
    );

  if (pacienteExistente) {
    throw new Error(
      'Já existe um paciente com o mesmo CPF ou e-mail. Verifique a duplicidade antes de aprovar.'
    );
  }

  var paciente =
    rnsAprovacaoCriarPaciente_(
      solicitacao,
      idResponsavel
    );

  var associacoes =
    rnsAprovacaoCriarAssociacoes_(
      paciente.idPaciente,
      idResponsavel,
      idsAdicionais
    );

  var atualizada =
    rnsCoreAtualizarRegistro_(
      idSolicitacao,
      {
        STATUS:
          ARYA_RN_SOLICITACOES_CONFIG
            .STATUS
            .APROVADO,

        ID_PACIENTE_GERADO:
          paciente.idPaciente,

        ID_PROFISSIONAL_RESPONSAVEL:
          idResponsavel,

        APROVADO_POR:
          rnUsuariosObterEmailAtual(),

        DATA_APROVACAO:
          new Date(),

        OBSERVACOES_APROVACAO:
          rncTexto_(
            dados.observacao
          )
      }
    );

  return {
    sucesso:
      true,

    idSolicitacao:
      idSolicitacao,

    status:
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .APROVADO,

    paciente:
      paciente,

    associacoes:
      associacoes,

    solicitacao:
      rnsCorePrepararRetorno_(
        atualizada
      )
  };
}


/* ============================================================
 * CRIAÇÃO DO PACIENTE
 * ============================================================
 */

function rnsAprovacaoCriarPaciente_(
  solicitacao,
  idResponsavel
) {
  var nomeAba =
    rncNomeAba_(
      'PACIENTES'
    );

  if (!dbAbaExiste(nomeAba)) {
    throw new Error(
      'A aba PACIENTES não foi encontrada.'
    );
  }

  var idPaciente =
    rnsAprovacaoGerarIdPaciente_();

  var registro = {
    ID_PACIENTE:
      idPaciente,

    NOME_COMPLETO:
      solicitacao.nomeCompleto,

    NOME_SOCIAL:
      solicitacao.nomeSocial,

    CPF:
      solicitacao.cpf,

    DATA_NASCIMENTO:
      solicitacao.dataNascimento,

    TELEFONE:
      solicitacao.telefone,

    EMAIL:
      solicitacao.email,

    TIPO_ATENDIMENTO_PADRAO:
      solicitacao
        .tipoAtendimentoPadrao,

    ID_CONVENIO:
      solicitacao.idConvenio,

    NOME_CONVENIO:
      solicitacao.nomeConvenio,

    NUMERO_CARTEIRINHA:
      solicitacao.numeroCarteirinha,

    VALIDADE_CARTEIRINHA:
      solicitacao.validadeCarteirinha,

    NOME_TITULAR:
      solicitacao.nomeTitular,

    CPF_TITULAR:
      solicitacao.cpfTitular,

    ID_PROFISSIONAL_RESPONSAVEL:
      idResponsavel,

    ATIVO:
      'SIM',

    DATA_CADASTRO:
      new Date(),

    OBSERVACOES:
      solicitacao.observacoes
  };

  if (
    typeof dbInserirRegistro !==
      'function'
  ) {
    throw new Error(
      'A função dbInserirRegistro não foi encontrada no Database.gs.'
    );
  }

  var numeroLinha =
    dbInserirRegistro(
      nomeAba,
      registro
    );

  return {
    idPaciente:
      idPaciente,

    numeroLinha:
      numeroLinha,

    nomeCompleto:
      solicitacao.nomeCompleto,

    idProfissionalResponsavel:
      idResponsavel
  };
}


/* ============================================================
 * ASSOCIAÇÕES
 * ============================================================
 */

function rnsAprovacaoCriarAssociacoes_(
  idPaciente,
  idResponsavel,
  idsAdicionais
) {
  var profissionais = [];

  profissionais.push(
    idResponsavel
  );

  (
    idsAdicionais || []
  ).forEach(
    function(idProfissional) {
      var idNormalizado =
        rncNormalizarId_(
          idProfissional
        );

      if (
        idNormalizado &&
        profissionais
          .map(rncChave_)
          .indexOf(
            rncChave_(
              idNormalizado
            )
          ) === -1
      ) {
        profissionais.push(
          idNormalizado
        );
      }
    }
  );

  var nomeAba =
    rncNomeAba_(
      'ASSOCIACOES'
    );

  if (!dbAbaExiste(nomeAba)) {
    return [];
  }

  var criadas = [];

  profissionais.forEach(
    function(idProfissional) {
      var profissional =
        rnUsuariosBuscarProfissionalPorId(
          idProfissional
        );

      if (!profissional) {
        throw new Error(
          'Profissional não encontrado: ' +
          idProfissional +
          '.'
        );
      }

      var registro = {
        ID_ASSOCIACAO:
          rnsAprovacaoGerarIdAssociacao_(),

        ID_PACIENTE:
          idPaciente,

        ID_PROFISSIONAL:
          idProfissional,

        TIPO_ASSOCIACAO:
          rncChave_(idProfissional) ===
            rncChave_(idResponsavel)
            ? 'RESPONSAVEL'
            : 'ADICIONAL',

        DATA_INICIO:
          new Date(),

        DATA_FIM:
          '',

        ATIVO:
          'SIM',

        DATA_CADASTRO:
          new Date()
      };

      var numeroLinha =
        dbInserirRegistro(
          nomeAba,
          registro
        );

      criadas.push({
        idAssociacao:
          registro.ID_ASSOCIACAO,

        idPaciente:
          idPaciente,

        idProfissional:
          idProfissional,

        tipoAssociacao:
          registro.TIPO_ASSOCIACAO,

        numeroLinha:
          numeroLinha
      });
    }
  );

  return criadas;
}


/* ============================================================
 * RECUSA
 * ============================================================
 */

function rnsAprovacaoRecusar_(
  idSolicitacao,
  motivo
) {
  rnUsuariosExigirPerfilAdministrativo();

  var motivoNormalizado =
    rncTexto_(
      motivo
    );

  if (!motivoNormalizado) {
    throw new Error(
      'Informe o motivo da recusa.'
    );
  }

  var solicitacao =
    rnsAprovacaoExigirSolicitacao_(
      idSolicitacao
    );

  rnsAprovacaoExigirStatusPermitido_(
    solicitacao,
    [
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .PENDENTE,

      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .EM_ANALISE
    ]
  );

  var atualizada =
    rnsCoreAtualizarRegistro_(
      idSolicitacao,
      {
        STATUS:
          ARYA_RN_SOLICITACOES_CONFIG
            .STATUS
            .RECUSADO,

        MOTIVO_RECUSA:
          motivoNormalizado,

        RECUSADO_POR:
          rnUsuariosObterEmailAtual(),

        DATA_RECUSA:
          new Date()
      }
    );

  return rnsCorePrepararRetorno_(
    atualizada
  );
}


/* ============================================================
 * DUPLICIDADE
 * ============================================================
 */

function rnsAprovacaoMarcarDuplicada_(
  idSolicitacao,
  idPacienteExistente,
  observacao
) {
  rnUsuariosExigirPerfilAdministrativo();

  var solicitacao =
    rnsAprovacaoExigirSolicitacao_(
      idSolicitacao
    );

  rnsAprovacaoExigirStatusPermitido_(
    solicitacao,
    [
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .PENDENTE,

      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .EM_ANALISE
    ]
  );

  var pacienteNormalizado =
    rncNormalizarId_(
      idPacienteExistente
    );

  if (pacienteNormalizado) {
    var paciente =
      rnPacientesBuscarPorId(
        pacienteNormalizado
      );

    if (!paciente) {
      throw new Error(
        'O paciente indicado como duplicado não foi encontrado.'
      );
    }
  }

  var atualizada =
    rnsCoreAtualizarRegistro_(
      idSolicitacao,
      {
        STATUS:
          ARYA_RN_SOLICITACOES_CONFIG
            .STATUS
            .DUPLICADO,

        ID_PACIENTE_EXISTENTE:
          pacienteNormalizado,

        OBSERVACOES_DUPLICIDADE:
          rncTexto_(
            observacao
          ),

        MARCADO_DUPLICADO_POR:
          rnUsuariosObterEmailAtual(),

        DATA_DUPLICIDADE:
          new Date()
      }
    );

  return rnsCorePrepararRetorno_(
    atualizada
  );
}


/* ============================================================
 * VALIDAÇÕES INTERNAS
 * ============================================================
 */

function rnsAprovacaoExigirSolicitacao_(
  idSolicitacao
) {
  var idNormalizado =
    rncNormalizarId_(
      idSolicitacao
    );

  if (!idNormalizado) {
    throw new Error(
      'Solicitação não informada.'
    );
  }

  var solicitacao =
    rnsCoreBuscarRegistroPorId_(
      idNormalizado
    );

  if (!solicitacao) {
    throw new Error(
      'Solicitação não encontrada.'
    );
  }

  return solicitacao;
}


function rnsAprovacaoExigirStatusPermitido_(
  solicitacao,
  statusPermitidos
) {
  var statusAtual =
    rnsCoreObterStatus_(
      solicitacao
    );

  if (
    (
      statusPermitidos || []
    ).indexOf(
      statusAtual
    ) === -1
  ) {
    throw new Error(
      'A solicitação está com status ' +
      statusAtual +
      ' e não pode realizar esta operação.'
    );
  }
}


/* ============================================================
 * GERAÇÃO DE IDs
 * ============================================================
 */

function rnsAprovacaoGerarIdPaciente_() {
  if (
    typeof dbGerarId ===
      'function'
  ) {
    return dbGerarId(
      'PAC'
    );
  }

  return (
    'PAC-' +
    Utilities.getUuid()
      .substring(0, 8)
      .toUpperCase()
  );
}


function rnsAprovacaoGerarIdAssociacao_() {
  if (
    typeof dbGerarId ===
      'function'
  ) {
    return dbGerarId(
      'ASC'
    );
  }

  return (
    'ASC-' +
    Utilities.getUuid()
      .substring(0, 8)
      .toUpperCase()
  );
}