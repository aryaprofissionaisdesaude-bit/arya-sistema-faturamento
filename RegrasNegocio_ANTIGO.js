/**
 * ============================================================
 * ÁRYA SAÚDE
 * MOTOR CENTRAL DE REGRAS DE NEGÓCIO
 * ARQUIVO: RegrasNegocio.gs
 * ============================================================
 *
 * Responsabilidades:
 * - identificar o usuário e o profissional conectado;
 * - determinar quais pacientes o profissional pode acessar;
 * - localizar o convênio padrão de um paciente;
 * - determinar procedimentos permitidos;
 * - cruzar habilitação profissional e regras do convênio;
 * - validar atendimentos antes da criação de protocolos/guias;
 * - centralizar regras que serão usadas por vários módulos.
 *
 * DEPENDÊNCIA:
 * - Database.gs
 *
 * Este arquivo não grava dados e não altera a estrutura das abas.
 */


/* ============================================================
 * CONFIGURAÇÃO DAS REGRAS
 * ============================================================
 */

var RN_CONFIG = {
  PERFIS_ADMINISTRATIVOS: [
    'ADMINISTRADOR',
    'ADMINISTRATIVO',
    'ADMIN',
    'SECRETARIA',
    'GESTOR'
  ],

  VALORES_ATIVOS: [
    'SIM',
    'ATIVO',
    'TRUE',
    '1',
    'S'
  ],

  VALORES_INATIVOS: [
    'NAO',
    'NÃO',
    'INATIVO',
    'FALSE',
    '0',
    'N'
  ],

  TIPO_ATENDIMENTO: {
    CONVENIO:
      'CONVENIO',

    PARTICULAR:
      'PARTICULAR'
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
        'USUARIO'
      ],

      PERFIL: [
        'PERFIL',
        'TIPO_USUARIO',
        'NIVEL_ACESSO'
      ],

      ID_PROFISSIONAL: [
        'ID_PROFISSIONAL',
        'PROFISSIONAL_ID'
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

      EMAIL: [
        'EMAIL',
        'E_MAIL'
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

      TELEFONE: [
        'TELEFONE',
        'CELULAR'
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

      ID_PROFISSIONAL_RESPONSAVEL: [
        'ID_PROFISSIONAL_RESPONSAVEL',
        'ID_PROFISSIONAL_PRINCIPAL',
        'PROFISSIONAL_RESPONSAVEL'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    ASSOCIACOES: {
      ID_ASSOCIACAO: [
        'ID_ASSOCIACAO',
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
        'RAZAO_SOCIAL',
        'NOME',
        'CONVENIO'
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
        'CODIGO',
        'CODIGO_TUSS'
      ],

      NOME: [
        'NOME_PROCEDIMENTO',
        'DESCRICAO',
        'PROCEDIMENTO',
        'NOME'
      ],

      VALOR_PARTICULAR: [
        'VALOR_PARTICULAR',
        'VALOR',
        'PRECO'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    HABILITACOES: {
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

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    },

    PROCEDIMENTOS_CONVENIOS: {
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
        'CODIGO_PROCEDIMENTO_CONVENIO',
        'CODIGO'
      ],

      VALOR: [
        'VALOR_CONVENIO',
        'VALOR_PROCEDIMENTO',
        'VALOR'
      ],

      ATIVO: [
        'ATIVO',
        'STATUS'
      ]
    }
  }
};


/* ============================================================
 * CONTEXTO DO USUÁRIO ATUAL
 * ============================================================
 */

/**
 * Retorna o contexto completo do usuário conectado.
 *
 * @return {Object}
 */
function rnObterContextoUsuarioAtual() {
  var email =
    rnObterEmailUsuarioAtual_();

  if (!email) {
    throw new Error(
      'Não foi possível identificar o e-mail do usuário conectado.'
    );
  }

  var usuario =
    rnBuscarUsuarioPorEmail_(
      email
    );

  if (!usuario) {
    throw new Error(
      'O usuário "' +
      email +
      '" não está cadastrado na aba USUARIOS.'
    );
  }

  if (
    !rnRegistroAtivo_(
      usuario,
      RN_CONFIG.CABECALHOS.USUARIOS.ATIVO
    )
  ) {
    throw new Error(
      'O usuário conectado está inativo.'
    );
  }

  var perfil =
    rnValorPorAlias_(
      usuario,
      RN_CONFIG.CABECALHOS.USUARIOS.PERFIL
    );

  var idProfissional =
    rnValorPorAlias_(
      usuario,
      RN_CONFIG.CABECALHOS.USUARIOS.ID_PROFISSIONAL
    );

  var contexto = {
    email:
      email,

    perfil:
      rnTexto_(perfil).toUpperCase(),

    idUsuario:
      rnValorPorAlias_(
        usuario,
        RN_CONFIG.CABECALHOS.USUARIOS.ID_USUARIO
      ),

    idProfissional:
      rnTexto_(idProfissional),

    administrativo:
      rnPerfilAdministrativo_(
        perfil
      ),

    usuario:
      usuario,

    profissional:
      null
  };

  if (contexto.idProfissional) {
    contexto.profissional =
      rnBuscarProfissionalPorId_(
        contexto.idProfissional
      );
  }

  return contexto;
}


/**
 * Retorna apenas o ID do profissional conectado.
 *
 * @return {string}
 */
function rnObterIdProfissionalAtual() {
  var contexto =
    rnObterContextoUsuarioAtual();

  if (!contexto.idProfissional) {
    throw new Error(
      'O usuário conectado não possui ID_PROFISSIONAL vinculado.'
    );
  }

  return contexto.idProfissional;
}


/**
 * Verifica se o usuário conectado possui perfil administrativo.
 *
 * @return {boolean}
 */
function rnUsuarioAtualEhAdministrativo() {
  return rnObterContextoUsuarioAtual()
    .administrativo;
}


/* ============================================================
 * PACIENTES E PERMISSÕES
 * ============================================================
 */

/**
 * Retorna pacientes que o profissional pode acessar.
 *
 * O acesso pode ocorrer por:
 * 1. ID_PROFISSIONAL_RESPONSAVEL em PACIENTES;
 * 2. associação ativa na aba ASSOCIACOES.
 *
 * Usuários administrativos podem consultar todos os pacientes.
 *
 * @param {string=} idProfissional
 * @return {Object[]}
 */
function rnObterPacientesDoProfissional(
  idProfissional
) {
  var contexto =
    rnObterContextoUsuarioAtual();

  var idAlvo =
    rnTexto_(
      idProfissional ||
      contexto.idProfissional
    );

  if (
    idProfissional &&
    !contexto.administrativo &&
    idAlvo !== contexto.idProfissional
  ) {
    throw new Error(
      'O usuário conectado não pode consultar pacientes de outro profissional.'
    );
  }

  var pacientes =
    dbLerRegistros(
      DB_CONFIG.ABAS.PACIENTES,
      {
        incluirNumeroLinha:
          true
      }
    );

  pacientes =
    pacientes.filter(
      function(paciente) {
        return rnRegistroAtivo_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.ATIVO
        );
      }
    );

  if (
    contexto.administrativo &&
    !idAlvo
  ) {
    return pacientes
      .map(rnPrepararPacienteRetorno_)
      .sort(rnOrdenarPorNome_);
  }

  if (!idAlvo) {
    throw new Error(
      'Não foi possível determinar o profissional para a consulta.'
    );
  }

  var idsAssociados =
    rnObterIdsPacientesAssociados_(
      idAlvo
    );

  var mapaAssociados = {};

  idsAssociados.forEach(
    function(idPaciente) {
      mapaAssociados[
        rnChave_(idPaciente)
      ] =
        true;
    }
  );

  var permitidos =
    pacientes.filter(
      function(paciente) {
        var idPaciente =
          rnValorPorAlias_(
            paciente,
            RN_CONFIG.CABECALHOS.PACIENTES.ID_PACIENTE
          );

        var responsavel =
          rnValorPorAlias_(
            paciente,
            RN_CONFIG.CABECALHOS.PACIENTES
              .ID_PROFISSIONAL_RESPONSAVEL
          );

        return (
          rnChave_(responsavel) ===
          rnChave_(idAlvo)
        ) || Boolean(
          mapaAssociados[
            rnChave_(idPaciente)
          ]
        );
      }
    );

  return permitidos
    .map(rnPrepararPacienteRetorno_)
    .sort(rnOrdenarPorNome_);
}


/**
 * Verifica se um profissional pode acessar determinado paciente.
 *
 * @param {string} idProfissional
 * @param {string} idPaciente
 * @return {boolean}
 */
function rnProfissionalPodeAcessarPaciente(
  idProfissional,
  idPaciente
) {
  var profissional =
    rnTexto_(idProfissional);

  var paciente =
    rnTexto_(idPaciente);

  if (
    !profissional ||
    !paciente
  ) {
    return false;
  }

  var registroPaciente =
    rnBuscarPacientePorId_(
      paciente
    );

  if (
    !registroPaciente ||
    !rnRegistroAtivo_(
      registroPaciente,
      RN_CONFIG.CABECALHOS.PACIENTES.ATIVO
    )
  ) {
    return false;
  }

  var responsavel =
    rnValorPorAlias_(
      registroPaciente,
      RN_CONFIG.CABECALHOS.PACIENTES
        .ID_PROFISSIONAL_RESPONSAVEL
    );

  if (
    rnChave_(responsavel) ===
    rnChave_(profissional)
  ) {
    return true;
  }

  var associados =
    rnObterIdsPacientesAssociados_(
      profissional
    );

  return associados.some(
    function(idAssociado) {
      return (
        rnChave_(idAssociado) ===
        rnChave_(paciente)
      );
    }
  );
}


/**
 * Valida o acesso do usuário atual a um paciente.
 *
 * Administrativos sempre podem acessar.
 *
 * @param {string} idPaciente
 * @return {Object}
 */
function rnValidarAcessoAoPaciente(
  idPaciente
) {
  var contexto =
    rnObterContextoUsuarioAtual();

  var paciente =
    rnBuscarPacientePorId_(
      idPaciente
    );

  if (!paciente) {
    throw new Error(
      'Paciente não encontrado.'
    );
  }

  if (contexto.administrativo) {
    return paciente;
  }

  if (
    !contexto.idProfissional ||
    !rnProfissionalPodeAcessarPaciente(
      contexto.idProfissional,
      idPaciente
    )
  ) {
    throw new Error(
      'O usuário conectado não possui acesso a este paciente.'
    );
  }

  return paciente;
}


/* ============================================================
 * CONVÊNIOS
 * ============================================================
 */

/**
 * Retorna todos os convênios ativos.
 *
 * @return {Object[]}
 */
function rnObterConveniosAtivos() {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.CONVENIOS
    )
  ) {
    return [];
  }

  var convenios =
    dbLerRegistros(
      DB_CONFIG.ABAS.CONVENIOS,
      {
        incluirNumeroLinha:
          true
      }
    );

  return convenios
    .filter(
      function(convenio) {
        return rnRegistroAtivo_(
          convenio,
          RN_CONFIG.CABECALHOS.CONVENIOS.ATIVO
        );
      }
    )
    .map(
      function(convenio) {
        return {
          idConvenio:
            rnTexto_(
              rnValorPorAlias_(
                convenio,
                RN_CONFIG.CABECALHOS.CONVENIOS.ID_CONVENIO
              )
            ),

          nomeConvenio:
            rnTexto_(
              rnValorPorAlias_(
                convenio,
                RN_CONFIG.CABECALHOS.CONVENIOS.NOME
              )
            ),

          registro:
            convenio
        };
      }
    )
    .sort(rnOrdenarPorNomeConvenio_);
}


/**
 * Retorna o convênio padrão informado no cadastro do paciente.
 *
 * @param {string} idPaciente
 * @return {Object|null}
 */
function rnObterConvenioDoPaciente(
  idPaciente
) {
  var paciente =
    rnValidarAcessoAoPaciente(
      idPaciente
    );

  var tipoAtendimento =
    rnTexto_(
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.TIPO_ATENDIMENTO
      )
    ).toUpperCase();

  var idConvenio =
    rnTexto_(
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.ID_CONVENIO
      )
    );

  var nomeConvenioCadastro =
    rnTexto_(
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.NOME_CONVENIO
      )
    );

  if (
    tipoAtendimento ===
      RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR ||
    !idConvenio
  ) {
    return {
      tipoAtendimento:
        tipoAtendimento ||
        RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR,

      idConvenio:
        '',

      nomeConvenio:
        '',

      numeroCarteirinha:
        '',

      validadeCarteirinha:
        '',

      paciente:
        paciente,

      convenio:
        null
    };
  }

  var convenio =
    rnBuscarConvenioPorId_(
      idConvenio
    );

  return {
    tipoAtendimento:
      RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO,

    idConvenio:
      idConvenio,

    nomeConvenio:
      convenio
        ? rnTexto_(
            rnValorPorAlias_(
              convenio,
              RN_CONFIG.CABECALHOS.CONVENIOS.NOME
            )
          )
        : nomeConvenioCadastro,

    numeroCarteirinha:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.NUMERO_CARTEIRINHA
        )
      ),

    validadeCarteirinha:
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.VALIDADE_CARTEIRINHA
      ),

    paciente:
      paciente,

    convenio:
      convenio
  };
}


