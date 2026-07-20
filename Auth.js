/**
 * ============================================================
 * ÁRYA SAÚDE
 * AUTENTICAÇÃO E CONTROLE DE ACESSO
 * ARQUIVO: Auth.gs
 * ============================================================
 *
 * Responsabilidades:
 * - identificar a conta Google conectada;
 * - localizar o usuário na aba USUARIOS;
 * - verificar se o usuário está ativo;
 * - validar o perfil;
 * - localizar o profissional vinculado;
 * - criar ou promover o administrador inicial.
 *
 * Dependências:
 * - Database.gs
 * - Utils.gs
 */


/* ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

const AUTH_CONFIG = {
  ABA_USUARIOS: 'USUARIOS',
  ABA_PROFISSIONAIS: 'PROFISSIONAIS',

  PERFIS: {
    ADMINISTRADOR: 'ADMINISTRADOR',
    ADMINISTRATIVO: 'ADMINISTRATIVO',
    PROFISSIONAL: 'PROFISSIONAL'
  }
};


/**
 * ============================================================
 * SESSÃO PRÓPRIA (LOGIN COM E-MAIL E SENHA)
 * ============================================================
 *
 * O restante deste arquivo identifica o usuário conectado pela
 * conta Google ativa (Session.getActiveUser()). Isso só é
 * confiável quando quem acessa está no mesmo domínio Google
 * Workspace de quem publicou o aplicativo.
 *
 * Como os profissionais acessam com contas de Gmail próprias, a
 * sessão real do navegador não é suficiente. Por isso existe um
 * login por e-mail e senha, controlado pela própria aplicação:
 *
 * - authEntrar(email, senha) valida as credenciais e devolve um
 *   token de sessão;
 * - o cliente guarda esse token (localStorage) e o envia em toda
 *   chamada ao servidor;
 * - authDefinirContextoPorToken_(token) é chamada no início de
 *   cada função pública e faz authObterEmailAtual() (e as demais
 *   funções que dependem dela) responderem com o e-mail da sessão
 *   do token, em vez de depender da conta Google ativa.
 *
 * No primeiro login de cada usuário (quando ainda não existe uma
 * senha salva), a senha digitada passa a ser a senha definitiva.
 */

const AUTH_SESSAO_CONFIG = Object.freeze({
  ABA_SESSOES: 'SESSOES_ACESSO',
  DURACAO_SESSAO_HORAS: 16,
  CAMPO_SENHA: 'SENHA_HASH'
});

const AUTH_SESSOES_COLUNAS = Object.freeze([
  'TOKEN',
  'ID_USUARIO',
  'EMAIL',
  'PERFIL',
  'CRIADO_EM',
  'EXPIRA_EM'
]);

/**
 * E-mail resolvido a partir do token de sessão enviado pelo
 * cliente na chamada atual. Fica vazio até que
 * authDefinirContextoPorToken_ seja chamada.
 */
var AUTH_SESSAO_EMAIL_ATUAL_ = '';


/* ============================================================
 * IDENTIFICAÇÃO DA CONTA GOOGLE
 * ============================================================
 */

/**
 * Retorna o e-mail da conta Google conectada.
 *
 * @return {string}
 */
function authObterEmailAtual() {
  if (AUTH_SESSAO_EMAIL_ATUAL_) {
    return AUTH_SESSAO_EMAIL_ATUAL_;
  }

  let emailAtivo = '';
  let emailEfetivo = '';

  try {
    emailAtivo =
      Session.getActiveUser().getEmail();
  } catch (erroAtivo) {
    emailAtivo = '';
  }

  try {
    emailEfetivo =
      Session.getEffectiveUser().getEmail();
  } catch (erroEfetivo) {
    emailEfetivo = '';
  }

  return utilNormalizarEmail(
    emailAtivo ||
    emailEfetivo ||
    ''
  );
}


/**
 * Alias interno para compatibilidade com outros módulos.
 *
 * @return {string}
 */
function authObterEmailAtual_() {
  return authObterEmailAtual();
}


/* ============================================================
 * LOCALIZAÇÃO DO USUÁRIO
 * ============================================================
 */

/**
 * Localiza um usuário pelo e-mail.
 *
 * @param {string} email
 * @return {Object|null}
 */
