/**
 * ============================================================
 * ÁRYA SAÚDE — RN_Protocolos.gs
 * ============================================================
 *
 * Guias (itens) de um envio/protocolo, e o fluxo completo usado
 * pelo Portal Profissional para gerar um protocolo:
 *
 *  1. o profissional monta a lista de guias (convênio e/ou
 *     particular) na tela "Novo protocolo";
 *  2. ao confirmar, o sistema:
 *     - cria o envio (RN_Envios.criar);
 *     - grava cada guia nesta planilha (PROTOCOLOS_ITENS);
 *     - atualiza a quantidade de itens do envio;
 *     - gera o PDF do protocolo (RN_ProtocolosPdf);
 *     - vincula o PDF ao envio;
 *     - submete o envio para conferência administrativa.
 *
 * Dependências:
 * - Auth.gs
 * - RN_Config.gs
 * - RN_Envios.gs
 * - RN_ProtocolosPdf.gs
 * - RN_Pacientes*.gs / RN_Convenios.gs
 * - Utils.gs
 */

const RN_PROTOCOLOS_CONFIG = Object.freeze({
  PLANILHA_ITENS: 'PROTOCOLOS_ITENS'
});

const RN_PROTOCOLOS_TIPOS = Object.freeze({
  CONVENIO: 'CONVENIO',
  PARTICULAR: 'PARTICULAR'
});

const RN_PROTOCOLOS_FORMATOS_PAGAMENTO = Object.freeze({
  ADIANTADO_SESSAO: 'ADIANTADO_SESSAO',
  ADIANTADO_MES: 'ADIANTADO_MES',
  ATRASADO_SESSAO: 'ATRASADO_SESSAO',
  ATRASADO_MES: 'ATRASADO_MES'
});

const RN_PROTOCOLOS_COLUNAS = Object.freeze([
  'ID',
  'ENVIO_ID',
  'ENVIO_NUMERO',
  'ORDEM',
  'TIPO',

  'PACIENTE_ID',
  'PACIENTE_NOME',

  'CONVENIO_ID',
  'CONVENIO_NOME',

  'DATAS_ATENDIMENTO',

  'VALOR',
  'FORMATO_PAGAMENTO',

  'OBSERVACOES',

  'DATA_CRIACAO',
  'CRIADO_POR'
]);


/**
 * ============================================================
 * API PRINCIPAL
 * ============================================================
 */

const RN_Protocolos = {

  instalar: function () {
    const planilha = rnEnviosObterSpreadsheet_();
    const aba = rnProtocolosObterOuCriarAba_(planilha);

    return {
      sucesso: true,
      planilha: aba.getName()
    };
  },

  /**
   * Cria um novo protocolo (envio) a partir da lista de guias
   * digitadas pelo profissional, gera o PDF e já submete o
   * envio para conferência administrativa.
   *
   * @param {Object} dados
   * @param {{usuario: Object, profissional: Object}} contexto
   * @return {Object}
   */
  gerar: function (dados, contexto) {
    dados = dados || {};

    const itensBrutos = Array.isArray(dados.itens) ? dados.itens : [];

    if (itensBrutos.length === 0) {
      throw new Error('Adicione ao menos uma guia antes de gerar o protocolo.');
    }

    const itens = itensBrutos.map(rnProtocolosNormalizarItem_);

    const tipoConteudo = rnProtocolosDeterminarTipoConteudo_(itens);

    const usuario = contexto.usuario;
    const profissionalRegistro = contexto.profissional;

    const profissional = {
      id: rncTexto_(rncValorPorAlias_(profissionalRegistro, rncAliases_('PROFISSIONAIS', 'ID_PROFISSIONAL'))),
      nome: rncTexto_(rncValorPorAlias_(profissionalRegistro, rncAliases_('PROFISSIONAIS', 'NOME'))),
      email: rncTexto_(rncValorPorAlias_(profissionalRegistro, rncAliases_('PROFISSIONAIS', 'EMAIL'))) || usuario.EMAIL
    };

    const usuarioResumo = {
      id: usuario.ID_USUARIO || '',
      nome: usuario.NOME || '',
      email: usuario.EMAIL || ''
    };

    const envio = RN_Envios.criar({
      usuario: usuarioResumo,
      profissional: profissional,
      tipoConteudo: tipoConteudo,
      observacoes: dados.observacoes || ''
    });

    rnProtocolosInserirItens_(envio, itens, usuarioResumo);

    const totalizado = RN_Envios.atualizarResumoItens(
      envio.id,
      itens.length,
      tipoConteudo,
      usuarioResumo
    );

    const pdf = RN_ProtocolosPdf.gerar(totalizado, itens, profissional);

    RN_Envios.vincularPdf(
      totalizado.id,
      { id: pdf.id, url: pdf.url },
      usuarioResumo
    );

    const enviado = RN_Envios.submeter(
      totalizado.id,
      usuarioResumo
    );

    return {
      sucesso: true,
      numero: enviado.numero,
      pdfUrl: pdf.url,
      envio: enviado,
      itens: itens
    };
  },

  /**
   * Lista os itens (guias) de um envio.
   *
   * @param {string} envioId
   * @return {Object[]}
   */
  listarPorEnvio: function (envioId) {
    RN_Protocolos.instalar();

    return rnProtocolosLerItens_()
      .filter(function (item) {
        return String(item.ENVIO_ID) === String(envioId);
      })
      .map(rnProtocolosHidratarItem_)
      .sort(function (a, b) {
        return a.ordem - b.ordem;
      });
  }
};


