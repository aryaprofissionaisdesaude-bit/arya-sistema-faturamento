/**
 * ============================================================
 * ÁRYA SAÚDE
 * CONFIGURAÇÕES E UTILITÁRIOS DAS REGRAS DE NEGÓCIO
 * ARQUIVO: RN_Config.gs
 * ============================================================
 *
 * Este arquivo centraliza:
 * - perfis e valores padronizados;
 * - aliases de cabeçalhos;
 * - nomes das tabelas utilizadas;
 * - normalização de textos e identificadores;
 * - leitura genérica de campos;
 * - validação de registros ativos;
 * - formatação segura de datas e valores;
 * - funções utilitárias compartilhadas.
 *
 * DEPENDÊNCIA:
 * - Database.gs
 *
 * IMPORTANTE:
 * - este arquivo não grava dados;
 * - este arquivo não altera planilhas;
 * - os nomes usam o prefixo "rnc" para evitar conflito com
 *   o arquivo RegrasNegocio.gs antigo durante a migração.
 */


/* ============================================================
 * CONFIGURAÇÃO CENTRAL
 * ============================================================
 */

var ARYA_RN_CONFIG = {
  VERSAO:
    '1.0.0',

  PERFIS: {
    ADMINISTRADOR:
      'ADMINISTRADOR',

    ADMINISTRATIVO:
      'ADMINISTRATIVO',

    PROFISSIONAL:
      'PROFISSIONAL',

    SECRETARIA:
      'SECRETARIA',

    GESTOR:
      'GESTOR'
  },

  PERFIS_ADMINISTRATIVOS: [
    'ADMINISTRADOR',
    'ADMINISTRATIVO',
    'ADMIN',
    'SECRETARIA',
    'GESTOR'
  ],

  TIPO_ATENDIMENTO: {
    CONVENIO:
      'CONVENIO',

    PARTICULAR:
      'PARTICULAR'
  },

  STATUS_SOLICITACAO: {
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

  VALORES_ATIVOS: [
    'SIM',
    'S',
    'ATIVO',
    'TRUE',
    'VERDADEIRO',
    '1'
  ],

  VALORES_INATIVOS: [
    'NAO',
    'NÃO',
    'N',
    'INATIVO',
    'FALSE',
    'FALSO',
    '0'
  ],

  ABAS: {
    USUARIOS:
      'USUARIOS',

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

    SOLICITACOES_CADASTRO:
      'SOLICITACOES_CADASTRO'
  },

  CABECALHOS: {
    USUARIOS: {
      ID_USUARIO: [
        'ID_USUARIO',
        'ID'
      ],

      EMAIL: [
        'EMAIL',
        'E_MAIL',
        'USUARIO',
        'LOGIN'
      ],

      PERFIL: [
        'PERFIL',
        'TIPO_USUARIO',
        'NIVEL_ACESSO',
        'NÍVEL_ACESSO'
      ],

      ID_PROFISSIONAL: [
        'ID_PROFISSIONAL',
        'PROFISSIONAL_ID'
      ],

      NOME: [
        'NOME',
        'NOME_COMPLETO',
        'NOME_USUARIO'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    PROFISSIONAIS: {
      ID_PROFISSIONAL: [
        'ID_PROFISSIONAL',
        'PROFISSIONAL_ID',
        'ID'
      ],

      NOME: [
        'NOME_COMPLETO',
        'NOME_PROFISSIONAL',
        'NOME'
      ],

      NOME_SOCIAL: [
        'NOME_SOCIAL'
      ],

      CPF: [
        'CPF'
      ],

      EMAIL: [
        'EMAIL',
        'E_MAIL'
      ],

      TELEFONE: [
        'TELEFONE',
        'CELULAR',
        'WHATSAPP'
      ],

      REGISTRO_PROFISSIONAL: [
        'REGISTRO_PROFISSIONAL',
        'CRP',
        'CRN',
        'CRM'
      ],

      ESPECIALIDADE: [
        'ESPECIALIDADE',
        'AREA_ATUACAO',
        'ÁREA_ATUAÇÃO'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    PACIENTES: {
      ID_PACIENTE: [
        'ID_PACIENTE',
        'PACIENTE_ID',
        'ID'
      ],

      NOME_COMPLETO: [
        'NOME_COMPLETO',
        'NOME_PACIENTE',
        'NOME'
      ],

      NOME_SOCIAL: [
        'NOME_SOCIAL'
      ],

      CPF: [
        'CPF'
      ],

      DATA_NASCIMENTO: [
        'DATA_NASCIMENTO',
        'NASCIMENTO'
      ],

      TELEFONE: [
        'TELEFONE',
        'CELULAR',
        'WHATSAPP'
      ],

      EMAIL: [
        'EMAIL',
        'E_MAIL'
      ],

      TIPO_ATENDIMENTO: [
        'TIPO_ATENDIMENTO_PADRAO',
        'TIPO_ATENDIMENTO'
      ],

      ID_CONVENIO: [
        'ID_CONVENIO',
        'CONVENIO_ID'
      ],

      NOME_CONVENIO: [
        'NOME_CONVENIO',
        'CONVENIO'
      ],

      NUMERO_CARTEIRINHA: [
        'NÚMERO_CARTEIRINHA',
        'NUMERO_CARTEIRINHA',
        'CARTEIRINHA'
      ],

      VALIDADE_CARTEIRINHA: [
        'VALIDADE_CARTEIRINHA'
      ],

      NOME_TITULAR: [
        'NOME_TITULAR'
      ],

      CPF_TITULAR: [
        'CPF_TITULAR'
      ],

      ID_PROFISSIONAL_RESPONSAVEL: [
        'ID_PROFISSIONAL_RESPONSAVEL',
        'ID_PROFISSIONAL_PRINCIPAL',
        'PROFISSIONAL_RESPONSAVEL'
      ],

      DATA_CADASTRO: [
        'DATA_CADASTRO'
      ],

      OBSERVACOES: [
        'OBSERVAÇÕES',
        'OBSERVACOES'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    ASSOCIACOES: {
      ID_ASSOCIACAO: [
        'ID_ASSOCIACAO',
        'ASSOCIACAO_ID',
        'ID'
      ],

      ID_PACIENTE: [
        'ID_PACIENTE',
        'PACIENTE_ID'
      ],

      ID_PROFISSIONAL: [
        'ID_PROFISSIONAL',
        'PROFISSIONAL_ID'
      ],

      TIPO_ASSOCIACAO: [
        'TIPO_ASSOCIACAO',
        'TIPO_ACESSO',
        'PERFIL_ASSOCIACAO'
      ],

      DATA_INICIO: [
        'DATA_INICIO',
        'DATA_CADASTRO'
      ],

      DATA_FIM: [
        'DATA_FIM'
      ],

      OBSERVACOES: [
        'OBSERVACOES',
        'OBSERVAÇÕES'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    CONVENIOS: {
      ID_CONVENIO: [
        'ID_CONVENIO',
        'CONVENIO_ID',
        'ID'
      ],

      NOME: [
        'NOME_CONVENIO',
        'NOME',
        'CONVENIO',
        'RAZAO_SOCIAL',
        'RAZÃO_SOCIAL'
      ],

      NOME_FANTASIA: [
        'NOME_FANTASIA'
      ],

      CNPJ: [
        'CNPJ'
      ],

      REGISTRO_ANS: [
        'REGISTRO_ANS',
        'ANS'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    PROCEDIMENTOS: {
      ID_PROCEDIMENTO: [
        'ID_PROCEDIMENTO',
        'PROCEDIMENTO_ID',
        'ID'
      ],

      CODIGO: [
        'CODIGO_PROCEDIMENTO',
        'CÓDIGO_PROCEDIMENTO',
        'CODIGO_TUSS',
        'CÓDIGO_TUSS',
        'CODIGO'
      ],

      NOME: [
        'NOME_PROCEDIMENTO',
        'PROCEDIMENTO',
        'DESCRICAO',
        'DESCRIÇÃO',
        'NOME'
      ],

      DESCRICAO: [
        'DESCRICAO',
        'DESCRIÇÃO'
      ],

      DURACAO_MINUTOS: [
        'DURACAO_MINUTOS',
        'DURAÇÃO_MINUTOS',
        'DURACAO',
        'DURAÇÃO'
      ],

      VALOR_PARTICULAR: [
        'VALOR_PARTICULAR',
        'PRECO_PARTICULAR',
        'PREÇO_PARTICULAR',
        'VALOR',
        'PRECO',
        'PREÇO'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    HABILITACAO_PROFISSIONAIS: {
      ID_HABILITACAO: [
        'ID_HABILITACAO',
        'HABILITACAO_ID',
        'ID'
      ],

      ID_PROFISSIONAL: [
        'ID_PROFISSIONAL',
        'PROFISSIONAL_ID'
      ],

      ID_PROCEDIMENTO: [
        'ID_PROCEDIMENTO',
        'PROCEDIMENTO_ID'
      ],

      ID_CONVENIO: [
        'ID_CONVENIO',
        'CONVENIO_ID'
      ],

      TIPO_ATENDIMENTO: [
        'TIPO_ATENDIMENTO',
        'MODALIDADE'
      ],

      DATA_INICIO: [
        'DATA_INICIO'
      ],

      DATA_FIM: [
        'DATA_FIM'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    PROCEDIMENTOS_CONVENIOS: {
      ID_VINCULO: [
        'ID_PROCEDIMENTO_CONVENIO',
        'ID_VINCULO',
        'ID'
      ],

      ID_CONVENIO: [
        'ID_CONVENIO',
        'CONVENIO_ID'
      ],

      ID_PROCEDIMENTO: [
        'ID_PROCEDIMENTO',
        'PROCEDIMENTO_ID'
      ],

      CODIGO_CONVENIO: [
        'CODIGO_CONVENIO',
        'CÓDIGO_CONVENIO',
        'CODIGO_PROCEDIMENTO_CONVENIO',
        'CODIGO',
        'CÓDIGO'
      ],

      VALOR: [
        'VALOR_CONVENIO',
        'VALOR_PROCEDIMENTO',
        'VALOR'
      ],

      QUANTIDADE_MAXIMA: [
        'QUANTIDADE_MAXIMA',
        'QUANTIDADE_MÁXIMA',
        'LIMITE_SESSOES',
        'LIMITE_SESSÕES'
      ],

      EXIGE_AUTORIZACAO: [
        'EXIGE_AUTORIZACAO',
        'EXIGE_AUTORIZAÇÃO'
      ],

      DATA_INICIO: [
        'DATA_INICIO'
      ],

      DATA_FIM: [
        'DATA_FIM'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    SOLICITACOES_CADASTRO: {
      ID_SOLICITACAO: [
        'ID_SOLICITACAO'
      ],

      DATA_SOLICITACAO: [
        'DATA_SOLICITACAO'
      ],

      STATUS: [
        'STATUS'
      ],

      NOME_COMPLETO: [
        'NOME_COMPLETO'
      ],

      NOME_SOCIAL: [
        'NOME_SOCIAL'
      ],

      CPF: [
        'CPF'
      ],

      DATA_NASCIMENTO: [
        'DATA_NASCIMENTO'
      ],

      TELEFONE: [
        'TELEFONE'
      ],

      EMAIL: [
        'EMAIL'
      ],

      TIPO_ATENDIMENTO: [
        'TIPO_ATENDIMENTO_INFORMADO'
      ],

      ID_CONVENIO: [
        'ID_CONVENIO_INFORMADO'
      ],

      NOME_CONVENIO: [
        'NOME_CONVENIO_INFORMADO'
      ],

      OUTRO_CONVENIO: [
        'OUTRO_CONVENIO_INFORMADO'
      ],

      NUMERO_CARTEIRINHA: [
        'NUMERO_CARTEIRINHA',
        'NÚMERO_CARTEIRINHA'
      ],

      VALIDADE_CARTEIRINHA: [
        'VALIDADE_CARTEIRINHA'
      ],

      NOME_TITULAR: [
        'NOME_TITULAR'
      ],

      CPF_TITULAR: [
        'CPF_TITULAR'
      ],

      CONSENTIMENTO_DADOS: [
        'CONSENTIMENTO_DADOS'
      ],

      DATA_CONSENTIMENTO: [
        'DATA_CONSENTIMENTO'
      ],

      OBSERVACOES_PACIENTE: [
        'OBSERVACOES_PACIENTE'
      ],

      ID_PROFISSIONAL_RESPONSAVEL: [
        'ID_PROFISSIONAL_RESPONSAVEL'
      ],

      OBSERVACOES_INTERNAS: [
        'OBSERVACOES_INTERNAS'
      ],

      ID_PACIENTE_GERADO: [
        'ID_PACIENTE_GERADO'
      ],

      DATA_ANALISE: [
        'DATA_ANALISE'
      ],

      ANALISADO_POR: [
        'ANALISADO_POR'
      ],

      DATA_APROVACAO: [
        'DATA_APROVACAO'
      ],

      APROVADO_POR: [
        'APROVADO_POR'
      ],

      MOTIVO_RECUSA: [
        'MOTIVO_RECUSA'
      ]
    }
  }
};


/* ============================================================
 * FUNÇÕES DE TEXTO E NORMALIZAÇÃO
 * ============================================================
 */

/**
 * Converte qualquer valor em texto limpo.
 *
 * @param {*} valor
 * @return {string}
 */
function rncTexto_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor).trim();
}


/**
 * Converte um valor em chave de comparação.
 *
 * @param {*} valor
 * @return {string}
 */
function rncChave_(valor) {
  return rncTexto_(valor)
    .toUpperCase();
}


/**
 * Remove acentos de um texto.
 *
 * @param {*} valor
 * @return {string}
 */
function rncRemoverAcentos_(valor) {
  var texto =
    rncTexto_(valor);

  if (!texto) {
    return '';
  }

  return texto
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


/**
 * Normaliza cabeçalhos para comparação segura.
 *
 * Exemplos:
 * "Número Carteirinha" -> "NUMERO_CARTEIRINHA"
 * "NÚMERO_CARTEIRINHA" -> "NUMERO_CARTEIRINHA"
 *
 * @param {*} valor
 * @return {string}
 */
function rncNormalizarCabecalho_(valor) {
  return rncRemoverAcentos_(valor)
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      '_'
    )
    .replace(
      /^_+|_+$/g,
      ''
    );
}


/**
 * Normaliza um e-mail.
 *
 * @param {*} valor
 * @return {string}
 */
function rncNormalizarEmail_(valor) {
  return rncTexto_(valor)
    .toLowerCase();
}


/**
 * Mantém somente os números.
 *
 * @param {*} valor
 * @return {string}
 */
function rncSomenteNumeros_(valor) {
  return rncTexto_(valor)
    .replace(
      /\D/g,
      ''
    );
}


/**
 * Normaliza CPF para comparação.
 *
 * @param {*} valor
 * @return {string}
 */
function rncNormalizarCpf_(valor) {
  return rncSomenteNumeros_(valor);
}


/**
 * Normaliza telefone para comparação.
 *
 * @param {*} valor
 * @return {string}
 */
function rncNormalizarTelefone_(valor) {
  return rncSomenteNumeros_(valor);
}


/**
 * Normaliza identificadores internos.
 *
 * @param {*} valor
 * @return {string}
 */
function rncNormalizarId_(valor) {
  return rncTexto_(valor)
    .toUpperCase();
}


/* ============================================================
 * LEITURA GENÉRICA DE REGISTROS
 * ============================================================
 */

/**
 * Retorna o valor de um registro utilizando uma lista de aliases.
 *
 * @param {Object} registro
 * @param {string[]} aliases
 * @param {*=} valorPadrao
 * @return {*}
 */
function rncValorPorAlias_(
  registro,
  aliases,
  valorPadrao
) {
  if (
    !registro ||
    typeof registro !== 'object'
  ) {
    return valorPadrao === undefined
      ? ''
      : valorPadrao;
  }

  if (
    !aliases ||
    !aliases.length
  ) {
    return valorPadrao === undefined
      ? ''
      : valorPadrao;
  }

  var mapaRegistro = {};

  Object.keys(
    registro
  ).forEach(
    function(chaveOriginal) {
      mapaRegistro[
        rncNormalizarCabecalho_(
          chaveOriginal
        )
      ] =
        registro[chaveOriginal];
    }
  );

  for (
    var indice = 0;
    indice < aliases.length;
    indice++
  ) {
    var aliasNormalizado =
      rncNormalizarCabecalho_(
        aliases[indice]
      );

    if (
      Object.prototype.hasOwnProperty.call(
        mapaRegistro,
        aliasNormalizado
      )
    ) {
      return mapaRegistro[
        aliasNormalizado
      ];
    }
  }

  return valorPadrao === undefined
    ? ''
    : valorPadrao;
}


/**
 * Verifica se um registro possui determinado campo.
 *
 * @param {Object} registro
 * @param {string[]} aliases
 * @return {boolean}
 */
function rncPossuiCampo_(
  registro,
  aliases
) {
  if (
    !registro ||
    typeof registro !== 'object' ||
    !aliases ||
    !aliases.length
  ) {
    return false;
  }

  var chavesRegistro =
    Object.keys(registro).map(
      function(chave) {
        return rncNormalizarCabecalho_(
          chave
        );
      }
    );

  return aliases.some(
    function(alias) {
      return (
        chavesRegistro.indexOf(
          rncNormalizarCabecalho_(alias)
        ) !== -1
      );
    }
  );
}


/**
 * Retorna um objeto com chaves normalizadas.
 *
 * @param {Object} objeto
 * @return {Object}
 */
function rncNormalizarObjeto_(
  objeto
) {
  var resultado = {};

  if (
    !objeto ||
    typeof objeto !== 'object'
  ) {
    return resultado;
  }

  Object.keys(
    objeto
  ).forEach(
    function(chave) {
      resultado[
        rncNormalizarCabecalho_(
          chave
        )
      ] =
        objeto[chave];
    }
  );

  return resultado;
}


/* ============================================================
 * ATIVO, INATIVO E PERFIS
 * ============================================================
 */

/**
 * Interpreta valores de ativo e inativo.
 *
 * Quando o campo não existe ou está vazio, o registro é
 * considerado ativo para preservar compatibilidade com abas
 * antigas.
 *
 * @param {*} valor
 * @param {boolean=} padrao
 * @return {boolean}
 */
function rncValorAtivo_(
  valor,
  padrao
) {
  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return padrao === undefined
      ? true
      : Boolean(padrao);
  }

  if (
    typeof valor === 'boolean'
  ) {
    return valor;
  }

  if (
    typeof valor === 'number'
  ) {
    return valor !== 0;
  }

  var normalizado =
    rncRemoverAcentos_(valor)
      .toUpperCase();

  if (
    ARYA_RN_CONFIG.VALORES_ATIVOS
      .indexOf(normalizado) !== -1
  ) {
    return true;
  }

  if (
    ARYA_RN_CONFIG.VALORES_INATIVOS
      .map(rncRemoverAcentos_)
      .indexOf(normalizado) !== -1
  ) {
    return false;
  }

  return padrao === undefined
    ? true
    : Boolean(padrao);
}


/**
 * Verifica se um registro está ativo.
 *
 * @param {Object} registro
 * @param {string[]} aliasesAtivo
 * @param {boolean=} padrao
 * @return {boolean}
 */
function rncRegistroAtivo_(
  registro,
  aliasesAtivo,
  padrao
) {
  var valor =
    rncValorPorAlias_(
      registro,
      aliasesAtivo,
      ''
    );

  return rncValorAtivo_(
    valor,
    padrao
  );
}


/**
 * Verifica se o perfil é administrativo.
 *
 * @param {*} perfil
 * @return {boolean}
 */
function rncPerfilAdministrativo_(
  perfil
) {
  var perfilNormalizado =
    rncRemoverAcentos_(perfil)
      .toUpperCase();

  return (
    ARYA_RN_CONFIG
      .PERFIS_ADMINISTRATIVOS
      .indexOf(perfilNormalizado) !== -1
  );
}


/**
 * Normaliza um perfil de usuário.
 *
 * @param {*} perfil
 * @return {string}
 */
function rncNormalizarPerfil_(
  perfil
) {
  return rncRemoverAcentos_(perfil)
    .toUpperCase()
    .replace(
      /\s+/g,
      '_'
    );
}


/**
 * Normaliza o tipo de atendimento.
 *
 * @param {*} tipo
 * @return {string}
 */
function rncNormalizarTipoAtendimento_(
  tipo
) {
  var normalizado =
    rncRemoverAcentos_(tipo)
      .toUpperCase()
      .replace(
        /\s+/g,
        '_'
      );

  if (
    normalizado === 'CONVENIO'
  ) {
    return ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;
  }

  if (
    normalizado === 'PARTICULAR'
  ) {
    return ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;
  }

  return normalizado;
}


/* ============================================================
 * DATAS
 * ============================================================
 */

/**
 * Verifica se um valor é uma data válida.
 *
 * @param {*} valor
 * @return {boolean}
 */
function rncDataValida_(valor) {
  return (
    valor instanceof Date &&
    !isNaN(valor.getTime())
  );
}


/**
 * Converte um valor para Date quando possível.
 *
 * Aceita:
 * - objeto Date;
 * - dd/MM/yyyy;
 * - yyyy-MM-dd;
 * - valores reconhecidos pelo JavaScript.
 *
 * @param {*} valor
 * @return {Date|null}
 */
function rncConverterData_(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null;
  }

  if (
    rncDataValida_(valor)
  ) {
    return new Date(
      valor.getTime()
    );
  }

  var texto =
    rncTexto_(valor);

  var formatoBrasileiro =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (formatoBrasileiro) {
    var dataBrasileira =
      new Date(
        Number(formatoBrasileiro[3]),
        Number(formatoBrasileiro[2]) - 1,
        Number(formatoBrasileiro[1])
      );

    return rncDataValida_(
      dataBrasileira
    )
      ? dataBrasileira
      : null;
  }

  var formatoIso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (formatoIso) {
    var dataIso =
      new Date(
        Number(formatoIso[1]),
        Number(formatoIso[2]) - 1,
        Number(formatoIso[3])
      );

    return rncDataValida_(
      dataIso
    )
      ? dataIso
      : null;
  }

  var dataGenerica =
    new Date(texto);

  return rncDataValida_(
    dataGenerica
  )
    ? dataGenerica
    : null;
}


/**
 * Formata uma data em dd/MM/yyyy.
 *
 * @param {*} valor
 * @return {string}
 */
function rncFormatarData_(valor) {
  var data =
    rncConverterData_(valor);

  if (!data) {
    return '';
  }

  return Utilities.formatDate(
    data,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy'
  );
}


/**
 * Formata data e hora.
 *
 * @param {*} valor
 * @return {string}
 */
function rncFormatarDataHora_(valor) {
  var data =
    rncConverterData_(valor);

  if (!data) {
    return '';
  }

  return Utilities.formatDate(
    data,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm'
  );
}


/**
 * Verifica se uma data já terminou.
 *
 * @param {*} valor
 * @return {boolean}
 */
function rncDataExpirada_(valor) {
  var data =
    rncConverterData_(valor);

  if (!data) {
    return false;
  }

  var hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  data.setHours(
    0,
    0,
    0,
    0
  );

  return data < hoje;
}


/**
 * Verifica vigência considerando data inicial e final.
 *
 * @param {*} dataInicio
 * @param {*} dataFim
 * @param {Date=} dataReferencia
 * @return {boolean}
 */
function rncEstaVigente_(
  dataInicio,
  dataFim,
  dataReferencia
) {
  var referencia =
    dataReferencia instanceof Date
      ? new Date(dataReferencia.getTime())
      : new Date();

  referencia.setHours(
    0,
    0,
    0,
    0
  );

  var inicio =
    rncConverterData_(dataInicio);

  var fim =
    rncConverterData_(dataFim);

  if (inicio) {
    inicio.setHours(
      0,
      0,
      0,
      0
    );

    if (
      referencia < inicio
    ) {
      return false;
    }
  }

  if (fim) {
    fim.setHours(
      23,
      59,
      59,
      999
    );

    if (
      referencia > fim
    ) {
      return false;
    }
  }

  return true;
}


/* ============================================================
 * NÚMEROS E VALORES MONETÁRIOS
 * ============================================================
 */

/**
 * Converte texto ou número para valor numérico.
 *
 * Aceita exemplos:
 * 150
 * "150"
 * "150,00"
 * "R$ 150,00"
 * "1.250,50"
 *
 * @param {*} valor
 * @return {number|null}
 */
function rncConverterNumero_(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null;
  }

  if (
    typeof valor === 'number'
  ) {
    return isNaN(valor)
      ? null
      : valor;
  }

  var texto =
    rncTexto_(valor)
      .replace(
        /R\$/gi,
        ''
      )
      .replace(
        /\s/g,
        ''
      );

  if (
    texto.indexOf(',') !== -1
  ) {
    texto =
      texto
        .replace(
          /\./g,
          ''
        )
        .replace(
          ',',
          '.'
        );
  }

  texto =
    texto.replace(
      /[^0-9.-]/g,
      ''
    );

  var numero =
    Number(texto);

  return isNaN(numero)
    ? null
    : numero;
}


/**
 * Arredonda para duas casas decimais.
 *
 * @param {*} valor
 * @return {number}
 */
function rncArredondarMoeda_(valor) {
  var numero =
    rncConverterNumero_(valor);

  if (numero === null) {
    return 0;
  }

  return Math.round(
    (
      numero +
      Number.EPSILON
    ) *
    100
  ) / 100;
}


/* ============================================================
 * ORDENAÇÃO E LISTAS
 * ============================================================
 */

/**
 * Remove valores repetidos de uma lista.
 *
 * @param {Array} lista
 * @return {Array}
 */
function rncValoresUnicos_(lista) {
  var resultado = [];
  var mapa = {};

  (
    lista || []
  ).forEach(
    function(valor) {
      var chave =
        rncChave_(valor);

      if (
        !chave ||
        mapa[chave]
      ) {
        return;
      }

      mapa[chave] =
        true;

      resultado.push(
        valor
      );
    }
  );

  return resultado;
}


/**
 * Ordena objetos por uma propriedade textual.
 *
 * @param {Object[]} lista
 * @param {string} propriedade
 * @return {Object[]}
 */
function rncOrdenarPorTexto_(
  lista,
  propriedade
) {
  return (
    lista || []
  )
    .slice()
    .sort(
      function(a, b) {
        return rncTexto_(
          a &&
          a[propriedade]
        ).localeCompare(
          rncTexto_(
            b &&
            b[propriedade]
          ),
          'pt-BR',
          {
            sensitivity:
              'base'
          }
        );
      }
    );
}


/**
 * Cria um mapa indexado por determinada propriedade.
 *
 * @param {Object[]} lista
 * @param {string} propriedade
 * @return {Object}
 */
function rncCriarMapaPorPropriedade_(
  lista,
  propriedade
) {
  var mapa = {};

  (
    lista || []
  ).forEach(
    function(item) {
      if (!item) {
        return;
      }

      var chave =
        rncChave_(
          item[propriedade]
        );

      if (!chave) {
        return;
      }

      mapa[chave] =
        item;
    }
  );

  return mapa;
}


/* ============================================================
 * ACESSO SEGURO À CONFIGURAÇÃO
 * ============================================================
 */

/**
 * Retorna os aliases de uma tabela e campo.
 *
 * Exemplo:
 * rncAliases_("PACIENTES", "ID_PACIENTE")
 *
 * @param {string} tabela
 * @param {string} campo
 * @return {string[]}
 */
function rncAliases_(
  tabela,
  campo
) {
  var nomeTabela =
    rncNormalizarCabecalho_(
      tabela
    );

  var nomeCampo =
    rncNormalizarCabecalho_(
      campo
    );

  var configuracaoTabela =
    ARYA_RN_CONFIG
      .CABECALHOS[
        nomeTabela
      ];

  if (!configuracaoTabela) {
    throw new Error(
      'Configuração de cabeçalhos não encontrada para a tabela "' +
      tabela +
      '".'
    );
  }

  var aliases =
    configuracaoTabela[
      nomeCampo
    ];

  if (!aliases) {
    throw new Error(
      'Configuração do campo "' +
      campo +
      '" não encontrada na tabela "' +
      tabela +
      '".'
    );
  }

  return aliases.slice();
}


/**
 * Retorna o nome configurado de uma aba.
 *
 * @param {string} chaveAba
 * @return {string}
 */
function rncNomeAba_(
  chaveAba
) {
  var chave =
    rncNormalizarCabecalho_(
      chaveAba
    );

  var nome =
    ARYA_RN_CONFIG
      .ABAS[
        chave
      ];

  if (!nome) {
    throw new Error(
      'A aba "' +
      chaveAba +
      '" não está configurada em ARYA_RN_CONFIG.'
    );
  }

  return nome;
}


/**
 * Verifica se as funções essenciais do Database.gs existem.
 *
 * @return {Object}
 */
function rncValidarDependencias_() {
  var dependencias = {
    dbObterPlanilha:
      typeof dbObterPlanilha ===
      'function',

    dbAbaExiste:
      typeof dbAbaExiste ===
      'function',

    dbLerRegistros:
      typeof dbLerRegistros ===
      'function',

    dbObterCabecalhos:
      typeof dbObterCabecalhos ===
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


/* ============================================================
 * TESTE DO MÓDULO
 * ============================================================
 */

/**
 * Testa exclusivamente o RN_Config.gs.
 *
 * Não grava nem altera dados.
 *
 * @return {Object}
 */
function testarRNConfig() {
  var dependencias =
    rncValidarDependencias_();

  var resultado = {
    sucesso:
      dependencias.valido,

    modulo:
      'RN_Config.gs',

    versao:
      ARYA_RN_CONFIG.VERSAO,

    dependencias:
      dependencias,

    testes: {
      normalizacaoCabecalho:
        rncNormalizarCabecalho_(
          'Número da Carteirinha'
        ),

      normalizacaoCpf:
        rncNormalizarCpf_(
          '123.456.789-00'
        ),

      normalizacaoEmail:
        rncNormalizarEmail_(
          ' TESTE@EMAIL.COM '
        ),

      perfilAdministrador:
        rncPerfilAdministrativo_(
          'Administrador'
        ),

      perfilProfissional:
        rncPerfilAdministrativo_(
          'Profissional'
        ),

      tipoConvenio:
        rncNormalizarTipoAtendimento_(
          'Convênio'
        ),

      tipoParticular:
        rncNormalizarTipoAtendimento_(
          'Particular'
        ),

      valorAtivo:
        rncValorAtivo_(
          'SIM'
        ),

      valorInativo:
        rncValorAtivo_(
          'NÃO'
        ),

      numeroConvertido:
        rncConverterNumero_(
          'R$ 1.250,50'
        ),

      dataConvertida:
        rncFormatarData_(
          '18/07/2026'
        )
    }
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