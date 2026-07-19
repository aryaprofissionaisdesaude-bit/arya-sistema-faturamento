/**
 * ============================================================
 * ÁRYA SAÚDE
 * FUNÇÕES UTILITÁRIAS GERAIS
 * ARQUIVO: Utils.gs
 * ============================================================
 *
 * Responsabilidades:
 * - normalização de textos;
 * - conversão de valores;
 * - tratamento de datas;
 * - validação de campos;
 * - geração de identificadores;
 * - preparação segura de dados.
 */


/* ============================================================
 * TEXTOS
 * ============================================================
 */

/**
 * Converte qualquer valor para texto sem espaços nas extremidades.
 *
 * @param {*} valor
 * @return {string}
 */
function utilTexto(valor) {
  if (valor === undefined || valor === null) {
    return '';
  }

  return String(valor).trim();
}


/**
 * Normaliza texto para comparações.
 *
 * Remove acentos, espaços nas extremidades e converte para maiúsculas.
 *
 * @param {*} valor
 * @return {string}
 */
function utilNormalizarTexto(valor) {
  return utilTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}


/**
 * Normaliza espaços internos.
 *
 * @param {*} valor
 * @return {string}
 */
function utilNormalizarEspacos(valor) {
  return utilTexto(valor)
    .replace(/\s+/g, ' ')
    .trim();
}


/**
 * Normaliza um endereço de e-mail.
 *
 * @param {*} email
 * @return {string}
 */
function utilNormalizarEmail(email) {
  return utilTexto(email).toLowerCase();
}


/**
 * Remove todos os caracteres que não sejam números.
 *
 * @param {*} valor
 * @return {string}
 */
function utilSomenteNumeros(valor) {
  return utilTexto(valor).replace(/\D/g, '');
}


/**
 * Verifica se um valor está vazio.
 *
 * @param {*} valor
 * @return {boolean}
 */
function utilEstaVazio(valor) {
  return (
    valor === undefined ||
    valor === null ||
    utilTexto(valor) === ''
  );
}


/**
 * Compara dois textos ignorando acentos e caixa.
 *
 * @param {*} valorA
 * @param {*} valorB
 * @return {boolean}
 */
function utilTextosIguais(valorA, valorB) {
  return (
    utilNormalizarTexto(valorA) ===
    utilNormalizarTexto(valorB)
  );
}


/**
 * Retorna o primeiro valor preenchido.
 *
 * @return {*}
 */
function utilPrimeiroValorPreenchido() {
  const valores = Array.prototype.slice.call(arguments);

  for (let i = 0; i < valores.length; i++) {
    if (!utilEstaVazio(valores[i])) {
      return valores[i];
    }
  }

  return '';
}


/* ============================================================
 * BOOLEANOS E SITUAÇÕES
 * ============================================================
 */

/**
 * Converte diferentes representações para booleano.
 *
 * @param {*} valor
 * @param {boolean=} valorPadrao
 * @return {boolean}
 */
function utilParaBooleano(valor, valorPadrao) {
  if (valor === true || valor === 1) {
    return true;
  }

  if (valor === false || valor === 0) {
    return false;
  }

  const texto = utilNormalizarTexto(valor);

  if (!texto) {
    return valorPadrao === undefined
      ? false
      : Boolean(valorPadrao);
  }

  const valoresVerdadeiros = [
    'SIM',
    'S',
    'TRUE',
    '1',
    'ATIVO',
    'ATIVA',
    'OK'
  ];

  const valoresFalsos = [
    'NAO',
    'N',
    'FALSE',
    '0',
    'INATIVO',
    'INATIVA'
  ];

  if (valoresVerdadeiros.indexOf(texto) !== -1) {
    return true;
  }

  if (valoresFalsos.indexOf(texto) !== -1) {
    return false;
  }

  return valorPadrao === undefined
    ? false
    : Boolean(valorPadrao);
}


/**
 * Verifica se um registro está ativo.
 *
 * Quando o campo ATIVO não existe, considera o registro ativo.
 *
 * @param {Object} registro
 * @return {boolean}
 */
