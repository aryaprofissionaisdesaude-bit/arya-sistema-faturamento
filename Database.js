/**
 * ============================================================
 * ÁRYA SAÚDE
 * CAMADA CENTRAL DE BANCO DE DADOS
 * ARQUIVO: Database.gs
 * ============================================================
 *
 * Responsabilidades:
 * - centralizar os nomes das abas;
 * - acessar a planilha e suas abas;
 * - validar e configurar estruturas;
 * - ler registros como objetos;
 * - inserir e atualizar registros;
 * - localizar registros por campos;
 * - gerar identificadores;
 * - aplicar validações e formatações.
 *
 * PRINCÍPIO DE SEGURANÇA:
 * - nenhuma função deste arquivo apaga dados automaticamente;
 * - cabeçalhos existentes não são reposicionados;
 * - cabeçalhos ausentes são acrescentados ao final;
 * - abas existentes são preservadas.
 */


/* ============================================================
 * CONFIGURAÇÃO CENTRAL
 * ============================================================
 */

var DB_CONFIG = {
  PROPRIEDADE_ID_PLANILHA:
    'ARYA_PLANILHA_ID',

  LINHA_CABECALHO:
    1,

  PRIMEIRA_LINHA_DADOS:
    2,

  ABAS: {
    INICIO:
      'INICIO',

    AUDITORIA:
      'AUDITORIA',

    CONFIGURACOES:
      'CONFIGURACOES',

    USUARIOS:
      'USUARIOS',

    PERMISSOES:
      'PERMISSOES',

    LOGS:
      'LOGS',

    HISTORICO:
      'HISTORICO',

    PROFISSIONAIS:
      'PROFISSIONAIS',

    PACIENTES:
      'PACIENTES',

    CONVENIOS:
      'CONVENIOS',

    ASSOCIACOES:
      'ASSOCIACOES',

    PROCEDIMENTOS:
      'PROCEDIMENTOS',

    PROCEDIMENTOS_CONVENIOS:
      'PROCEDIMENTOS_CONVENIOS',

    HABILITACAO_PROFISSIONAIS:
      'HABILITACAO_PROFISSIONAIS',

    CONTRATOS_REPASSE:
      'CONTRATOS_REPASSE',

    POLITICAS_FATURAMENTO:
      'POLITICAS_FATURAMENTO',

    CONTRATOS_PROFISSIONAIS:
      'CONTRATOS_PROFISSIONAIS',

    PROTOCOLOS:
      'PROTOCOLOS',

    GUIAS:
      'GUIAS',

    SESSOES:
      'SESSOES',

    REMESSAS:
      'REMESSAS',

    REMESSA_GUIAS:
      'REMESSA_GUIAS',

    PAGAMENTOS:
      'PAGAMENTOS',

    GLOSAS:
      'GLOSAS',

    RESSALVAS:
      'RESSALVAS',

    MOTIVOS:
      'MOTIVOS',

    DOCUMENTOS:
      'DOCUMENTOS',

    IMPORTACOES:
      'IMPORTACOES',

    DASHBOARD:
      'DASHBOARD',

    RELATORIO_FINANCEIRO:
      'RELATORIO_FINANCEIRO',

    RELATORIO_PRODUCAO:
      'RELATORIO_PRODUCAO',

    RELATORIO_CONVENIOS:
      'RELATORIO_CONVENIOS',

    RELATORIO_ASSOCIACOES:
      'RELATORIO_ASSOCIACOES',

    RELATORIO_GLOSAS:
      'RELATORIO_GLOSAS',

    SOLICITACOES_CADASTRO:
      'SOLICITACOES_CADASTRO'
  },

  LISTAS: {
    SIM_NAO: [
      'SIM',
      'NAO'
    ],

    ATIVO_INATIVO: [
      'ATIVO',
      'INATIVO'
    ],

    TIPO_ATENDIMENTO: [
      'CONVENIO',
      'PARTICULAR'
    ],

    STATUS_SOLICITACAO: [
      'PENDENTE',
      'EM_ANALISE',
      'APROVADO',
      'RECUSADO',
      'DUPLICADO'
    ],

    PERFIS_USUARIO: [
      'ADMINISTRADOR',
      'ADMINISTRATIVO',
      'PROFISSIONAL'
    ]
  }
};


/* ============================================================
 * ESTRUTURAS CONHECIDAS
 * ============================================================
 *
 * A configuração automática atua somente nas abas descritas
 * abaixo. As demais abas permanecem registradas em DB_CONFIG,
 * mas não recebem alterações estruturais automáticas.
 */

