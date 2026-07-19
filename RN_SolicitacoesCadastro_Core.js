/**
 * ============================================================
 * ÁRYA SAÚDE
 * SOLICITAÇÕES DE CADASTRO — NÚCLEO
 * ARQUIVO: RN_SolicitacoesCadastro_Core.gs
 * ============================================================
 *
 * Responsabilidades:
 * - leitura da aba SOLICITACOES_CADASTRO;
 * - criação de solicitações;
 * - consultas e filtros;
 * - normalização de dados;
 * - detecção de duplicidade;
 * - atualização interna de solicitações.
 *
 * Funções internas usam o prefixo:
 * rnsCore
 */


/* ============================================================
 * CONFIGURAÇÃO
 * ============================================================
 */

var ARYA_RN_SOLICITACOES_CONFIG = {
  VERSAO:
    '1.0.0',

  STATUS: {
    PENDENTE:
      'PENDENTE',

    EM_ANALISE:
      'EM_ANALISE',

    APROVADO:
      'APROVADO',

    RECUSADO:
      'RECUSADO',

    DUPLICADO:
      'DUPLICADO'
  },

  STATUS_FINALIZADOS: [
    'APROVADO',
    'RECUSADO',
    'DUPLICADO'
  ]
};


/* ============================================================
 * LISTAGEM
 * ============================================================
 */

function rnsCoreListar_(filtros) {
  rnsCoreExigirDependencias_();

  rnUsuariosExigirPerfilAdministrativo();

  var configuracao =
    filtros || {};

  var solicitacoes =
    rnsCoreLerSolicitacoes_();

  solicitacoes =
    rnsCoreAplicarFiltros_(
      solicitacoes,
      configuracao
    );

  return solicitacoes
    .map(
      function(solicitacao) {
        return rnsCorePrepararRetorno_(
          solicitacao
        );
      }
    )
    .sort(
      rnsCoreOrdenarMaisRecentes_
    );
}


function rnsCoreListarPendentes_() {
  return rnsCoreListar_({
    status:
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .PENDENTE
  });
}


function rnsCoreListarEmAnalise_() {
  return rnsCoreListar_({
    status:
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .EM_ANALISE
  });
}


function rnsCoreListarStatus_() {
  return [
    {
      valor:
        'PENDENTE',

      nome:
        'Pendente'
    },
    {
      valor:
        'EM_ANALISE',

      nome:
        'Em análise'
    },
    {
      valor:
        'APROVADO',

      nome:
        'Aprovado'
    },
    {
      valor:
        'RECUSADO',

      nome:
        'Recusado'
    },
    {
      valor:
        'DUPLICADO',

      nome:
        'Duplicado'
    }
  ];
}


/* ============================================================
 * CONSULTAS
 * ============================================================
 */

function rnsCoreBuscarPorIdPublico_(
  idSolicitacao
) {
  rnsCoreExigirDependencias_();

  rnUsuariosExigirPerfilAdministrativo();

  var registro =
    rnsCoreBuscarRegistroPorId_(
      idSolicitacao
    );

  return registro
    ? rnsCorePrepararRetorno_(
        registro
      )
    : null;
}


function rnsCoreBuscarPorCpf_(cpf) {
  rnsCoreExigirDependencias_();

  rnUsuariosExigirPerfilAdministrativo();

  var cpfNormalizado =
    rncNormalizarCpf_(
      cpf
    );

  if (!cpfNormalizado) {
    throw new Error(
      'Informe o CPF.'
    );
  }

  return rnsCoreLerSolicitacoes_()
    .filter(
      function(solicitacao) {
        var cpfRegistro =
          rncNormalizarCpf_(
            rncValorPorAlias_(
              solicitacao,
              rncAliases_(
                'SOLICITACOES_CADASTRO',
                'CPF'
              )
            )
          );

        return (
          cpfRegistro ===
          cpfNormalizado
        );
      }
    )
    .map(
      rnsCorePrepararRetorno_
    )
    .sort(
      rnsCoreOrdenarMaisRecentes_
    );
}


