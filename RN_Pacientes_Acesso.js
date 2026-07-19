/**
 * ============================================================
 * ÁRYA SAÚDE
 * PACIENTES — CONTROLE DE ACESSO
 * ARQUIVO: RN_Pacientes_Acesso.gs
 * ============================================================
 *
 * Responsabilidades:
 * - acesso pelo profissional responsável;
 * - acesso pela aba ASSOCIACOES;
 * - validação de associação ativa e vigente;
 * - origem do acesso.
 *
 * Funções internas usam o prefixo:
 * rnpAcesso
 */


/* ============================================================
 * API INTERNA DE ACESSO
 * ============================================================
 */

function rnpAcessoUsuarioAtualPodeAcessar_(
  idPaciente
) {
  var contexto =
    rnUsuariosObterContextoAtual();

  if (contexto.administrativo) {
    return Boolean(
      rnpCoreBuscarRegistroPorId_(
        idPaciente
      )
    );
  }

  if (!contexto.idProfissional) {
    return false;
  }

  return rnpAcessoProfissionalPodeAcessar_(
    contexto.idProfissional,
    idPaciente
  );
}


function rnpAcessoProfissionalPodeAcessarPublico_(
  idProfissional,
  idPaciente
) {
  var contexto =
    rnUsuariosObterContextoAtual();

  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  var pacienteNormalizado =
    rncNormalizarId_(
      idPaciente
    );

  if (
    !profissionalNormalizado ||
    !pacienteNormalizado
  ) {
    return false;
  }

  if (
    !contexto.administrativo &&
    rncChave_(contexto.idProfissional) !==
      rncChave_(profissionalNormalizado)
  ) {
    throw new Error(
      'O usuário conectado não pode verificar o acesso de outro profissional.'
    );
  }

  return rnpAcessoProfissionalPodeAcessar_(
    profissionalNormalizado,
    pacienteNormalizado
  );
}


function rnpAcessoObterOrigemPublica_(
  idProfissional,
  idPaciente
) {
  var contexto =
    rnUsuariosObterContextoAtual();

  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  var pacienteNormalizado =
    rncNormalizarId_(
      idPaciente
    );

  if (
    !profissionalNormalizado ||
    !pacienteNormalizado
  ) {
    return 'SEM_ACESSO';
  }

  if (
    !contexto.administrativo &&
    rncChave_(contexto.idProfissional) !==
      rncChave_(profissionalNormalizado)
  ) {
    throw new Error(
      'O usuário conectado não pode consultar o acesso de outro profissional.'
    );
  }

  return rnpAcessoObterOrigemInterna_(
    profissionalNormalizado,
    pacienteNormalizado
  );
}


/* ============================================================
 * VERIFICAÇÃO INTERNA
 * ============================================================
 */

function rnpAcessoProfissionalPodeAcessar_(
  idProfissional,
  idPaciente
) {
  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  var pacienteNormalizado =
    rncNormalizarId_(
      idPaciente
    );

  if (
    !profissionalNormalizado ||
    !pacienteNormalizado
  ) {
    return false;
  }

  var paciente =
    rnpCoreBuscarRegistroPorId_(
      pacienteNormalizado
    );

  if (
    !paciente ||
    !rnpCorePacienteAtivo_(
      paciente
    )
  ) {
    return false;
  }

  if (
    ARYA_RN_PACIENTES_CONFIG
      .CONSIDERAR_RESPONSAVEL_COMO_ACESSO &&
    rnpAcessoProfissionalEhResponsavel_(
      profissionalNormalizado,
      paciente
    )
  ) {
    return true;
  }

  if (
    ARYA_RN_PACIENTES_CONFIG
      .CONSIDERAR_ASSOCIACOES_COMO_ACESSO &&
    rnpAcessoExisteAssociacaoValida_(
      profissionalNormalizado,
      pacienteNormalizado
    )
  ) {
    return true;
  }

  return false;
}


function rnpAcessoObterOrigemInterna_(
  idProfissional,
  idPaciente
) {
  var paciente =
    rnpCoreBuscarRegistroPorId_(
      idPaciente
    );

  if (!paciente) {
    return 'SEM_ACESSO';
  }

  var responsavel =
    rnpAcessoProfissionalEhResponsavel_(
      idProfissional,
      paciente
    );

  var associacao =
    rnpAcessoExisteAssociacaoValida_(
      idProfissional,
      idPaciente
    );

  if (
    responsavel &&
    associacao
  ) {
    return 'RESPONSAVEL_E_ASSOCIACAO';
  }

  if (responsavel) {
    return 'RESPONSAVEL';
  }

  if (associacao) {
    return 'ASSOCIACAO';
  }

  return 'SEM_ACESSO';
}


/* ============================================================
 * MAPA DE ACESSOS
 * ============================================================
 */