function authBuscarUsuarioPorEmail(email) {
  const emailNormalizado =
    utilNormalizarEmail(email);

  if (!emailNormalizado) {
    return null;
  }

  const usuarios =
    dbListarRegistros(
      AUTH_CONFIG.ABA_USUARIOS
    ) || [];

  return usuarios.find(
    function(usuario) {
      return (
        utilNormalizarEmail(
          usuario.EMAIL
        ) === emailNormalizado
      );
    }
  ) || null;
}


/**
 * Retorna o usuário conectado.
 *
 * @return {Object|null}
 */
function authObterUsuarioAtual() {
  const email =
    authObterEmailAtual();

  if (!email) {
    return null;
  }

  return authBuscarUsuarioPorEmail(
    email
  );
}


/**
 * Alias interno para compatibilidade.
 *
 * @return {Object|null}
 */
function authObterUsuarioAtual_() {
  return authObterUsuarioAtual();
}


/* ============================================================
 * SITUAÇÃO DO USUÁRIO
 * ============================================================
 */

/**
 * Verifica se um usuário está ativo.
 *
 * @param {Object} usuario
 * @return {boolean}
 */
function authUsuarioEstaAtivo(usuario) {
  if (!usuario) {
    return false;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      usuario,
      'ATIVO'
    )
  ) {
    return true;
  }

  return utilParaBooleano(
    usuario.ATIVO,
    true
  );
}


/**
 * Alias para compatibilidade.
 *
 * @param {Object} usuario
 * @return {boolean}
 */
function authUsuarioAtivo(usuario) {
  return authUsuarioEstaAtivo(usuario);
}


/**
 * Exige que o usuário exista e esteja ativo.
 *
 * @return {Object}
 */
function authExigirUsuarioAtivo() {
  const usuario =
    authObterUsuarioAtual();

  if (!usuario) {
    throw new Error(
      'O e-mail da conta Google utilizada não está cadastrado no sistema.'
    );
  }

  if (!authUsuarioEstaAtivo(usuario)) {
    throw new Error(
      'Seu usuário está inativo.'
    );
  }

  return usuario;
}


/* ============================================================
 * PERFIS
 * ============================================================
 */

/**
 * Normaliza o perfil de um usuário.
 *
 * @param {Object|string} usuarioOuPerfil
 * @return {string}
 */
function authPerfilNormalizado(
  usuarioOuPerfil
) {
  if (
    usuarioOuPerfil &&
    typeof usuarioOuPerfil === 'object'
  ) {
    return utilNormalizarTexto(
      usuarioOuPerfil.PERFIL
    );
  }

  return utilNormalizarTexto(
    usuarioOuPerfil
  );
}


/**
 * Verifica se o usuário possui determinado perfil.
 *
 * @param {Object} usuario
 * @param {string} perfil
 * @return {boolean}
 */
function authUsuarioPossuiPerfil(
  usuario,
  perfil
) {
  return (
    authPerfilNormalizado(usuario) ===
    authPerfilNormalizado(perfil)
  );
}


/**
 * Verifica se o usuário possui um dos perfis informados.
 *
 * @param {Object} usuario
 * @param {string[]} perfis
 * @return {boolean}
 */
function authUsuarioPossuiAlgumPerfil(
  usuario,
  perfis
) {
  const perfilUsuario =
    authPerfilNormalizado(usuario);

  return (perfis || []).some(
    function(perfil) {
      return (
        perfilUsuario ===
        authPerfilNormalizado(perfil)
      );
    }
  );
}


/**
 * Exige perfil administrador.
 *
 * @return {Object}
 */
function authExigirAdministrador() {
  const usuario =
    authExigirUsuarioAtivo();

  if (
    !authUsuarioPossuiPerfil(
      usuario,
      AUTH_CONFIG.PERFIS.ADMINISTRADOR
    )
  ) {
    throw new Error(
      'Esta operação exige perfil de administrador.'
    );
  }

  return usuario;
}


/**
 * Exige perfil administrativo ou administrador.
 *
 * @return {Object}
 */
function authExigirAdministrativo() {
  const usuario =
    authExigirUsuarioAtivo();

  const permitido =
    authUsuarioPossuiAlgumPerfil(
      usuario,
      [
        AUTH_CONFIG.PERFIS.ADMINISTRADOR,
        AUTH_CONFIG.PERFIS.ADMINISTRATIVO
      ]
    );

  if (!permitido) {
    throw new Error(
      'Você não possui permissão administrativa.'
    );
  }

  return usuario;
}


/* ============================================================
 * PROFISSIONAL VINCULADO
 * ============================================================
 */

/**
 * Busca o profissional vinculado ao usuário.
 *
 * @param {Object} usuario
 * @return {Object|null}
 */