function rnsCoreBuscarPorEmail_(email) {
  rnsCoreExigirDependencias_();

  rnUsuariosExigirPerfilAdministrativo();

  var emailNormalizado =
    rncNormalizarEmail_(
      email
    );

  if (!emailNormalizado) {
    throw new Error(
      'Informe o e-mail.'
    );
  }

  return rnsCoreLerSolicitacoes_()
    .filter(
      function(solicitacao) {
        var emailRegistro =
          rncNormalizarEmail_(
            rncValorPorAlias_(
              solicitacao,
              rncAliases_(
                'SOLICITACOES_CADASTRO',
                'EMAIL'
              )
            )
          );

        return (
          emailRegistro ===
          emailNormalizado
        );
      }
    )
    .map(
      rnsCorePrepararRetorno_
    )
    .sort(
      rnsCoreOrdenarMaisRecentes_
    );
}


/* ============================================================
 * CADASTRO
 * ============================================================
 */

function rnsCoreCadastrar_(dados) {
  rnsCoreExigirDependencias_();

  var validacao =
    rnsCoreValidarDadosCadastro_(
      dados
    );

  if (!validacao.valido) {
    throw new Error(
      'Solicitação inválida: ' +
      validacao.erros.join(' | ')
    );
  }

  var dadosNormalizados =
    validacao.dados;

  var duplicidade =
    rnsCoreVerificarDuplicidade_(
      dadosNormalizados
    );

  var idSolicitacao =
    rnsCoreGerarIdSolicitacao_();

  var registro = {
    ID_SOLICITACAO:
      idSolicitacao,

    STATUS:
      ARYA_RN_SOLICITACOES_CONFIG
        .STATUS
        .PENDENTE,

    NOME_COMPLETO:
      dadosNormalizados.nomeCompleto,

    NOME_SOCIAL:
      dadosNormalizados.nomeSocial,

    CPF:
      dadosNormalizados.cpf,

    DATA_NASCIMENTO:
      dadosNormalizados.dataNascimento,

    TELEFONE:
      dadosNormalizados.telefone,

    EMAIL:
      dadosNormalizados.email,

    TIPO_ATENDIMENTO_PADRAO:
      dadosNormalizados
        .tipoAtendimentoPadrao,

    ID_CONVENIO:
      dadosNormalizados.idConvenio,

    NOME_CONVENIO:
      dadosNormalizados.nomeConvenio,

    NUMERO_CARTEIRINHA:
      dadosNormalizados.numeroCarteirinha,

    VALIDADE_CARTEIRINHA:
      dadosNormalizados.validadeCarteirinha,

    NOME_TITULAR:
      dadosNormalizados.nomeTitular,

    CPF_TITULAR:
      dadosNormalizados.cpfTitular,

    OBSERVACOES:
      dadosNormalizados.observacoes,

    POSSIVEL_DUPLICIDADE:
      duplicidade.possivelDuplicidade
        ? 'SIM'
        : 'NAO',

    DATA_SOLICITACAO:
      new Date(),

    DATA_ATUALIZACAO:
      new Date()
  };

  var numeroLinha =
    rnsCoreInserirRegistro_(
      registro
    );

  return {
    sucesso:
      true,

    idSolicitacao:
      idSolicitacao,

    numeroLinha:
      numeroLinha,

    status:
      registro.STATUS,

    possivelDuplicidade:
      duplicidade.possivelDuplicidade,

    duplicidades:
      duplicidade.ocorrencias,

    solicitacao:
      rnsCorePrepararRetorno_(
        registro
      )
  };
}


/* ============================================================
 * VALIDAÇÃO DO CADASTRO
 * ============================================================
 */