/* ============================================================
 * PROCEDIMENTOS
 * ============================================================
 */

/**
 * Retorna procedimentos permitidos para um profissional.
 *
 * PARTICULAR:
 * - utiliza a habilitação do profissional;
 * - não exige PROCEDIMENTOS_CONVENIOS.
 *
 * CONVENIO:
 * - exige habilitação do profissional;
 * - exige vínculo ativo entre procedimento e convênio.
 *
 * @param {string} idProfissional
 * @param {string=} idConvenio
 * @param {string=} tipoAtendimento
 * @return {Object[]}
 */
function rnObterProcedimentosPermitidos(
  idProfissional,
  idConvenio,
  tipoAtendimento
) {
  var contexto =
    rnObterContextoUsuarioAtual();

  var profissional =
    rnTexto_(
      idProfissional ||
      contexto.idProfissional
    );

  if (!profissional) {
    throw new Error(
      'Informe o profissional para consultar os procedimentos.'
    );
  }

  if (
    !contexto.administrativo &&
    profissional !== contexto.idProfissional
  ) {
    throw new Error(
      'O usuário conectado não pode consultar procedimentos de outro profissional.'
    );
  }

  var tipo =
    rnTexto_(tipoAtendimento)
      .toUpperCase();

  var convenio =
    rnTexto_(idConvenio);

  if (!tipo) {
    tipo =
      convenio
        ? RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO
        : RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR;
  }

  if (
    tipo === RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO &&
    !convenio
  ) {
    throw new Error(
      'Informe o convênio para listar procedimentos conveniados.'
    );
  }

  var procedimentos =
    rnObterProcedimentosAtivos_();

  var idsHabilitados =
    rnObterIdsProcedimentosHabilitados_(
      profissional,
      convenio,
      tipo
    );

  var mapaHabilitados = {};

  idsHabilitados.forEach(
    function(idProcedimento) {
      mapaHabilitados[
        rnChave_(idProcedimento)
      ] =
        true;
    }
  );

  if (
    tipo ===
    RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR
  ) {
    return procedimentos
      .filter(
        function(procedimento) {
          var idProcedimento =
            rnValorPorAlias_(
              procedimento,
              RN_CONFIG.CABECALHOS.PROCEDIMENTOS.ID_PROCEDIMENTO
            );

          return Boolean(
            mapaHabilitados[
              rnChave_(idProcedimento)
            ]
          );
        }
      )
      .map(
        function(procedimento) {
          return rnPrepararProcedimentoRetorno_(
            procedimento,
            null
          );
        }
      )
      .sort(rnOrdenarPorNomeProcedimento_);
  }

  var regrasConvenio =
    rnObterRegrasProcedimentosConvenio_(
      convenio
    );

  var mapaConvenio = {};

  regrasConvenio.forEach(
    function(regra) {
      var idProcedimento =
        rnValorPorAlias_(
          regra,
          RN_CONFIG.CABECALHOS
            .PROCEDIMENTOS_CONVENIOS
            .ID_PROCEDIMENTO
        );

      mapaConvenio[
        rnChave_(idProcedimento)
      ] =
        regra;
    }
  );

  return procedimentos
    .filter(
      function(procedimento) {
        var idProcedimento =
          rnValorPorAlias_(
            procedimento,
            RN_CONFIG.CABECALHOS.PROCEDIMENTOS.ID_PROCEDIMENTO
          );

        var chave =
          rnChave_(
            idProcedimento
          );

        return Boolean(
          mapaHabilitados[chave] &&
          mapaConvenio[chave]
        );
      }
    )
    .map(
      function(procedimento) {
        var idProcedimento =
          rnValorPorAlias_(
            procedimento,
            RN_CONFIG.CABECALHOS.PROCEDIMENTOS.ID_PROCEDIMENTO
          );

        return rnPrepararProcedimentoRetorno_(
          procedimento,
          mapaConvenio[
            rnChave_(idProcedimento)
          ]
        );
      }
    )
    .sort(rnOrdenarPorNomeProcedimento_);
}


