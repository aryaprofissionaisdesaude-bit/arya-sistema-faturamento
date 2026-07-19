/**
 * ============================================================
 * ÁRYA SAÚDE
 * INSTALADOR DO SISTEMA DE FATURAMENTO E PROTOCOLOS
 * VERSÃO 1.0
 * ============================================================
 *
 * PRIMEIRA ETAPA:
 * - Cria estrutura de pastas no Google Drive
 * - Cria planilha principal
 * - Cria abas do banco de dados
 * - Aplica cabeçalhos e formatações
 * - Insere configurações e cadastros iniciais
 * - Aplica validações básicas
 *
 * IMPORTANTE:
 * Execute a função instalarSistemaArya() apenas uma vez.
 */


/* ============================================================
 * CONFIGURAÇÕES GERAIS DO INSTALADOR
 * ============================================================
 */

const ARYA_CONFIG = {
  nomeSistema: 'Árya Saúde - Gestão de Faturamento',
  versao: '1.0.0',

  nomePastaPrincipal: 'ÁRYA SAÚDE - SISTEMA DE FATURAMENTO',
  nomePlanilha: 'Árya Saúde - Banco de Dados',

  quantidadeLinhasPreparadas: 2000,

  cores: {
    principal: '#263238',
    secundaria: '#455A64',
    destaque: '#C9A96E',
    fundoClaro: '#F5F7F8',
    branco: '#FFFFFF',
    verde: '#2E7D32',
    amarelo: '#F9A825',
    vermelho: '#C62828',
    azul: '#1565C0',
    cinza: '#757575',
    roxo: '#6A1B9A'
  }
};


/* ============================================================
 * FUNÇÃO PRINCIPAL
 * ============================================================
 */