function rnsCoreValidarDadosCadastro_(dados) {
  var erros = [];

  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    return {
      valido:
        false,

      erros: [
        'Os dados da solicitação não foram informados.'
      ],

      dados:
        {}
    };
  }

  var tipoAtendimento =
    rncNormalizarTipoAtendimento_(
      dados.tipoAtendimentoPadrao ||
      dados.tipoAtendimento
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  var normalizados = {
    nomeCompleto:
      rncTexto_(
        dados.nomeCompleto
      ),

    nomeSocial:
      rncTexto_(
        dados.nomeSocial
      ),

    cpf:
      rncNormalizarCpf_(
        dados.cpf
      ),

    dataNascimento:
      dados.dataNascimento || '',

    telefone:
      rncTexto_(
        dados.telefone
      ),

    email:
      rncNormalizarEmail_(
        dados.email
      ),

    tipoAtendimentoPadrao:
      tipoAtendimento,

    idConvenio:
      rncNormalizarId_(
        dados.idConvenio
      ),

    nomeConvenio:
      rncTexto_(
        dados.nomeConvenio
      ),

    numeroCarteirinha:
      rncTexto_(
        dados.numeroCarteirinha
      ),

    validadeCarteirinha:
      dados.validadeCarteirinha || '',

    nomeTitular:
      rncTexto_(
        dados.nomeTitular
      ),

    cpfTitular:
      rncNormalizarCpf_(
        dados.cpfTitular
      ),

    observacoes:
      rncTexto_(
        dados.observacoes
      )
  };

  if (!normalizados.nomeCompleto) {
    erros.push(
      'Nome completo não informado.'
    );
  }

  if (!normalizados.cpf) {
    erros.push(
      'CPF não informado.'
    );
  }

  if (!normalizados.dataNascimento) {
    erros.push(
      'Data de nascimento não informada.'
    );
  }

  if (!normalizados.telefone) {
    erros.push(
      'Telefone não informado.'
    );
  }

  if (!normalizados.email) {
    erros.push(
      'E-mail não informado.'
    );
  }

  if (
    tipoAtendimento !==
      tipoParticular &&
    tipoAtendimento !==
      tipoConvenio
  ) {
    erros.push(
      'Tipo de atendimento inválido.'
    );
  }

  if (
    tipoAtendimento ===
      tipoConvenio &&
    !normalizados.idConvenio &&
    !normalizados.nomeConvenio
  ) {
    erros.push(
      'Convênio não informado.'
    );
  }

  if (
    tipoAtendimento ===
      tipoParticular
  ) {
    normalizados.idConvenio = '';
    normalizados.nomeConvenio = '';
    normalizados.numeroCarteirinha = '';
    normalizados.validadeCarteirinha = '';
    normalizados.nomeTitular = '';
    normalizados.cpfTitular = '';
  }

  return {
    valido:
      erros.length === 0,

    erros:
      erros,

    dados:
      normalizados
  };
}


/* ============================================================
 * DUPLICIDADE
 * ============================================================
 */

function rnsCoreVerificarDuplicidade_(dados) {
  rnsCoreExigirDependencias_();

  var cpf =
    rncNormalizarCpf_(
      dados && dados.cpf
    );

  var email =
    rncNormalizarEmail_(
      dados && dados.email
    );

  var ocorrencias = [];

  if (cpf || email) {
    rnsCoreVerificarDuplicidadePacientes_(
      cpf,
      email,
      ocorrencias
    );

    rnsCoreVerificarDuplicidadeSolicitacoes_(
      cpf,
      email,
      ocorrencias
    );
  }

  return {
    possivelDuplicidade:
      ocorrencias.length > 0,

    quantidade:
      ocorrencias.length,

    ocorrencias:
      ocorrencias
  };
}


function rnsCoreVerificarDuplicidadePacientes_(
  cpf,
  email,
  ocorrencias
) {
  var nomeAba =
    rncNomeAba_(
      'PACIENTES'
    );

  if (!dbAbaExiste(nomeAba)) {
    return;
  }

  var pacientes =
    dbLerRegistros(
      nomeAba,
      {
        incluirNumeroLinha:
          true
      }
    );

  pacientes.forEach(
    function(paciente) {
      var cpfPaciente =
        rncNormalizarCpf_(
          rncValorPorAlias_(
            paciente,
            rncAliases_(
              'PACIENTES',
              'CPF'
            )
          )
        );

      var emailPaciente =
        rncNormalizarEmail_(
          rncValorPorAlias_(
            paciente,
            rncAliases_(
              'PACIENTES',
              'EMAIL'
            )
          )
        );

      var motivos = [];

      if (
        cpf &&
        cpfPaciente === cpf
      ) {
        motivos.push('CPF');
      }

      if (
        email &&
        emailPaciente === email
      ) {
        motivos.push('EMAIL');
      }

      if (!motivos.length) {
        return;
      }

      ocorrencias.push({
        origem:
          'PACIENTES',

        id:
          rncNormalizarId_(
            rncValorPorAlias_(
              paciente,
              rncAliases_(
                'PACIENTES',
                'ID_PACIENTE'
              )
            )
          ),

        nome:
          rncTexto_(
            rncValorPorAlias_(
              paciente,
              rncAliases_(
                'PACIENTES',
                'NOME_COMPLETO'
              )
            )
          ),

        motivos:
          motivos
      });
    }
  );
}