function utilRegistroEstaAtivo(registro) {
  if (!registro) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      registro,
      'ATIVO'
    )
  ) {
    return true;
  }

  return utilParaBooleano(
    registro.ATIVO,
    true
  );
}


/* ============================================================
 * E-MAIL
 * ============================================================
 */

/**
 * Valida um endereço de e-mail.
 *
 * @param {*} email
 * @return {boolean}
 */
function utilEmailValido(email) {
  const texto = utilNormalizarEmail(email);

  if (!texto) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}


/**
 * Exige um endereço de e-mail válido.
 *
 * @param {*} email
 * @param {string=} nomeCampo
 * @return {string}
 */
function utilExigirEmailValido(email, nomeCampo) {
  const texto = utilNormalizarEmail(email);
  const rotulo = nomeCampo || 'E-mail';

  if (!texto) {
    throw new Error(
      rotulo + ' é obrigatório.'
    );
  }

  if (!utilEmailValido(texto)) {
    throw new Error(
      rotulo + ' inválido.'
    );
  }

  return texto;
}


/* ============================================================
 * DATAS
 * ============================================================
 */

/**
 * Retorna o fuso horário configurado no projeto.
 *
 * @return {string}
 */
function utilObterFusoHorario() {
  return (
    Session.getScriptTimeZone() ||
    'America/Sao_Paulo'
  );
}


/**
 * Converte um valor para Date.
 *
 * Aceita:
 * - objeto Date;
 * - yyyy-MM-dd;
 * - dd/MM/yyyy;
 * - outros formatos reconhecidos pelo JavaScript.
 *
 * @param {*} valor
 * @return {Date|null}
 */
function utilParaData(valor) {
  if (utilEstaVazio(valor)) {
    return null;
  }

  if (
    Object.prototype.toString.call(valor) ===
    '[object Date]'
  ) {
    if (isNaN(valor.getTime())) {
      return null;
    }

    return new Date(valor.getTime());
  }

  const texto = utilTexto(valor);

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const partes = texto.split('-');

    const data = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2]),
      12,
      0,
      0
    );

    return isNaN(data.getTime())
      ? null
      : data;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const partes = texto.split('/');

    const data = new Date(
      Number(partes[2]),
      Number(partes[1]) - 1,
      Number(partes[0]),
      12,
      0,
      0
    );

    return isNaN(data.getTime())
      ? null
      : data;
  }

  const data = new Date(valor);

  return isNaN(data.getTime())
    ? null
    : data;
}


/**
 * Exige uma data válida.
 *
 * @param {*} valor
 * @param {string=} nomeCampo
 * @return {Date}
 */
function utilExigirData(valor, nomeCampo) {
  const data = utilParaData(valor);

  if (!data) {
    throw new Error(
      (nomeCampo || 'Data') +
      ' inválida.'
    );
  }

  return data;
}


/**
 * Formata uma data.
 *
 * @param {*} valor
 * @param {string=} formato
 * @return {string}
 */
function utilFormatarData(valor, formato) {
  const data = utilParaData(valor);

  if (!data) {
    return '';
  }

  return Utilities.formatDate(
    data,
    utilObterFusoHorario(),
    formato || 'dd/MM/yyyy'
  );
}


/**
 * Formata data e hora.
 *
 * @param {*} valor
 * @return {string}
 */
function utilFormatarDataHora(valor) {
  return utilFormatarData(
    valor,
    'dd/MM/yyyy HH:mm:ss'
  );
}


/**
 * Formata uma data para campo HTML.
 *
 * @param {*} valor
 * @return {string}
 */
function utilFormatarDataIso(valor) {
  return utilFormatarData(
    valor,
    'yyyy-MM-dd'
  );
}


/* ============================================================
 * NÚMEROS E MOEDA
 * ============================================================
 */

/**
 * Converte diferentes formatos numéricos para Number.
 *
 * Exemplos aceitos:
 * - 1234.56
 * - "1234.56"
 * - "1.234,56"
 * - "R$ 1.234,56"
 *
 * @param {*} valor
 * @param {number=} valorPadrao
 * @return {number}
 */
