/**
 * ============================================================
 * ÁRYA SAÚDE
 * REGRAS DE NEGÓCIO — USUÁRIOS
 * ARQUIVO: RN_Usuarios.gs
 * ============================================================
 *
 * Responsabilidades:
 * - identificar o usuário conectado;
 * - localizar o usuário na aba USUARIOS;
 * - validar usuário ativo;
 * - identificar perfil e permissões gerais;
 * - localizar o profissional vinculado ao usuário;
 * - fornecer contexto seguro para os demais módulos.
 *
 * DEPENDÊNCIAS:
 * - Database.gs
 * - RN_Config.gs
 *
 * IMPORTANTE:
 * - este arquivo não cria nem altera usuários;
 * - este arquivo não grava dados;
 * - funções internas usam o prefixo "rnu";
 * - funções públicas novas usam o prefixo "rnUsuarios".
 */


/* ============================================================
 * CONFIGURAÇÃO DO MÓDULO
 * ============================================================
 */

var ARYA_RN_USUARIOS_CONFIG = {
  VERSAO:
    '1.0.0',

  EXIGIR_USUARIO_ATIVO:
    true,

  EXIGIR_PROFISSIONAL_ATIVO:
    true,

  PERMITIR_EMAIL_USUARIO_EFETIVO:
    true
};


/* ============================================================
 * CONTEXTO DO USUÁRIO
 * ============================================================
 */

/**
 * Retorna o contexto completo do usuário conectado.
 *
 * Estrutura de retorno:
 *
 * {
 *   autenticado: true,
 *   email: "...",
 *   idUsuario: "...",
 *   nomeUsuario: "...",
 *   perfil: "ADMINISTRADOR",
 *   administrativo: true,
 *   profissional: false,
 *   idProfissional: "",
 *   nomeProfissional: "",
 *   usuario: {...},
 *   registroProfissional: null
 * }
 *
 * @return {Object}
 */
function rnUsuariosObterContextoAtual() {
  rnuExigirDependencias_();

  var email =
    rnuObterEmailUsuarioAtual_();

  if (!email) {
    throw new Error(
      'Não foi possível identificar o e-mail da conta Google conectada.'
    );
  }

  var usuario =
    rnuBuscarUsuarioPorEmail_(
      email
    );

  if (!usuario) {
    throw new Error(
      'O e-mail "' +
      email +
      '" não está cadastrado na aba USUARIOS.'
    );
  }

  if (
    ARYA_RN_USUARIOS_CONFIG
      .EXIGIR_USUARIO_ATIVO &&
    !rnuUsuarioAtivo_(usuario)
  ) {
    throw new Error(
      'O usuário conectado está inativo.'
    );
  }

  var idUsuario =
    rncTexto_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'ID_USUARIO'
        )
      )
    );

  var nomeUsuario =
    rncTexto_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'NOME'
        )
      )
    );

  var perfil =
    rncNormalizarPerfil_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'PERFIL'
        )
      )
    );

  if (!perfil) {
    throw new Error(
      'O usuário conectado não possui perfil definido na aba USUARIOS.'
    );
  }

  var idProfissional =
    rncNormalizarId_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'ID_PROFISSIONAL'
        )
      )
    );

  var registroProfissional =
    null;

  if (idProfissional) {
    registroProfissional =
      rnuBuscarProfissionalPorId_(
        idProfissional
      );

    if (!registroProfissional) {
      throw new Error(
        'O usuário possui o ID_PROFISSIONAL "' +
        idProfissional +
        '", mas esse profissional não foi encontrado na aba PROFISSIONAIS.'
      );
    }

    if (
      ARYA_RN_USUARIOS_CONFIG
        .EXIGIR_PROFISSIONAL_ATIVO &&
      !rnuProfissionalAtivo_(
        registroProfissional
      )
    ) {
      throw new Error(
        'O profissional vinculado ao usuário está inativo.'
      );
    }
  }

  var nomeProfissional =
    registroProfissional
      ? rnuObterNomeProfissional_(
          registroProfissional
        )
      : '';

  var administrativo =
    rncPerfilAdministrativo_(
      perfil
    );

  var perfilProfissional =
    perfil ===
    ARYA_RN_CONFIG.PERFIS.PROFISSIONAL;

  if (
    perfilProfissional &&
    !idProfissional
  ) {
    throw new Error(
      'O usuário possui perfil PROFISSIONAL, mas não tem ID_PROFISSIONAL vinculado.'
    );
  }

  return {
    autenticado:
      true,

    email:
      email,

    idUsuario:
      idUsuario,

    nomeUsuario:
      nomeUsuario ||
      nomeProfissional ||
      email,

    perfil:
      perfil,

    administrativo:
      administrativo,

    profissional:
      perfilProfissional,

    idProfissional:
      idProfissional,

    nomeProfissional:
      nomeProfissional,

    usuario:
      usuario,

    registroProfissional:
      registroProfissional
  };
}