/**
 * Verifica se um procedimento está permitido.
 *
 * @param {string} idProfissional
 * @param {string} idProcedimento
 * @param {string=} idConvenio
 * @param {string=} tipoAtendimento
 * @return {boolean}
 */
function rnProcedimentoPermitido(
  idProfissional,
  idProcedimento,
  idConvenio,
  tipoAtendimento
) {
  var permitidos =
    rnObterProcedimentosPermitidos(
      idProfissional,
      idConvenio,
      tipoAtendimento
    );

  return permitidos.some(
    function(procedimento) {
      return (
        rnChave_(
          procedimento.idProcedimento
        ) ===
        rnChave_(
          idProcedimento
        )
      );
    }
  );
}


/* ============================================================
 * VALIDAÇÃO DE ATENDIMENTO
 * ============================================================
 */

/**
 * Valida uma seleção antes da criação de protocolo ou guia.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnValidarAtendimento(dados) {
  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    throw new Error(
      'Informe os dados do atendimento.'
    );
  }

  var contexto =
    rnObterContextoUsuarioAtual();

  var idProfissional =
    rnTexto_(
      dados.idProfissional ||
      contexto.idProfissional
    );

  var idPaciente =
    rnTexto_(
      dados.idPaciente
    );

  var tipoAtendimento =
    rnTexto_(
      dados.tipoAtendimento
    ).toUpperCase();

  var idConvenio =
    rnTexto_(
      dados.idConvenio
    );

  var idProcedimento =
    rnTexto_(
      dados.idProcedimento
    );

  var erros = [];
  var avisos = [];

  if (!idProfissional) {
    erros.push(
      'Profissional não informado.'
    );
  }

  if (!idPaciente) {
    erros.push(
      'Paciente não informado.'
    );
  }

  if (!tipoAtendimento) {
    erros.push(
      'Tipo de atendimento não informado.'
    );
  }

  if (
    tipoAtendimento &&
    tipoAtendimento !==
      RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO &&
    tipoAtendimento !==
      RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR
  ) {
    erros.push(
      'Tipo de atendimento inválido.'
    );
  }

  if (
    tipoAtendimento ===
      RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO &&
    !idConvenio
  ) {
    erros.push(
      'Convênio não informado.'
    );
  }

  if (!idProcedimento) {
    erros.push(
      'Procedimento não informado.'
    );
  }

  if (
    idPaciente &&
    idProfissional &&
    !rnProfissionalPodeAcessarPaciente(
      idProfissional,
      idPaciente
    ) &&
    !contexto.administrativo
  ) {
    erros.push(
      'O profissional não possui acesso ao paciente.'
    );
  }

  if (
    idProfissional &&
    idProcedimento &&
    tipoAtendimento &&
    (
      tipoAtendimento ===
        RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR ||
      idConvenio
    )
  ) {
    var permitido =
      rnProcedimentoPermitido(
        idProfissional,
        idProcedimento,
        idConvenio,
        tipoAtendimento
      );

    if (!permitido) {
      erros.push(
        'O procedimento não está habilitado para o profissional e para a modalidade escolhida.'
      );
    }
  }

  if (
    tipoAtendimento ===
      RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO &&
    idPaciente
  ) {
    var paciente =
      rnBuscarPacientePorId_(
        idPaciente
      );

    if (paciente) {
      var carteirinha =
        rnTexto_(
          rnValorPorAlias_(
            paciente,
            RN_CONFIG.CABECALHOS.PACIENTES.NUMERO_CARTEIRINHA
          )
        );

      if (!carteirinha) {
        avisos.push(
          'O paciente não possui número de carteirinha cadastrado.'
        );
      }
    }
  }

  return {
    valido:
      erros.length === 0,

    erros:
      erros,

    avisos:
      avisos,

    dadosNormalizados: {
      idProfissional:
        idProfissional,

      idPaciente:
        idPaciente,

      tipoAtendimento:
        tipoAtendimento,

      idConvenio:
        idConvenio,

      idProcedimento:
        idProcedimento
    }
  };
}


/**
 * Valida e lança erro quando o atendimento não for permitido.
 *
 * @param {Object} dados
 * @return {Object}
 */