function instalarSistemaArya() {
  const propriedades = PropertiesService.getScriptProperties();
  const planilhaJaInstalada = propriedades.getProperty('ARYA_PLANILHA_ID');

  if (planilhaJaInstalada) {
    const mensagem =
      'O sistema já foi instalado anteriormente.\n\n' +
      'ID da planilha:\n' +
      planilhaJaInstalada +
      '\n\n' +
      'Para evitar duplicidade, uma nova instalação não foi criada.';

    SpreadsheetApp.getUi().alert('Instalação já realizada', mensagem, SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  try {
    const estruturaPastas = criarEstruturaDePastas();
    const planilha = criarPlanilhaPrincipal(estruturaPastas.pastaBancoDados);

    criarAbasDoSistema(planilha);
    inserirDadosIniciais(planilha);
    aplicarValidacoes(planilha);
    aplicarFormatacoesEspecificas(planilha);
    criarAbaDeApresentacao(planilha);

    SpreadsheetApp.flush();

    propriedades.setProperties({
      ARYA_INSTALADO: 'SIM',
      ARYA_VERSAO: ARYA_CONFIG.versao,
      ARYA_PLANILHA_ID: planilha.getId(),
      ARYA_PLANILHA_URL: planilha.getUrl(),
      ARYA_PASTA_PRINCIPAL_ID: estruturaPastas.pastaPrincipal.getId(),
      ARYA_DATA_INSTALACAO: new Date().toISOString()
    });

    registrarLogDireto(
      planilha,
      'INSTALACAO',
      'Sistema instalado com sucesso',
      'INSTALADOR',
      'SUCESSO'
    );

    planilha.setActiveSheet(planilha.getSheetByName('INICIO'));

    const mensagemFinal =
      'A primeira etapa da instalação foi concluída.\n\n' +
      'Planilha criada:\n' +
      planilha.getUrl() +
      '\n\n' +
      'Pasta principal criada no Google Drive:\n' +
      estruturaPastas.pastaPrincipal.getName();

    SpreadsheetApp.getUi().alert(
      'Instalação concluída',
      mensagemFinal,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    Logger.log('PLANILHA: ' + planilha.getUrl());
    Logger.log('PASTA PRINCIPAL: ' + estruturaPastas.pastaPrincipal.getUrl());

  } catch (erro) {
    console.error(erro);

    SpreadsheetApp.getUi().alert(
      'Erro na instalação',
      'A instalação não foi concluída.\n\nDetalhes:\n' + erro.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    throw erro;
  }
}


/* ============================================================
 * CRIAÇÃO DAS PASTAS
 * ============================================================
 */

function criarEstruturaDePastas() {
  const raiz = DriveApp.getRootFolder();
  const pastaPrincipal = raiz.createFolder(ARYA_CONFIG.nomePastaPrincipal);

  const pastaBancoDados = pastaPrincipal.createFolder('01 - BANCO DE DADOS');
  const pastaDocumentos = pastaPrincipal.createFolder('02 - DOCUMENTOS');
  const pastaGuias = pastaPrincipal.createFolder('03 - GUIAS');
  const pastaRemessas = pastaPrincipal.createFolder('04 - REMESSAS');
  const pastaPagamentos = pastaPrincipal.createFolder('05 - PAGAMENTOS');
  const pastaGlosas = pastaPrincipal.createFolder('06 - GLOSAS');
  const pastaImportacoes = pastaPrincipal.createFolder('07 - IMPORTAÇÕES');
  const pastaRelatorios = pastaPrincipal.createFolder('08 - RELATÓRIOS');
  const pastaBackups = pastaPrincipal.createFolder('09 - BACKUPS');

  pastaDocumentos.createFolder('Autorizações');
  pastaDocumentos.createFolder('Pedidos médicos');
  pastaDocumentos.createFolder('Documentos de pacientes');
  pastaDocumentos.createFolder('Documentos de profissionais');
  pastaDocumentos.createFolder('Contratos');
  pastaDocumentos.createFolder('Outros');

  pastaGuias.createFolder('Guias recebidas');
  pastaGuias.createFolder('Guias conferidas');
  pastaGuias.createFolder('Guias com pendência');
  pastaGuias.createFolder('Guias faturadas');

  pastaRemessas.createFolder('Remessas abertas');
  pastaRemessas.createFolder('Remessas enviadas');
  pastaRemessas.createFolder('Comprovantes de protocolo');

  pastaPagamentos.createFolder('Relatórios ASMEPRO');
  pastaPagamentos.createFolder('Relatórios AMHP');
  pastaPagamentos.createFolder('Comprovantes');

  pastaGlosas.createFolder('Recursos');
  pastaGlosas.createFolder('Documentos comprobatórios');
  pastaGlosas.createFolder('Respostas das associações');

  return {
    pastaPrincipal,
    pastaBancoDados,
    pastaDocumentos,
    pastaGuias,
    pastaRemessas,
    pastaPagamentos,
    pastaGlosas,
    pastaImportacoes,
    pastaRelatorios,
    pastaBackups
  };
}


/* ============================================================
 * CRIAÇÃO DA PLANILHA
 * ============================================================
 */

function criarPlanilhaPrincipal(pastaBancoDados) {
  const planilha = SpreadsheetApp.create(ARYA_CONFIG.nomePlanilha);

  planilha.setSpreadsheetLocale('pt_BR');
  planilha.setSpreadsheetTimeZone('America/Sao_Paulo');

  const arquivo = DriveApp.getFileById(planilha.getId());
  arquivo.moveTo(pastaBancoDados);

  const abaInicial = planilha.getSheets()[0];
  abaInicial.setName('INICIO');

  return planilha;
}


/* ============================================================
 * DEFINIÇÃO DAS ABAS E COLUNAS
 * ============================================================
 */

function obterEstruturaDasAbas() {
  return {

    INICIO: [
      'INFORMAÇÃO',
      'CONTEÚDO'
    ],

    CONFIGURACOES: [
      'CHAVE',
      'VALOR',
      'DESCRIÇÃO',
      'ALTERÁVEL',
      'DATA_ATUALIZAÇÃO'
    ],

    USUARIOS: [
      'ID_USUARIO',
      'NOME',
      'EMAIL',
      'PERFIL',
      'ID_PROFISSIONAL',
      'ATIVO',
      'DATA_CADASTRO',
      'ÚLTIMO_ACESSO',
      'OBSERVAÇÕES'
    ],

    PERMISSOES: [
      'ID_PERMISSAO',
      'PERFIL',
      'MÓDULO',
      'PODE_VISUALIZAR',
      'PODE_CRIAR',
      'PODE_EDITAR',
      'PODE_EXCLUIR',
      'PODE_APROVAR',
      'OBSERVAÇÕES'
    ],

    LOGS: [
      'ID_LOG',
      'DATA_HORA',
      'TIPO_EVENTO',
      'DESCRIÇÃO',
      'USUÁRIO',
      'STATUS',
      'DETALHES'
    ],

    HISTORICO: [
      'ID_HISTORICO',
      'DATA_HORA',
      'USUÁRIO',
      'TABELA',
      'ID_REGISTRO',
      'AÇÃO',
      'CAMPO_ALTERADO',
      'VALOR_ANTERIOR',
      'VALOR_NOVO',
      'OBSERVAÇÕES'
    ],

    PROFISSIONAIS: [
      'ID_PROFISSIONAL',
      'NOME_COMPLETO',
      'NOME_EXIBIÇÃO',
      'CPF',
      'CONSELHO',
      'NÚMERO_CONSELHO',
      'UF_CONSELHO',
      'ESPECIALIDADE',
      'EMAIL',
      'TELEFONE',
      'CHAVE_PIX',
      'TIPO_CHAVE_PIX',
      'DATA_ENTRADA',
      'DATA_SAÍDA',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    PACIENTES: [
      'ID_PACIENTE',
      'NOME_COMPLETO',
      'NOME_SOCIAL',
      'CPF',
      'DATA_NASCIMENTO',
      'TELEFONE',
      'EMAIL',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'NÚMERO_CARTEIRINHA',
      'VALIDADE_CARTEIRINHA',
      'NOME_TITULAR',
      'CPF_TITULAR',
      'ID_PROFISSIONAL_PRINCIPAL',
      'ATIVO',
      'DATA_CADASTRO',
      'OBSERVAÇÕES'
    ],

    CONVENIOS: [
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'RAZÃO_SOCIAL',
      'CNPJ',
      'REGISTRO_ANS',
      'ATIVO',
      'EXIGE_AUTORIZAÇÃO',
      'EXIGE_PEDIDO_MÉDICO',
      'VALIDADE_PADRÃO_AUTORIZAÇÃO_DIAS',
      'OBSERVAÇÕES'
    ],

    ASSOCIACOES: [
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'RAZÃO_SOCIAL',
      'CNPJ',
      'EMAIL',
      'TELEFONE',
      'SITE',
      'PRAZO_PADRÃO_PAGAMENTO_DIAS',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    PROCEDIMENTOS: [
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'CÓDIGO_INTERNO',
      'TIPO_ATENDIMENTO',
      'DURAÇÃO_PADRÃO_MINUTOS',
      'MODALIDADE',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    PROCEDIMENTOS_CONVENIOS: [
      'ID_PROCEDIMENTO_CONVENIO',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'CÓDIGO_NO_CONVENIO',
      'DESCRIÇÃO_NO_CONVENIO',
      'UNIDADE_FATURAMENTO',
      'EXIGE_AUTORIZAÇÃO',
      'QUANTIDADE_MÁXIMA_POR_GUIA',
      'ATIVO',
      'DATA_INÍCIO',
      'DATA_FIM',
      'OBSERVAÇÕES'
    ],

    HABILITACAO_PROFISSIONAIS: [
      'ID_HABILITACAO',
      'ID_PROFISSIONAL',
      'NOME_PROFISSIONAL',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'NÚMERO_CREDENCIAMENTO',
      'DATA_INÍCIO',
      'DATA_FIM',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    CONTRATOS_REPASSE: [
      'ID_CONTRATO_REPASSE',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'ID_PROCEDIMENTO_CONVENIO',
      'CÓDIGO_PROCEDIMENTO_CONVENIO',
      'VALOR_BRUTO',
      'TIPO_TAXA',
      'PERCENTUAL_TAXA',
      'VALOR_TAXA_FIXA',
      'VALOR_LÍQUIDO_ESTIMADO',
      'PRAZO_PAGAMENTO_DIAS',
      'DATA_INÍCIO_VIGÊNCIA',
      'DATA_FIM_VIGÊNCIA',
      'PRIORIDADE_MANUAL',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    POLITICAS_FATURAMENTO: [
      'ID_POLITICA',
      'ESCOPO',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'CRITÉRIO_PRINCIPAL',
      'CRITÉRIO_SECUNDÁRIO',
      'ASSOCIAÇÃO_PADRÃO_EMPATE',
      'PERMITE_ALTERAÇÃO_MANUAL',
      'BLOQUEIA_CONTRATO_VENCIDO',
      'BLOQUEIA_PROFISSIONAL_NÃO_HABILITADO',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    CONTRATOS_PROFISSIONAIS: [
      'ID_CONTRATO_PROFISSIONAL',
      'ID_PROFISSIONAL',
      'NOME_PROFISSIONAL',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'TIPO_CÁLCULO',
      'PERCENTUAL_REPASSE',
      'VALOR_FIXO',
      'BASE_DE_CÁLCULO',
      'DATA_INÍCIO_VIGÊNCIA',
      'DATA_FIM_VIGÊNCIA',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    PROTOCOLOS: [
      'ID_PROTOCOLO',
      'NÚMERO_PROTOCOLO_INTERNO',
      'ID_PROFISSIONAL',
      'NOME_PROFISSIONAL',
      'COMPETÊNCIA',
      'DATA_RECEBIMENTO',
      'RECEBIDO_POR',
      'QUANTIDADE_GUIAS_INFORMADA',
      'QUANTIDADE_GUIAS_CONFERIDA',
      'STATUS',
      'DATA_CONFERÊNCIA',
      'CONFERIDO_POR',
      'POSSUI_RESSALVA',
      'OBSERVAÇÕES'
    ],

    GUIAS: [
      'ID_GUIA',
      'ID_PROTOCOLO',
      'NÚMERO_GUIA',
      'ID_PACIENTE',
      'NOME_PACIENTE',
      'ID_PROFISSIONAL',
      'NOME_PROFISSIONAL',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'ID_PROCEDIMENTO_CONVENIO',
      'CÓDIGO_PROCEDIMENTO_CONVENIO',
      'ID_CONTRATO_REPASSE',
      'NÚMERO_AUTORIZAÇÃO',
      'DATA_INÍCIO_AUTORIZAÇÃO',
      'DATA_FIM_AUTORIZAÇÃO',
      'QUANTIDADE_AUTORIZADA',
      'QUANTIDADE_REALIZADA',
      'VALOR_UNITÁRIO_BRUTO',
      'VALOR_UNITÁRIO_TAXA',
      'VALOR_UNITÁRIO_LÍQUIDO',
      'VALOR_TOTAL_BRUTO_PREVISTO',
      'VALOR_TOTAL_TAXA_PREVISTA',
      'VALOR_TOTAL_LÍQUIDO_PREVISTO',
      'ORIGEM_VALOR',
      'DATA_REFERÊNCIA_VALOR',
      'STATUS',
      'POSSUI_RESSALVA',
      'LINK_DOCUMENTO',
      'OBSERVAÇÕES'
    ],

    SESSOES: [
      'ID_SESSAO',
      'ID_GUIA',
      'ID_PROTOCOLO',
      'ID_PACIENTE',
      'NOME_PACIENTE',
      'ID_PROFISSIONAL',
      'NOME_PROFISSIONAL',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'ID_PROCEDIMENTO',
      'NOME_PROCEDIMENTO',
      'DATA_SESSÃO',
      'HORÁRIO',
      'MODALIDADE',
      'STATUS_SESSÃO',
      'VALOR_BRUTO_PREVISTO',
      'VALOR_TAXA_PREVISTA',
      'VALOR_LÍQUIDO_PREVISTO',
      'VALOR_BRUTO_RECEBIDO',
      'VALOR_TAXA_RECEBIDA',
      'VALOR_LÍQUIDO_RECEBIDO',
      'DIFERENÇA_LÍQUIDA',
      'ID_REMESSA',
      'ID_PAGAMENTO',
      'STATUS_FATURAMENTO',
      'OBSERVAÇÕES'
    ],

    REMESSAS: [
      'ID_REMESSA',
      'NÚMERO_REMESSA',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'COMPETÊNCIA',
      'DATA_ABERTURA',
      'DATA_FECHAMENTO',
      'DATA_ENVIO',
      'ENVIADO_POR',
      'QUANTIDADE_GUIAS',
      'QUANTIDADE_SESSÕES',
      'VALOR_BRUTO_TOTAL',
      'VALOR_TAXA_TOTAL',
      'VALOR_LÍQUIDO_PREVISTO',
      'NÚMERO_PROTOCOLO_ASSOCIAÇÃO',
      'STATUS',
      'LINK_COMPROVANTE',
      'OBSERVAÇÕES'
    ],

    REMESSA_GUIAS: [
      'ID_REMESSA_GUIA',
      'ID_REMESSA',
      'NÚMERO_REMESSA',
      'ID_GUIA',
      'NÚMERO_GUIA',
      'ID_PACIENTE',
      'NOME_PACIENTE',
      'VALOR_BRUTO',
      'VALOR_TAXA',
      'VALOR_LÍQUIDO_PREVISTO',
      'DATA_INCLUSÃO',
      'INCLUÍDO_POR',
      'STATUS',
      'OBSERVAÇÕES'
    ],

    PAGAMENTOS: [
      'ID_PAGAMENTO',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'COMPETÊNCIA',
      'DATA_PREVISTA',
      'DATA_RECEBIMENTO',
      'VALOR_BRUTO_INFORMADO',
      'VALOR_TAXAS_INFORMADO',
      'VALOR_LÍQUIDO_RECEBIDO',
      'VALOR_PREVISTO_SISTEMA',
      'DIFERENÇA',
      'TIPO_DOCUMENTO',
      'NÚMERO_DOCUMENTO',
      'LINK_COMPROVANTE',
      'STATUS_CONCILIAÇÃO',
      'CONCILIADO_POR',
      'DATA_CONCILIAÇÃO',
      'OBSERVAÇÕES'
    ],

    GLOSAS: [
      'ID_GLOSA',
      'ID_PAGAMENTO',
      'ID_REMESSA',
      'ID_GUIA',
      'ID_SESSAO',
      'ID_PACIENTE',
      'NOME_PACIENTE',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'CÓDIGO_GLOSA',
      'MOTIVO_GLOSA',
      'VALOR_GLOSADO',
      'DATA_IDENTIFICAÇÃO',
      'STATUS',
      'DATA_RECURSO',
      'DATA_RESPOSTA',
      'VALOR_RECUPERADO',
      'RESPONSÁVEL',
      'LINK_DOCUMENTO',
      'OBSERVAÇÕES'
    ],

    RESSALVAS: [
      'ID_RESSALVA',
      'TIPO_REGISTRO',
      'ID_REGISTRO',
      'ID_PROTOCOLO',
      'ID_GUIA',
      'ID_SESSAO',
      'ID_MOTIVO',
      'MOTIVO',
      'DESCRIÇÃO',
      'NÍVEL_CRITICIDADE',
      'DATA_ABERTURA',
      'ABERTA_POR',
      'STATUS',
      'DATA_RESOLUÇÃO',
      'RESOLVIDA_POR',
      'SOLUÇÃO',
      'OBSERVAÇÕES'
    ],

    MOTIVOS: [
      'ID_MOTIVO',
      'CATEGORIA',
      'NOME_MOTIVO',
      'DESCRIÇÃO_PADRÃO',
      'BLOQUEIA_FATURAMENTO',
      'EXIGE_DOCUMENTO',
      'ATIVO',
      'ORDEM_EXIBIÇÃO'
    ],

    DOCUMENTOS: [
      'ID_DOCUMENTO',
      'TIPO_DOCUMENTO',
      'NOME_ARQUIVO',
      'ID_ARQUIVO_DRIVE',
      'LINK_ARQUIVO',
      'TIPO_REGISTRO_RELACIONADO',
      'ID_REGISTRO_RELACIONADO',
      'ID_PACIENTE',
      'ID_PROFISSIONAL',
      'ID_GUIA',
      'ID_REMESSA',
      'ID_GLOSA',
      'DATA_UPLOAD',
      'ENVIADO_POR',
      'ATIVO',
      'OBSERVAÇÕES'
    ],

    IMPORTACOES: [
      'ID_IMPORTACAO',
      'TIPO_IMPORTAÇÃO',
      'ORIGEM',
      'NOME_ARQUIVO',
      'ID_ARQUIVO_DRIVE',
      'LINK_ARQUIVO',
      'DATA_IMPORTAÇÃO',
      'IMPORTADO_POR',
      'QUANTIDADE_LINHAS',
      'QUANTIDADE_PROCESSADA',
      'QUANTIDADE_ERROS',
      'STATUS',
      'MENSAGEM_PROCESSAMENTO',
      'OBSERVAÇÕES'
    ],

    DASHBOARD: [
      'INDICADOR',
      'VALOR',
      'PERÍODO',
      'DATA_ATUALIZAÇÃO'
    ],

    RELATORIO_FINANCEIRO: [
      'COMPETÊNCIA',
      'VALOR_BRUTO_PREVISTO',
      'VALOR_LÍQUIDO_PREVISTO',
      'VALOR_LÍQUIDO_RECEBIDO',
      'VALOR_GLOSADO',
      'VALOR_RECUPERADO',
      'DIFERENÇA'
    ],

    RELATORIO_PRODUCAO: [
      'COMPETÊNCIA',
      'ID_PROFISSIONAL',
      'NOME_PROFISSIONAL',
      'QUANTIDADE_SESSÕES',
      'VALOR_BRUTO',
      'VALOR_LÍQUIDO',
      'VALOR_REPASSE_PROFISSIONAL'
    ],

    RELATORIO_CONVENIOS: [
      'COMPETÊNCIA',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'QUANTIDADE_GUIAS',
      'QUANTIDADE_SESSÕES',
      'VALOR_BRUTO',
      'VALOR_LÍQUIDO',
      'VALOR_GLOSADO'
    ],

    RELATORIO_ASSOCIACOES: [
      'COMPETÊNCIA',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'QUANTIDADE_GUIAS',
      'VALOR_BRUTO',
      'VALOR_TAXAS',
      'VALOR_LÍQUIDO',
      'PRAZO_MÉDIO_PAGAMENTO',
      'ÍNDICE_GLOSAS'
    ],

    RELATORIO_GLOSAS: [
      'COMPETÊNCIA',
      'ID_ASSOCIACAO',
      'NOME_ASSOCIACAO',
      'ID_CONVENIO',
      'NOME_CONVENIO',
      'QUANTIDADE_GLOSAS',
      'VALOR_GLOSADO',
      'VALOR_RECUPERADO',
      'PERCENTUAL_RECUPERAÇÃO'
    ]
  };
}


/* ============================================================
 * CRIAÇÃO DAS ABAS
 * ============================================================
 */

function criarAbasDoSistema(planilha) {
  const estrutura = obterEstruturaDasAbas();
  const nomesAbas = Object.keys(estrutura);

  nomesAbas.forEach(function(nomeAba) {
    let aba = planilha.getSheetByName(nomeAba);

    if (!aba) {
      aba = planilha.insertSheet(nomeAba);
    }

    aba.clear();
    aba.clearFormats();
    aba.clearConditionalFormatRules();

    const cabecalhos = estrutura[nomeAba];

    aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);

    prepararDimensoesDaAba(aba, cabecalhos.length);
    formatarCabecalho(aba, cabecalhos.length);
    formatarCorpoDaAba(aba, cabecalhos.length);
    ajustarLarguraDasColunas(aba, cabecalhos);

    aba.setFrozenRows(1);
    aba.setTabColor(obterCorDaAba(nomeAba));
  });

  ordenarAbas(planilha, nomesAbas);
}


/* ============================================================
 * DIMENSÕES E FORMATAÇÃO GERAL
 * ============================================================
 */

function prepararDimensoesDaAba(aba, quantidadeColunas) {
  const linhasNecessarias = ARYA_CONFIG.quantidadeLinhasPreparadas;
  const colunasNecessarias = quantidadeColunas;

  if (aba.getMaxRows() < linhasNecessarias) {
    aba.insertRowsAfter(
      aba.getMaxRows(),
      linhasNecessarias - aba.getMaxRows()
    );
  }

  if (aba.getMaxColumns() < colunasNecessarias) {
    aba.insertColumnsAfter(
      aba.getMaxColumns(),
      colunasNecessarias - aba.getMaxColumns()
    );
  }

  if (aba.getMaxColumns() > colunasNecessarias) {
    aba.deleteColumns(
      colunasNecessarias + 1,
      aba.getMaxColumns() - colunasNecessarias
    );
  }
}


function formatarCabecalho(aba, quantidadeColunas) {
  const intervalo = aba.getRange(1, 1, 1, quantidadeColunas);

  intervalo
    .setBackground(ARYA_CONFIG.cores.principal)
    .setFontColor(ARYA_CONFIG.cores.branco)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  aba.setRowHeight(1, 42);
}


function formatarCorpoDaAba(aba, quantidadeColunas) {
  aba.getRange(
    2,
    1,
    ARYA_CONFIG.quantidadeLinhasPreparadas - 1,
    quantidadeColunas
  )
    .setFontFamily('Arial')
    .setFontSize(10)
    .setVerticalAlignment('middle');

  aba.setRowHeights(
    2,
    ARYA_CONFIG.quantidadeLinhasPreparadas - 1,
    28
  );

  aba.setHiddenGridlines(false);
}


function ajustarLarguraDasColunas(aba, cabecalhos) {
  cabecalhos.forEach(function(cabecalho, indice) {
    const coluna = indice + 1;
    let largura = 140;

    const texto = String(cabecalho).toUpperCase();

    if (
      texto.includes('OBSERVA') ||
      texto.includes('DESCRI') ||
      texto.includes('DETALHE') ||
      texto.includes('SOLUÇÃO') ||
      texto.includes('MENSAGEM')
    ) {
      largura = 280;
    } else if (
      texto.includes('LINK') ||
      texto.includes('EMAIL') ||
      texto.includes('NOME_COMPLETO') ||
      texto.includes('RAZÃO_SOCIAL')
    ) {
      largura = 220;
    } else if (
      texto.includes('DATA') ||
      texto.includes('HORÁRIO') ||
      texto.includes('COMPETÊNCIA')
    ) {
      largura = 125;
    } else if (
      texto.includes('VALOR') ||
      texto.includes('PERCENTUAL') ||
      texto.includes('QUANTIDADE')
    ) {
      largura = 130;
    } else if (texto.startsWith('ID_')) {
      largura = 145;
    }

    aba.setColumnWidth(coluna, largura);
  });
}


function obterCorDaAba(nomeAba) {
  const abasSistema = [
    'INICIO',
    'CONFIGURACOES',
    'USUARIOS',
    'PERMISSOES',
    'LOGS',
    'HISTORICO'
  ];

  const abasCadastro = [
    'PROFISSIONAIS',
    'PACIENTES',
    'CONVENIOS',
    'ASSOCIACOES',
    'PROCEDIMENTOS',
    'PROCEDIMENTOS_CONVENIOS',
    'HABILITACAO_PROFISSIONAIS'
  ];

  const abasRegras = [
    'CONTRATOS_REPASSE',
    'POLITICAS_FATURAMENTO',
    'CONTRATOS_PROFISSIONAIS'
  ];

  const abasOperacao = [
    'PROTOCOLOS',
    'GUIAS',
    'SESSOES',
    'REMESSAS',
    'REMESSA_GUIAS'
  ];

  const abasFinanceiro = [
    'PAGAMENTOS',
    'GLOSAS',
    'RESSALVAS',
    'MOTIVOS'
  ];

  const abasDocumentos = [
    'DOCUMENTOS',
    'IMPORTACOES'
  ];

  if (abasSistema.includes(nomeAba)) {
    return ARYA_CONFIG.cores.principal;
  }

  if (abasCadastro.includes(nomeAba)) {
    return ARYA_CONFIG.cores.verde;
  }

  if (abasRegras.includes(nomeAba)) {
    return ARYA_CONFIG.cores.amarelo;
  }

  if (abasOperacao.includes(nomeAba)) {
    return ARYA_CONFIG.cores.azul;
  }

  if (abasFinanceiro.includes(nomeAba)) {
    return ARYA_CONFIG.cores.vermelho;
  }

  if (abasDocumentos.includes(nomeAba)) {
    return ARYA_CONFIG.cores.roxo;
  }

  return ARYA_CONFIG.cores.cinza;
}


function ordenarAbas(planilha, nomesAbas) {
  nomesAbas.forEach(function(nomeAba, indice) {
    const aba = planilha.getSheetByName(nomeAba);

    planilha.setActiveSheet(aba);
    planilha.moveActiveSheet(indice + 1);
  });
}


/* ============================================================
 * DADOS INICIAIS
 * ============================================================
 */

function inserirDadosIniciais(planilha) {
  inserirConfiguracoesIniciais(planilha);
  inserirUsuarioAdministrador(planilha);
  inserirPermissoesIniciais(planilha);
  inserirAssociacoesIniciais(planilha);
  inserirProcedimentosIniciais(planilha);
  inserirPoliticasFaturamentoIniciais(planilha);
  inserirMotivosIniciais(planilha);
}


function inserirConfiguracoesIniciais(planilha) {
  const aba = planilha.getSheetByName('CONFIGURACOES');
  const agora = new Date();

  const dados = [
    ['NOME_SISTEMA', ARYA_CONFIG.nomeSistema, 'Nome oficial do sistema', 'NÃO', agora],
    ['VERSAO_SISTEMA', ARYA_CONFIG.versao, 'Versão atual instalada', 'NÃO', agora],
    ['EMPRESA', 'Árya Saúde', 'Nome da empresa', 'SIM', agora],
    ['FUSO_HORARIO', 'America/Sao_Paulo', 'Fuso horário utilizado pelo sistema', 'SIM', agora],
    ['MOEDA', 'BRL', 'Moeda utilizada nos cálculos', 'NÃO', agora],
    ['LOCALE', 'pt_BR', 'Localidade da planilha', 'NÃO', agora],
    ['EMAIL_ADMINISTRATIVO', '', 'E-mail responsável pelo faturamento', 'SIM', agora],
    ['DIA_FECHAMENTO_COMPETENCIA', '5', 'Dia padrão para fechamento da competência', 'SIM', agora],
    ['PERMITE_ALTERACAO_ASSOCIACAO', 'SIM', 'Permite alteração administrativa da associação sugerida', 'SIM', agora],
    ['BLOQUEIA_CONTRATO_VENCIDO', 'SIM', 'Impede utilização de contrato vencido', 'SIM', agora],
    ['BLOQUEIA_PROFISSIONAL_NAO_HABILITADO', 'SIM', 'Impede faturamento por profissional sem habilitação', 'SIM', agora],
    ['CRIADO_EM', agora, 'Data de criação do sistema', 'NÃO', agora]
  ];

  aba.getRange(2, 1, dados.length, dados[0].length).setValues(dados);
}


function inserirUsuarioAdministrador(planilha) {
  const aba = planilha.getSheetByName('USUARIOS');
  const emailUsuario = Session.getActiveUser().getEmail() || '';

  const dados = [[
    'USR-0001',
    'Administrador do sistema',
    emailUsuario,
    'ADMINISTRADOR',
    '',
    'SIM',
    new Date(),
    '',
    'Usuário criado automaticamente durante a instalação'
  ]];

  aba.getRange(2, 1, 1, dados[0].length).setValues(dados);
}


function inserirPermissoesIniciais(planilha) {
  const aba = planilha.getSheetByName('PERMISSOES');

  const modulos = [
    'CADASTROS',
    'PROTOCOLOS',
    'GUIAS',
    'SESSÕES',
    'REMESSAS',
    'PAGAMENTOS',
    'GLOSAS',
    'RELATÓRIOS',
    'CONFIGURAÇÕES'
  ];

  const dados = [];
  let contador = 1;

  modulos.forEach(function(modulo) {
    dados.push([
      criarCodigoSequencial('PERM', contador++),
      'ADMINISTRADOR',
      modulo,
      'SIM',
      'SIM',
      'SIM',
      'SIM',
      'SIM',
      'Acesso total'
    ]);
  });

  ['PROTOCOLOS', 'GUIAS', 'SESSÕES', 'REMESSAS', 'PAGAMENTOS', 'GLOSAS'].forEach(function(modulo) {
    dados.push([
      criarCodigoSequencial('PERM', contador++),
      'ADMINISTRATIVO',
      modulo,
      'SIM',
      'SIM',
      'SIM',
      'NÃO',
      'SIM',
      'Acesso operacional'
    ]);
  });

  ['PACIENTES', 'GUIAS', 'SESSÕES'].forEach(function(modulo) {
    dados.push([
      criarCodigoSequencial('PERM', contador++),
      'PROFISSIONAL',
      modulo,
      'SIM',
      'SIM',
      'SIM',
      'NÃO',
      'NÃO',
      'Acesso restrito aos próprios registros'
    ]);
  });

  aba.getRange(2, 1, dados.length, dados[0].length).setValues(dados);
}


function inserirAssociacoesIniciais(planilha) {
  const aba = planilha.getSheetByName('ASSOCIACOES');

  const dados = [
    [
      'ASSOC-0001',
      'ASMEPRO',
      '',
      '',
      '',
      '',
      '',
      '',
      'SIM',
      'Cadastro inicial. Completar dados contratuais.'
    ],
    [
      'ASSOC-0002',
      'AMHP',
      '',
      '',
      '',
      '',
      '',
      '',
      'SIM',
      'Cadastro inicial. Completar dados contratuais.'
    ]
  ];

  aba.getRange(2, 1, dados.length, dados[0].length).setValues(dados);
}


function inserirProcedimentosIniciais(planilha) {
  const aba = planilha.getSheetByName('PROCEDIMENTOS');

  const dados = [
    [
      'PROC-0001',
      'Psicoterapia individual',
      'PSI-IND',
      'INDIVIDUAL',
      50,
      'PRESENCIAL OU ONLINE',
      'SIM',
      ''
    ],
    [
      'PROC-0002',
      'Psicoterapia de casal',
      'PSI-CASAL',
      'CASAL',
      50,
      'PRESENCIAL OU ONLINE',
      'SIM',
      ''
    ],
    [
      'PROC-0003',
      'Psicoterapia familiar',
      'PSI-FAM',
      'FAMÍLIA',
      50,
      'PRESENCIAL OU ONLINE',
      'SIM',
      ''
    ],
    [
      'PROC-0004',
      'Consulta psicológica',
      'CONS-PSI',
      'INDIVIDUAL',
      50,
      'PRESENCIAL OU ONLINE',
      'SIM',
      ''
    ],
    [
      'PROC-0005',
      'Orientação parental',
      'ORI-PAR',
      'FAMÍLIA',
      50,
      'PRESENCIAL OU ONLINE',
      'SIM',
      ''
    ],
    [
      'PROC-0006',
      'Avaliação psicológica',
      'AVA-PSI',
      'AVALIAÇÃO',
      60,
      'PRESENCIAL OU ONLINE',
      'SIM',
      ''
    ]
  ];

  aba.getRange(2, 1, dados.length, dados[0].length).setValues(dados);
}


function inserirPoliticasFaturamentoIniciais(planilha) {
  const aba = planilha.getSheetByName('POLITICAS_FATURAMENTO');

  const dados = [[
    'POL-0001',
    'GLOBAL',
    '',
    '',
    '',
    '',
    'MAIOR VALOR LÍQUIDO',
    'MENOR PRAZO DE PAGAMENTO',
    'ASMEPRO',
    'SIM',
    'SIM',
    'SIM',
    'SIM',
    'Política geral inicial da Árya Saúde'
  ]];

  aba.getRange(2, 1, 1, dados[0].length).setValues(dados);
}


function inserirMotivosIniciais(planilha) {
  const aba = planilha.getSheetByName('MOTIVOS');

  const dados = [
    [
      'MOT-0001',
      'GUIA',
      'Guia sem assinatura',
      'A guia foi entregue sem a assinatura necessária.',
      'SIM',
      'NÃO',
      'SIM',
      1
    ],
    [
      'MOT-0002',
      'GUIA',
      'Guia sem data',
      'A guia possui sessão sem data informada.',
      'SIM',
      'NÃO',
      'SIM',
      2
    ],
    [
      'MOT-0003',
      'AUTORIZAÇÃO',
      'Autorização vencida',
      'A data da sessão está fora do período autorizado.',
      'SIM',
      'SIM',
      'SIM',
      3
    ],
    [
      'MOT-0004',
      'AUTORIZAÇÃO',
      'Quantidade excedida',
      'A quantidade de sessões realizadas ultrapassa a quantidade autorizada.',
      'SIM',
      'SIM',
      'SIM',
      4
    ],
    [
      'MOT-0005',
      'PACIENTE',
      'Carteirinha inválida',
      'A carteirinha está vencida, incorreta ou não foi localizada.',
      'SIM',
      'SIM',
      'SIM',
      5
    ],
    [
      'MOT-0006',
      'PROFISSIONAL',
      'Profissional não habilitado',
      'O profissional não possui habilitação ativa para o convênio ou associação.',
      'SIM',
      'SIM',
      'SIM',
      6
    ],
    [
      'MOT-0007',
      'DOCUMENTO',
      'Pedido médico ausente',
      'O convênio exige pedido médico e o documento não foi apresentado.',
      'SIM',
      'SIM',
      'SIM',
      7
    ],
    [
      'MOT-0008',
      'ADMINISTRATIVO',
      'Informação divergente',
      'Há divergência entre a guia, a autorização e o cadastro.',
      'SIM',
      'SIM',
      'SIM',
      8
    ],
    [
      'MOT-0009',
      'ADMINISTRATIVO',
      'Documento ilegível',
      'O documento apresentado não permite conferência adequada.',
      'SIM',
      'SIM',
      'SIM',
      9
    ],
    [
      'MOT-0010',
      'OUTRO',
      'Outro motivo',
      'Motivo não previsto na lista padrão.',
      'NÃO',
      'NÃO',
      'SIM',
      99
    ]
  ];

  aba.getRange(2, 1, dados.length, dados[0].length).setValues(dados);
}


/* ============================================================
 * VALIDAÇÕES
 * ============================================================
 */

function aplicarValidacoes(planilha) {
  const totalLinhas = ARYA_CONFIG.quantidadeLinhasPreparadas - 1;

  const listas = {
    SIM_NAO: ['SIM', 'NÃO'],
    ATIVO_INATIVO: ['SIM', 'NÃO'],
    PERFIS: ['ADMINISTRADOR', 'ADMINISTRATIVO', 'PROFISSIONAL', 'CONSULTA'],
    MODALIDADES: ['PRESENCIAL', 'ONLINE', 'HÍBRIDO', 'PRESENCIAL OU ONLINE'],
    STATUS_PROTOCOLO: [
      'RECEBIDO',
      'EM CONFERÊNCIA',
      'COM RESSALVA',
      'CONFERIDO',
      'FATURADO',
      'ARQUIVADO'
    ],
    STATUS_GUIA: [
      'RECEBIDA',
      'EM CONFERÊNCIA',
      'COM RESSALVA',
      'APROVADA',
      'EM REMESSA',
      'ENVIADA',
      'PAGA',
      'GLOSADA',
      'CANCELADA'
    ],
    STATUS_SESSAO: [
      'REALIZADA',
      'CANCELADA',
      'FALTA',
      'REAGENDADA'
    ],
    STATUS_FATURAMENTO: [
      'NÃO FATURADA',
      'APTA',
      'BLOQUEADA',
      'EM REMESSA',
      'ENVIADA',
      'PAGA',
      'GLOSADA'
    ],
    STATUS_REMESSA: [
      'ABERTA',
      'EM CONFERÊNCIA',
      'FECHADA',
      'ENVIADA',
      'PROCESSADA',
      'PAGA',
      'CANCELADA'
    ],
    STATUS_CONCILIACAO: [
      'PENDENTE',
      'PARCIAL',
      'CONCILIADO',
      'COM DIVERGÊNCIA'
    ],
    STATUS_GLOSA: [
      'IDENTIFICADA',
      'EM ANÁLISE',
      'RECURSO PREPARADO',
      'RECURSO ENVIADO',
      'ACEITA',
      'NEGADA',
      'RECUPERADA',
      'ENCERRADA'
    ],
    STATUS_RESSALVA: [
      'ABERTA',
      'EM TRATAMENTO',
      'RESOLVIDA',
      'CANCELADA'
    ],
    CRITICIDADE: [
      'BAIXA',
      'MÉDIA',
      'ALTA',
      'BLOQUEADORA'
    ],
    TIPO_TAXA: [
      'PERCENTUAL',
      'VALOR FIXO',
      'SEM TAXA'
    ],
    TIPO_CALCULO: [
      'PERCENTUAL',
      'VALOR FIXO'
    ],
    BASE_CALCULO: [
      'VALOR BRUTO',
      'VALOR LÍQUIDO'
    ],
    CRITERIOS_FATURAMENTO: [
      'MAIOR VALOR LÍQUIDO',
      'MAIOR VALOR BRUTO',
      'MENOR PRAZO DE PAGAMENTO',
      'MENOR ÍNDICE DE GLOSAS',
      'PRIORIDADE MANUAL',
      'ASSOCIAÇÃO PADRÃO'
    ]
  };

  aplicarListaPorCabecalho(planilha, 'USUARIOS', 'PERFIL', listas.PERFIS, totalLinhas);
  aplicarListaPorCabecalho(planilha, 'USUARIOS', 'ATIVO', listas.SIM_NAO, totalLinhas);

  aplicarListaPorCabecalho(planilha, 'PROFISSIONAIS', 'ATIVO', listas.SIM_NAO, totalLinhas);
  aplicarListaPorCabecalho(planilha, 'PACIENTES', 'ATIVO', listas.SIM_NAO, totalLinhas);
  aplicarListaPorCabecalho(planilha, 'CONVENIOS', 'ATIVO', listas.SIM_NAO, totalLinhas);
  aplicarListaPorCabecalho(planilha, 'ASSOCIACOES', 'ATIVO', listas.SIM_NAO, totalLinhas);
  aplicarListaPorCabecalho(planilha, 'PROCEDIMENTOS', 'ATIVO', listas.SIM_NAO, totalLinhas);
  aplicarListaPorCabecalho(planilha, 'PROCEDIMENTOS', 'MODALIDADE', listas.MODALIDADES, totalLinhas);

  aplicarListaPorCabecalho(
    planilha,
    'PROCEDIMENTOS_CONVENIOS',
    'ATIVO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'PROCEDIMENTOS_CONVENIOS',
    'EXIGE_AUTORIZAÇÃO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'HABILITACAO_PROFISSIONAIS',
    'ATIVO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'CONTRATOS_REPASSE',
    'TIPO_TAXA',
    listas.TIPO_TAXA,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'CONTRATOS_REPASSE',
    'ATIVO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'POLITICAS_FATURAMENTO',
    'CRITÉRIO_PRINCIPAL',
    listas.CRITERIOS_FATURAMENTO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'POLITICAS_FATURAMENTO',
    'CRITÉRIO_SECUNDÁRIO',
    listas.CRITERIOS_FATURAMENTO,
    totalLinhas
  );

  [
    'PERMITE_ALTERAÇÃO_MANUAL',
    'BLOQUEIA_CONTRATO_VENCIDO',
    'BLOQUEIA_PROFISSIONAL_NÃO_HABILITADO',
    'ATIVO'
  ].forEach(function(cabecalho) {
    aplicarListaPorCabecalho(
      planilha,
      'POLITICAS_FATURAMENTO',
      cabecalho,
      listas.SIM_NAO,
      totalLinhas
    );
  });

  aplicarListaPorCabecalho(
    planilha,
    'CONTRATOS_PROFISSIONAIS',
    'TIPO_CÁLCULO',
    listas.TIPO_CALCULO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'CONTRATOS_PROFISSIONAIS',
    'BASE_DE_CÁLCULO',
    listas.BASE_CALCULO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'CONTRATOS_PROFISSIONAIS',
    'ATIVO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'PROTOCOLOS',
    'STATUS',
    listas.STATUS_PROTOCOLO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'GUIAS',
    'STATUS',
    listas.STATUS_GUIA,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'SESSOES',
    'MODALIDADE',
    listas.MODALIDADES,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'SESSOES',
    'STATUS_SESSÃO',
    listas.STATUS_SESSAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'SESSOES',
    'STATUS_FATURAMENTO',
    listas.STATUS_FATURAMENTO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'REMESSAS',
    'STATUS',
    listas.STATUS_REMESSA,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'PAGAMENTOS',
    'STATUS_CONCILIAÇÃO',
    listas.STATUS_CONCILIACAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'GLOSAS',
    'STATUS',
    listas.STATUS_GLOSA,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'RESSALVAS',
    'NÍVEL_CRITICIDADE',
    listas.CRITICIDADE,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'RESSALVAS',
    'STATUS',
    listas.STATUS_RESSALVA,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'MOTIVOS',
    'BLOQUEIA_FATURAMENTO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'MOTIVOS',
    'EXIGE_DOCUMENTO',
    listas.SIM_NAO,
    totalLinhas
  );

  aplicarListaPorCabecalho(
    planilha,
    'MOTIVOS',
    'ATIVO',
    listas.SIM_NAO,
    totalLinhas
  );
}


function aplicarListaPorCabecalho(
  planilha,
  nomeAba,
  nomeCabecalho,
  opcoes,
  quantidadeLinhas
) {
  const aba = planilha.getSheetByName(nomeAba);

  if (!aba) {
    return;
  }

  const coluna = localizarColunaPorCabecalho(aba, nomeCabecalho);

  if (!coluna) {
    return;
  }

  const regra = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(opcoes, true)
    .setAllowInvalid(false)
    .setHelpText('Selecione uma opção válida da lista.')
    .build();

  aba.getRange(2, coluna, quantidadeLinhas, 1).setDataValidation(regra);
}


/* ============================================================
 * FORMATOS ESPECÍFICOS
 * ============================================================
 */

function aplicarFormatacoesEspecificas(planilha) {
  const estrutura = obterEstruturaDasAbas();

  Object.keys(estrutura).forEach(function(nomeAba) {
    const aba = planilha.getSheetByName(nomeAba);
    const cabecalhos = estrutura[nomeAba];

    cabecalhos.forEach(function(cabecalho, indice) {
      const coluna = indice + 1;
      const texto = String(cabecalho).toUpperCase();
      const intervalo = aba.getRange(
        2,
        coluna,
        ARYA_CONFIG.quantidadeLinhasPreparadas - 1,
        1
      );

      if (
        texto.includes('VALOR') ||
        texto.includes('TAXA_FIXA') ||
        texto.includes('DIFERENÇA')
      ) {
        intervalo.setNumberFormat('"R$" #,##0.00');
      }

      if (
        texto.includes('PERCENTUAL') ||
        texto.includes('ÍNDICE')
      ) {
        intervalo.setNumberFormat('0.00%');
      }

      if (
        texto.includes('DATA') &&
        !texto.includes('DATA_HORA') &&
        !texto.includes('DATA_ATUALIZAÇÃO')
      ) {
        intervalo.setNumberFormat('dd/MM/yyyy');
      }

      if (
        texto.includes('DATA_HORA') ||
        texto.includes('DATA_ATUALIZAÇÃO') ||
        texto.includes('CRIADO_EM')
      ) {
        intervalo.setNumberFormat('dd/MM/yyyy HH:mm:ss');
      }

      if (texto.includes('COMPETÊNCIA')) {
        intervalo.setNumberFormat('MM/yyyy');
      }

      if (texto.includes('HORÁRIO')) {
        intervalo.setNumberFormat('HH:mm');
      }

      if (
        texto.includes('CPF') ||
        texto.includes('CNPJ') ||
        texto.includes('TELEFONE') ||
        texto.includes('CARTEIRINHA') ||
        texto.includes('AUTORIZAÇÃO') ||
        texto.includes('CONSELHO')
      ) {
        intervalo.setNumberFormat('@');
      }
    });

    aplicarCoresAlternadas(aba, cabecalhos.length);
  });
}


function aplicarCoresAlternadas(aba, quantidadeColunas) {
  const intervalo = aba.getRange(
    1,
    1,
    ARYA_CONFIG.quantidadeLinhasPreparadas,
    quantidadeColunas
  );

  intervalo.applyRowBanding(
    SpreadsheetApp.BandingTheme.LIGHT_GREY,
    true,
    false
  );

  aba.getRange(1, 1, 1, quantidadeColunas)
    .setBackground(ARYA_CONFIG.cores.principal)
    .setFontColor(ARYA_CONFIG.cores.branco)
    .setFontWeight('bold');
}


/* ============================================================
 * ABA INICIAL
 * ============================================================
 */

function criarAbaDeApresentacao(planilha) {
  const aba = planilha.getSheetByName('INICIO');

  aba.clear();
  aba.clearFormats();
  aba.setHiddenGridlines(true);

  aba.setColumnWidth(1, 240);
  aba.setColumnWidth(2, 520);

  aba.getRange('A1:B1').merge();

  aba.getRange('A1')
    .setValue('ÁRYA SAÚDE')
    .setBackground(ARYA_CONFIG.cores.principal)
    .setFontColor(ARYA_CONFIG.cores.branco)
    .setFontWeight('bold')
    .setFontSize(22)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  aba.setRowHeight(1, 65);

  aba.getRange('A3:B3').merge();

  aba.getRange('A3')
    .setValue('Sistema de Gestão de Faturamento, Protocolos e Repasses')
    .setFontWeight('bold')
    .setFontSize(15)
    .setFontColor(ARYA_CONFIG.cores.principal)
    .setHorizontalAlignment('center');

  const informacoes = [
    ['Versão instalada', ARYA_CONFIG.versao],
    ['Data de instalação', new Date()],
    ['Etapa', 'Estrutura inicial do banco de dados'],
    ['Situação', 'Instalação concluída'],
    ['Próxima etapa', 'Criação das funções de cadastro, formulários e automações'],
    ['Observação', 'Não altere os nomes das abas nem os cabeçalhos sem atualizar o código do sistema.']
  ];

  aba.getRange(5, 1, informacoes.length, 2).setValues(informacoes);

  aba.getRange(5, 1, informacoes.length, 1)
    .setBackground(ARYA_CONFIG.cores.secundaria)
    .setFontColor(ARYA_CONFIG.cores.branco)
    .setFontWeight('bold');

  aba.getRange(5, 2, informacoes.length, 1)
    .setBackground(ARYA_CONFIG.cores.fundoClaro)
    .setFontColor(ARYA_CONFIG.cores.principal);

  aba.getRange(5, 1, informacoes.length, 2)
    .setBorder(true, true, true, true, true, true)
    .setVerticalAlignment('middle')
    .setWrap(true);

  aba.getRange(6, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  aba.setRowHeights(5, informacoes.length, 40);

  aba.getRange('A13:B13').merge();

  aba.getRange('A13')
    .setValue('ESTRUTURA CRIADA')
    .setBackground(ARYA_CONFIG.cores.destaque)
    .setFontColor(ARYA_CONFIG.cores.principal)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  const modulos = [
    ['Sistema', 'Configurações, usuários, permissões, logs e histórico'],
    ['Cadastros', 'Profissionais, pacientes, convênios, associações e procedimentos'],
    ['Regras financeiras', 'Contratos de repasse, políticas de faturamento e contratos profissionais'],
    ['Operação', 'Protocolos, guias, sessões, remessas e vínculo entre remessas e guias'],
    ['Financeiro', 'Pagamentos, glosas, ressalvas e motivos'],
    ['Documentos', 'Documentos e importações'],
    ['Relatórios', 'Dashboard e relatórios gerenciais']
  ];

  aba.getRange(14, 1, modulos.length, 2).setValues(modulos);

  aba.getRange(14, 1, modulos.length, 1)
    .setFontWeight('bold')
    .setBackground('#ECEFF1');

  aba.getRange(14, 1, modulos.length, 2)
    .setBorder(true, true, true, true, true, true)
    .setWrap(true)
    .setVerticalAlignment('middle');

  aba.setFrozenRows(1);
  aba.setTabColor(ARYA_CONFIG.cores.destaque);
}


/* ============================================================
 * FUNÇÕES AUXILIARES
 * ============================================================
 */

function localizarColunaPorCabecalho(aba, nomeCabecalho) {
  const ultimaColuna = aba.getLastColumn();

  if (ultimaColuna === 0) {
    return null;
  }

  const cabecalhos = aba
    .getRange(1, 1, 1, ultimaColuna)
    .getValues()[0];

  const indice = cabecalhos.indexOf(nomeCabecalho);

  return indice === -1 ? null : indice + 1;
}


function criarCodigoSequencial(prefixo, numero) {
  return prefixo + '-' + String(numero).padStart(4, '0');
}


function criarId(prefixo) {
  const data = Utilities.formatDate(
    new Date(),
    'America/Sao_Paulo',
    'yyyyMMddHHmmss'
  );

  const aleatorio = Math.floor(1000 + Math.random() * 9000);

  return prefixo + '-' + data + '-' + aleatorio;
}


function registrarLogDireto(
  planilha,
  tipoEvento,
  descricao,
  usuario,
  status,
  detalhes
) {
  const aba = planilha.getSheetByName('LOGS');

  if (!aba) {
    return;
  }

  aba.appendRow([
    criarId('LOG'),
    new Date(),
    tipoEvento || '',
    descricao || '',
    usuario || '',
    status || '',
    detalhes || ''
  ]);
}


/* ============================================================
 * FUNÇÃO PARA ABRIR A PLANILHA INSTALADA
 * ============================================================
 */

function abrirPlanilhaArya() {
  const propriedades = PropertiesService.getScriptProperties();
  const url = propriedades.getProperty('ARYA_PLANILHA_URL');

  if (!url) {
    SpreadsheetApp.getUi().alert(
      'Sistema não instalado',
      'Execute primeiro a função instalarSistemaArya().',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return;
  }

  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;padding:20px;">' +
      '<h2>Árya Saúde</h2>' +
      '<p>A planilha do sistema já está disponível.</p>' +
      '<p><a href="' + url + '" target="_blank">Abrir planilha do sistema</a></p>' +
    '</div>'
  )
    .setWidth(420)
    .setHeight(200);

  SpreadsheetApp.getUi().showModalDialog(
    html,
    'Abrir sistema'
  );
}


/* ============================================================
 * FUNÇÃO DE DIAGNÓSTICO
 * ============================================================
 */

function verificarInstalacaoArya() {
  const propriedades = PropertiesService.getScriptProperties();
  const planilhaId = propriedades.getProperty('ARYA_PLANILHA_ID');

  if (!planilhaId) {
    SpreadsheetApp.getUi().alert(
      'Instalação não encontrada',
      'O sistema ainda não foi instalado.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return;
  }

  try {
    const planilha = SpreadsheetApp.openById(planilhaId);
    const estruturaEsperada = Object.keys(obterEstruturaDasAbas());
    const abasExistentes = planilha.getSheets().map(function(aba) {
      return aba.getName();
    });

    const abasAusentes = estruturaEsperada.filter(function(nomeAba) {
      return !abasExistentes.includes(nomeAba);
    });

    if (abasAusentes.length === 0) {
      SpreadsheetApp.getUi().alert(
        'Verificação concluída',
        'A estrutura principal está íntegra.\n\n' +
          'Planilha:\n' +
          planilha.getUrl(),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'Estrutura incompleta',
        'As seguintes abas não foram localizadas:\n\n' +
          abasAusentes.join('\n'),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }

  } catch (erro) {
    SpreadsheetApp.getUi().alert(
      'Erro na verificação',
      'Não foi possível abrir a planilha instalada.\n\n' +
        erro.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}