/**
 * Retorna um contexto reduzido e apropriado para a interface.
 *
 * Não retorna a linha completa das abas.
 *
 * @return {Object}
 */
function rnUsuariosObterContextoPublicoAtual() {
  var contexto =
    rnUsuariosObterContextoAtual();

  return {
    autenticado:
      contexto.autenticado,

    email:
      contexto.email,

    idUsuario:
      contexto.idUsuario,

    nomeUsuario:
      contexto.nomeUsuario,

    perfil:
      contexto.perfil,

    administrativo:
      contexto.administrativo,

    profissional:
      contexto.profissional,

    idProfissional:
      contexto.idProfissional,

    nomeProfissional:
      contexto.nomeProfissional
  };
}


/**
 * Retorna o e-mail do usuário conectado.
 *
 * @return {string}
 */
function rnUsuariosObterEmailAtual() {
  var email =
    rnuObterEmailUsuarioAtual_();

  if (!email) {
    throw new Error(
      'Não foi possível identificar o e-mail do usuário conectado.'
    );
  }

  return email;
}


/**
 * Retorna o ID do usuário conectado.
 *
 * @return {string}
 */
function rnUsuariosObterIdAtual() {
  var contexto =
    rnUsuariosObterContextoAtual();

  if (!contexto.idUsuario) {
    throw new Error(
      'O usuário conectado não possui ID_USUARIO.'
    );
  }

  return contexto.idUsuario;
}


/**
 * Retorna o perfil do usuário conectado.
 *
 * @return {string}
 */
function rnUsuariosObterPerfilAtual() {
  return rnUsuariosObterContextoAtual()
    .perfil;
}


/**
 * Retorna o ID do profissional vinculado.
 *
 * @return {string}
 */
function rnUsuariosObterIdProfissionalAtual() {
  var contexto =
    rnUsuariosObterContextoAtual();

  if (!contexto.idProfissional) {
    throw new Error(
      'O usuário conectado não possui profissional vinculado.'
    );
  }

  return contexto.idProfissional;
}


/**
 * Verifica se o usuário conectado é administrativo.
 *
 * @return {boolean}
 */
function rnUsuariosAtualEhAdministrativo() {
  return rnUsuariosObterContextoAtual()
    .administrativo;
}


/**
 * Verifica se o usuário conectado possui perfil profissional.
 *
 * @return {boolean}
 */
function rnUsuariosAtualEhProfissional() {
  return rnUsuariosObterContextoAtual()
    .profissional;
}


/* ============================================================
 * CONSULTAS DE USUÁRIOS
 * ============================================================
 */

/**
 * Busca um usuário pelo e-mail.
 *
 * A consulta de outro usuário é permitida apenas para perfis
 * administrativos. O próprio usuário pode consultar seu registro.
 *
 * @param {string} email
 * @return {Object|null}
 */
