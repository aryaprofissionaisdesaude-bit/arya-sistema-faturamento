/**
 * ============================================================
 * ÁRYA SAÚDE
 * REGRAS DE NEGÓCIO — CONVÊNIOS
 * ARQUIVO: RN_Convenios.gs
 * ============================================================
 *
 * Responsabilidades:
 * - listar convênios cadastrados;
 * - retornar somente convênios ativos por padrão;
 * - buscar convênio por ID;
 * - validar convênios;
 * - carregar o convênio padrão de um paciente;
 * - preparar opções para menus suspensos;
 * - fornecer dados seguros para outros módulos.
 *
 * DEPENDÊNCIAS:
 * - Database.gs
 * - RN_Config.gs
 * - RN_Usuarios.gs
 * - RN_Pacientes.gs
 *
 * IMPORTANTE:
 * - este arquivo não grava dados;
 * - este arquivo não altera convênios;
 * - funções internas usam o prefixo "rnv";
 * - funções públicas usam o prefixo "rnConvenios".
 */


/* ============================================================
 * CONFIGURAÇÃO DO MÓDULO
 * ============================================================
 */

var ARYA_RN_CONVENIOS_CONFIG = {
  VERSAO:
    '1.0.0',

  SOMENTE_ATIVOS_POR_PADRAO:
    true,

  PERMITIR_CONVENIO_INATIVO_NO_HISTORICO:
    true,

  MODALIDADE_PARTICULAR:
    'PARTICULAR'
};


/* ============================================================
 * LISTAGEM DE CONVÊNIOS
 * ============================================================
 */

/**
 * Lista os convênios cadastrados.
 *
 * Por padrão, retorna somente convênios ativos.
 *
 * Filtros aceitos:
 * {
 *   incluirInativos: false,
 *   nome: "",
 *   cnpj: "",
 *   registroAns: ""
 * }
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnConveniosListar(filtros) {
  rnvExigirDependencias_();

  var configuracao =
    filtros || {};

  var convenios =
    rnvLerConvenios_();

  if (
    configuracao.incluirInativos !== true &&
    ARYA_RN_CONVENIOS_CONFIG
      .SOMENTE_ATIVOS_POR_PADRAO
  ) {
    convenios =
      convenios.filter(
        function(convenio) {
          return rnvConvenioAtivo_(
            convenio
          );
        }
      );
  }

  convenios =
    rnvAplicarFiltros_(
      convenios,
      configuracao
    );

  var retorno =
    convenios.map(
      function(convenio) {
        return rnvPrepararConvenioRetorno_(
          convenio
        );
      }
    );

  return rncOrdenarPorTexto_(
    retorno,
    'nomeConvenio'
  );
}


/**
 * Lista somente os convênios ativos.
 *
 * Função simples, sem parâmetros, adequada para teste direto
 * pelo seletor de funções do Apps Script.
 *
 * @return {Object[]}
 */
function rnConveniosListarAtivos() {
  return rnConveniosListar({
    incluirInativos:
      false
  });
}


/**
 * Retorna opções reduzidas para menus suspensos.
 *
 * @return {Object[]}
 */
function rnConveniosListarOpcoes() {
  var convenios =
    rnConveniosListarAtivos();

  return convenios.map(
    function(convenio) {
      return {
        idConvenio:
          convenio.idConvenio,

        nomeConvenio:
          convenio.nomeConvenio,

        nomeExibicao:
          convenio.nomeExibicao
      };
    }
  );
}


/**
 * Retorna opções de modalidade de atendimento.
 *
 * Inclui PARTICULAR e os convênios ativos.
 *
 * @return {Object[]}
 */
