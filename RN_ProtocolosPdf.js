/**
 * ============================================================
 * ÁRYA SAÚDE — RN_ProtocolosPdf.gs
 * ============================================================
 *
 * Gera o PDF do protocolo de entrega de guias, no mesmo formato
 * dos modelos em papel já usados pela clínica:
 *
 * - "PROTOCOLO DE ENTREGA DE GUIAS PARA FATURAMENTO INTERNO"
 *   (guias de convênio — até 8 guias por folha);
 * - "PROTOCOLO DE COBRANÇA DE ATENDIMENTO PARTICULAR"
 *   (atendimentos particulares — até 6 por folha).
 *
 * Se o protocolo tiver os dois tipos de guia, o PDF final terá
 * as folhas de convênio seguidas pelas folhas de particular.
 *
 * Layout provisório: reproduz fielmente o conteúdo e a ordem
 * dos campos dos modelos em papel. O visual (cores exatas,
 * fontes) pode ser refinado depois a partir do modelo oficial.
 *
 * Dependências:
 * - RN_Envios.gs
 * - RN_Protocolos.gs
 * - Utils.gs
 */

const RN_PROTOCOLOS_PDF_CONFIG = Object.freeze({
  PASTA_DRIVE: 'Árya Saúde — Protocolos gerados',
  ITENS_POR_PAGINA_CONVENIO: 8,
  ITENS_POR_PAGINA_PARTICULAR: 6
});

const RN_PROTOCOLOS_PDF_LABELS_PAGAMENTO = Object.freeze({
  ADIANTADO_SESSAO: 'Paga Adiantado por sessão',
  ADIANTADO_MES: 'Paga Adiantado por mês',
  ATRASADO_SESSAO: 'Paga Atrasado por sessão',
  ATRASADO_MES: 'Paga Atrasado por mês'
});


/**
 * ============================================================
 * API PRINCIPAL
 * ============================================================
 */

const RN_ProtocolosPdf = {

  /**
   * Gera o PDF do protocolo e salva no Drive.
   *
   * @param {Object} envio (já hidratado — ver rnEnviosHidratarRegistro_)
   * @param {Object[]} itens (já normalizados — ver rnProtocolosNormalizarItem_)
   * @param {{nome: string}} profissional
   * @return {{id: string, url: string}}
   */
  gerar: function (envio, itens, profissional) {
    const html = rnProtocolosPdfMontarHtml_(envio, itens, profissional);

    const blobHtml = Utilities.newBlob(html, 'text/html', 'protocolo.html');
    const blobPdf = blobHtml.getAs('application/pdf');

    const nomeArquivo = utilSanitizarNomeArquivo(
      'Protocolo ' + envio.numero + ' - ' + (profissional.nome || 'profissional') + '.pdf'
    );

    blobPdf.setName(nomeArquivo);

    const pasta = rnProtocolosPdfObterPasta_();
    const arquivo = pasta.createFile(blobPdf);

    arquivo.setDescription(
      'Protocolo ' + envio.numero + ' gerado automaticamente pelo Portal Profissional da Árya Saúde.'
    );

    return {
      id: arquivo.getId(),
      url: arquivo.getUrl()
    };
  }
};


function rnProtocolosPdfObterPasta_() {
  const pastas = DriveApp.getFoldersByName(RN_PROTOCOLOS_PDF_CONFIG.PASTA_DRIVE);

  if (pastas.hasNext()) {
    return pastas.next();
  }

  return DriveApp.createFolder(RN_PROTOCOLOS_PDF_CONFIG.PASTA_DRIVE);
}


/* ============================================================
 * MONTAGEM DO HTML
 * ============================================================
 */

function rnProtocolosPdfMontarHtml_(envio, itens, profissional) {
  const itensConvenio = itens.filter(function (i) { return i.tipo === RN_PROTOCOLOS_TIPOS.CONVENIO; });
  const itensParticular = itens.filter(function (i) { return i.tipo === RN_PROTOCOLOS_TIPOS.PARTICULAR; });

  const dataGeracao = utilFormatarData(new Date());

  let paginas = '';

  if (itensConvenio.length > 0) {
    paginas += rnProtocolosPdfPaginasConvenio_(envio, itensConvenio, profissional, dataGeracao);
  }

  if (itensParticular.length > 0) {
    paginas += rnProtocolosPdfPaginasParticular_(envio, itensParticular, profissional, dataGeracao);
  }

  return [
    '<!DOCTYPE html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="UTF-8">',
    '<style>', rnProtocolosPdfCss_(), '</style>',
    '</head>',
    '<body>', paginas, '</body>',
    '</html>'
  ].join('');
}

