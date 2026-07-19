/**
 * ============================================================
 * ÁRYA SAÚDE
 * PACIENTES — NÚCLEO
 * ARQUIVO: RN_Pacientes_Core.gs
 * ============================================================
 *
 * Responsabilidades:
 * - leitura da aba PACIENTES;
 * - consultas internas;
 * - preparação dos dados de retorno;
 * - coordenação entre acesso e filtros.
 *
 * Funções internas usam o prefixo:
 * rnpCore
 */


var ARYA_RN_PACIENTES_CONFIG = {
  VERSAO:
    '2.0.0',

  SOMENTE_PACIENTES_ATIVOS_POR_PADRAO:
    true,

  CONSIDERAR_RESPONSAVEL_COMO_ACESSO:
    true,

  CONSIDERAR_ASSOCIACOES_COMO_ACESSO:
    true,

  EXIGIR_ASSOCIACAO_ATIVA:
    true,

  EXIGIR_ASSOCIACAO_VIGENTE:
    true
};


/* ============================================================
 * LISTAGEM PRINCIPAL
 * ============================================================
 */

function rnpCoreListarAcessiveis_(filtros) {
  rnpCoreExigirDependencias_();

  var configuracao =
    filtros || {};

  var contexto =
    rnUsuariosObterContextoAtual();

  var pacientes =
    rnpCoreLerPacientes_();

  if (
    configuracao.incluirInativos !== true &&
    ARYA_RN_PACIENTES_CONFIG
      .SOMENTE_PACIENTES_ATIVOS_POR_PADRAO
  ) {
    pacientes =
      pacientes.filter(
        function(paciente) {
          return rnpCorePacienteAtivo_(
            paciente
          );
        }
      );
  }

  if (contexto.administrativo) {
    return rnpFiltrosAplicar_(
      pacientes,
      configuracao
    )
      .map(
        function(paciente) {
          return rnpCorePrepararRetorno_(
            paciente,
            contexto,
            null
          );
        }
      )
      .sort(
        rnpCoreOrdenarPorNome_
      );
  }

  if (!contexto.idProfissional) {
    throw new Error(
      'O usuário conectado não possui profissional vinculado.'
    );
  }

  var mapaAcessos =
    rnpAcessoCriarMapaPacientesPermitidos_(
      contexto.idProfissional
    );

  pacientes =
    pacientes.filter(
      function(paciente) {
        var idPaciente =
          rnpCoreObterIdPaciente_(
            paciente
          );

        return Boolean(
          mapaAcessos[
            rncChave_(idPaciente)
          ]
        );
      }
    );

  pacientes =
    rnpFiltrosAplicar_(
      pacientes,
      configuracao
    );

  return pacientes
    .map(
      function(paciente) {
        return rnpCorePrepararRetorno_(
          paciente,
          contexto,
          mapaAcessos
        );
      }
    )
    .sort(
      rnpCoreOrdenarPorNome_
    );
}


function rnpCoreListarPorProfissional_(
  idProfissional,
  filtros
) {
  rnpCoreExigirDependencias_();

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
      'O usuário conectado não pode consultar pacientes de outro profissional.'
    );
  }

  var configuracao =
    filtros || {};

  var pacientes =
    rnpCoreLerPacientes_();

  if (
    configuracao.incluirInativos !== true
  ) {
    pacientes =
      pacientes.filter(
        function(paciente) {
          return rnpCorePacienteAtivo_(
            paciente
          );
        }
      );
  }

  var mapaAcessos =
    rnpAcessoCriarMapaPacientesPermitidos_(
      idNormalizado
    );

  pacientes =
    pacientes.filter(
      function(paciente) {
        var idPaciente =
          rnpCoreObterIdPaciente_(
            paciente
          );

        return Boolean(
          mapaAcessos[
            rncChave_(idPaciente)
          ]
        );
      }
    );

  pacientes =
    rnpFiltrosAplicar_(
      pacientes,
      configuracao
    );

  return pacientes
    .map(
      function(paciente) {
        return rnpCorePrepararRetorno_(
          paciente,
          contexto,
          mapaAcessos
        );
      }
    )
    .sort(
      rnpCoreOrdenarPorNome_
    );
}


/* ============================================================
 * CONSULTAS
 * ============================================================
 */