function rnConveniosListarOpcoesAtendimento() {
  var opcoes = [
    {
      tipoAtendimento:
        ARYA_RN_CONFIG
          .TIPO_ATENDIMENTO
          .PARTICULAR,

      idConvenio:
        '',

      nome:
        'Particular'
    }
  ];

  var convenios =
    rnConveniosListarAtivos();

  convenios.forEach(
    function(convenio) {
      opcoes.push({
        tipoAtendimento:
          ARYA_RN_CONFIG
            .TIPO_ATENDIMENTO
            .CONVENIO,

        idConvenio:
          convenio.idConvenio,

        nome:
          convenio.nomeConvenio
      });
    }
  );

  return opcoes;
}


/* ============================================================
 * CONSULTA INDIVIDUAL
 * ============================================================
 */

/**
 * Busca convênio por ID.
 *
 * Usuários autenticados podem consultar convênios porque essa
 * informação será utilizada nos formulários do sistema.
 *
 * @param {string} idConvenio
 * @return {Object|null}
 */
function rnConveniosBuscarPorId(idConvenio) {
  rnvExigirDependencias_();

  rnUsuariosObterContextoAtual();

  var idNormalizado =
    rncNormalizarId_(
      idConvenio
    );

  if (!idNormalizado) {
    throw new Error(
      'Informe o ID do convênio.'
    );
  }

  var convenio =
    rnvBuscarConvenioPorId_(
      idNormalizado
    );

  return convenio
    ? rnvPrepararConvenioRetorno_(
        convenio
      )
    : null;
}


/**
 * Busca convênio pelo CNPJ.
 *
 * @param {string} cnpj
 * @return {Object|null}
 */
function rnConveniosBuscarPorCnpj(cnpj) {
  rnvExigirDependencias_();

  rnUsuariosObterContextoAtual();

  var cnpjNormalizado =
    rncSomenteNumeros_(
      cnpj
    );

  if (!cnpjNormalizado) {
    throw new Error(
      'Informe o CNPJ do convênio.'
    );
  }

  var convenios =
    rnvLerConvenios_();

  var aliasesCnpj =
    rncAliases_(
      'CONVENIOS',
      'CNPJ'
    );

  for (
    var indice = 0;
    indice < convenios.length;
    indice++
  ) {
    var cnpjConvenio =
      rncSomenteNumeros_(
        rncValorPorAlias_(
          convenios[indice],
          aliasesCnpj
        )
      );

    if (
      cnpjConvenio ===
      cnpjNormalizado
    ) {
      return rnvPrepararConvenioRetorno_(
        convenios[indice]
      );
    }
  }

  return null;
}


/**
 * Exige que o convênio exista.
 *
 * @param {string} idConvenio
 * @return {Object}
 */
function rnConveniosExigirExistente(
  idConvenio
) {
  var convenio =
    rnConveniosBuscarPorId(
      idConvenio
    );

  if (!convenio) {
    throw new Error(
      'Convênio não encontrado.'
    );
  }

  return convenio;
}


/**
 * Exige que o convênio exista e esteja ativo.
 *
 * @param {string} idConvenio
 * @return {Object}
 */
function rnConveniosExigirAtivo(
  idConvenio
) {
  var convenio =
    rnConveniosExigirExistente(
      idConvenio
    );

  if (!convenio.ativo) {
    throw new Error(
      'O convênio selecionado está inativo.'
    );
  }

  return convenio;
}


/**
 * Verifica se o convênio está ativo.
 *
 * @param {string} idConvenio
 * @return {boolean}
 */
function rnConveniosEstaAtivo(
  idConvenio
) {
  var convenio =
    rnConveniosBuscarPorId(
      idConvenio
    );

  return Boolean(
    convenio &&
    convenio.ativo
  );
}


/* ============================================================
 * CONVÊNIO DO PACIENTE
 * ============================================================
 */

