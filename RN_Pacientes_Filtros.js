/**
 * ============================================================
 * ÁRYA SAÚDE
 * PACIENTES — FILTROS
 * ARQUIVO: RN_Pacientes_Filtros.gs
 * ============================================================
 *
 * Responsabilidades:
 * - aplicar filtros de busca;
 * - manter a lógica de filtragem isolada do núcleo;
 * - facilitar inclusão de novos filtros.
 *
 * Funções internas usam o prefixo:
 * rnpFiltros
 */


/**
 * Filtros aceitos:
 *
 * {
 *   nome: "",
 *   cpf: "",
 *   idConvenio: "",
 *   tipoAtendimento: "",
 *   idProfissionalResponsavel: "",
 *   incluirInativos: false
 * }
 *
 * @param {Object[]} pacientes
 * @param {Object=} filtros
 * @return {Object[]}
 */
function rnpFiltrosAplicar_(
  pacientes,
  filtros
) {
  var configuracao =
    filtros || {};

  var resultado =
    (
      pacientes || []
    ).slice();

  resultado =
    rnpFiltrosPorNome_(
      resultado,
      configuracao.nome
    );

  resultado =
    rnpFiltrosPorCpf_(
      resultado,
      configuracao.cpf
    );

  resultado =
    rnpFiltrosPorConvenio_(
      resultado,
      configuracao.idConvenio
    );

  resultado =
    rnpFiltrosPorTipoAtendimento_(
      resultado,
      configuracao.tipoAtendimento
    );

  resultado =
    rnpFiltrosPorResponsavel_(
      resultado,
      configuracao
        .idProfissionalResponsavel
    );

  return resultado;
}


function rnpFiltrosPorNome_(
  pacientes,
  nome
) {
  if (!nome) {
    return pacientes;
  }

  var filtro =
    rncRemoverAcentos_(
      nome
    ).toUpperCase();

  return pacientes.filter(
    function(paciente) {
      var nomeCompleto =
        rncRemoverAcentos_(
          rncValorPorAlias_(
            paciente,
            rncAliases_(
              'PACIENTES',
              'NOME_COMPLETO'
            )
          )
        ).toUpperCase();

      var nomeSocial =
        rncRemoverAcentos_(
          rncValorPorAlias_(
            paciente,
            rncAliases_(
              'PACIENTES',
              'NOME_SOCIAL'
            )
          )
        ).toUpperCase();

      return (
        nomeCompleto.indexOf(
          filtro
        ) !== -1 ||
        nomeSocial.indexOf(
          filtro
        ) !== -1
      );
    }
  );
}


function rnpFiltrosPorCpf_(
  pacientes,
  cpf
) {
  if (!cpf) {
    return pacientes;
  }

  var filtro =
    rncNormalizarCpf_(
      cpf
    );

  return pacientes.filter(
    function(paciente) {
      var cpfPaciente =
        rncNormalizarCpf_(
          rncValorPorAlias_(
            paciente,
            rncAliases_(
              'PACIENTES',
              'CPF'
            )
          )
        );

      return (
        cpfPaciente ===
        filtro
      );
    }
  );
}


function rnpFiltrosPorConvenio_(
  pacientes,
  idConvenio
) {
  if (!idConvenio) {
    return pacientes;
  }

  var filtro =
    rncChave_(
      idConvenio
    );

  return pacientes.filter(
    function(paciente) {
      var convenioPaciente =
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'ID_CONVENIO'
          )
        );

      return (
        rncChave_(
          convenioPaciente
        ) ===
        filtro
      );
    }
  );
}


function rnpFiltrosPorTipoAtendimento_(
  pacientes,
  tipoAtendimento
) {
  if (!tipoAtendimento) {
    return pacientes;
  }

  var filtro =
    rncNormalizarTipoAtendimento_(
      tipoAtendimento
    );

  return pacientes.filter(
    function(paciente) {
      var tipoPaciente =
        rncNormalizarTipoAtendimento_(
          rncValorPorAlias_(
            paciente,
            rncAliases_(
              'PACIENTES',
              'TIPO_ATENDIMENTO_PADRAO'
            )
          )
        );

      return (
        tipoPaciente ===
        filtro
      );
    }
  );
}


function rnpFiltrosPorResponsavel_(
  pacientes,
  idProfissionalResponsavel
) {
  if (!idProfissionalResponsavel) {
    return pacientes;
  }

  var filtro =
    rncChave_(
      idProfissionalResponsavel
    );

  return pacientes.filter(
    function(paciente) {
      var responsavelPaciente =
        rncValorPorAlias_(
          paciente,
          rncAliases_(
            'PACIENTES',
            'ID_PROFISSIONAL_RESPONSAVEL'
          )
        );

      return (
        rncChave_(
          responsavelPaciente
        ) ===
        filtro
      );
    }
  );
}