/* ============================================================
 * VALIDAÇÃO E NORMALIZAÇÃO DOS ITENS
 * ============================================================
 */

function rnProtocolosNormalizarItem_(itemBruto) {
  itemBruto = itemBruto || {};

  const tipo = String(itemBruto.tipo || '').trim().toUpperCase();

  if (
    tipo !== RN_PROTOCOLOS_TIPOS.CONVENIO &&
    tipo !== RN_PROTOCOLOS_TIPOS.PARTICULAR
  ) {
    throw new Error('Cada guia deve informar o tipo: CONVENIO ou PARTICULAR.');
  }

  const pacienteNome = utilTexto(itemBruto.pacienteNome).trim();

  if (!pacienteNome) {
    throw new Error('Informe o nome do paciente em todas as guias.');
  }

  const datas = Array.isArray(itemBruto.datasAtendimento)
    ? itemBruto.datasAtendimento
        .map(function (d) { return utilTexto(d).trim(); })
        .filter(Boolean)
    : String(itemBruto.datasAtendimento || '')
        .split(/[,;\n]/)
        .map(function (d) { return d.trim(); })
        .filter(Boolean);

  if (datas.length === 0) {
    throw new Error('Informe ao menos uma data de atendimento para "' + pacienteNome + '".');
  }

  const item = {
    tipo: tipo,
    pacienteId: utilTexto(itemBruto.pacienteId),
    pacienteNome: pacienteNome,
    datasAtendimento: datas,
    observacoes: utilTexto(itemBruto.observacoes)
  };

  if (tipo === RN_PROTOCOLOS_TIPOS.CONVENIO) {
    const convenioNome = utilTexto(itemBruto.convenioNome).trim();

    if (!convenioNome) {
      throw new Error('Informe o convênio da guia de "' + pacienteNome + '".');
    }

    item.convenioId = utilTexto(itemBruto.convenioId);
    item.convenioNome = convenioNome;
  } else {
    const valor = utilParaNumero(itemBruto.valor, null);

    if (valor === null || valor <= 0) {
      throw new Error('Informe o valor da sessão/pacote de "' + pacienteNome + '".');
    }

    const formato = String(itemBruto.formatoPagamento || '').trim().toUpperCase();

    if (!RN_PROTOCOLOS_FORMATOS_PAGAMENTO[formato]) {
      throw new Error('Informe o formato de pagamento de "' + pacienteNome + '".');
    }

    item.valor = valor;
    item.formatoPagamento = formato;
  }

  return item;
}

function rnProtocolosDeterminarTipoConteudo_(itens) {
  const temConvenio = itens.some(function (i) { return i.tipo === RN_PROTOCOLOS_TIPOS.CONVENIO; });
  const temParticular = itens.some(function (i) { return i.tipo === RN_PROTOCOLOS_TIPOS.PARTICULAR; });

  if (temConvenio && temParticular) { return 'AMBOS'; }
  if (temConvenio) { return RN_PROTOCOLOS_TIPOS.CONVENIO; }
  return RN_PROTOCOLOS_TIPOS.PARTICULAR;
}


/* ============================================================
 * PERSISTÊNCIA
 * ============================================================
 */

function rnProtocolosObterOuCriarAba_(planilha) {
  let aba = planilha.getSheetByName(RN_PROTOCOLOS_CONFIG.PLANILHA_ITENS);

  if (!aba) {
    aba = planilha.insertSheet(RN_PROTOCOLOS_CONFIG.PLANILHA_ITENS);
  }

  rnProtocolosGarantirCabecalho_(aba);

  return aba;
}

function rnProtocolosGarantirCabecalho_(aba) {
  const colunas = RN_PROTOCOLOS_COLUNAS;

  const ultimaColuna = Math.max(aba.getLastColumn(), colunas.length);

  const cabecalhoAtual = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0];

  const vazio = cabecalhoAtual.every(function (v) {
    return String(v || '').trim() === '';
  });

  if (vazio) {
    aba.getRange(1, 1, 1, colunas.length).setValues([colunas]);
    aba.setFrozenRows(1);
    return;
  }

  colunas.forEach(function (coluna) {
    if (cabecalhoAtual.indexOf(coluna) === -1) {
      aba.getRange(1, aba.getLastColumn() + 1).setValue(coluna);
    }
  });

  aba.setFrozenRows(1);
}