function rnsCoreVerificarDuplicidadeSolicitacoes_(
  cpf,
  email,
  ocorrencias
) {
  var solicitacoes =
    rnsCoreLerSolicitacoes_();

  solicitacoes.forEach(
    function(solicitacao) {
      var status =
        rnsCoreObterStatus_(
          solicitacao
        );

      if (
        status ===
        ARYA_RN_SOLICITACOES_CONFIG
          .STATUS
          .RECUSADO ||
        status ===
        ARYA_RN_SOLICITACOES_CONFIG
          .STATUS
          .DUPLICADO
      ) {
        return;
      }

      var cpfSolicitacao =
        rncNormalizarCpf_(
          rncValorPorAlias_(
            solicitacao,
            rncAliases_(
              'SOLICITACOES_CADASTRO',
              'CPF'
            )
          )
        );

      var emailSolicitacao =
        rncNormalizarEmail_(
          rncValorPorAlias_(
            solicitacao,
            rncAliases_(
              'SOLICITACOES_CADASTRO',
              'EMAIL'
            )
          )
        );

      var motivos = [];

      if (
        cpf &&
        cpfSolicitacao === cpf
      ) {
        motivos.push('CPF');
      }

      if (
        email &&
        emailSolicitacao === email
      ) {
        motivos.push('EMAIL');
      }

      if (!motivos.length) {
        return;
      }

      ocorrencias.push({
        origem:
          'SOLICITACOES_CADASTRO',

        id:
          rnsCoreObterIdSolicitacao_(
            solicitacao
          ),

        nome:
          rncTexto_(
            rncValorPorAlias_(
              solicitacao,
              rncAliases_(
                'SOLICITACOES_CADASTRO',
                'NOME_COMPLETO'
              )
            )
          ),

        status:
          status,

        motivos:
          motivos
      });
    }
  );
}


/* ============================================================
 * LEITURA E GRAVAÇÃO
 * ============================================================
 */

function rnsCoreLerSolicitacoes_() {
  var nomeAba =
    rncNomeAba_(
      'SOLICITACOES_CADASTRO'
    );

  if (!dbAbaExiste(nomeAba)) {
    throw new Error(
      'A aba SOLICITACOES_CADASTRO não foi encontrada.'
    );
  }

  return dbLerRegistros(
    nomeAba,
    {
      incluirNumeroLinha:
        true
    }
  );
}


function rnsCoreBuscarRegistroPorId_(
  idSolicitacao
) {
  var chaveBusca =
    rncChave_(
      idSolicitacao
    );

  if (!chaveBusca) {
    return null;
  }

  var solicitacoes =
    rnsCoreLerSolicitacoes_();

  for (
    var indice = 0;
    indice < solicitacoes.length;
    indice++
  ) {
    var idRegistro =
      rnsCoreObterIdSolicitacao_(
        solicitacoes[indice]
      );

    if (
      rncChave_(idRegistro) ===
      chaveBusca
    ) {
      return solicitacoes[indice];
    }
  }

  return null;
}


function rnsCoreInserirRegistro_(registro) {
  var nomeAba =
    rncNomeAba_(
      'SOLICITACOES_CADASTRO'
    );

  if (
    typeof dbInserirRegistro !==
      'function'
  ) {
    throw new Error(
      'A função dbInserirRegistro não foi encontrada no Database.gs.'
    );
  }

  return dbInserirRegistro(
    nomeAba,
    registro
  );
}