function authObterProfissionalDoUsuario(
  usuario
) {
  if (!usuario) {
    return null;
  }

  const idProfissional =
    utilTexto(
      usuario.ID_PROFISSIONAL
    );

  if (!idProfissional) {
    return null;
  }

  return dbBuscarRegistroPorId(
    AUTH_CONFIG.ABA_PROFISSIONAIS,
    'ID_PROFISSIONAL',
    idProfissional
  );
}


/**
 * Exige perfil profissional e cadastro vinculado.
 *
 * @return {{
 *   usuario: Object,
 *   profissional: Object
 * }}
 */
function authExigirProfissional() {
  const usuario =
    authExigirUsuarioAtivo();

  if (
    !authUsuarioPossuiPerfil(
      usuario,
      AUTH_CONFIG.PERFIS.PROFISSIONAL
    )
  ) {
    throw new Error(
      'Esta operação exige perfil profissional.'
    );
  }

  const idProfissional =
    utilTexto(
      usuario.ID_PROFISSIONAL
    );

  if (!idProfissional) {
    throw new Error(
      'Seu usuário não está vinculado a um cadastro profissional.'
    );
  }

  const profissional =
    authObterProfissionalDoUsuario(
      usuario
    );

  if (!profissional) {
    throw new Error(
      'O cadastro profissional vinculado ao usuário não foi localizado.'
    );
  }

  if (!utilRegistroEstaAtivo(profissional)) {
    throw new Error(
      'O cadastro profissional está inativo.'
    );
  }

  return {
    usuario: usuario,
    profissional: profissional
  };
}


/* ============================================================
 * DADOS SEGUROS PARA A INTERFACE
 * ============================================================
 */

/**
 * Retorna somente os campos seguros do usuário.
 *
 * @param {Object} usuario
 * @return {Object}
 */
function authPrepararUsuarioParaInterface(
  usuario
) {
  if (!usuario) {
    return null;
  }

  return {
    ID_USUARIO:
      usuario.ID_USUARIO || '',

    NOME:
      usuario.NOME || '',

    EMAIL:
      usuario.EMAIL || '',

    PERFIL:
      usuario.PERFIL || '',

    ID_PROFISSIONAL:
      usuario.ID_PROFISSIONAL || ''
  };
}


/**
 * Retorna os dados seguros do usuário conectado.
 *
 * @return {Object}
 */
function authObterUsuarioConectadoParaInterface() {
  const usuario =
    authExigirUsuarioAtivo();

  return authPrepararUsuarioParaInterface(
    usuario
  );
}


/* ============================================================
 * ADMINISTRADOR INICIAL
 * ============================================================
 */

/**
 * Cria um administrador ou promove um usuário existente.
 *
 * Esta função evita a criação de usuários duplicados pelo e-mail.
 *
 * @param {string} nome
 * @param {string} email
 * @return {Object}
 */
function authCriarOuPromoverAdministrador(
  nome,
  email
) {
  const emailNormalizado =
    utilExigirEmailValido(
      email,
      'E-mail do administrador'
    );

  const usuarioExistente =
    authBuscarUsuarioPorEmail(
      emailNormalizado
    );

  if (usuarioExistente) {
    if (!usuarioExistente.ID_USUARIO) {
      throw new Error(
        'O usuário existente não possui ID_USUARIO.'
      );
    }

    dbAtualizarPrimeiroPorCampo(
      AUTH_CONFIG.ABA_USUARIOS,
      'ID_USUARIO',
      usuarioExistente.ID_USUARIO,
      {
        NOME:
          utilTexto(nome) ||
          usuarioExistente.NOME ||
          '',

        EMAIL:
          emailNormalizado,

        PERFIL:
          AUTH_CONFIG.PERFIS.ADMINISTRADOR,

        ATIVO:
          'SIM'
      }
    );

    return dbBuscarRegistroPorId(
      AUTH_CONFIG.ABA_USUARIOS,
      'ID_USUARIO',
      usuarioExistente.ID_USUARIO
    );
  }

  const novoUsuario = {
    ID_USUARIO:
      utilGerarId('USR'),

    NOME:
      utilTexto(nome),

    EMAIL:
      emailNormalizado,

    PERFIL:
      AUTH_CONFIG.PERFIS.ADMINISTRADOR,

    ID_PROFISSIONAL:
      '',

    ATIVO:
      'SIM',

    DATA_CADASTRO:
      new Date(),

    ULTIMO_ACESSO:
      ''
  };

  return dbSalvarRegistro(
    AUTH_CONFIG.ABA_USUARIOS,
    novoUsuario
  );
}