/**
 * Retorna os dados de atendimento padrão de um paciente,
 * incluindo o convênio cadastrado.
 *
 * Regras:
 *
 * PARTICULAR:
 * - retorna tipo PARTICULAR;
 * - não exige ID_CONVENIO.
 *
 * CONVENIO:
 * - retorna dados da carteirinha;
 * - cruza ID_CONVENIO com a aba CONVENIOS;
 * - informa se o convênio existe e se está ativo.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnConveniosObterDoPaciente(
  idPaciente
) {
  rnvExigirDependencias_();

  var paciente =
    rnPacientesExigirAcesso(
      idPaciente
    );

  var tipoAtendimento =
    rncNormalizarTipoAtendimento_(
      paciente.tipoAtendimentoPadrao
    );

  var idConvenio =
    rncNormalizarId_(
      paciente.idConvenio
    );

  if (
    tipoAtendimento ===
      ARYA_RN_CONFIG
        .TIPO_ATENDIMENTO
        .PARTICULAR ||
    !idConvenio
  ) {
    return {
      idPaciente:
        paciente.idPaciente,

      nomePaciente:
        paciente.nomeExibicao,

      tipoAtendimento:
        ARYA_RN_CONFIG
          .TIPO_ATENDIMENTO
          .PARTICULAR,

      idConvenio:
        '',

      nomeConvenio:
        '',

      numeroCarteirinha:
        '',

      validadeCarteirinha:
        '',

      nomeTitular:
        '',

      cpfTitular:
        '',

      convenioEncontrado:
        false,

      convenioAtivo:
        false,

      aviso:
        ''
    };
  }

  var registroConvenio =
    rnvBuscarConvenioPorId_(
      idConvenio
    );

  var convenioPreparado =
    registroConvenio
      ? rnvPrepararConvenioRetorno_(
          registroConvenio
        )
      : null;

  var nomeConvenio =
    convenioPreparado
      ? convenioPreparado.nomeConvenio
      : rncTexto_(
          paciente.nomeConvenio
        );

  var aviso = '';

  if (!registroConvenio) {
    aviso =
      'O convênio informado no cadastro do paciente não foi encontrado na aba CONVENIOS.';
  } else if (
    !convenioPreparado.ativo
  ) {
    aviso =
      'O convênio informado no cadastro do paciente está inativo.';
  }

  return {
    idPaciente:
      paciente.idPaciente,

    nomePaciente:
      paciente.nomeExibicao,

    tipoAtendimento:
      ARYA_RN_CONFIG
        .TIPO_ATENDIMENTO
        .CONVENIO,

    idConvenio:
      idConvenio,

    nomeConvenio:
      nomeConvenio,

    numeroCarteirinha:
      rncTexto_(
        paciente.numeroCarteirinha
      ),

    validadeCarteirinha:
      rncTexto_(
        paciente.validadeCarteirinha
      ),

    nomeTitular:
      rncTexto_(
        paciente.nomeTitular
      ),

    cpfTitular:
      rncNormalizarCpf_(
        paciente.cpfTitular
      ),

    convenioEncontrado:
      Boolean(
        registroConvenio
      ),

    convenioAtivo:
      Boolean(
        convenioPreparado &&
        convenioPreparado.ativo
      ),

    aviso:
      aviso
  };
}


/**
 * Verifica se o cadastro conveniado do paciente está utilizável.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnConveniosValidarCadastroPaciente(
  idPaciente
) {
  var dados =
    rnConveniosObterDoPaciente(
      idPaciente
    );

  var erros = [];
  var avisos = [];

  if (
    dados.tipoAtendimento ===
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR
  ) {
    return {
      valido:
        true,

      tipoAtendimento:
        dados.tipoAtendimento,

      erros:
        [],

      avisos:
        [],

      dados:
        dados
    };
  }

  if (!dados.idConvenio) {
    erros.push(
      'O paciente está marcado como conveniado, mas não possui ID_CONVENIO.'
    );
  }

  if (!dados.convenioEncontrado) {
    erros.push(
      'O convênio do paciente não foi encontrado.'
    );
  }

  if (
    dados.convenioEncontrado &&
    !dados.convenioAtivo
  ) {
    avisos.push(
      'O convênio do paciente está inativo.'
    );
  }

  if (!dados.numeroCarteirinha) {
    avisos.push(
      'O paciente não possui número de carteirinha cadastrado.'
    );
  }

  if (!dados.validadeCarteirinha) {
    avisos.push(
      'O paciente não possui validade da carteirinha cadastrada.'
    );
  }

  return {
    valido:
      erros.length === 0,

    tipoAtendimento:
      dados.tipoAtendimento,

    erros:
      erros,

    avisos:
      avisos,

    dados:
      dados
  };
}


/* ============================================================
 * FUNÇÕES INTERNAS — LEITURA
 * ============================================================
 */

