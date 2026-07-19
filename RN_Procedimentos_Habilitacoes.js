/**
 * ============================================================
 * ÁRYA SAÚDE
 * PROCEDIMENTOS — HABILITAÇÕES PROFISSIONAIS
 * ARQUIVO: RN_Procedimentos_Habilitacoes.gs
 * ============================================================
 *
 * Responsabilidades:
 * - leitura da aba HABILITACAO_PROFISSIONAIS;
 * - validação de habilitações;
 * - modalidade particular ou convênio;
 * - vigência e status;
 * - criação de mapa por procedimento.
 *
 * Funções internas usam o prefixo:
 * rnrHabilitacoes
 */


/* ============================================================
 * LEITURA
 * ============================================================
 */

function rnrHabilitacoesLer_() {
  var nomeAba =
    rncNomeAba_(
      'HABILITACAO_PROFISSIONAIS'
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


/* ============================================================
 * CONSULTA
 * ============================================================
 */

function rnrHabilitacoesObterDoProfissional_(
  idProfissional,
  tipoAtendimento,
  idConvenio
) {
  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  if (!profissionalNormalizado) {
    return [];
  }

  var tipo =
    rncNormalizarTipoAtendimento_(
      tipoAtendimento
    );

  var convenioNormalizado =
    rncNormalizarId_(
      idConvenio
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  return rnrHabilitacoesLer_()
    .filter(
      function(habilitacao) {
        var profissionalRegistro =
          rncNormalizarId_(
            rncValorPorAlias_(
              habilitacao,
              rncAliases_(
                'HABILITACAO_PROFISSIONAIS',
                'ID_PROFISSIONAL'
              )
            )
          );

        if (
          rncChave_(
            profissionalRegistro
          ) !==
          rncChave_(
            profissionalNormalizado
          )
        ) {
          return false;
        }

        if (
          !rnrHabilitacoesAtiva_(
            habilitacao
          )
        ) {
          return false;
        }

        if (
          ARYA_RN_PROCEDIMENTOS_CONFIG
            .EXIGIR_VIGENCIA_HABILITACAO &&
          !rnrHabilitacoesVigente_(
            habilitacao
          )
        ) {
          return false;
        }

        if (!tipo) {
          return true;
        }

        var tipoRegistro =
          rncNormalizarTipoAtendimento_(
            rncValorPorAlias_(
              habilitacao,
              rncAliases_(
                'HABILITACAO_PROFISSIONAIS',
                'TIPO_ATENDIMENTO'
              )
            )
          );

        var convenioRegistro =
          rncNormalizarId_(
            rncValorPorAlias_(
              habilitacao,
              rncAliases_(
                'HABILITACAO_PROFISSIONAIS',
                'ID_CONVENIO'
              )
            )
          );

        if (
          tipo ===
          tipoParticular
        ) {
          if (
            tipoRegistro &&
            tipoRegistro !==
              tipoParticular
          ) {
            return false;
          }

          return (
            !convenioRegistro ||
            rncChave_(
              convenioRegistro
            ) ===
              'PARTICULAR'
          );
        }

        if (
          tipo ===
          tipoConvenio
        ) {
          if (
            tipoRegistro &&
            tipoRegistro !==
              tipoConvenio
          ) {
            return false;
          }

          if (
            !convenioRegistro &&
            ARYA_RN_PROCEDIMENTOS_CONFIG
              .ACEITAR_HABILITACAO_GERAL_SEM_CONVENIO
          ) {
            return true;
          }

          return (
            rncChave_(
              convenioRegistro
            ) ===
            rncChave_(
              convenioNormalizado
            )
          );
        }

        return true;
      }
    );
}


/* ============================================================
 * MAPA
 * ============================================================
 */

function rnrHabilitacoesCriarMapa_(
  habilitacoes
) {
  var mapa = {};

  (
    habilitacoes || []
  ).forEach(
    function(habilitacao) {
      var idProcedimento =
        rncNormalizarId_(
          rncValorPorAlias_(
            habilitacao,
            rncAliases_(
              'HABILITACAO_PROFISSIONAIS',
              'ID_PROCEDIMENTO'
            )
          )
        );

      var chave =
        rncChave_(
          idProcedimento
        );

      if (!chave) {
        return;
      }

      mapa[chave] =
        habilitacao;
    }
  );

  return mapa;
}


/* ============================================================
 * STATUS E VIGÊNCIA
 * ============================================================
 */

function rnrHabilitacoesAtiva_(
  habilitacao
) {
  return rncRegistroAtivo_(
    habilitacao,
    rncAliases_(
      'HABILITACAO_PROFISSIONAIS',
      'ATIVO'
    ),
    true
  );
}


function rnrHabilitacoesVigente_(
  habilitacao
) {
  var dataInicio =
    rncValorPorAlias_(
      habilitacao,
      rncAliases_(
        'HABILITACAO_PROFISSIONAIS',
        'DATA_INICIO'
      )
    );

  var dataFim =
    rncValorPorAlias_(
      habilitacao,
      rncAliases_(
        'HABILITACAO_PROFISSIONAIS',
        'DATA_FIM'
      )
    );

  return rncEstaVigente_(
    dataInicio,
    dataFim
  );
}