function rnUsuariosBuscarPorEmail(email) {
  var emailNormalizado =
    rncNormalizarEmail_(
      email
    );

  if (!emailNormalizado) {
    throw new Error(
      'Informe o e-mail do usuário.'
    );
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  if (
    !contexto.administrativo &&
    emailNormalizado !==
      contexto.email
  ) {
    throw new Error(
      'O usuário conectado não possui permissão para consultar outro usuário.'
    );
  }

  var usuario =
    rnuBuscarUsuarioPorEmail_(
      emailNormalizado
    );

  return usuario
    ? rnuPrepararUsuarioRetorno_(
        usuario
      )
    : null;
}


/**
 * Busca um usuário pelo ID.
 *
 * Disponível apenas para perfis administrativos, exceto quando
 * o ID consultado pertence ao próprio usuário.
 *
 * @param {string} idUsuario
 * @return {Object|null}
 */
function rnUsuariosBuscarPorId(idUsuario) {
  var idNormalizado =
    rncNormalizarId_(
      idUsuario
    );

  if (!idNormalizado) {
    throw new Error(
      'Informe o ID do usuário.'
    );
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  if (
    !contexto.administrativo &&
    rncChave_(contexto.idUsuario) !==
      rncChave_(idNormalizado)
  ) {
    throw new Error(
      'O usuário conectado não possui permissão para consultar outro usuário.'
    );
  }

  var usuario =
    rnuBuscarUsuarioPorId_(
      idNormalizado
    );

  return usuario
    ? rnuPrepararUsuarioRetorno_(
        usuario
      )
    : null;
}


/**
 * Lista usuários.
 *
 * Disponível apenas para perfis administrativos.
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnUsuariosListar(filtros) {
  rnUsuariosExigirPerfilAdministrativo();

  var configuracao =
    filtros || {};

  var usuarios =
    rnuLerUsuarios_();

  if (
    configuracao.somenteAtivos === true
  ) {
    usuarios =
      usuarios.filter(
        function(usuario) {
          return rnuUsuarioAtivo_(
            usuario
          );
        }
      );
  }

  if (configuracao.perfil) {
    var perfilFiltro =
      rncNormalizarPerfil_(
        configuracao.perfil
      );

    usuarios =
      usuarios.filter(
        function(usuario) {
          var perfilUsuario =
            rncNormalizarPerfil_(
              rncValorPorAlias_(
                usuario,
                rncAliases_(
                  'USUARIOS',
                  'PERFIL'
                )
              )
            );

          return (
            perfilUsuario ===
            perfilFiltro
          );
        }
      );
  }

  if (configuracao.idProfissional) {
    var profissionalFiltro =
      rncChave_(
        configuracao.idProfissional
      );

    usuarios =
      usuarios.filter(
        function(usuario) {
          var idProfissional =
            rncValorPorAlias_(
              usuario,
              rncAliases_(
                'USUARIOS',
                'ID_PROFISSIONAL'
              )
            );

          return (
            rncChave_(idProfissional) ===
            profissionalFiltro
          );
        }
      );
  }

  var retorno =
    usuarios.map(
      rnuPrepararUsuarioRetorno_
    );

  return rncOrdenarPorTexto_(
    retorno,
    'nomeUsuario'
  );
}


/* ============================================================
 * CONSULTAS DE PROFISSIONAIS
 * ============================================================
 */

/**
 * Retorna o profissional vinculado ao usuário atual.
 *
 * @return {Object}
 */
function rnUsuariosObterProfissionalAtual() {
  var contexto =
    rnUsuariosObterContextoAtual();

  if (
    !contexto.registroProfissional
  ) {
    throw new Error(
      'O usuário conectado não possui profissional vinculado.'
    );
  }

  return rnuPrepararProfissionalRetorno_(
    contexto.registroProfissional
  );
}


/**
 * Busca um profissional por ID.
 *
 * Um profissional comum só pode consultar o próprio cadastro.
 * Administrativos podem consultar qualquer profissional.
 *
 * @param {string} idProfissional
 * @return {Object|null}
 */
function rnUsuariosBuscarProfissionalPorId(
  idProfissional
) {
  var idNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  if (!idNormalizado) {
    throw new Error(
      'Informe o ID do profissional.'
    );
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  if (
    !contexto.administrativo &&
    rncChave_(contexto.idProfissional) !==
      rncChave_(idNormalizado)
  ) {
    throw new Error(
      'O usuário conectado não pode consultar outro profissional.'
    );
  }

  var profissional =
    rnuBuscarProfissionalPorId_(
      idNormalizado
    );

  return profissional
    ? rnuPrepararProfissionalRetorno_(
        profissional
      )
    : null;
}


/**
 * Lista profissionais ativos.
 *
 * Disponível para usuários administrativos.
 *
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnUsuariosListarProfissionais(
  filtros
) {
  rnUsuariosExigirPerfilAdministrativo();

  var configuracao =
    filtros || {};

  var profissionais =
    rnuLerProfissionais_();

  if (
    configuracao.incluirInativos !== true
  ) {
    profissionais =
      profissionais.filter(
        function(profissional) {
          return rnuProfissionalAtivo_(
            profissional
          );
        }
      );
  }

  if (configuracao.especialidade) {
    var especialidadeFiltro =
      rncChave_(
        configuracao.especialidade
      );

    profissionais =
      profissionais.filter(
        function(profissional) {
          var especialidade =
            rncValorPorAlias_(
              profissional,
              rncAliases_(
                'PROFISSIONAIS',
                'ESPECIALIDADE'
              )
            );

          return (
            rncChave_(especialidade) ===
            especialidadeFiltro
          );
        }
      );
  }

  var retorno =
    profissionais.map(
      rnuPrepararProfissionalRetorno_
    );

  return rncOrdenarPorTexto_(
    retorno,
    'nomeProfissional'
  );
}


/* ============================================================
 * EXIGÊNCIAS DE ACESSO
 * ============================================================
 */

/**
 * Exige que o usuário atual tenha perfil administrativo.
 *
 * @return {Object}
 */
function rnUsuariosExigirPerfilAdministrativo() {
  var contexto =
    rnUsuariosObterContextoAtual();

  if (!contexto.administrativo) {
    throw new Error(
      'Esta operação exige perfil administrativo.'
    );
  }

  return contexto;
}


/**
 * Exige que o usuário atual tenha profissional vinculado.
 *
 * @return {Object}
 */
function rnUsuariosExigirProfissionalVinculado() {
  var contexto =
    rnUsuariosObterContextoAtual();

  if (!contexto.idProfissional) {
    throw new Error(
      'Esta operação exige um profissional vinculado ao usuário.'
    );
  }

  return contexto;
}


/**
 * Exige um dos perfis informados.
 *
 * Exemplo:
 *
 * rnUsuariosExigirPerfis([
 *   'ADMINISTRADOR',
 *   'PROFISSIONAL'
 * ]);
 *
 * @param {string[]} perfisPermitidos
 * @return {Object}
 */
function rnUsuariosExigirPerfis(
  perfisPermitidos
) {
  if (
    !Array.isArray(
      perfisPermitidos
    ) ||
    !perfisPermitidos.length
  ) {
    throw new Error(
      'Informe ao menos um perfil permitido.'
    );
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  var perfisNormalizados =
    perfisPermitidos.map(
      function(perfil) {
        return rncNormalizarPerfil_(
          perfil
        );
      }
    );

  if (
    perfisNormalizados.indexOf(
      contexto.perfil
    ) === -1
  ) {
    throw new Error(
      'O perfil "' +
      contexto.perfil +
      '" não possui permissão para esta operação.'
    );
  }

  return contexto;
}


/**
 * Verifica sem lançar erro se o usuário possui um dos perfis.
 *
 * @param {string[]} perfisPermitidos
 * @return {boolean}
 */
function rnUsuariosPossuiUmDosPerfis(
  perfisPermitidos
) {
  if (
    !Array.isArray(
      perfisPermitidos
    ) ||
    !perfisPermitidos.length
  ) {
    return false;
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  var perfisNormalizados =
    perfisPermitidos.map(
      function(perfil) {
        return rncNormalizarPerfil_(
          perfil
        );
      }
    );

  return (
    perfisNormalizados.indexOf(
      contexto.perfil
    ) !== -1
  );
}


/* ============================================================
 * FUNÇÕES INTERNAS — IDENTIFICAÇÃO
 * ============================================================
 */

/**
 * Obtém o e-mail do usuário conectado.
 *
 * Primeiro tenta Session.getActiveUser().
 * Se necessário, utiliza Session.getEffectiveUser().
 *
 * @return {string}
 */
function rnuObterEmailUsuarioAtual_() {
  if (
    typeof AUTH_SESSAO_EMAIL_ATUAL_ !== 'undefined' &&
    AUTH_SESSAO_EMAIL_ATUAL_
  ) {
    return AUTH_SESSAO_EMAIL_ATUAL_;
  }

  var emailAtivo = '';

  try {
    emailAtivo =
      Session
        .getActiveUser()
        .getEmail();
  } catch (erroUsuarioAtivo) {
    emailAtivo = '';
  }

  emailAtivo =
    rncNormalizarEmail_(
      emailAtivo
    );

  if (emailAtivo) {
    return emailAtivo;
  }

  if (
    !ARYA_RN_USUARIOS_CONFIG
      .PERMITIR_EMAIL_USUARIO_EFETIVO
  ) {
    return '';
  }

  var emailEfetivo = '';

  try {
    emailEfetivo =
      Session
        .getEffectiveUser()
        .getEmail();
  } catch (erroUsuarioEfetivo) {
    emailEfetivo = '';
  }

  return rncNormalizarEmail_(
    emailEfetivo
  );
}


/* ============================================================
 * FUNÇÕES INTERNAS — LEITURA
 * ============================================================
 */

/**
 * Lê todos os usuários.
 *
 * @return {Object[]}
 */
function rnuLerUsuarios_() {
  var nomeAba =
    rncNomeAba_(
      'USUARIOS'
    );

  if (
    !dbAbaExiste(
      nomeAba
    )
  ) {
    throw new Error(
      'A aba USUARIOS não foi encontrada.'
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
 * Lê todos os profissionais.
 *
 * @return {Object[]}
 */
function rnuLerProfissionais_() {
  var nomeAba =
    rncNomeAba_(
      'PROFISSIONAIS'
    );

  if (
    !dbAbaExiste(
      nomeAba
    )
  ) {
    throw new Error(
      'A aba PROFISSIONAIS não foi encontrada.'
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
 * Busca usuário por e-mail.
 *
 * @param {string} email
 * @return {Object|null}
 */
function rnuBuscarUsuarioPorEmail_(
  email
) {
  var emailNormalizado =
    rncNormalizarEmail_(
      email
    );

  if (!emailNormalizado) {
    return null;
  }

  var usuarios =
    rnuLerUsuarios_();

  var aliasesEmail =
    rncAliases_(
      'USUARIOS',
      'EMAIL'
    );

  for (
    var indice = 0;
    indice < usuarios.length;
    indice++
  ) {
    var emailUsuario =
      rncNormalizarEmail_(
        rncValorPorAlias_(
          usuarios[indice],
          aliasesEmail
        )
      );

    if (
      emailUsuario ===
      emailNormalizado
    ) {
      return usuarios[indice];
    }
  }

  return null;
}


/**
 * Busca usuário por ID.
 *
 * @param {string} idUsuario
 * @return {Object|null}
 */
function rnuBuscarUsuarioPorId_(
  idUsuario
) {
  var idNormalizado =
    rncChave_(
      idUsuario
    );

  if (!idNormalizado) {
    return null;
  }

  var usuarios =
    rnuLerUsuarios_();

  var aliasesId =
    rncAliases_(
      'USUARIOS',
      'ID_USUARIO'
    );

  for (
    var indice = 0;
    indice < usuarios.length;
    indice++
  ) {
    var idRegistro =
      rncChave_(
        rncValorPorAlias_(
          usuarios[indice],
          aliasesId
        )
      );

    if (
      idRegistro ===
      idNormalizado
    ) {
      return usuarios[indice];
    }
  }

  return null;
}


/**
 * Busca profissional por ID.
 *
 * @param {string} idProfissional
 * @return {Object|null}
 */
function rnuBuscarProfissionalPorId_(
  idProfissional
) {
  var idNormalizado =
    rncChave_(
      idProfissional
    );

  if (!idNormalizado) {
    return null;
  }

  var profissionais =
    rnuLerProfissionais_();

  var aliasesId =
    rncAliases_(
      'PROFISSIONAIS',
      'ID_PROFISSIONAL'
    );

  for (
    var indice = 0;
    indice < profissionais.length;
    indice++
  ) {
    var idRegistro =
      rncChave_(
        rncValorPorAlias_(
          profissionais[indice],
          aliasesId
        )
      );

    if (
      idRegistro ===
      idNormalizado
    ) {
      return profissionais[indice];
    }
  }

  return null;
}


/* ============================================================
 * FUNÇÕES INTERNAS — STATUS
 * ============================================================
 */

/**
 * Verifica se o usuário está ativo.
 *
 * @param {Object} usuario
 * @return {boolean}
 */
function rnuUsuarioAtivo_(usuario) {
  return rncRegistroAtivo_(
    usuario,
    rncAliases_(
      'USUARIOS',
      'ATIVO'
    ),
    true
  );
}


/**
 * Verifica se o profissional está ativo.
 *
 * @param {Object} profissional
 * @return {boolean}
 */
function rnuProfissionalAtivo_(
  profissional
) {
  return rncRegistroAtivo_(
    profissional,
    rncAliases_(
      'PROFISSIONAIS',
      'ATIVO'
    ),
    true
  );
}


/* ============================================================
 * FUNÇÕES INTERNAS — NOMES
 * ============================================================
 */

/**
 * Retorna o nome de exibição do profissional.
 *
 * Prioridade:
 * 1. nome social;
 * 2. nome completo;
 * 3. e-mail;
 * 4. ID.
 *
 * @param {Object} profissional
 * @return {string}
 */
function rnuObterNomeProfissional_(
  profissional
) {
  if (!profissional) {
    return '';
  }

  var nomeSocial =
    rncTexto_(
      rncValorPorAlias_(
        profissional,
        rncAliases_(
          'PROFISSIONAIS',
          'NOME_SOCIAL'
        )
      )
    );

  var nomeCompleto =
    rncTexto_(
      rncValorPorAlias_(
        profissional,
        rncAliases_(
          'PROFISSIONAIS',
          'NOME'
        )
      )
    );

  var email =
    rncNormalizarEmail_(
      rncValorPorAlias_(
        profissional,
        rncAliases_(
          'PROFISSIONAIS',
          'EMAIL'
        )
      )
    );

  var idProfissional =
    rncNormalizarId_(
      rncValorPorAlias_(
        profissional,
        rncAliases_(
          'PROFISSIONAIS',
          'ID_PROFISSIONAL'
        )
      )
    );

  return (
    nomeSocial ||
    nomeCompleto ||
    email ||
    idProfissional
  );
}


/* ============================================================
 * FUNÇÕES INTERNAS — RETORNOS
 * ============================================================
 */

/**
 * Prepara usuário para retorno seguro.
 *
 * Não inclui o objeto completo da planilha.
 *
 * @param {Object} usuario
 * @return {Object}
 */
function rnuPrepararUsuarioRetorno_(
  usuario
) {
  var idProfissional =
    rncNormalizarId_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'ID_PROFISSIONAL'
        )
      )
    );

  var profissional =
    idProfissional
      ? rnuBuscarProfissionalPorId_(
          idProfissional
        )
      : null;

  var nomeProfissional =
    profissional
      ? rnuObterNomeProfissional_(
          profissional
        )
      : '';

  var nomeUsuario =
    rncTexto_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'NOME'
        )
      )
    );

  var perfil =
    rncNormalizarPerfil_(
      rncValorPorAlias_(
        usuario,
        rncAliases_(
          'USUARIOS',
          'PERFIL'
        )
      )
    );

  return {
    idUsuario:
      rncNormalizarId_(
        rncValorPorAlias_(
          usuario,
          rncAliases_(
            'USUARIOS',
            'ID_USUARIO'
          )
        )
      ),

    nomeUsuario:
      nomeUsuario ||
      nomeProfissional,

    email:
      rncNormalizarEmail_(
        rncValorPorAlias_(
          usuario,
          rncAliases_(
            'USUARIOS',
            'EMAIL'
          )
        )
      ),

    perfil:
      perfil,

    administrativo:
      rncPerfilAdministrativo_(
        perfil
      ),

    idProfissional:
      idProfissional,

    nomeProfissional:
      nomeProfissional,

    ativo:
      rnuUsuarioAtivo_(
        usuario
      )
  };
}


/**
 * Prepara profissional para retorno seguro.
 *
 * @param {Object} profissional
 * @return {Object}
 */
function rnuPrepararProfissionalRetorno_(
  profissional
) {
  return {
    idProfissional:
      rncNormalizarId_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'ID_PROFISSIONAL'
          )
        )
      ),

    nomeProfissional:
      rnuObterNomeProfissional_(
        profissional
      ),

    nomeCompleto:
      rncTexto_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'NOME'
          )
        )
      ),

    nomeSocial:
      rncTexto_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'NOME_SOCIAL'
          )
        )
      ),

    cpf:
      rncNormalizarCpf_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'CPF'
          )
        )
      ),

    email:
      rncNormalizarEmail_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'EMAIL'
          )
        )
      ),

    telefone:
      rncTexto_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'TELEFONE'
          )
        )
      ),

    registroProfissional:
      rncTexto_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'REGISTRO_PROFISSIONAL'
          )
        )
      ),

    especialidade:
      rncTexto_(
        rncValorPorAlias_(
          profissional,
          rncAliases_(
            'PROFISSIONAIS',
            'ESPECIALIDADE'
          )
        )
      ),

    ativo:
      rnuProfissionalAtivo_(
        profissional
      )
  };
}