function rnsCoreAtualizarRegistro_(
  idSolicitacao,
  alteracoes
) {
  var registro =
    rnsCoreBuscarRegistroPorId_(
      idSolicitacao
    );

  if (!registro) {
    throw new Error(
      'Solicitação não encontrada.'
    );
  }

  var numeroLinha =
    registro.__numeroLinha ||
    registro._numeroLinha ||
    registro.numeroLinha;

  if (!numeroLinha) {
    throw new Error(
      'Não foi possível identificar a linha da solicitação.'
    );
  }

  var nomeAba =
    rncNomeAba_(
      'SOLICITACOES_CADASTRO'
    );

  var dadosAtualizados =
    Object.assign(
      {},
      alteracoes || {},
      {
        DATA_ATUALIZACAO:
          new Date()
      }
    );

  if (
    typeof dbAtualizarRegistroPorLinha !==
      'function'
  ) {
    throw new Error(
      'A função dbAtualizarRegistroPorLinha não foi encontrada no Database.gs.'
    );
  }

  dbAtualizarRegistroPorLinha(
    nomeAba,
    numeroLinha,
    dadosAtualizados
  );

  return rnsCoreBuscarRegistroPorId_(
    idSolicitacao
  );
}


/* ============================================================
 * FILTROS
 * ============================================================
 */

function rnsCoreAplicarFiltros_(
  solicitacoes,
  filtros
) {
  var resultado =
    (
      solicitacoes || []
    ).slice();

  if (
    filtros.incluirFinalizadas ===
      false
  ) {
    resultado =
      resultado.filter(
        function(solicitacao) {
          return (
            ARYA_RN_SOLICITACOES_CONFIG
              .STATUS_FINALIZADOS
              .indexOf(
                rnsCoreObterStatus_(
                  solicitacao
                )
              ) === -1
          );
        }
      );
  }

  if (filtros.status) {
    var statusFiltro =
      rncChave_(
        filtros.status
      );

    resultado =
      resultado.filter(
        function(solicitacao) {
          return (
            rncChave_(
              rnsCoreObterStatus_(
                solicitacao
              )
            ) ===
            statusFiltro
          );
        }
      );
  }

  if (filtros.nome) {
    var nomeFiltro =
      rncRemoverAcentos_(
        filtros.nome
      ).toUpperCase();

    resultado =
      resultado.filter(
        function(solicitacao) {
          var nome =
            rncRemoverAcentos_(
              rncValorPorAlias_(
                solicitacao,
                rncAliases_(
                  'SOLICITACOES_CADASTRO',
                  'NOME_COMPLETO'
                )
              )
            ).toUpperCase();

          return (
            nome.indexOf(
              nomeFiltro
            ) !== -1
          );
        }
      );
  }

  if (filtros.cpf) {
    var cpfFiltro =
      rncNormalizarCpf_(
        filtros.cpf
      );

    resultado =
      resultado.filter(
        function(solicitacao) {
          return (
            rncNormalizarCpf_(
              rncValorPorAlias_(
                solicitacao,
                rncAliases_(
                  'SOLICITACOES_CADASTRO',
                  'CPF'
                )
              )
            ) ===
            cpfFiltro
          );
        }
      );
  }

  if (filtros.email) {
    var emailFiltro =
      rncNormalizarEmail_(
        filtros.email
      );

    resultado =
      resultado.filter(
        function(solicitacao) {
          return (
            rncNormalizarEmail_(
              rncValorPorAlias_(
                solicitacao,
                rncAliases_(
                  'SOLICITACOES_CADASTRO',
                  'EMAIL'
                )
              )
            ) ===
            emailFiltro
          );
        }
      );
  }

  return resultado;
}


/* ============================================================
 * DADOS E RETORNO
 * ============================================================
 */

function rnsCoreObterIdSolicitacao_(
  solicitacao
) {
  return rncNormalizarId_(
    rncValorPorAlias_(
      solicitacao,
      rncAliases_(
        'SOLICITACOES_CADASTRO',
        'ID_SOLICITACAO'
      )
    )
  );
}


function rnsCoreObterStatus_(
  solicitacao
) {
  return rncChave_(
    rncValorPorAlias_(
      solicitacao,
      rncAliases_(
        'SOLICITACOES_CADASTRO',
        'STATUS'
      )
    )
  );
}