function rnpAcessoCriarMapaPacientesPermitidos_(
  idProfissional
) {
  var mapa = {};

  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  if (!profissionalNormalizado) {
    return mapa;
  }

  var pacientes =
    rnpCoreLerPacientes_();

  if (
    ARYA_RN_PACIENTES_CONFIG
      .CONSIDERAR_RESPONSAVEL_COMO_ACESSO
  ) {
    pacientes.forEach(
      function(paciente) {
        if (
          !rnpAcessoProfissionalEhResponsavel_(
            profissionalNormalizado,
            paciente
          )
        ) {
          return;
        }

        var idPaciente =
          rnpCoreObterIdPaciente_(
            paciente
          );

        var chave =
          rncChave_(
            idPaciente
          );

        if (!chave) {
          return;
        }

        mapa[chave] = {
          idPaciente:
            idPaciente,

          responsavel:
            true,

          associacao:
            false
        };
      }
    );
  }

  if (
    ARYA_RN_PACIENTES_CONFIG
      .CONSIDERAR_ASSOCIACOES_COMO_ACESSO
  ) {
    var associacoes =
      rnpAcessoObterAssociacoesValidasDoProfissional_(
        profissionalNormalizado
      );

    associacoes.forEach(
      function(associacao) {
        var idPaciente =
          rncNormalizarId_(
            rncValorPorAlias_(
              associacao,
              rncAliases_(
                'ASSOCIACOES',
                'ID_PACIENTE'
              )
            )
          );

        var chave =
          rncChave_(
            idPaciente
          );

        if (!chave) {
          return;
        }

        if (!mapa[chave]) {
          mapa[chave] = {
            idPaciente:
              idPaciente,

            responsavel:
              false,

            associacao:
              true
          };

          return;
        }

        mapa[chave].associacao =
          true;
      }
    );
  }

  return mapa;
}


function rnpAcessoDeterminarOrigemPeloMapa_(
  idPaciente,
  mapaAcessos
) {
  if (!mapaAcessos) {
    return '';
  }

  var acesso =
    mapaAcessos[
      rncChave_(idPaciente)
    ];

  if (!acesso) {
    return 'SEM_ACESSO';
  }

  if (
    acesso.responsavel &&
    acesso.associacao
  ) {
    return 'RESPONSAVEL_E_ASSOCIACAO';
  }

  if (acesso.responsavel) {
    return 'RESPONSAVEL';
  }

  if (acesso.associacao) {
    return 'ASSOCIACAO';
  }

  return 'SEM_ACESSO';
}


/* ============================================================
 * RESPONSÁVEL
 * ============================================================
 */

function rnpAcessoProfissionalEhResponsavel_(
  idProfissional,
  paciente
) {
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

  return (
    Boolean(idResponsavel) &&
    rncChave_(idResponsavel) ===
      rncChave_(idProfissional)
  );
}


/* ============================================================
 * ASSOCIAÇÕES
 * ============================================================
 */

function rnpAcessoLerAssociacoes_() {
  var nomeAba =
    rncNomeAba_(
      'ASSOCIACOES'
    );

  if (
    !dbAbaExiste(
      nomeAba
    )
  ) {
    return [];
  }

  return dbLerRegistros(
    nomeAba,
    {
      incluirNumeroLinha:
        true
    }
  );
}


function rnpAcessoExisteAssociacaoValida_(
  idProfissional,
  idPaciente
) {
  var associacoes =
    rnpAcessoObterAssociacoesValidasDoProfissional_(
      idProfissional
    );

  return associacoes.some(
    function(associacao) {
      var pacienteAssociacao =
        rncValorPorAlias_(
          associacao,
          rncAliases_(
            'ASSOCIACOES',
            'ID_PACIENTE'
          )
        );

      return (
        rncChave_(pacienteAssociacao) ===
        rncChave_(idPaciente)
      );
    }
  );
}


function rnpAcessoObterAssociacoesValidasDoProfissional_(
  idProfissional
) {
  var associacoes =
    rnpAcessoLerAssociacoes_();

  return associacoes.filter(
    function(associacao) {
      var profissionalAssociacao =
        rncValorPorAlias_(
          associacao,
          rncAliases_(
            'ASSOCIACOES',
            'ID_PROFISSIONAL'
          )
        );

      if (
        rncChave_(
          profissionalAssociacao
        ) !==
        rncChave_(
          idProfissional
        )
      ) {
        return false;
      }

      if (
        ARYA_RN_PACIENTES_CONFIG
          .EXIGIR_ASSOCIACAO_ATIVA &&
        !rnpAcessoAssociacaoAtiva_(
          associacao
        )
      ) {
        return false;
      }

      if (
        ARYA_RN_PACIENTES_CONFIG
          .EXIGIR_ASSOCIACAO_VIGENTE &&
        !rnpAcessoAssociacaoVigente_(
          associacao
        )
      ) {
        return false;
      }

      return true;
    }
  );
}


function rnpAcessoAssociacaoAtiva_(
  associacao
) {
  return rncRegistroAtivo_(
    associacao,
    rncAliases_(
      'ASSOCIACOES',
      'ATIVO'
    ),
    true
  );
}


function rnpAcessoAssociacaoVigente_(
  associacao
) {
  var dataInicio =
    rncValorPorAlias_(
      associacao,
      rncAliases_(
        'ASSOCIACOES',
        'DATA_INICIO'
      )
    );

  var dataFim =
    rncValorPorAlias_(
      associacao,
      rncAliases_(
        'ASSOCIACOES',
        'DATA_FIM'
      )
    );

  return rncEstaVigente_(
    dataInicio,
    dataFim
  );
}