function utilParaNumero(valor, valorPadrao) {
  if (
    typeof valor === 'number' &&
    !isNaN(valor)
  ) {
    return valor;
  }

  let texto = utilTexto(valor);

  if (!texto) {
    return valorPadrao === undefined
      ? 0
      : Number(valorPadrao);
  }

  texto = texto
    .replace(/\s/g, '')
    .replace(/R\$/gi, '');

  const possuiVirgula =
    texto.indexOf(',') !== -1;

  const possuiPonto =
    texto.indexOf('.') !== -1;

  if (possuiVirgula && possuiPonto) {
    if (
      texto.lastIndexOf(',') >
      texto.lastIndexOf('.')
    ) {
      texto = texto
        .replace(/\./g, '')
        .replace(',', '.');
    } else {
      texto = texto.replace(/,/g, '');
    }
  } else if (possuiVirgula) {
    texto = texto.replace(',', '.');
  }

  texto = texto.replace(/[^\d.-]/g, '');

  const numero = Number(texto);

  if (isNaN(numero)) {
    return valorPadrao === undefined
      ? 0
      : Number(valorPadrao);
  }

  return numero;
}


/**
 * Arredonda um número.
 *
 * @param {*} valor
 * @param {number=} casas
 * @return {number}
 */
function utilArredondar(valor, casas) {
  const quantidadeCasas =
    casas === undefined
      ? 2
      : Number(casas);

  const fator = Math.pow(
    10,
    quantidadeCasas
  );

  return Math.round(
    utilParaNumero(valor) * fator
  ) / fator;
}


/**
 * Formata um valor em reais.
 *
 * @param {*} valor
 * @return {string}
 */
function utilFormatarMoeda(valor) {
  return utilParaNumero(valor)
    .toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );
}


/* ============================================================
 * IDENTIFICADORES
 * ============================================================
 */

/**
 * Gera um identificador único.
 *
 * Exemplo:
 * PROT_20260718_152312_A1B2C3D4
 *
 * @param {string=} prefixo
 * @return {string}
 */
function utilGerarId(prefixo) {
  const prefixoNormalizado =
    utilNormalizarTexto(prefixo || 'ID')
      .replace(/[^A-Z0-9]/g, '_');

  const dataHora = Utilities.formatDate(
    new Date(),
    utilObterFusoHorario(),
    'yyyyMMdd_HHmmss'
  );

  const uuid = Utilities
    .getUuid()
    .replace(/-/g, '')
    .substring(0, 8)
    .toUpperCase();

  return (
    prefixoNormalizado +
    '_' +
    dataHora +
    '_' +
    uuid
  );
}


/**
 * Gera um número sequencial legível.
 *
 * Exemplo:
 * PROT-2026-000001
 *
 * @param {string} chave
 * @param {string=} prefixo
 * @return {string}
 */