function rnsCorePrepararRetorno_(
  solicitacao
) {
  return {
    idSolicitacao:
      rnsCoreObterIdSolicitacao_(
        solicitacao
      ),

    status:
      rnsCoreObterStatus_(
        solicitacao
      ),

    nomeCompleto:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'NOME_COMPLETO'
          )
        )
      ),

    nomeSocial:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'NOME_SOCIAL'
          )
        )
      ),

    cpf:
      rncNormalizarCpf_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'CPF'
          )
        )
      ),

    dataNascimento:
      rncValorPorAlias_(
        solicitacao,
        rncAliases_(
          'SOLICITACOES_CADASTRO',
          'DATA_NASCIMENTO'
        )
      ),

    telefone:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'TELEFONE'
          )
        )
      ),

    email:
      rncNormalizarEmail_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'EMAIL'
          )
        )
      ),

    tipoAtendimentoPadrao:
      rncNormalizarTipoAtendimento_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'TIPO_ATENDIMENTO_PADRAO'
          )
        )
      ),

    idConvenio:
      rncNormalizarId_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'ID_CONVENIO'
          )
        )
      ),

    nomeConvenio:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'NOME_CONVENIO'
          )
        )
      ),

    numeroCarteirinha:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'NUMERO_CARTEIRINHA'
          )
        )
      ),

    validadeCarteirinha:
      rncValorPorAlias_(
        solicitacao,
        rncAliases_(
          'SOLICITACOES_CADASTRO',
          'VALIDADE_CARTEIRINHA'
        )
      ),

    nomeTitular:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'NOME_TITULAR'
          )
        )
      ),

    cpfTitular:
      rncNormalizarCpf_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'CPF_TITULAR'
          )
        )
      ),

    observacoes:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'OBSERVACOES'
          )
        )
      ),

    idPacienteGerado:
      rncNormalizarId_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'ID_PACIENTE_GERADO'
          )
        )
      ),

    idProfissionalResponsavel:
      rncNormalizarId_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'ID_PROFISSIONAL_RESPONSAVEL'
          )
        )
      ),

    motivoRecusa:
      rncTexto_(
        rncValorPorAlias_(
          solicitacao,
          rncAliases_(
            'SOLICITACOES_CADASTRO',
            'MOTIVO_RECUSA'
          )
        )
      ),

    dataSolicitacao:
      rncValorPorAlias_(
        solicitacao,
        rncAliases_(
          'SOLICITACOES_CADASTRO',
          'DATA_SOLICITACAO'
        )
      ),

    dataAtualizacao:
      rncValorPorAlias_(
        solicitacao,
        rncAliases_(
          'SOLICITACOES_CADASTRO',
          'DATA_ATUALIZACAO'
        )
      )
  };
}


function rnsCoreGerarIdSolicitacao_() {
  if (
    typeof dbGerarId ===
      'function'
  ) {
    return dbGerarId(
      'SOL'
    );
  }

  return (
    'SOL-' +
    Utilities.getUuid()
      .substring(0, 8)
      .toUpperCase()
  );
}


function rnsCoreOrdenarMaisRecentes_(
  solicitacaoA,
  solicitacaoB
) {
  var dataA =
    new Date(
      solicitacaoA.dataSolicitacao || 0
    ).getTime();

  var dataB =
    new Date(
      solicitacaoB.dataSolicitacao || 0
    ).getTime();

  return dataB - dataA;
}


/* ============================================================
 * DEPENDÊNCIAS
 * ============================================================
 */

function rnsCoreValidarDependencias_() {
  var dependencias = {
    Database:
      typeof dbLerRegistros ===
        'function' &&
      typeof dbAbaExiste ===
        'function',

    RNConfig:
      typeof ARYA_RN_CONFIG !==
        'undefined' &&
      typeof rncAliases_ ===
        'function',

    RNUsuarios:
      typeof rnUsuariosExigirPerfilAdministrativo ===
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


function rnsCoreExigirDependencias_() {
  var resultado =
    rnsCoreValidarDependencias_();

  if (!resultado.valido) {
    throw new Error(
      'Dependências ausentes no módulo de solicitações: ' +
      resultado.ausentes.join(', ') +
      '.'
    );
  }
}