function rnExigirAtendimentoValido(
  dados
) {
  var resultado =
    rnValidarAtendimento(
      dados
    );

  if (!resultado.valido) {
    throw new Error(
      resultado.erros.join(
        ' '
      )
    );
  }

  return resultado;
}


/* ============================================================
 * FUNÇÕES INTERNAS: CONSULTAS
 * ============================================================
 */

function rnBuscarUsuarioPorEmail_(
  email
) {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.USUARIOS
    )
  ) {
    throw new Error(
      'A aba USUARIOS não foi encontrada.'
    );
  }

  var usuarios =
    dbLerRegistros(
      DB_CONFIG.ABAS.USUARIOS,
      {
        incluirNumeroLinha:
          true
      }
    );

  var emailComparacao =
    rnChave_(email);

  for (
    var indice = 0;
    indice < usuarios.length;
    indice++
  ) {
    var emailUsuario =
      rnValorPorAlias_(
        usuarios[indice],
        RN_CONFIG.CABECALHOS.USUARIOS.EMAIL
      );

    if (
      rnChave_(emailUsuario) ===
      emailComparacao
    ) {
      return usuarios[indice];
    }
  }

  return null;
}


function rnBuscarProfissionalPorId_(
  idProfissional
) {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.PROFISSIONAIS
    )
  ) {
    return null;
  }

  return rnBuscarRegistroPorId_(
    DB_CONFIG.ABAS.PROFISSIONAIS,
    RN_CONFIG.CABECALHOS.PROFISSIONAIS.ID_PROFISSIONAL,
    idProfissional
  );
}