function utilGerarSequencial(chave, prefixo) {
  const chaveNormalizada =
    utilNormalizarTexto(chave)
      .replace(/[^A-Z0-9]/g, '_');

  if (!chaveNormalizada) {
    throw new Error(
      'A chave do sequencial é obrigatória.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const propriedades =
      PropertiesService.getScriptProperties();

    const ano = Utilities.formatDate(
      new Date(),
      utilObterFusoHorario(),
      'yyyy'
    );

    const chaveCompleta =
      'SEQUENCIAL_' +
      chaveNormalizada +
      '_' +
      ano;

    const valorAtual = Number(
      propriedades.getProperty(
        chaveCompleta
      ) || 0
    );

    const proximoValor =
      valorAtual + 1;

    propriedades.setProperty(
      chaveCompleta,
      String(proximoValor)
    );

    const numeroFormatado =
      String(proximoValor)
        .padStart(6, '0');

    const prefixoFormatado =
      utilNormalizarTexto(
        prefixo || chaveNormalizada
      )
        .replace(/[^A-Z0-9]/g, '');

    return (
      prefixoFormatado +
      '-' +
      ano +
      '-' +
      numeroFormatado
    );
  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * OBJETOS E LISTAS
 * ============================================================
 */

/**
 * Cria uma cópia simples de um objeto.
 *
 * @param {Object} objeto
 * @return {Object}
 */
function utilCopiarObjeto(objeto) {
  const resultado = {};

  Object.keys(objeto || {})
    .forEach(function(chave) {
      resultado[chave] =
        objeto[chave];
    });

  return resultado;
}


/**
 * Retorna somente os campos permitidos de um objeto.
 *
 * @param {Object} objeto
 * @param {string[]} camposPermitidos
 * @return {Object}
 */
function utilSelecionarCampos(
  objeto,
  camposPermitidos
) {
  const resultado = {};
  const origem = objeto || {};

  (camposPermitidos || [])
    .forEach(function(campo) {
      if (
        Object.prototype.hasOwnProperty.call(
          origem,
          campo
        )
      ) {
        resultado[campo] =
          origem[campo];
      }
    });

  return resultado;
}


/**
 * Remove propriedades com valor undefined.
 *
 * @param {Object} objeto
 * @return {Object}
 */
function utilRemoverIndefinidos(objeto) {
  const resultado = {};

  Object.keys(objeto || {})
    .forEach(function(chave) {
      if (objeto[chave] !== undefined) {
        resultado[chave] =
          objeto[chave];
      }
    });

  return resultado;
}


/**
 * Indexa uma lista por determinado campo.
 *
 * @param {Object[]} lista
 * @param {string} campo
 * @return {Object}
 */
function utilIndexarPorCampo(lista, campo) {
  const indice = {};

  (lista || []).forEach(function(item) {
    const chave =
      utilTexto(item && item[campo]);

    if (chave) {
      indice[chave] = item;
    }
  });

  return indice;
}


/**
 * Ordena uma lista por campo textual.
 *
 * @param {Object[]} lista
 * @param {string} campo
 * @param {boolean=} decrescente
 * @return {Object[]}
 */
function utilOrdenarPorTexto(
  lista,
  campo,
  decrescente
) {
  const copia =
    (lista || []).slice();

  copia.sort(function(a, b) {
    const resultado =
      utilTexto(a && a[campo])
        .localeCompare(
          utilTexto(b && b[campo]),
          'pt-BR',
          {
            sensitivity: 'base'
          }
        );

    return decrescente
      ? resultado * -1
      : resultado;
  });

  return copia;
}


/* ============================================================
 * VALIDAÇÃO
 * ============================================================
 */

/**
 * Exige o preenchimento de um campo.
 *
 * @param {*} valor
 * @param {string} nomeCampo
 * @return {*}
 */
function utilExigirCampo(valor, nomeCampo) {
  if (utilEstaVazio(valor)) {
    throw new Error(
      (nomeCampo || 'Campo') +
      ' é obrigatório.'
    );
  }

  return valor;
}


/**
 * Exige vários campos de um objeto.
 *
 * Exemplo:
 *
 * utilExigirCampos(dados, {
 *   NOME: 'Nome',
 *   EMAIL: 'E-mail'
 * });
 *
 * @param {Object} objeto
 * @param {Object} configuracao
 * @return {Object}
 */
function utilExigirCampos(
  objeto,
  configuracao
) {
  const dados = objeto || {};
  const campos = configuracao || {};

  Object.keys(campos)
    .forEach(function(chave) {
      utilExigirCampo(
        dados[chave],
        campos[chave]
      );
    });

  return dados;
}


/* ============================================================
 * HTML E NOMES DE ARQUIVO
 * ============================================================
 */

/**
 * Escapa caracteres especiais para HTML.
 *
 * @param {*} valor
 * @return {string}
 */
function utilEscaparHtml(valor) {
  return String(
    valor === undefined ||
    valor === null
      ? ''
      : valor
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/**
 * Prepara um texto para ser usado como nome de arquivo.
 *
 * @param {*} valor
 * @return {string}
 */
function utilSanitizarNomeArquivo(valor) {
  const resultado =
    utilNormalizarEspacos(valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

  return resultado || 'arquivo';
}