function rnProtocolosPdfCss_() {
  return [
    '@page { size: A4; margin: 10mm; }',
    'body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #1a1a1a; }',
    '.folha { page-break-after: always; }',
    '.folha:last-child { page-break-after: auto; }',
    'table { width: 100%; border-collapse: collapse; }',
    '.cabecalho-tabela td { border: 1px solid #333; padding: 4px 6px; vertical-align: top; }',
    '.marca { font-size: 15pt; font-weight: bold; }',
    '.titulo { font-weight: bold; padding: 4px 6px; border: 1px solid #333; border-top: none; }',
    '.caixa-protocolo { background: #ffff00; font-weight: bold; text-align: center; }',
    '.linha-protocolo-num { font-size: 13pt; font-weight: bold; }',
    '.orientacoes { border: 1px solid #333; border-top: none; padding: 4px 6px; font-size: 8pt; }',
    '.tabela-guias th { background: #f4a83c; border: 1px solid #333; padding: 4px; font-size: 8.5pt; }',
    '.tabela-guias td { border: 1px solid #333; padding: 4px; vertical-align: top; font-size: 8.5pt; }',
    '.col-ordem { width: 4%; text-align: center; font-weight: bold; }',
    '.col-conferencia { width: 24%; font-size: 7.5pt; color: #555; }',
    '.rodape-uso { background: #ffff00; font-weight: bold; border: 1px solid #333; padding: 4px 6px; margin-top: 6px; }',
    '.assinatura { border: 1px solid #333; border-top: none; padding: 18px 6px 6px; }',
    '.assinatura-linha { margin-top: 26px; border-top: 1px solid #333; width: 60%; }'
  ].join(' ');
}

function rnProtocolosPdfCabecalho_(envio, profissional, dataGeracao, titulo, orientacoesHtml) {
  return [
    '<table class="cabecalho-tabela"><tr>',
    '<td style="width:60%">',
    '<div class="marca">Árya Saúde</div>',
    '</td>',
    '<td class="caixa-protocolo" style="width:40%">Protocolo (Uso da Árya Saúde)<br>',
    '<span style="font-weight:normal">Recebido por: ______________________</span><br>',
    '<span style="font-weight:normal">Data de recebimento: ____/____/______</span>',
    '</td>',
    '</tr></table>',

    '<div class="titulo">', utilEscaparHtml(titulo), '</div>',

    '<table class="cabecalho-tabela"><tr>',
    '<td style="width:60%">',
    '<div class="orientacoes">', orientacoesHtml, '</div>',
    '</td>',
    '<td style="width:40%">',
    '<div style="padding:4px 6px">',
    '<div class="linha-protocolo-num">Protocolo: ', utilEscaparHtml(envio.numero), '</div>',
    '<div>Profissional: <b>', utilEscaparHtml(profissional.nome || ''), '</b></div>',
    '<div>Data de geração: ', utilEscaparHtml(dataGeracao), '</div>',
    '</div>',
    '</td>',
    '</tr></table>'
  ].join('');
}

function rnProtocolosPdfRodape_() {
  return [
    '<div class="rodape-uso">USO DO PROFISSIONAL (ENTREGA DAS GUIAS AO FATURAMENTO INTERNO)</div>',
    '<table class="cabecalho-tabela"><tr>',
    '<td style="width:50%"><b>Data que foi colocado na pasta de faturamento:</b><br>',
    utilEscaparHtml(utilFormatarData(new Date())),
    '</td>',
    '<td style="width:50%" class="assinatura"><b>Carimbo e assinatura do profissional responsável</b>',
    '<div class="assinatura-linha">&nbsp;</div>',
    '</td>',
    '</tr></table>'
  ].join('');
}

function rnProtocolosPdfDividirEmPaginas_(lista, tamanho) {
  const paginas = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    paginas.push(lista.slice(i, i + tamanho));
  }
  return paginas;
}


/* ============================================================
 * FOLHAS — GUIAS DE CONVÊNIO
 * ============================================================
 */