function rnBuscarPacientePorId_(
  idPaciente
) {
  return rnBuscarRegistroPorId_(
    DB_CONFIG.ABAS.PACIENTES,
    RN_CONFIG.CABECALHOS.PACIENTES.ID_PACIENTE,
    idPaciente
  );
}


function rnBuscarConvenioPorId_(
  idConvenio
) {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.CONVENIOS
    )
  ) {
    return null;
  }

  return rnBuscarRegistroPorId_(
    DB_CONFIG.ABAS.CONVENIOS,
    RN_CONFIG.CABECALHOS.CONVENIOS.ID_CONVENIO,
    idConvenio
  );
}


function rnBuscarRegistroPorId_(
  nomeAba,
  aliasesId,
  valorId
) {
  var registros =
    dbLerRegistros(
      nomeAba,
      {
        incluirNumeroLinha:
          true
      }
    );

  var chaveBusca =
    rnChave_(valorId);

  for (
    var indice = 0;
    indice < registros.length;
    indice++
  ) {
    var valorRegistro =
      rnValorPorAlias_(
        registros[indice],
        aliasesId
      );

    if (
      rnChave_(valorRegistro) ===
      chaveBusca
    ) {
      return registros[indice];
    }
  }

  return null;
}


function rnObterIdsPacientesAssociados_(
  idProfissional
) {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.ASSOCIACOES
    )
  ) {
    return [];
  }

  var associacoes =
    dbLerRegistros(
      DB_CONFIG.ABAS.ASSOCIACOES
    );

  return associacoes
    .filter(
      function(associacao) {
        var profissional =
          rnValorPorAlias_(
            associacao,
            RN_CONFIG.CABECALHOS.ASSOCIACOES.ID_PROFISSIONAL
          );

        return (
          rnChave_(profissional) ===
          rnChave_(idProfissional)
        ) &&
        rnRegistroAtivo_(
          associacao,
          RN_CONFIG.CABECALHOS.ASSOCIACOES.ATIVO
        );
      }
    )
    .map(
      function(associacao) {
        return rnTexto_(
          rnValorPorAlias_(
            associacao,
            RN_CONFIG.CABECALHOS.ASSOCIACOES.ID_PACIENTE
          )
        );
      }
    )
    .filter(Boolean);
}