/* ============================================================
 * DEPENDÊNCIAS
 * ============================================================
 */

/**
 * Valida dependências do módulo.
 *
 * @return {Object}
 */
function rnuValidarDependencias_() {
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
        'function' &&
      typeof rncNomeAba_ ===
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
function rnuExigirDependencias_() {
  var resultado =
    rnuValidarDependencias_();

  if (!resultado.valido) {
    throw new Error(
      'Dependências ausentes no RN_Usuarios.gs: ' +
      resultado.ausentes.join(', ') +
      '.'
    );
  }
}


/* ============================================================
 * TESTES
 * ============================================================
 */

/**
 * Diagnostica as abas e cabeçalhos usados pelo módulo.
 *
 * Não grava dados.
 *
 * @return {Object}
 */
function diagnosticarRNUsuarios() {
  rnuExigirDependencias_();

  var abasNecessarias = [
    rncNomeAba_(
      'USUARIOS'
    ),
    rncNomeAba_(
      'PROFISSIONAIS'
    )
  ];

  var resultado = {
    sucesso:
      true,

    modulo:
      'RN_Usuarios.gs',

    versao:
      ARYA_RN_USUARIOS_CONFIG.VERSAO,

    abas: []
  };

  abasNecessarias.forEach(
    function(nomeAba) {
      var existe =
        dbAbaExiste(
          nomeAba
        );

      if (!existe) {
        resultado.sucesso =
          false;
      }

      resultado.abas.push({
        nome:
          nomeAba,

        existe:
          existe,

        cabecalhos:
          existe
            ? dbObterCabecalhos(
                nomeAba
              )
            : []
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


/**
 * Testa a identificação do usuário conectado.
 *
 * Não grava dados.
 *
 * @return {Object}
 */
function testarRNUsuariosContextoAtual() {
  var contexto =
    rnUsuariosObterContextoPublicoAtual();

  var resultado = {
    sucesso:
      true,

    modulo:
      'RN_Usuarios.gs',

    contexto:
      contexto
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


/**
 * Testa a consulta do profissional vinculado.
 *
 * Para um usuário administrativo sem profissional vinculado,
 * o teste retorna uma informação em vez de falhar.
 *
 * Não grava dados.
 *
 * @return {Object}
 */
function testarRNUsuariosProfissionalAtual() {
  var contexto =
    rnUsuariosObterContextoAtual();

  var resultado = {
    sucesso:
      true,

    modulo:
      'RN_Usuarios.gs',

    possuiProfissionalVinculado:
      Boolean(
        contexto.idProfissional
      ),

    profissional:
      contexto.idProfissional
        ? rnUsuariosObterProfissionalAtual()
        : null,

    observacao:
      contexto.idProfissional
        ? ''
        : 'O usuário atual não possui profissional vinculado.'
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