var DB_ESTRUTURAS = {
  PACIENTES: {
    nomeAba:
      DB_CONFIG.ABAS.PACIENTES,

    criarSeAusente:
      true,

    cabecalhos: [
      'ID_PACIENTE',
      'NOME_COMPLETO',
      'NOME_SOCIAL',
      'CPF',
      'DATA_NASCIMENTO',
      'TELEFONE',
      'EMAIL',
      'TIPO_ATENDIMENTO_PADRAO',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'NÚMERO_CARTEIRINHA',
      'VALIDADE_CARTEIRINHA',
      'NOME_TITULAR',
      'CPF_TITULAR',
      'ID_PROFISSIONAL_RESPONSAVEL',
      'ATIVO',
      'DATA_CADASTRO',
      'OBSERVAÇÕES'
    ],

    validacoes: {
      TIPO_ATENDIMENTO_PADRAO:
        DB_CONFIG.LISTAS.TIPO_ATENDIMENTO,

      ATIVO:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [
      'DATA_NASCIMENTO',
      'VALIDADE_CARTEIRINHA',
      'DATA_CADASTRO'
    ],

    colunasTexto: [
      'ID_PACIENTE',
      'CPF',
      'TELEFONE',
      'ID_CONVENIO',
      'NÚMERO_CARTEIRINHA',
      'CPF_TITULAR',
      'ID_PROFISSIONAL_RESPONSAVEL'
    ]
  },

  SOLICITACOES_CADASTRO: {
    nomeAba:
      DB_CONFIG.ABAS.SOLICITACOES_CADASTRO,

    criarSeAusente:
      true,

    cabecalhos: [
      'ID_SOLICITACAO',
      'DATA_SOLICITACAO',
      'STATUS',
      'NOME_COMPLETO',
      'NOME_SOCIAL',
      'CPF',
      'DATA_NASCIMENTO',
      'TELEFONE',
      'EMAIL',
      'TIPO_ATENDIMENTO_INFORMADO',
      'ID_CONVENIO_INFORMADO',
      'NOME_CONVENIO_INFORMADO',
      'OUTRO_CONVENIO_INFORMADO',
      'NUMERO_CARTEIRINHA',
      'VALIDADE_CARTEIRINHA',
      'NOME_TITULAR',
      'CPF_TITULAR',
      'CONSENTIMENTO_DADOS',
      'DATA_CONSENTIMENTO',
      'OBSERVACOES_PACIENTE',
      'ID_PROFISSIONAL_RESPONSAVEL',
      'OBSERVACOES_INTERNAS',
      'ID_PACIENTE_GERADO',
      'DATA_ANALISE',
      'ANALISADO_POR',
      'DATA_APROVACAO',
      'APROVADO_POR',
      'MOTIVO_RECUSA'
    ],

    validacoes: {
      STATUS:
        DB_CONFIG.LISTAS.STATUS_SOLICITACAO,

      TIPO_ATENDIMENTO_INFORMADO:
        DB_CONFIG.LISTAS.TIPO_ATENDIMENTO,

      CONSENTIMENTO_DADOS:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [
      'DATA_SOLICITACAO',
      'DATA_NASCIMENTO',
      'VALIDADE_CARTEIRINHA',
      'DATA_CONSENTIMENTO',
      'DATA_ANALISE',
      'DATA_APROVACAO'
    ],

    colunasTexto: [
      'ID_SOLICITACAO',
      'CPF',
      'TELEFONE',
      'ID_CONVENIO_INFORMADO',
      'NUMERO_CARTEIRINHA',
      'CPF_TITULAR',
      'ID_PROFISSIONAL_RESPONSAVEL',
      'ID_PACIENTE_GERADO'
    ]
  },

  USUARIOS: {
    nomeAba:
      DB_CONFIG.ABAS.USUARIOS,

    criarSeAusente:
      false,

    cabecalhos: [],

    validacoes: {
      PERFIL:
        DB_CONFIG.LISTAS.PERFIS_USUARIO,

      ATIVO:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [],

    colunasTexto: [
      'ID_USUARIO',
      'EMAIL',
      'ID_PROFISSIONAL'
    ]
  },

  PROFISSIONAIS: {
    nomeAba:
      DB_CONFIG.ABAS.PROFISSIONAIS,

    criarSeAusente:
      false,

    cabecalhos: [],

    validacoes: {
      ATIVO:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [],

    colunasTexto: [
      'ID_PROFISSIONAL',
      'CPF',
      'TELEFONE',
      'REGISTRO_PROFISSIONAL'
    ]
  },

  CONVENIOS: {
    nomeAba:
      DB_CONFIG.ABAS.CONVENIOS,

    criarSeAusente:
      false,

    cabecalhos: [],

    validacoes: {
      ATIVO:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [],

    colunasTexto: [
      'ID_CONVENIO',
      'CNPJ'
    ]
  },

  PROCEDIMENTOS: {
    nomeAba:
      DB_CONFIG.ABAS.PROCEDIMENTOS,

    criarSeAusente:
      false,

    cabecalhos: [],

    validacoes: {
      ATIVO:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [],

    colunasTexto: [
      'ID_PROCEDIMENTO',
      'CODIGO_PROCEDIMENTO'
    ]
  },

  ASSOCIACOES: {
    nomeAba:
      DB_CONFIG.ABAS.ASSOCIACOES,

    criarSeAusente:
      false,

    cabecalhos: [],

    validacoes: {
      ATIVO:
        DB_CONFIG.LISTAS.SIM_NAO
    },

    colunasData: [],

    colunasTexto: [
      'ID_ASSOCIACAO',
      'ID_PACIENTE',
      'ID_PROFISSIONAL'
    ]
  }
};


/* ============================================================
 * ACESSO À PLANILHA
 * ============================================================
 */

/**
 * Retorna a planilha principal do sistema.
 *
 * Prioridade:
 * 1. ID salvo nas propriedades do script;
 * 2. planilha ativa vinculada ao projeto.
 *
 * @return {Spreadsheet}
 */
function dbObterPlanilha() {
  var propriedades =
    PropertiesService.getScriptProperties();

  var idPlanilha =
    propriedades.getProperty(
      DB_CONFIG.PROPRIEDADE_ID_PLANILHA
    );

  if (idPlanilha) {
    return SpreadsheetApp.openById(
      idPlanilha
    );
  }

  var planilhaAtiva =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!planilhaAtiva) {
    throw new Error(
      'Não foi possível localizar a planilha principal. ' +
      'Vincule o projeto a uma planilha ou configure o ID.'
    );
  }

  return planilhaAtiva;
}


/**
 * Salva explicitamente o ID da planilha principal.
 *
 * Normalmente não é necessário executar esta função em
 * projetos vinculados diretamente à planilha.
 *
 * @param {string} idPlanilha
 * @return {Object}
 */
function dbConfigurarIdPlanilha(idPlanilha) {
  var idNormalizado =
    dbTexto_(idPlanilha);

  if (!idNormalizado) {
    throw new Error(
      'Informe um ID de planilha válido.'
    );
  }

  SpreadsheetApp.openById(
    idNormalizado
  );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      DB_CONFIG.PROPRIEDADE_ID_PLANILHA,
      idNormalizado
    );

  return {
    sucesso:
      true,

    idPlanilha:
      idNormalizado
  };
}


/**
 * Remove o ID salvo e volta a utilizar a planilha ativa.
 *
 * @return {Object}
 */
function dbRemoverIdPlanilhaConfigurado() {
  PropertiesService
    .getScriptProperties()
    .deleteProperty(
      DB_CONFIG.PROPRIEDADE_ID_PLANILHA
    );

  return {
    sucesso:
      true
  };
}


/* ============================================================
 * ACESSO ÀS ABAS
 * ============================================================
 */

/**
 * Retorna uma aba pelo nome.
 *
 * @param {string} nomeAba
 * @param {boolean} criarSeAusente
 * @return {Sheet}
 */
function dbObterAba(
  nomeAba,
  criarSeAusente
) {
  var nome =
    dbTexto_(nomeAba);

  if (!nome) {
    throw new Error(
      'O nome da aba não foi informado.'
    );
  }

  var planilha =
    dbObterPlanilha();

  var aba =
    planilha.getSheetByName(
      nome
    );

  if (
    !aba &&
    criarSeAusente === true
  ) {
    aba =
      planilha.insertSheet(
        nome
      );
  }

  if (!aba) {
    throw new Error(
      'A aba "' +
      nome +
      '" não foi encontrada.'
    );
  }

  return aba;
}


/**
 * Verifica se uma aba existe.
 *
 * @param {string} nomeAba
 * @return {boolean}
 */
function dbAbaExiste(nomeAba) {
  var nome =
    dbTexto_(nomeAba);

  if (!nome) {
    return false;
  }

  return Boolean(
    dbObterPlanilha()
      .getSheetByName(nome)
  );
}


/* ============================================================
 * ATALHOS DE ABAS
 * ============================================================
 */

function dbAbaUsuarios() {
  return dbObterAba(
    DB_CONFIG.ABAS.USUARIOS,
    false
  );
}

function dbAbaProfissionais() {
  return dbObterAba(
    DB_CONFIG.ABAS.PROFISSIONAIS,
    false
  );
}

function dbAbaPacientes() {
  return dbObterAba(
    DB_CONFIG.ABAS.PACIENTES,
    false
  );
}

function dbAbaConvenios() {
  return dbObterAba(
    DB_CONFIG.ABAS.CONVENIOS,
    false
  );
}

function dbAbaAssociacoes() {
  return dbObterAba(
    DB_CONFIG.ABAS.ASSOCIACOES,
    false
  );
}

function dbAbaProcedimentos() {
  return dbObterAba(
    DB_CONFIG.ABAS.PROCEDIMENTOS,
    false
  );
}

function dbAbaProcedimentosConvenios() {
  return dbObterAba(
    DB_CONFIG.ABAS.PROCEDIMENTOS_CONVENIOS,
    false
  );
}

function dbAbaHabilitacaoProfissionais() {
  return dbObterAba(
    DB_CONFIG.ABAS.HABILITACAO_PROFISSIONAIS,
    false
  );
}

function dbAbaProtocolos() {
  return dbObterAba(
    DB_CONFIG.ABAS.PROTOCOLOS,
    false
  );
}

function dbAbaGuias() {
  return dbObterAba(
    DB_CONFIG.ABAS.GUIAS,
    false
  );
}

function dbAbaSessoes() {
  return dbObterAba(
    DB_CONFIG.ABAS.SESSOES,
    false
  );
}

function dbAbaSolicitacoesCadastro() {
  return dbObterAba(
    DB_CONFIG.ABAS.SOLICITACOES_CADASTRO,
    true
  );
}


/* ============================================================
 * LEITURA DE CABEÇALHOS
 * ============================================================
 */

/**
 * Retorna os cabeçalhos preenchidos da aba.
 *
 * @param {Sheet|string} abaOuNome
 * @return {string[]}
 */
function dbObterCabecalhos(abaOuNome) {
  var aba =
    dbResolverAba_(abaOuNome);

  var ultimaColuna =
    aba.getLastColumn();

  if (ultimaColuna < 1) {
    return [];
  }

  var valores =
    aba
      .getRange(
        DB_CONFIG.LINHA_CABECALHO,
        1,
        1,
        ultimaColuna
      )
      .getDisplayValues()[0];

  var ultimaPosicaoPreenchida =
    valores.length - 1;

  while (
    ultimaPosicaoPreenchida >= 0 &&
    !dbTexto_(valores[ultimaPosicaoPreenchida])
  ) {
    ultimaPosicaoPreenchida--;
  }

  if (ultimaPosicaoPreenchida < 0) {
    return [];
  }

  return valores
    .slice(
      0,
      ultimaPosicaoPreenchida + 1
    )
    .map(function(valor) {
      return dbTexto_(valor);
    });
}


/**
 * Retorna um mapa no formato:
 *
 * {
 *   ID_PACIENTE: 1,
 *   NOME_COMPLETO: 2
 * }
 *
 * Os índices são baseados em 1, como as colunas do Sheets.
 *
 * @param {Sheet|string} abaOuNome
 * @return {Object}
 */
function dbMapaCabecalhos(abaOuNome) {
  var cabecalhos =
    dbObterCabecalhos(
      abaOuNome
    );

  var mapa = {};

  cabecalhos.forEach(
    function(cabecalho, indice) {
      var chave =
        dbNormalizarCabecalho_(
          cabecalho
        );

      if (chave) {
        mapa[chave] =
          indice + 1;
      }
    }
  );

  return mapa;
}


/**
 * Retorna o número de uma coluna.
 *
 * @param {Sheet|string} abaOuNome
 * @param {string} cabecalho
 * @param {boolean} obrigatorio
 * @return {number|null}
 */
function dbObterNumeroColuna(
  abaOuNome,
  cabecalho,
  obrigatorio
) {
  var mapa =
    dbMapaCabecalhos(
      abaOuNome
    );

  var chave =
    dbNormalizarCabecalho_(
      cabecalho
    );

  var numero =
    mapa[chave] || null;

  if (
    !numero &&
    obrigatorio !== false
  ) {
    throw new Error(
      'O cabeçalho "' +
      cabecalho +
      '" não foi encontrado.'
    );
  }

  return numero;
}


/* ============================================================
 * LEITURA DE REGISTROS
 * ============================================================
 */

/**
 * Lê uma tabela e transforma cada linha em objeto.
 *
 * @param {Sheet|string} abaOuNome
 * @param {Object=} opcoes
 * @return {Object[]}
 */
function dbLerRegistros(
  abaOuNome,
  opcoes
) {
  var configuracao =
    opcoes || {};

  var aba =
    dbResolverAba_(abaOuNome);

  var cabecalhos =
    dbObterCabecalhos(
      aba
    );

  if (!cabecalhos.length) {
    return [];
  }

  var ultimaLinha =
    aba.getLastRow();

  if (
    ultimaLinha <
    DB_CONFIG.PRIMEIRA_LINHA_DADOS
  ) {
    return [];
  }

  var quantidadeLinhas =
    ultimaLinha -
    DB_CONFIG.PRIMEIRA_LINHA_DADOS +
    1;

  var valores =
    aba
      .getRange(
        DB_CONFIG.PRIMEIRA_LINHA_DADOS,
        1,
        quantidadeLinhas,
        cabecalhos.length
      )
      .getValues();

  var registros = [];

  valores.forEach(
    function(linha, indiceLinha) {
      if (
        dbLinhaVazia_(linha) &&
        configuracao.incluirLinhasVazias !== true
      ) {
        return;
      }

      var registro = {};

      cabecalhos.forEach(
        function(cabecalho, indiceColuna) {
          registro[
            dbNormalizarCabecalho_(
              cabecalho
            )
          ] =
            linha[indiceColuna];
        }
      );

      if (
        configuracao.incluirNumeroLinha === true
      ) {
        registro._NUMERO_LINHA =
          DB_CONFIG.PRIMEIRA_LINHA_DADOS +
          indiceLinha;
      }

      registros.push(
        registro
      );
    }
  );

  return registros;
}


/**
 * Busca o primeiro registro que corresponde a um campo.
 *
 * @param {Sheet|string} abaOuNome
 * @param {string} campo
 * @param {*} valor
 * @param {Object=} opcoes
 * @return {Object|null}
 */
function dbBuscarPrimeiroPorCampo(
  abaOuNome,
  campo,
  valor,
  opcoes
) {
  var registros =
    dbLerRegistros(
      abaOuNome,
      {
        incluirNumeroLinha:
          true
      }
    );

  var chave =
    dbNormalizarCabecalho_(
      campo
    );

  var valorComparacao =
    dbNormalizarComparacao_(
      valor,
      opcoes
    );

  for (
    var indice = 0;
    indice < registros.length;
    indice++
  ) {
    var registro =
      registros[indice];

    var valorRegistro =
      dbNormalizarComparacao_(
        registro[chave],
        opcoes
      );

    if (
      valorRegistro ===
      valorComparacao
    ) {
      return registro;
    }
  }

  return null;
}


/**
 * Busca todos os registros correspondentes.
 *
 * @param {Sheet|string} abaOuNome
 * @param {string} campo
 * @param {*} valor
 * @param {Object=} opcoes
 * @return {Object[]}
 */
function dbBuscarTodosPorCampo(
  abaOuNome,
  campo,
  valor,
  opcoes
) {
  var registros =
    dbLerRegistros(
      abaOuNome,
      {
        incluirNumeroLinha:
          true
      }
    );

  var chave =
    dbNormalizarCabecalho_(
      campo
    );

  var valorComparacao =
    dbNormalizarComparacao_(
      valor,
      opcoes
    );

  return registros.filter(
    function(registro) {
      return (
        dbNormalizarComparacao_(
          registro[chave],
          opcoes
        ) ===
        valorComparacao
      );
    }
  );
}


/* ============================================================
 * INSERÇÃO E ATUALIZAÇÃO
 * ============================================================
 */

/**
 * Insere um objeto como nova linha.
 *
 * Campos inexistentes no objeto ficam vazios.
 * Propriedades desconhecidas são ignoradas.
 *
 * @param {Sheet|string} abaOuNome
 * @param {Object} registro
 * @return {Object}
 */
function dbInserirRegistro(
  abaOuNome,
  registro
) {
  if (
    !registro ||
    typeof registro !== 'object'
  ) {
    throw new Error(
      'Informe um registro válido para inserção.'
    );
  }

  var aba =
    dbResolverAba_(abaOuNome);

  var cabecalhos =
    dbObterCabecalhos(
      aba
    );

  if (!cabecalhos.length) {
    throw new Error(
      'A aba "' +
      aba.getName() +
      '" não possui cabeçalhos.'
    );
  }

  var registroNormalizado =
    dbNormalizarObjeto_(
      registro
    );

  var linha =
    cabecalhos.map(
      function(cabecalho) {
        var chave =
          dbNormalizarCabecalho_(
            cabecalho
          );

        return Object.prototype
          .hasOwnProperty.call(
            registroNormalizado,
            chave
          )
          ? registroNormalizado[chave]
          : '';
      }
    );

  var numeroLinha =
    Math.max(
      aba.getLastRow() + 1,
      DB_CONFIG.PRIMEIRA_LINHA_DADOS
    );

  aba
    .getRange(
      numeroLinha,
      1,
      1,
      linha.length
    )
    .setValues([
      linha
    ]);

  return {
    sucesso:
      true,

    aba:
      aba.getName(),

    numeroLinha:
      numeroLinha
  };
}


/**
 * Atualiza uma linha existente.
 *
 * Apenas os campos informados são modificados.
 *
 * @param {Sheet|string} abaOuNome
 * @param {number} numeroLinha
 * @param {Object} alteracoes
 * @return {Object}
 */
function dbAtualizarRegistro(
  abaOuNome,
  numeroLinha,
  alteracoes
) {
  var linha =
    Number(numeroLinha);

  if (
    !linha ||
    linha <
    DB_CONFIG.PRIMEIRA_LINHA_DADOS
  ) {
    throw new Error(
      'Número de linha inválido para atualização.'
    );
  }

  if (
    !alteracoes ||
    typeof alteracoes !== 'object'
  ) {
    throw new Error(
      'Informe as alterações do registro.'
    );
  }

  var aba =
    dbResolverAba_(abaOuNome);

  if (
    linha >
    aba.getLastRow()
  ) {
    throw new Error(
      'A linha informada não existe na aba.'
    );
  }

  var cabecalhos =
    dbObterCabecalhos(
      aba
    );

  var registroNormalizado =
    dbNormalizarObjeto_(
      alteracoes
    );

  var intervalo =
    aba.getRange(
      linha,
      1,
      1,
      cabecalhos.length
    );

  var valoresAtuais =
    intervalo.getValues()[0];

  cabecalhos.forEach(
    function(cabecalho, indice) {
      var chave =
        dbNormalizarCabecalho_(
          cabecalho
        );

      if (
        Object.prototype
          .hasOwnProperty.call(
            registroNormalizado,
            chave
          )
      ) {
        valoresAtuais[indice] =
          registroNormalizado[chave];
      }
    }
  );

  intervalo.setValues([
    valoresAtuais
  ]);

  return {
    sucesso:
      true,

    aba:
      aba.getName(),

    numeroLinha:
      linha
  };
}


/**
 * Atualiza o primeiro registro encontrado por campo.
 *
 * @param {Sheet|string} abaOuNome
 * @param {string} campoBusca
 * @param {*} valorBusca
 * @param {Object} alteracoes
 * @return {Object}
 */
function dbAtualizarPrimeiroPorCampo(
  abaOuNome,
  campoBusca,
  valorBusca,
  alteracoes
) {
  var registro =
    dbBuscarPrimeiroPorCampo(
      abaOuNome,
      campoBusca,
      valorBusca
    );

  if (!registro) {
    throw new Error(
      'Nenhum registro correspondente foi encontrado.'
    );
  }

  return dbAtualizarRegistro(
    abaOuNome,
    registro._NUMERO_LINHA,
    alteracoes
  );
}


/* ============================================================
 * GERAÇÃO DE IDENTIFICADORES
 * ============================================================
 */

/**
 * Gera um identificador com prefixo e data.
 *
 * Exemplo:
 * PAC-20260718-A1B2C3
 *
 * @param {string} prefixo
 * @return {string}
 */
function dbGerarId(prefixo) {
  var prefixoNormalizado =
    dbTexto_(prefixo)
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ''
      );

  if (!prefixoNormalizado) {
    prefixoNormalizado =
      'ID';
  }

  var data =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyyMMdd'
    );

  var aleatorio =
    Utilities
      .getUuid()
      .replace(
        /-/g,
        ''
      )
      .substring(
        0,
        6
      )
      .toUpperCase();

  return [
    prefixoNormalizado,
    data,
    aleatorio
  ].join('-');
}


/* ============================================================
 * CONFIGURAÇÃO AUTOMÁTICA DO BANCO
 * ============================================================
 */

/**
 * Configura as estruturas conhecidas do banco.
 *
 * Esta função:
 * - cria abas autorizadas quando ausentes;
 * - acrescenta cabeçalhos faltantes ao final;
 * - preserva cabeçalhos e dados existentes;
 * - congela a linha 1;
 * - aplica filtros;
 * - aplica validações;
 * - aplica formatos;
 * - ajusta dimensões básicas.
 *
 * @return {Object}
 */
function configurarEstruturaBanco() {
  var bloqueio =
    LockService.getScriptLock();

  bloqueio.waitLock(
    30000
  );

  try {
    var relatorio = {
      sucesso:
        true,

      planilha:
        dbObterPlanilha()
          .getName(),

      abasProcessadas: [],

      avisos: []
    };

    Object.keys(
      DB_ESTRUTURAS
    ).forEach(
      function(chaveEstrutura) {
        var estrutura =
          DB_ESTRUTURAS[
            chaveEstrutura
          ];

        if (
          !dbAbaExiste(
            estrutura.nomeAba
          ) &&
          estrutura.criarSeAusente !== true
        ) {
          relatorio.avisos.push(
            'A aba "' +
            estrutura.nomeAba +
            '" não existe e não foi criada automaticamente.'
          );

          return;
        }

        var resultado =
          dbConfigurarEstruturaAba_(
            estrutura
          );

        relatorio.abasProcessadas.push(
          resultado
        );
      }
    );

    SpreadsheetApp.flush();

    console.log(
      JSON.stringify(
        relatorio,
        null,
        2
      )
    );

    return relatorio;
  } finally {
    bloqueio.releaseLock();
  }
}


/**
 * Valida as estruturas sem alterar a planilha.
 *
 * @return {Object}
 */
function validarEstruturaBanco() {
  var resultado = {
    valido:
      true,

    planilha:
      dbObterPlanilha()
        .getName(),

    abas: []
  };

  Object.keys(
    DB_ESTRUTURAS
  ).forEach(
    function(chaveEstrutura) {
      var estrutura =
        DB_ESTRUTURAS[
          chaveEstrutura
        ];

      if (
        !dbAbaExiste(
          estrutura.nomeAba
        )
      ) {
        resultado.valido =
          false;

        resultado.abas.push({
          aba:
            estrutura.nomeAba,

          existe:
            false,

          cabecalhosAusentes:
            estrutura.cabecalhos || []
        });

        return;
      }

      var aba =
        dbObterAba(
          estrutura.nomeAba,
          false
        );

      var mapa =
        dbMapaCabecalhos(
          aba
        );

      var ausentes =
        (
          estrutura.cabecalhos ||
          []
        ).filter(
          function(cabecalho) {
            return !mapa[
              dbNormalizarCabecalho_(
                cabecalho
              )
            ];
          }
        );

      if (ausentes.length) {
        resultado.valido =
          false;
      }

      resultado.abas.push({
        aba:
          estrutura.nomeAba,

        existe:
          true,

        cabecalhosAusentes:
          ausentes
      });
    }
  );

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/* ============================================================
 * TESTE DO DATABASE
 * ============================================================
 */

/**
 * Teste básico da camada de banco.
 *
 * Não grava nem altera dados.
 *
 * @return {Object}
 */
function testarDatabase() {
  var planilha =
    dbObterPlanilha();

  var resultado = {
    sucesso:
      true,

    nomePlanilha:
      planilha.getName(),

    idPlanilha:
      planilha.getId(),

    pacientesExiste:
      dbAbaExiste(
        DB_CONFIG.ABAS.PACIENTES
      ),

    solicitacoesExiste:
      dbAbaExiste(
        DB_CONFIG.ABAS.SOLICITACOES_CADASTRO
      ),

    quantidadePacientes:
      0,

    quantidadeSolicitacoes:
      0
  };

  if (
    resultado.pacientesExiste
  ) {
    resultado.quantidadePacientes =
      dbLerRegistros(
        DB_CONFIG.ABAS.PACIENTES
      ).length;
  }

  if (
    resultado.solicitacoesExiste
  ) {
    resultado.quantidadeSolicitacoes =
      dbLerRegistros(
        DB_CONFIG.ABAS.SOLICITACOES_CADASTRO
      ).length;
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


/* ============================================================
 * FUNÇÕES INTERNAS DE CONFIGURAÇÃO
 * ============================================================
 */

/**
 * Configura uma aba segundo sua estrutura.
 *
 * @param {Object} estrutura
 * @return {Object}
 */
function dbConfigurarEstruturaAba_(
  estrutura
) {
  var aba =
    dbObterAba(
      estrutura.nomeAba,
      estrutura.criarSeAusente === true
    );

  var resultado = {
    aba:
      aba.getName(),

    criada:
      aba.getLastRow() === 0,

    cabecalhosAcrescentados: [],

    validacoesAplicadas: [],

    formatosAplicados: []
  };

  var cabecalhosEsperados =
    estrutura.cabecalhos || [];

  if (cabecalhosEsperados.length) {
    resultado.cabecalhosAcrescentados =
      dbGarantirCabecalhos_(
        aba,
        cabecalhosEsperados
      );
  }

  dbFormatarCabecalho_(
    aba
  );

  dbCongelarCabecalho_(
    aba
  );

  dbAplicarFiltro_(
    aba
  );

  resultado.validacoesAplicadas =
    dbAplicarValidacoes_(
      aba,
      estrutura.validacoes || {}
    );

  resultado.formatosAplicados =
    dbAplicarFormatos_(
      aba,
      estrutura
    );

  dbAjustarDimensoes_(
    aba
  );

  return resultado;
}


/**
 * Acrescenta cabeçalhos ausentes ao final.
 *
 * @param {Sheet} aba
 * @param {string[]} cabecalhosEsperados
 * @return {string[]}
 */
function dbGarantirCabecalhos_(
  aba,
  cabecalhosEsperados
) {
  var cabecalhosAtuais =
    dbObterCabecalhos(
      aba
    );

  var mapaAtual = {};

  cabecalhosAtuais.forEach(
    function(cabecalho) {
      mapaAtual[
        dbNormalizarCabecalho_(
          cabecalho
        )
      ] =
        true;
    }
  );

  var ausentes =
    cabecalhosEsperados.filter(
      function(cabecalho) {
        return !mapaAtual[
          dbNormalizarCabecalho_(
            cabecalho
          )
        ];
      }
    );

  if (!ausentes.length) {
    return [];
  }

  var colunaInicial =
    cabecalhosAtuais.length + 1;

  if (
    aba.getMaxColumns() <
    colunaInicial +
    ausentes.length -
    1
  ) {
    aba.insertColumnsAfter(
      aba.getMaxColumns(),
      (
        colunaInicial +
        ausentes.length -
        1
      ) -
      aba.getMaxColumns()
    );
  }

  aba
    .getRange(
      DB_CONFIG.LINHA_CABECALHO,
      colunaInicial,
      1,
      ausentes.length
    )
    .setValues([
      ausentes
    ]);

  return ausentes;
}


/**
 * Formata visualmente o cabeçalho.
 *
 * @param {Sheet} aba
 */
function dbFormatarCabecalho_(aba) {
  var ultimaColuna =
    aba.getLastColumn();

  if (ultimaColuna < 1) {
    return;
  }

  aba
    .getRange(
      DB_CONFIG.LINHA_CABECALHO,
      1,
      1,
      ultimaColuna
    )
    .setFontWeight(
      'bold'
    )
    .setHorizontalAlignment(
      'center'
    )
    .setVerticalAlignment(
      'middle'
    )
    .setWrap(
      true
    );
}


/**
 * Congela a primeira linha.
 *
 * @param {Sheet} aba
 */
function dbCongelarCabecalho_(aba) {
  if (
    aba.getFrozenRows() < 1
  ) {
    aba.setFrozenRows(
      1
    );
  }
}


/**
 * Cria filtro somente quando não existe.
 *
 * @param {Sheet} aba
 */
function dbAplicarFiltro_(aba) {
  var ultimaColuna =
    aba.getLastColumn();

  if (
    ultimaColuna < 1 ||
    aba.getFilter()
  ) {
    return;
  }

  var ultimaLinha =
    Math.max(
      aba.getLastRow(),
      DB_CONFIG.PRIMEIRA_LINHA_DADOS
    );

  aba
    .getRange(
      DB_CONFIG.LINHA_CABECALHO,
      1,
      ultimaLinha,
      ultimaColuna
    )
    .createFilter();
}


/**
 * Aplica menus suspensos.
 *
 * @param {Sheet} aba
 * @param {Object} validacoes
 * @return {string[]}
 */
function dbAplicarValidacoes_(
  aba,
  validacoes
) {
  var aplicadas = [];

  Object.keys(
    validacoes
  ).forEach(
    function(cabecalho) {
      var numeroColuna =
        dbObterNumeroColuna(
          aba,
          cabecalho,
          false
        );

      if (!numeroColuna) {
        return;
      }

      var opcoes =
        validacoes[cabecalho];

      if (
        !opcoes ||
        !opcoes.length
      ) {
        return;
      }

      var regra =
        SpreadsheetApp
          .newDataValidation()
          .requireValueInList(
            opcoes,
            true
          )
          .setAllowInvalid(
            false
          )
          .setHelpText(
            'Selecione uma das opções disponíveis.'
          )
          .build();

      var quantidadeLinhas =
        Math.max(
          aba.getMaxRows() -
          DB_CONFIG.PRIMEIRA_LINHA_DADOS +
          1,
          1
        );

      aba
        .getRange(
          DB_CONFIG.PRIMEIRA_LINHA_DADOS,
          numeroColuna,
          quantidadeLinhas,
          1
        )
        .setDataValidation(
          regra
        );

      aplicadas.push(
        cabecalho
      );
    }
  );

  return aplicadas;
}


/**
 * Aplica formatos de data e texto.
 *
 * @param {Sheet} aba
 * @param {Object} estrutura
 * @return {string[]}
 */
function dbAplicarFormatos_(
  aba,
  estrutura
) {
  var aplicados = [];

  var quantidadeLinhas =
    Math.max(
      aba.getMaxRows() -
      DB_CONFIG.PRIMEIRA_LINHA_DADOS +
      1,
      1
    );

  (
    estrutura.colunasData ||
    []
  ).forEach(
    function(cabecalho) {
      var numeroColuna =
        dbObterNumeroColuna(
          aba,
          cabecalho,
          false
        );

      if (!numeroColuna) {
        return;
      }

      aba
        .getRange(
          DB_CONFIG.PRIMEIRA_LINHA_DADOS,
          numeroColuna,
          quantidadeLinhas,
          1
        )
        .setNumberFormat(
          'dd/MM/yyyy'
        );

      aplicados.push(
        cabecalho + ':DATA'
      );
    }
  );

  (
    estrutura.colunasTexto ||
    []
  ).forEach(
    function(cabecalho) {
      var numeroColuna =
        dbObterNumeroColuna(
          aba,
          cabecalho,
          false
        );

      if (!numeroColuna) {
        return;
      }

      aba
        .getRange(
          DB_CONFIG.PRIMEIRA_LINHA_DADOS,
          numeroColuna,
          quantidadeLinhas,
          1
        )
        .setNumberFormat(
          '@'
        );

      aplicados.push(
        cabecalho + ':TEXTO'
      );
    }
  );

  return aplicados;
}


/**
 * Ajusta dimensões sem exagerar nas larguras.
 *
 * @param {Sheet} aba
 */
function dbAjustarDimensoes_(aba) {
  var ultimaColuna =
    aba.getLastColumn();

  if (ultimaColuna < 1) {
    return;
  }

  aba.setRowHeight(
    DB_CONFIG.LINHA_CABECALHO,
    42
  );

  aba.autoResizeColumns(
    1,
    ultimaColuna
  );

  for (
    var coluna = 1;
    coluna <= ultimaColuna;
    coluna++
  ) {
    var largura =
      aba.getColumnWidth(
        coluna
      );

    if (largura < 110) {
      aba.setColumnWidth(
        coluna,
        110
      );
    }

    if (largura > 280) {
      aba.setColumnWidth(
        coluna,
        280
      );
    }
  }
}


/* ============================================================
 * FUNÇÕES INTERNAS GERAIS
 * ============================================================
 */

/**
 * Resolve uma aba recebida como objeto ou nome.
 *
 * @param {Sheet|string} abaOuNome
 * @return {Sheet}
 */
function dbResolverAba_(abaOuNome) {
  if (
    abaOuNome &&
    typeof abaOuNome.getName === 'function'
  ) {
    return abaOuNome;
  }

  return dbObterAba(
    abaOuNome,
    false
  );
}


/**
 * Normaliza texto simples.
 *
 * @param {*} valor
 * @return {string}
 */
function dbTexto_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor)
    .trim();
}


/**
 * Normaliza um cabeçalho para uso como chave.
 *
 * Mantém acentos para respeitar os nomes reais das colunas.
 *
 * @param {*} valor
 * @return {string}
 */
function dbNormalizarCabecalho_(valor) {
  return dbTexto_(valor)
    .toUpperCase()
    .replace(
      /\s+/g,
      '_'
    );
}


/**
 * Normaliza todas as chaves de um objeto.
 *
 * @param {Object} objeto
 * @return {Object}
 */
function dbNormalizarObjeto_(objeto) {
  var resultado = {};

  Object.keys(
    objeto
  ).forEach(
    function(chave) {
      resultado[
        dbNormalizarCabecalho_(
          chave
        )
      ] =
        objeto[chave];
    }
  );

  return resultado;
}


/**
 * Normaliza valores para comparação.
 *
 * @param {*} valor
 * @param {Object=} opcoes
 * @return {*}
 */
function dbNormalizarComparacao_(
  valor,
  opcoes
) {
  var configuracao =
    opcoes || {};

  if (
    valor instanceof Date
  ) {
    return valor.getTime();
  }

  if (
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  ) {
    return valor;
  }

  var texto =
    dbTexto_(valor);

  if (
    configuracao.diferenciarMaiusculas === true
  ) {
    return texto;
  }

  return texto.toUpperCase();
}


/**
 * Verifica se uma linha está vazia.
 *
 * @param {Array} linha
 * @return {boolean}
 */
function dbLinhaVazia_(linha) {
  return linha.every(
    function(valor) {
      return (
        valor === '' ||
        valor === null ||
        valor === undefined
      );
    }
  );
}
/**
 * ============================================================
 * COMPATIBILIDADE COM MÓDULOS EXISTENTES
 * ============================================================
 */

/**
 * Mantém compatibilidade com arquivos que utilizam o nome
 * dbListarRegistros.
 *
 * A implementação oficial da camada de banco é dbLerRegistros.
 *
 * @param {Sheet|string} abaOuNome
 * @param {Object=} opcoes
 * @return {Object[]}
 */
function dbListarRegistros(
  abaOuNome,
  opcoes
) {
  return dbLerRegistros(
    abaOuNome,
    opcoes
  );
}