function rnObterProcedimentosAtivos_() {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.PROCEDIMENTOS
    )
  ) {
    return [];
  }

  return dbLerRegistros(
    DB_CONFIG.ABAS.PROCEDIMENTOS,
    {
      incluirNumeroLinha:
        true
    }
  ).filter(
    function(procedimento) {
      return rnRegistroAtivo_(
        procedimento,
        RN_CONFIG.CABECALHOS.PROCEDIMENTOS.ATIVO
      );
    }
  );
}


function rnObterIdsProcedimentosHabilitados_(
  idProfissional,
  idConvenio,
  tipoAtendimento
) {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.HABILITACAO_PROFISSIONAIS
    )
  ) {
    return [];
  }

  var habilitacoes =
    dbLerRegistros(
      DB_CONFIG.ABAS.HABILITACAO_PROFISSIONAIS
    );

  return habilitacoes
    .filter(
      function(habilitacao) {
        var profissional =
          rnValorPorAlias_(
            habilitacao,
            RN_CONFIG.CABECALHOS.HABILITACOES.ID_PROFISSIONAL
          );

        if (
          rnChave_(profissional) !==
          rnChave_(idProfissional)
        ) {
          return false;
        }

        if (
          !rnRegistroAtivo_(
            habilitacao,
            RN_CONFIG.CABECALHOS.HABILITACOES.ATIVO
          )
        ) {
          return false;
        }

        var convenioHabilitacao =
          rnTexto_(
            rnValorPorAlias_(
              habilitacao,
              RN_CONFIG.CABECALHOS.HABILITACOES.ID_CONVENIO
            )
          );

        if (
          tipoAtendimento ===
          RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR
        ) {
          return (
            !convenioHabilitacao ||
            rnChave_(convenioHabilitacao) ===
            'PARTICULAR'
          );
        }

        if (!convenioHabilitacao) {
          return true;
        }

        return (
          rnChave_(convenioHabilitacao) ===
          rnChave_(idConvenio)
        );
      }
    )
    .map(
      function(habilitacao) {
        return rnTexto_(
          rnValorPorAlias_(
            habilitacao,
            RN_CONFIG.CABECALHOS.HABILITACOES.ID_PROCEDIMENTO
          )
        );
      }
    )
    .filter(Boolean);
}


