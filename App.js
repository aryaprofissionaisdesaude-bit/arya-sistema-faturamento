/**
 * ============================================================
 * ÁRYA SAÚDE
 * NÚCLEO DA APLICAÇÃO E ROTEAMENTO
 * ARQUIVO: App.gs
 * ============================================================
 *
 * Responsabilidades:
 * - receber o acesso ao aplicativo da web;
 * - identificar o usuário conectado;
 * - validar usuário e perfil;
 * - direcionar para a interface adequada;
 * - exibir mensagens de erro de acesso.
 *
 * Dependências:
 * - Auth.gs
 * - Utils.gs
 *
 * Observação:
 * Este arquivo contém o único doGet() do projeto.
 */


/* ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

const APP_CONFIG = {
  NOME_SISTEMA: 'Árya Saúde',

  TITULO_ADMINISTRATIVO:
    'Árya Saúde — Gestão Administrativa',

  TITULO_PROFISSIONAL:
    'Árya Saúde — Portal Profissional',

  ARQUIVO_ADMINISTRATIVO:
    'Index',

  ARQUIVO_PROFISSIONAL:
    'PortalProfissional'
};


/* ============================================================
 * ENTRADA DO APLICATIVO DA WEB
 * ============================================================
 */

/**
 * Função principal executada ao abrir o aplicativo da web.
 *
 * @param {Object} evento
 * @return {HtmlOutput}
 */
function doGet(evento) {
  try {
    const usuario =
      authObterUsuarioAtual();

    if (!usuario) {
      return appCriarTelaMensagem_(
        'Acesso não autorizado',
        'O e-mail da conta Google utilizada não está cadastrado no sistema.'
      );
    }

    if (!authUsuarioEstaAtivo(usuario)) {
      return appCriarTelaMensagem_(
        'Usuário inativo',
        'Seu acesso ao sistema está inativo. Procure a administração da Árya Saúde.'
      );
    }

    const perfil =
      authPerfilNormalizado(usuario);

    if (
      perfil ===
      AUTH_CONFIG.PERFIS.ADMINISTRADOR
    ) {
      return appRenderizarPagina_(
        APP_CONFIG.ARQUIVO_ADMINISTRATIVO,
        APP_CONFIG.TITULO_ADMINISTRATIVO,
        usuario
      );
    }

    if (
      perfil ===
      AUTH_CONFIG.PERFIS.ADMINISTRATIVO
    ) {
      return appRenderizarPagina_(
        APP_CONFIG.ARQUIVO_ADMINISTRATIVO,
        APP_CONFIG.TITULO_ADMINISTRATIVO,
        usuario
      );
    }

    if (
      perfil ===
      AUTH_CONFIG.PERFIS.PROFISSIONAL
    ) {
      const contextoProfissional =
        authExigirProfissional();

      return appRenderizarPagina_(
        APP_CONFIG.ARQUIVO_PROFISSIONAL,
        APP_CONFIG.TITULO_PROFISSIONAL,
        contextoProfissional.usuario
      );
    }

    return appCriarTelaMensagem_(
      'Perfil sem acesso',
      'O perfil cadastrado para este usuário não possui acesso à aplicação.'
    );
  } catch (erro) {
    console.error(
      'Erro ao abrir o sistema:',
      erro
    );

    return appCriarTelaMensagem_(
      'Erro ao abrir o sistema',
      appObterMensagemErro_(erro)
    );
  }
}


/* ============================================================
 * RENDERIZAÇÃO DE PÁGINAS
 * ============================================================
 */

/**
 * Renderiza um arquivo HTML do projeto.
 *
 * @param {string} nomeArquivo
 * @param {string} titulo
 * @param {Object} usuario
 * @return {HtmlOutput}
 */
function appRenderizarPagina_(
  nomeArquivo,
  titulo,
  usuario
) {
  if (!nomeArquivo) {
    throw new Error(
      'O nome do arquivo HTML não foi informado.'
    );
  }

  const template =
    HtmlService.createTemplateFromFile(
      nomeArquivo
    );

  template.dadosIniciais = {
    sistema:
      APP_CONFIG.NOME_SISTEMA,

    usuario:
      authPrepararUsuarioParaInterface(
        usuario
      )
  };

  return template
    .evaluate()
    .setTitle(
      titulo ||
      APP_CONFIG.NOME_SISTEMA
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    )
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1'
    );
}