/**
 * Lê todos os convênios.
 *
 * @return {Object[]}
 */
function rnvLerConvenios_() {
  var nomeAba =
    rncNomeAba_(
      'CONVENIOS'
    );

  if (
    !dbAbaExiste(
      nomeAba
    )
  ) {
    throw new Error(
      'A aba CONVENIOS não foi encontrada.'
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


/**
 * Busca convênio por ID sem aplicar controle de interface.
 *
 * @param {string} idConvenio
 * @return {Object|null}
 */
function rnvBuscarConvenioPorId_(
  idConvenio
) {
  var idNormalizado =
    rncChave_(
      idConvenio
    );

  if (!idNormalizado) {
    return null;
  }

  var convenios =
    rnvLerConvenios_();

  var aliasesId =
    rncAliases_(
      'CONVENIOS',
      'ID_CONVENIO'
    );

  for (
    var indice = 0;
    indice < convenios.length;
    indice++
  ) {
    var idRegistro =
      rncChave_(
        rncValorPorAlias_(
          convenios[indice],
          aliasesId
        )
      );

    if (
      idRegistro ===
      idNormalizado
    ) {
      return convenios[indice];
    }
  }

  return null;
}


/* ============================================================
 * FUNÇÕES INTERNAS — FILTROS
 * ============================================================
 */

/**
 * Aplica filtros à lista de convênios.
 *
 * @param {Object[]} convenios
 * @param {Object} filtros
 * @return {Object[]}
 */
function rnvAplicarFiltros_(
  convenios,
  filtros
) {
  var resultado =
    convenios.slice();

  if (filtros.nome) {
    var nomeFiltro =
      rncRemoverAcentos_(
        filtros.nome
      ).toUpperCase();

    resultado =
      resultado.filter(
        function(convenio) {
          var nome =
            rncRemoverAcentos_(
              rnvObterNomeConvenio_(
                convenio
              )
            ).toUpperCase();

          var nomeFantasia =
            rncRemoverAcentos_(
              rncValorPorAlias_(
                convenio,
                rncAliases_(
                  'CONVENIOS',
                  'NOME_FANTASIA'
                )
              )
            ).toUpperCase();

          return (
            nome.indexOf(
              nomeFiltro
            ) !== -1 ||
            nomeFantasia.indexOf(
              nomeFiltro
            ) !== -1
          );
        }
      );
  }

  if (filtros.cnpj) {
    var cnpjFiltro =
      rncSomenteNumeros_(
        filtros.cnpj
      );

    resultado =
      resultado.filter(
        function(convenio) {
          var cnpjConvenio =
            rncSomenteNumeros_(
              rncValorPorAlias_(
                convenio,
                rncAliases_(
                  'CONVENIOS',
                  'CNPJ'
                )
              )
            );

          return (
            cnpjConvenio ===
            cnpjFiltro
          );
        }
      );
  }

  if (filtros.registroAns) {
    var ansFiltro =
      rncChave_(
        filtros.registroAns
      );

    resultado =
      resultado.filter(
        function(convenio) {
          var registroAns =
            rncValorPorAlias_(
              convenio,
              rncAliases_(
                'CONVENIOS',
                'REGISTRO_ANS'
              )
            );

          return (
            rncChave_(registroAns) ===
            ansFiltro
          );
        }
      );
  }

  return resultado;
}


/* ============================================================
 * FUNÇÕES INTERNAS — STATUS E NOMES
 * ============================================================
 */

/**
 * Verifica se o convênio está ativo.
 *
 * @param {Object} convenio
 * @return {boolean}
 */
function rnvConvenioAtivo_(convenio) {
  return rncRegistroAtivo_(
    convenio,
    rncAliases_(
      'CONVENIOS',
      'ATIVO'
    ),
    true
  );
}


/**
 * Retorna o nome principal do convênio.
 *
 * Prioridade:
 * 1. nome configurado;
 * 2. nome fantasia;
 * 3. ID do convênio.
 *
 * @param {Object} convenio
 * @return {string}
 */
function rnvObterNomeConvenio_(
  convenio
) {
  var nome =
    rncTexto_(
      rncValorPorAlias_(
        convenio,
        rncAliases_(
          'CONVENIOS',
          'NOME'
        )
      )
    );

  var nomeFantasia =
    rncTexto_(
      rncValorPorAlias_(
        convenio,
        rncAliases_(
          'CONVENIOS',
          'NOME_FANTASIA'
        )
      )
    );

  var idConvenio =
    rncNormalizarId_(
      rncValorPorAlias_(
        convenio,
        rncAliases_(
          'CONVENIOS',
          'ID_CONVENIO'
        )
      )
    );

  return (
    nome ||
    nomeFantasia ||
    idConvenio
  );
}


/* ============================================================
 * FUNÇÕES INTERNAS — RETORNO
 * ============================================================
 */

/**
 * Prepara um convênio para retorno seguro.
 *
 * @param {Object} convenio
 * @return {Object}
 */
function rnvPrepararConvenioRetorno_(
  convenio
) {
  var idConvenio =
    rncNormalizarId_(
      rncValorPorAlias_(
        convenio,
        rncAliases_(
          'CONVENIOS',
          'ID_CONVENIO'
        )
      )
    );

  var nomeConvenio =
    rnvObterNomeConvenio_(
      convenio
    );

  var nomeFantasia =
    rncTexto_(
      rncValorPorAlias_(
        convenio,
        rncAliases_(
          'CONVENIOS',
          'NOME_FANTASIA'
        )
      )
    );

  return {
    idConvenio:
      idConvenio,

    nomeConvenio:
      nomeConvenio,

    nomeFantasia:
      nomeFantasia,

    nomeExibicao:
      nomeFantasia ||
      nomeConvenio,

    cnpj:
      rncSomenteNumeros_(
        rncValorPorAlias_(
          convenio,
          rncAliases_(
            'CONVENIOS',
            'CNPJ'
          )
        )
      ),

    registroAns:
      rncTexto_(
        rncValorPorAlias_(
          convenio,
          rncAliases_(
            'CONVENIOS',
            'REGISTRO_ANS'
          )
        )
      ),

    ativo:
      rnvConvenioAtivo_(
        convenio
      )
  };
}


/* ============================================================
 * DEPENDÊNCIAS
 * ============================================================
 */

/**
 * Valida as dependências do módulo.
 *
 * @return {Object}
 */
function rnvValidarDependencias_() {
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
      typeof rnUsuariosObterContextoAtual ===
        'function',

    RNPacientes:
      typeof rnPacientesExigirAcesso ===
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

    dependencias:
      dependencias,

    ausentes:
      ausentes
  };
}


/**
 * Exige as dependências do módulo.
 */
function rnvExigirDependencias_() {
  var resultado =
    rnvValidarDependencias_();

  if (!resultado.valido) {
    throw new Error(
      'Dependências ausentes no RN_Convenios.gs: ' +
      resultado.ausentes.join(', ') +
      '.'
    );
  }
}