function rnpCoreBuscarPorIdComAcesso_(
  idPaciente
) {
  rnpCoreExigirDependencias_();

  var idNormalizado =
    rncNormalizarId_(
      idPaciente
    );

  if (!idNormalizado) {
    throw new Error(
      'Informe o ID do paciente.'
    );
  }

  var paciente =
    rnpCoreBuscarRegistroPorId_(
      idNormalizado
    );

  if (!paciente) {
    return null;
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  if (
    !contexto.administrativo &&
    !rnpAcessoProfissionalPodeAcessar_(
      contexto.idProfissional,
      idNormalizado
    )
  ) {
    throw new Error(
      'O usuário conectado não possui acesso a este paciente.'
    );
  }

  return rnpCorePrepararRetorno_(
    paciente,
    contexto,
    null
  );
}


function rnpCoreBuscarPorCpfComAcesso_(
  cpf
) {
  rnpCoreExigirDependencias_();

  var cpfNormalizado =
    rncNormalizarCpf_(
      cpf
    );

  if (!cpfNormalizado) {
    throw new Error(
      'Informe o CPF do paciente.'
    );
  }

  var pacientes =
    rnpCoreLerPacientes_();

  var aliasesCpf =
    rncAliases_(
      'PACIENTES',
      'CPF'
    );

  var encontrado =
    null;

  for (
    var indice = 0;
    indice < pacientes.length;
    indice++
  ) {
    var cpfPaciente =
      rncNormalizarCpf_(
        rncValorPorAlias_(
          pacientes[indice],
          aliasesCpf
        )
      );

    if (
      cpfPaciente ===
      cpfNormalizado
    ) {
      encontrado =
        pacientes[indice];

      break;
    }
  }

  if (!encontrado) {
    return null;
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  var idPaciente =
    rnpCoreObterIdPaciente_(
      encontrado
    );

  if (
    !contexto.administrativo &&
    !rnpAcessoProfissionalPodeAcessar_(
      contexto.idProfissional,
      idPaciente
    )
  ) {
    return null;
  }

  return rnpCorePrepararRetorno_(
    encontrado,
    contexto,
    null
  );
}


function rnpCoreExigirAcesso_(
  idPaciente
) {
  var paciente =
    rnpCoreBuscarPorIdComAcesso_(
      idPaciente
    );

  if (!paciente) {
    throw new Error(
      'Paciente não encontrado.'
    );
  }

  return paciente;
}


/* ============================================================
 * INTERFACE
 * ============================================================
 */

function rnpCoreListarOpcoes_(filtros) {
  var pacientes =
    rnpCoreListarAcessiveis_(
      filtros
    );

  return pacientes.map(
    function(paciente) {
      return {
        idPaciente:
          paciente.idPaciente,

        nome:
          paciente.nomeExibicao,

        tipoAtendimentoPadrao:
          paciente.tipoAtendimentoPadrao,

        idConvenio:
          paciente.idConvenio,

        nomeConvenio:
          paciente.nomeConvenio
      };
    }
  );
}


function rnpCoreObterDadosPadraoAtendimento_(
  idPaciente
) {
  var paciente =
    rnpCoreExigirAcesso_(
      idPaciente
    );

  return {
    idPaciente:
      paciente.idPaciente,

    nomeExibicao:
      paciente.nomeExibicao,

    tipoAtendimentoPadrao:
      paciente.tipoAtendimentoPadrao,

    idConvenio:
      paciente.idConvenio,

    nomeConvenio:
      paciente.nomeConvenio,

    numeroCarteirinha:
      paciente.numeroCarteirinha,

    validadeCarteirinha:
      paciente.validadeCarteirinha,

    nomeTitular:
      paciente.nomeTitular,

    cpfTitular:
      paciente.cpfTitular
  };
}


/* ============================================================
 * LEITURA INTERNA
 * ============================================================
 */

function rnpCoreLerPacientes_() {
  var nomeAba =
    rncNomeAba_(
      'PACIENTES'
    );

  if (
    !dbAbaExiste(
      nomeAba
    )
  ) {
    throw new Error(
      'A aba PACIENTES não foi encontrada.'
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


function rnpCoreBuscarRegistroPorId_(
  idPaciente
) {
  var chaveBusca =
    rncChave_(
      idPaciente
    );

  if (!chaveBusca) {
    return null;
  }

  var pacientes =
    rnpCoreLerPacientes_();

  for (
    var indice = 0;
    indice < pacientes.length;
    indice++
  ) {
    var idRegistro =
      rnpCoreObterIdPaciente_(
        pacientes[indice]
      );

    if (
      rncChave_(idRegistro) ===
      chaveBusca
    ) {
      return pacientes[indice];
    }
  }

  return null;
}


/* ============================================================
 * DADOS DO PACIENTE
 * ============================================================
 */

function rnpCoreObterIdPaciente_(
  paciente
) {
  return rncNormalizarId_(
    rncValorPorAlias_(
      paciente,
      rncAliases_(
        'PACIENTES',
        'ID_PACIENTE'
      )
    )
  );
}


function rnpCoreObterNomeExibicao_(
  paciente
) {
  var nomeSocial =
    rncTexto_(
      rncValorPorAlias_(
        paciente,
        rncAliases_(
          'PACIENTES',
          'NOME_SOCIAL'
        )
      )
    );

  var nomeCompleto =
    rncTexto_(
      rncValorPorAlias_(
        paciente,
        rncAliases_(
          'PACIENTES',
          'NOME_COMPLETO'
        )
      )
    );

  return (
    nomeSocial ||
    nomeCompleto ||
    rnpCoreObterIdPaciente_(
      paciente
    )
  );
}


function rnpCorePacienteAtivo_(
  paciente
) {
  return rncRegistroAtivo_(
    paciente,
    rncAliases_(
      'PACIENTES',
      'ATIVO'
    ),
    true
  );
}


/* ============================================================
 * PREPARAÇÃO DO RETORNO
 * ============================================================
 */

function rnpCorePrepararRetorno_(
  paciente,
  contexto,
  mapaAcessos
) {
  var idPaciente =
    rnpCoreObterIdPaciente_(
      paciente
    );

  var idResponsavel =
    rncNormalizarId_(
      rncValorPorAlias_(
        paciente,
        rncAliases_(
          'PACIENTES',
          'ID_PROFISSIONAL_RESPONSAVEL'
        )
      )
    );

  var origemAcesso = '';

  if (
    contexto &&
    contexto.administrativo
  ) {
    origemAcesso =
      'ADMINISTRATIVO';
  } else if (mapaAcessos) {
    origemAcesso =
      rnpAcessoDeterminarOrigemPeloMapa_(
        idPaciente,
        mapaAcessos
      );
  } else if (
    contexto &&
    contexto.idProfissional
  ) {
    origemAcesso =
      rnpAcessoObterOrigemInterna_(
        contexto.idProfissional,
        idPaciente
      );
  }

  return {
    idPaciente:
      idPaciente,

    nomeCompleto:
      rncTexto_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'NOME_COMPLETO'
          )
        )
      ),

    nomeSocial:
      rncTexto_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'NOME_SOCIAL'
          )
        )
      ),

    nomeExibicao:
      rnpCoreObterNomeExibicao_(
        paciente
      ),

    cpf:
      rncNormalizarCpf_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'CPF'
          )
        )
      ),

    dataNascimento:
      rncFormatarData_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'DATA_NASCIMENTO'
          )
        )
      ),

    telefone:
      rncTexto_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'TELEFONE'
          )
        )
      ),

    email:
      rncNormalizarEmail_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'EMAIL'
          )
        )
      ),

    tipoAtendimentoPadrao:
      rncNormalizarTipoAtendimento_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'TIPO_ATENDIMENTO_PADRAO'
          )
        )
      ),

    idConvenio:
      rncNormalizarId_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'ID_CONVENIO'
          )
        )
      ),

    nomeConvenio:
      rncTexto_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'NOME_CONVENIO'
          )
        )
      ),

    numeroCarteirinha:
      rncTexto_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'NUMERO_CARTEIRINHA'
          )
        )
      ),

    validadeCarteirinha:
      rncFormatarData_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'VALIDADE_CARTEIRINHA'
          )
        )
      ),

    nomeTitular:
      rncTexto_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'NOME_TITULAR'
          )
        )
      ),

    cpfTitular:
      rncNormalizarCpf_(
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'CPF_TITULAR'
          )
        )
      ),

    idProfissionalResponsavel:
      idResponsavel,

    ativo:
      rnpCorePacienteAtivo_(
        paciente
      ),

    origemAcesso:
      origemAcesso
  };
}


function rnpCoreOrdenarPorNome_(
  pacienteA,
  pacienteB
) {
  return rncTexto_(
    pacienteA.nomeExibicao
  ).localeCompare(
    rncTexto_(
      pacienteB.nomeExibicao
    ),
    'pt-BR',
    {
      sensitivity:
        'base'
    }
  );
}


/* ============================================================
 * DEPENDÊNCIAS
 * ============================================================
 */

function rnpCoreValidarDependencias_() {
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
        'function',

    RNUsuarios:
      typeof rnUsuariosObterContextoAtual ===
        'function',

    PacientesAcesso:
      typeof rnpAcessoCriarMapaPacientesPermitidos_ ===
        'function',

    PacientesFiltros:
      typeof rnpFiltrosAplicar_ ===
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

    ausentes:
      ausentes,

    dependencias:
      dependencias
  };
}


function rnpCoreExigirDependencias_() {
  var resultado =
    rnpCoreValidarDependencias_();

  if (!resultado.valido) {
    throw new Error(
      'Dependências ausentes no módulo de pacientes: ' +
      resultado.ausentes.join(', ') +
      '.'
    );
  }
}