function rnProtocolosInserirItens_(envio, itens, usuario) {
  const planilha = rnEnviosObterSpreadsheet_();
  const aba = rnProtocolosObterOuCriarAba_(planilha);
  const agora = new Date();

  const linhas = itens.map(function (item, indice) {
    return RN_PROTOCOLOS_COLUNAS.map(function (coluna) {
      switch (coluna) {
        case 'ID': return Utilities.getUuid();
        case 'ENVIO_ID': return envio.id;
        case 'ENVIO_NUMERO': return envio.numero;
        case 'ORDEM': return indice + 1;
        case 'TIPO': return item.tipo;
        case 'PACIENTE_ID': return item.pacienteId || '';
        case 'PACIENTE_NOME': return item.pacienteNome;
        case 'CONVENIO_ID': return item.convenioId || '';
        case 'CONVENIO_NOME': return item.convenioNome || '';
        case 'DATAS_ATENDIMENTO': return item.datasAtendimento.join(', ');
        case 'VALOR': return item.valor || '';
        case 'FORMATO_PAGAMENTO': return item.formatoPagamento || '';
        case 'OBSERVACOES': return item.observacoes || '';
        case 'DATA_CRIACAO': return agora;
        case 'CRIADO_POR': return usuario.email || usuario.EMAIL || '';
        default: return '';
      }
    });
  });

  if (linhas.length > 0) {
    const primeiraLinha = Math.max(aba.getLastRow() + 1, 2);
    aba.getRange(primeiraLinha, 1, linhas.length, RN_PROTOCOLOS_COLUNAS.length).setValues(linhas);
  }
}

function rnProtocolosLerItens_() {
  const planilha = rnEnviosObterSpreadsheet_();
  const aba = rnProtocolosObterOuCriarAba_(planilha);

  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  const valores = aba.getRange(2, 1, ultimaLinha - 1, RN_PROTOCOLOS_COLUNAS.length).getValues();

  return valores.map(function (linha) {
    const objeto = {};
    RN_PROTOCOLOS_COLUNAS.forEach(function (coluna, indice) {
      objeto[coluna] = linha[indice];
    });
    return objeto;
  });
}

function rnProtocolosHidratarItem_(registro) {
  return {
    id: String(registro.ID || ''),
    envioId: String(registro.ENVIO_ID || ''),
    envioNumero: String(registro.ENVIO_NUMERO || ''),
    ordem: Number(registro.ORDEM || 0),
    tipo: String(registro.TIPO || ''),
    pacienteId: String(registro.PACIENTE_ID || ''),
    pacienteNome: String(registro.PACIENTE_NOME || ''),
    convenioId: String(registro.CONVENIO_ID || ''),
    convenioNome: String(registro.CONVENIO_NOME || ''),
    datasAtendimento: String(registro.DATAS_ATENDIMENTO || '')
      .split(',')
      .map(function (d) { return d.trim(); })
      .filter(Boolean),
    valor: registro.VALOR === '' || registro.VALOR === undefined ? null : Number(registro.VALOR),
    formatoPagamento: String(registro.FORMATO_PAGAMENTO || ''),
    observacoes: String(registro.OBSERVACOES || '')
  };
}


/* ============================================================
 * API PÚBLICA — chamada pelo cliente via google.script.run
 * Todas as funções exigem o token de sessão do profissional
 * (ver Auth.gs — authDefinirContextoPorToken_).
 * ============================================================
 */

function protocolosListarMeusPacientes(token) {
  authDefinirContextoPorToken_(token);
  const ctx = authExigirProfissional();

  return rnpCoreListarPorProfissional_(ctx.profissional.ID_PROFISSIONAL, {});
}

function protocolosListarConveniosDisponiveis(token) {
  authDefinirContextoPorToken_(token);
  authExigirProfissional();

  return rnConveniosListarOpcoesAtendimento();
}

function protocolosObterConvenioDoPaciente(token, idPaciente) {
  authDefinirContextoPorToken_(token);
  authExigirProfissional();

  return rnConveniosObterDoPaciente(idPaciente);
}

function protocolosListarMeusProtocolos(token, filtros) {
  authDefinirContextoPorToken_(token);
  const ctx = authExigirProfissional();

  const filtrosFinais = filtros || {};
  filtrosFinais.profissionalEmail = ctx.usuario.EMAIL;

  return RN_Envios.listar(filtrosFinais);
}

function protocolosListarItensDoEnvio(token, envioId) {
  authDefinirContextoPorToken_(token);
  const ctx = authExigirProfissional();

  const envio = RN_Envios.obterObrigatorio(envioId);

  if (envio.profissional.email.toLowerCase() !== ctx.usuario.EMAIL.toLowerCase()) {
    throw new Error('Este protocolo não pertence ao profissional conectado.');
  }

  return RN_Protocolos.listarPorEnvio(envio.id);
}

function protocolosGerarProtocolo(token, dados) {
  authDefinirContextoPorToken_(token);
  const ctx = authExigirProfissional();

  return RN_Protocolos.gerar(dados, ctx);
}