function rnObterRegrasProcedimentosConvenio_(
  idConvenio
) {
  if (
    !dbAbaExiste(
      DB_CONFIG.ABAS.PROCEDIMENTOS_CONVENIOS
    )
  ) {
    return [];
  }

  return dbLerRegistros(
    DB_CONFIG.ABAS.PROCEDIMENTOS_CONVENIOS
  ).filter(
    function(regra) {
      var convenio =
        rnValorPorAlias_(
          regra,
          RN_CONFIG.CABECALHOS
            .PROCEDIMENTOS_CONVENIOS
            .ID_CONVENIO
        );

      return (
        rnChave_(convenio) ===
        rnChave_(idConvenio)
      ) &&
      rnRegistroAtivo_(
        regra,
        RN_CONFIG.CABECALHOS
          .PROCEDIMENTOS_CONVENIOS
          .ATIVO
      );
    }
  );
}


/* ============================================================
 * FUNÇÕES INTERNAS: RETORNOS
 * ============================================================
 */

function rnPrepararPacienteRetorno_(
  paciente
) {
  var nomeCompleto =
    rnTexto_(
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.NOME_COMPLETO
      )
    );

  var nomeSocial =
    rnTexto_(
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.NOME_SOCIAL
      )
    );

  return {
    idPaciente:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.ID_PACIENTE
        )
      ),

    nomeCompleto:
      nomeCompleto,

    nomeSocial:
      nomeSocial,

    nomeExibicao:
      nomeSocial ||
      nomeCompleto,

    cpf:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.CPF
        )
      ),

    telefone:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.TELEFONE
        )
      ),

    email:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.EMAIL
        )
      ),

    tipoAtendimentoPadrao:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.TIPO_ATENDIMENTO
        )
      ).toUpperCase(),

    idConvenio:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.ID_CONVENIO
        )
      ),

    nomeConvenio:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.NOME_CONVENIO
        )
      ),

    numeroCarteirinha:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES.NUMERO_CARTEIRINHA
        )
      ),

    validadeCarteirinha:
      rnValorPorAlias_(
        paciente,
        RN_CONFIG.CABECALHOS.PACIENTES.VALIDADE_CARTEIRINHA
      ),

    idProfissionalResponsavel:
      rnTexto_(
        rnValorPorAlias_(
          paciente,
          RN_CONFIG.CABECALHOS.PACIENTES
            .ID_PROFISSIONAL_RESPONSAVEL
        )
      )
  };
}


function rnPrepararProcedimentoRetorno_(
  procedimento,
  regraConvenio
) {
  return {
    idProcedimento:
      rnTexto_(
        rnValorPorAlias_(
          procedimento,
          RN_CONFIG.CABECALHOS.PROCEDIMENTOS.ID_PROCEDIMENTO
        )
      ),

    codigo:
      rnTexto_(
        rnValorPorAlias_(
          procedimento,
          RN_CONFIG.CABECALHOS.PROCEDIMENTOS.CODIGO
        )
      ),

    nomeProcedimento:
      rnTexto_(
        rnValorPorAlias_(
          procedimento,
          RN_CONFIG.CABECALHOS.PROCEDIMENTOS.NOME
        )
      ),

    valorParticular:
      rnValorPorAlias_(
        procedimento,
        RN_CONFIG.CABECALHOS.PROCEDIMENTOS.VALOR_PARTICULAR
      ),

    codigoConvenio:
      regraConvenio
        ? rnTexto_(
            rnValorPorAlias_(
              regraConvenio,
              RN_CONFIG.CABECALHOS
                .PROCEDIMENTOS_CONVENIOS
                .CODIGO_CONVENIO
            )
          )
        : '',

    valorConvenio:
      regraConvenio
        ? rnValorPorAlias_(
            regraConvenio,
            RN_CONFIG.CABECALHOS
              .PROCEDIMENTOS_CONVENIOS
              .VALOR
          )
        : '',

    modalidade:
      regraConvenio
        ? RN_CONFIG.TIPO_ATENDIMENTO.CONVENIO
        : RN_CONFIG.TIPO_ATENDIMENTO.PARTICULAR
  };
}


/* ============================================================
 * FUNÇÕES INTERNAS: UTILITÁRIOS
 * ============================================================
 */