function rnProtocolosPdfPaginasConvenio_(envio, itens, profissional, dataGeracao) {
  const paginas = rnProtocolosPdfDividirEmPaginas_(
    itens,
    RN_PROTOCOLOS_PDF_CONFIG.ITENS_POR_PAGINA_CONVENIO
  );

  const orientacoes = [
    '<b>Orientações:</b>',
    '1. As guias devem estar na mesma ordem que estiverem relacionadas.',
    '2. Cada linha deve constar apenas 1 guia com as datas que constam naquela guia.',
    '3. As guias deverão ser escaneadas tendo como capa este documento.'
  ].join('<br>');

  return paginas.map(function (pagina, indicePagina) {
    const inicioNumero = indicePagina * RN_PROTOCOLOS_PDF_CONFIG.ITENS_POR_PAGINA_CONVENIO;

    const linhas = pagina.map(function (item, indice) {
      return [
        '<tr>',
        '<td class="col-ordem">', inicioNumero + indice + 1, '</td>',
        '<td>', utilEscaparHtml(item.pacienteNome), '</td>',
        '<td>', utilEscaparHtml(item.convenioNome || ''), '</td>',
        '<td>', utilEscaparHtml(item.datasAtendimento.join(', ')), '</td>',
        '<td class="col-conferencia">',
        'Conferido por: _____________________<br><br>',
        'Data da conferência: ____/____/______<br>',
        'Devolvida? SIM &nbsp;&nbsp; NÃO<br>',
        'Motivo: _____________________',
        '</td>',
        '</tr>'
      ].join('');
    }).join('');

    return [
      '<div class="folha">',
      rnProtocolosPdfCabecalho_(envio, profissional, dataGeracao, 'PROTOCOLO DE ENTREGA DE GUIAS PARA FATURAMENTO INTERNO', orientacoes),
      '<table class="tabela-guias"><tr>',
      '<th class="col-ordem">#</th>',
      '<th>Nome do paciente</th>',
      '<th>Convênio</th>',
      '<th>Data(s) do(s) atendimento(s)</th>',
      '<th class="col-conferencia">Conferência (preenchido pela Árya)</th>',
      '</tr>', linhas, '</table>',
      rnProtocolosPdfRodape_(),
      '</div>'
    ].join('');
  }).join('');
}


/* ============================================================
 * FOLHAS — ATENDIMENTO PARTICULAR
 * ============================================================
 */

function rnProtocolosPdfPaginasParticular_(envio, itens, profissional, dataGeracao) {
  const paginas = rnProtocolosPdfDividirEmPaginas_(
    itens,
    RN_PROTOCOLOS_PDF_CONFIG.ITENS_POR_PAGINA_PARTICULAR
  );

  const orientacoes = [
    '<b>Orientações:</b>',
    'Os pagamentos dos particulares serão feitos sempre no dia 25 do mês seguinte.',
    'O protocolo deve ser enviado até o dia 10 do mês seguinte para ser repassado naquele mês.',
    'Protocolos entregues após o dia 10 serão pagos no dia 25 do mês seguinte.'
  ].join('<br>');

  return paginas.map(function (pagina, indicePagina) {
    const inicioNumero = indicePagina * RN_PROTOCOLOS_PDF_CONFIG.ITENS_POR_PAGINA_PARTICULAR;

    const linhas = pagina.map(function (item, indice) {
      const opcoesPagamento = Object.keys(RN_PROTOCOLOS_PDF_LABELS_PAGAMENTO).map(function (chave) {
        const marcado = chave === item.formatoPagamento;
        return (
          '<div>' +
          utilEscaparHtml(RN_PROTOCOLOS_PDF_LABELS_PAGAMENTO[chave]) +
          ' &nbsp; ( ' + (marcado ? 'X' : '&nbsp;') + ' )</div>'
        );
      }).join('');

      return [
        '<tr>',
        '<td class="col-ordem">', inicioNumero + indice + 1, '</td>',
        '<td>', utilEscaparHtml(item.pacienteNome), '</td>',
        '<td>', utilEscaparHtml(item.datasAtendimento.join(', ')), '</td>',
        '<td>', utilEscaparHtml(utilFormatarMoeda(item.valor)), '</td>',
        '<td style="font-size:7.5pt">', opcoesPagamento, '</td>',
        '<td class="col-conferencia">',
        'Cobranças enviadas? SIM &nbsp;&nbsp; NÃO<br><br>',
        'Pagamento realizado? SIM &nbsp;&nbsp; NÃO',
        '</td>',
        '</tr>'
      ].join('');
    }).join('');

    return [
      '<div class="folha">',
      rnProtocolosPdfCabecalho_(envio, profissional, dataGeracao, 'PROTOCOLO DE COBRANÇA DE ATENDIMENTO PARTICULAR', orientacoes),
      '<table class="tabela-guias"><tr>',
      '<th class="col-ordem">#</th>',
      '<th>Nome do paciente</th>',
      '<th>Data(s) do(s) atendimento(s)</th>',
      '<th>Valor — sessão/pacote</th>',
      '<th>Formato de pagamento</th>',
      '<th class="col-conferencia">Pagamento (Uso da Árya Saúde)</th>',
      '</tr>', linhas, '</table>',
      rnProtocolosPdfRodape_(),
      '</div>'
    ].join('');
  }).join('');
}