/**
 * Inclui o conteúdo de outro arquivo HTML.
 *
 * Esta função será útil futuramente para separar:
 * - estilos;
 * - scripts;
 * - componentes.
 *
 * Exemplo no HTML:
 *
 * <?!= appIncluirHtml('Estilos'); ?>
 *
 * @param {string} nomeArquivo
 * @return {string}
 */
function appIncluirHtml(nomeArquivo) {
  if (!nomeArquivo) {
    return '';
  }

  return HtmlService
    .createHtmlOutputFromFile(
      nomeArquivo
    )
    .getContent();
}


/* ============================================================
 * TELA DE MENSAGEM
 * ============================================================
 */

/**
 * Cria uma página simples para mensagens de acesso ou erro.
 *
 * @param {string} titulo
 * @param {string} mensagem
 * @return {HtmlOutput}
 */
function appCriarTelaMensagem_(
  titulo,
  mensagem
) {
  const tituloSeguro =
    utilEscaparHtml(
      titulo ||
      'Árya Saúde'
    );

  const mensagemSegura =
    utilEscaparHtml(
      mensagem ||
      'Não foi possível abrir o sistema.'
    );

  const html = [
    '<!DOCTYPE html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Árya Saúde</title>',

    '<style>',

    '* {',
    '  box-sizing: border-box;',
    '}',

    'body {',
    '  margin: 0;',
    '  min-height: 100vh;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  padding: 24px;',
    '  background: #f4f7f8;',
    '  color: #263238;',
    '  font-family: Arial, Helvetica, sans-serif;',
    '}',

    '.painel {',
    '  width: 100%;',
    '  max-width: 560px;',
    '  padding: 32px;',
    '  background: #ffffff;',
    '  border: 1px solid #dce4e7;',
    '  border-radius: 14px;',
    '  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);',
    '  text-align: center;',
    '}',

    '.marca {',
    '  margin-bottom: 22px;',
    '  color: #345c65;',
    '  font-size: 14px;',
    '  font-weight: 700;',
    '  letter-spacing: 0.08em;',
    '}',

    'h1 {',
    '  margin: 0 0 14px;',
    '  font-size: 26px;',
    '  line-height: 1.25;',
    '}',

    'p {',
    '  margin: 0;',
    '  color: #607d8b;',
    '  font-size: 16px;',
    '  line-height: 1.6;',
    '}',

    '</style>',
    '</head>',

    '<body>',

    '<main class="painel">',

    '<div class="marca">',
    'ÁRYA SAÚDE',
    '</div>',

    '<h1>',
    tituloSeguro,
    '</h1>',

    '<p>',
    mensagemSegura,
    '</p>',

    '</main>',

    '</body>',
    '</html>'
  ].join('');

  return HtmlService
    .createHtmlOutput(html)
    .setTitle(
      APP_CONFIG.NOME_SISTEMA
    )
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1'
    );
}


/* ============================================================
 * DADOS DO USUÁRIO CONECTADO
 * ============================================================
 */

/**
 * Retorna os dados seguros do usuário conectado.
 *
 * Esta função poderá ser chamada pelas páginas HTML por:
 *
 * google.script.run.obterUsuarioConectado()
 *
 * @return {Object}
 */
function obterUsuarioConectado() {
  const usuario =
    authExigirUsuarioAtivo();

  return authPrepararUsuarioParaInterface(
    usuario
  );
}


/**
 * Retorna informações mínimas da sessão.
 *
 * @return {Object}
 */
function appObterSessao() {
  const usuario =
    authExigirUsuarioAtivo();

  return {
    sistema:
      APP_CONFIG.NOME_SISTEMA,

    usuario:
      authPrepararUsuarioParaInterface(
        usuario
      ),

    perfil:
      authPerfilNormalizado(
        usuario
      ),

    dataHoraServidor:
      utilFormatarDataHora(
        new Date()
      )
  };
}


/* ============================================================
 * TRATAMENTO DE ERROS
 * ============================================================
 */

/**
 * Extrai uma mensagem legível de um erro.
 *
 * @param {*} erro
 * @return {string}
 */
function appObterMensagemErro_(erro) {
  if (!erro) {
    return 'Ocorreu um erro inesperado.';
  }

  if (
    typeof erro === 'string'
  ) {
    return erro;
  }

  if (
    erro.message
  ) {
    return String(
      erro.message
    );
  }

  return String(
    erro
  );
}