function rnObterEmailUsuarioAtual_() {
  var email = '';

  try {
    email =
      Session
        .getActiveUser()
        .getEmail();
  } catch (erro) {
    email = '';
  }

  if (!email) {
    try {
      email =
        Session
          .getEffectiveUser()
          .getEmail();
    } catch (erroEfetivo) {
      email = '';
    }
  }

  return rnTexto_(email)
    .toLowerCase();
}


function rnValorPorAlias_(
  registro,
  aliases
) {
  if (
    !registro ||
    !aliases ||
    !aliases.length
  ) {
    return '';
  }

  for (
    var indice = 0;
    indice < aliases.length;
    indice++
  ) {
    var chave =
      rnNormalizarCabecalho_(
        aliases[indice]
      );

    if (
      Object.prototype
        .hasOwnProperty.call(
          registro,
          chave
        )
    ) {
      return registro[chave];
    }
  }

  return '';
}


function rnRegistroAtivo_(
  registro,
  aliasesAtivo
) {
  var valor =
    rnValorPorAlias_(
      registro,
      aliasesAtivo
    );

  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return true;
  }

  var normalizado =
    rnTexto_(valor)
      .toUpperCase();

  if (
    RN_CONFIG.VALORES_INATIVOS
      .indexOf(normalizado) !== -1
  ) {
    return false;
  }

  if (
    RN_CONFIG.VALORES_ATIVOS
      .indexOf(normalizado) !== -1
  ) {
    return true;
  }

  return true;
}


function rnPerfilAdministrativo_(
  perfil
) {
  var normalizado =
    rnTexto_(perfil)
      .toUpperCase();

  return (
    RN_CONFIG.PERFIS_ADMINISTRATIVOS
      .indexOf(normalizado) !== -1
  );
}


function rnNormalizarCabecalho_(
  valor
) {
  return rnTexto_(valor)
    .toUpperCase()
    .replace(
      /\s+/g,
      '_'
    );
}


function rnTexto_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor)
    .trim();
}


function rnChave_(valor) {
  return rnTexto_(valor)
    .toUpperCase();
}


function rnOrdenarPorNome_(
  a,
  b
) {
  return rnTexto_(
    a.nomeExibicao
  ).localeCompare(
    rnTexto_(
      b.nomeExibicao
    ),
    'pt-BR'
  );
}


function rnOrdenarPorNomeConvenio_(
  a,
  b
) {
  return rnTexto_(
    a.nomeConvenio
  ).localeCompare(
    rnTexto_(
      b.nomeConvenio
    ),
    'pt-BR'
  );
}


function rnOrdenarPorNomeProcedimento_(
  a,
  b
) {
  return rnTexto_(
    a.nomeProcedimento
  ).localeCompare(
    rnTexto_(
      b.nomeProcedimento
    ),
    'pt-BR'
  );
}


/* ============================================================
 * TESTES
 * ============================================================
 */

/**
 * Testa a identificação do usuário conectado.
 *
 * Não grava dados.
 *
 * @return {Object}
 */
function testarRegrasNegocioUsuario() {
  var resultado =
    rnObterContextoUsuarioAtual();

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
 * Testa a listagem de pacientes permitidos.
 *
 * Não grava dados.
 *
 * @return {Object}
 */
function testarRegrasNegocioPacientes() {
  var contexto =
    rnObterContextoUsuarioAtual();

  var pacientes =
    rnObterPacientesDoProfissional();

  var resultado = {
    sucesso:
      true,

    email:
      contexto.email,

    perfil:
      contexto.perfil,

    idProfissional:
      contexto.idProfissional,

    administrativo:
      contexto.administrativo,

    quantidadePacientes:
      pacientes.length,

    pacientes:
      pacientes
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
 * Diagnóstico geral das abas utilizadas pelo motor de regras.
 *
 * Não grava dados.
 *
 * @return {Object}
 */
function diagnosticarRegrasNegocio() {
  var nomesAbas = [
    DB_CONFIG.ABAS.USUARIOS,
    DB_CONFIG.ABAS.PROFISSIONAIS,
    DB_CONFIG.ABAS.PACIENTES,
    DB_CONFIG.ABAS.ASSOCIACOES,
    DB_CONFIG.ABAS.CONVENIOS,
    DB_CONFIG.ABAS.PROCEDIMENTOS,
    DB_CONFIG.ABAS.HABILITACAO_PROFISSIONAIS,
    DB_CONFIG.ABAS.PROCEDIMENTOS_CONVENIOS
  ];

  var resultado = {
    sucesso:
      true,

    abas: []
  };

  nomesAbas.forEach(
    function(nomeAba) {
      var existe =
        dbAbaExiste(
          nomeAba
        );

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

      if (!existe) {
        resultado.sucesso =
          false;
      }
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