/**
 * Cria ou promove como administrador a conta Google conectada.
 *
 * Essa função poderá ser executada manualmente durante a configuração.
 *
 * @param {string=} nome
 * @return {Object}
 */
function authCriarAdministradorDaContaAtual(
  nome
) {
  const email =
    authObterEmailAtual();

  if (!email) {
    throw new Error(
      'Não foi possível identificar o e-mail da conta Google conectada.'
    );
  }

  return authCriarOuPromoverAdministrador(
    nome || '',
    email
  );
}

/* ============================================================
 * CONTEXTO DA REQUISIÇÃO ATUAL (TOKEN)
 * ============================================================
 */

/**
 * Resolve o token de sessão enviado pelo cliente e define o
 * e-mail correspondente como o "usuário atual" desta chamada de
 * servidor. Deve ser a primeira linha de toda função pública
 * chamada via google.script.run pelo Portal Profissional.
 *
 * @param {string} token
 * @return {Object|null} a sessão encontrada, ou null se inválida.
 */
function authDefinirContextoPorToken_(token) {
  AUTH_SESSAO_EMAIL_ATUAL_ = '';

  const sessao = authBuscarSessaoPorToken_(token);

  if (sessao) {
    AUTH_SESSAO_EMAIL_ATUAL_ = sessao.EMAIL;
  }

  return sessao;
}


/* ============================================================
 * PLANILHA DE SESSÕES DE ACESSO
 * ============================================================
 */

function authObterAbaSessoes_() {
  const planilha = dbObterPlanilha();

  let aba = planilha.getSheetByName(
    AUTH_SESSAO_CONFIG.ABA_SESSOES
  );

  if (!aba) {
    aba = planilha.insertSheet(
      AUTH_SESSAO_CONFIG.ABA_SESSOES
    );
  }

  const colunas = AUTH_SESSOES_COLUNAS;

  const ultimaColuna = Math.max(
    aba.getLastColumn(),
    colunas.length
  );

  const cabecalhoAtual = aba
    .getRange(1, 1, 1, ultimaColuna)
    .getValues()[0];

  const cabecalhoVazio = cabecalhoAtual.every(
    function (valor) {
      return String(valor || '').trim() === '';
    }
  );

  if (cabecalhoVazio) {
    aba.getRange(1, 1, 1, colunas.length).setValues([colunas]);
    aba.setFrozenRows(1);
  }

  return aba;
}

function authBuscarSessaoPorToken_(token) {
  token = utilTexto(token).trim();

  if (!token) {
    return null;
  }

  const aba = authObterAbaSessoes_();
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  const valores = aba
    .getRange(2, 1, ultimaLinha - 1, AUTH_SESSOES_COLUNAS.length)
    .getValues();

  for (let indice = 0; indice < valores.length; indice++) {
    const linha = valores[indice];

    if (String(linha[0]).trim() === token) {
      const expiraEm = linha[5];

      if (expiraEm && new Date(expiraEm).getTime() < Date.now()) {
        return null;
      }

      return {
        TOKEN: String(linha[0]),
        ID_USUARIO: String(linha[1] || ''),
        EMAIL: utilNormalizarEmail(linha[2]),
        PERFIL: String(linha[3] || ''),
        CRIADO_EM: linha[4],
        EXPIRA_EM: linha[5],
        _linha: indice + 2
      };
    }
  }

  return null;
}

function authCriarSessao_(usuario) {
  const aba = authObterAbaSessoes_();

  const token = Utilities.getUuid();
  const agora = new Date();
  const expira = new Date(
    agora.getTime() +
    AUTH_SESSAO_CONFIG.DURACAO_SESSAO_HORAS * 60 * 60 * 1000
  );

  aba.appendRow([
    token,
    usuario.ID_USUARIO || '',
    utilNormalizarEmail(usuario.EMAIL),
    authPerfilNormalizado(usuario),
    agora,
    expira
  ]);

  return token;
}


/* ============================================================
 * SENHA DO USUÁRIO
 * ============================================================
 */

/**
 * Garante que a aba USUARIOS possui a coluna de senha (hash).
 * Não remove nem reordena colunas existentes.
 */
