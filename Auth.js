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

    dbAtualizarCampos(
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