function authGarantirCampoSenha_() {
  const aba = dbObterAba(AUTH_CONFIG.ABA_USUARIOS, false);

  const cabecalho = aba
    .getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1))
    .getValues()[0];

  const jaExiste = cabecalho.some(function (valor) {
    return String(valor || '').trim() === AUTH_SESSAO_CONFIG.CAMPO_SENHA;
  });

  if (!jaExiste) {
    aba
      .getRange(1, aba.getLastColumn() + 1)
      .setValue(AUTH_SESSAO_CONFIG.CAMPO_SENHA);
  }
}

/**
 * Gera o hash de uma senha (SHA-256, com o e-mail como sal).
 *
 * @param {string} senha
 * @param {string} salEmail
 * @return {string}
 */
function authGerarHashSenha_(senha, salEmail) {
  const texto =
    utilNormalizarEmail(salEmail) + '::' + String(senha || '');

  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    texto,
    Utilities.Charset.UTF_8
  );

  return bytes
    .map(function (byte) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    })
    .join('');
}


/* ============================================================
 * ENTRAR / VALIDAR SESSÃO / SAIR
 * ============================================================
 */

/**
 * Efetua o login por e-mail e senha.
 *
 * No primeiro acesso de um usuário (sem senha salva ainda), a
 * senha informada é gravada como a senha definitiva dele.
 *
 * @param {string} email
 * @param {string} senha
 * @return {{token: string, usuario: Object, perfil: string}}
 */
function authEntrar(email, senha) {
  authGarantirCampoSenha_();

  const emailNormalizado = utilNormalizarEmail(email);

  if (!emailNormalizado) {
    throw new Error('Informe o e-mail de acesso.');
  }

  const senhaDigitada = String(senha || '').trim();

  if (senhaDigitada.length < 4) {
    throw new Error('A senha deve ter ao menos 4 caracteres.');
  }

  const usuario = authBuscarUsuarioPorEmail(emailNormalizado);

  if (!usuario) {
    throw new Error(
      'E-mail não cadastrado no sistema. Procure a administração da Árya Saúde.'
    );
  }

  if (!authUsuarioEstaAtivo(usuario)) {
    throw new Error(
      'Seu acesso está inativo. Procure a administração da Árya Saúde.'
    );
  }

  const hashSalvo = utilTexto(usuario[AUTH_SESSAO_CONFIG.CAMPO_SENHA]);
  const hashDigitado = authGerarHashSenha_(senhaDigitada, emailNormalizado);

  if (!hashSalvo) {
    dbAtualizarPrimeiroPorCampo(
      AUTH_CONFIG.ABA_USUARIOS,
      'ID_USUARIO',
      usuario.ID_USUARIO,
      {
        SENHA_HASH: hashDigitado,
        ULTIMO_ACESSO: new Date()
      }
    );
  } else if (hashDigitado !== hashSalvo) {
    throw new Error('Senha incorreta.');
  } else {
    dbAtualizarPrimeiroPorCampo(
      AUTH_CONFIG.ABA_USUARIOS,
      'ID_USUARIO',
      usuario.ID_USUARIO,
      {
        ULTIMO_ACESSO: new Date()
      }
    );
  }

  const token = authCriarSessao_(usuario);

  AUTH_SESSAO_EMAIL_ATUAL_ = emailNormalizado;

  return {
    sucesso: true,
    token: token,
    usuario: authPrepararUsuarioParaInterface(usuario),
    perfil: authPerfilNormalizado(usuario)
  };
}

/**
 * Valida um token salvo pelo cliente (usado ao recarregar a
 * página, para não pedir login de novo enquanto a sessão for
 * válida).
 *
 * @param {string} token
 * @return {{usuario: Object, perfil: string}}
 */
function authValidarSessao(token) {
  const sessao = authDefinirContextoPorToken_(token);

  if (!sessao) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const usuario = authBuscarUsuarioPorEmail(sessao.EMAIL);

  if (!usuario || !authUsuarioEstaAtivo(usuario)) {
    throw new Error('Seu acesso está inativo. Procure a administração da Árya Saúde.');
  }

  return {
    sucesso: true,
    usuario: authPrepararUsuarioParaInterface(usuario),
    perfil: authPerfilNormalizado(usuario)
  };
}

/**
 * Encerra a sessão (logout).
 *
 * @param {string} token
 * @return {{sucesso: boolean}}
 */
function authSair(token) {
  const sessao = authBuscarSessaoPorToken_(token);

  if (sessao && sessao._linha) {
    authObterAbaSessoes_().deleteRow(sessao._linha);
  }

  AUTH_SESSAO_EMAIL_ATUAL_ = '';

  return { sucesso: true };
}
