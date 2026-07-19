/**
 * ============================================================
 * ÁRYA SAÚDE
 * PROCEDIMENTOS — VÍNCULOS COM CONVÊNIOS
 * ARQUIVO: RN_Procedimentos_Convenios.gs
 * ============================================================
 *
 * Responsabilidades:
 * - leitura da aba PROCEDIMENTOS_CONVENIOS;
 * - vínculos entre convênios e procedimentos;
 * - vigência e status;
 * - código e valor do procedimento no convênio;
 * - criação de mapa por procedimento.
 *
 * Funções internas usam o prefixo:
 * rnrConvenios
 */


/* ============================================================
 * LEITURA
 * ============================================================
 */

function rnrConveniosLerVinculos_() {
  var nomeAba =
    rncNomeAba_(
      'PROCEDIMENTOS_CONVENIOS'
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

function rnrConveniosObterVinculosValidos_(
  idConvenio
) {
  var convenioNormalizado =
    rncNormalizarId_(
      idConvenio
    );

  if (!convenioNormalizado) {
    return [];
  }

  return rnrConveniosLerVinculos_()
    .filter(
      function(vinculo) {
        var convenioRegistro =
          rncNormalizarId_(
            rncValorPorAlias_(
              vinculo,
              rncAliases_(
                'PROCEDIMENTOS_CONVENIOS',
                'ID_CONVENIO'
              )
            )
          );

        if (
          rncChave_(
            convenioRegistro
          ) !==
          rncChave_(
            convenioNormalizado
          )
        ) {
          return false;
        }

        if (
          !rnrConveniosVinculoAtivo_(
            vinculo
          )
        ) {
          return false;
        }

        if (
          ARYA_RN_PROCEDIMENTOS_CONFIG
            .EXIGIR_VIGENCIA_CONVENIO &&
          !rnrConveniosVinculoVigente_(
            vinculo
          )
        ) {
          return false;
        }

        return true;
      }
    );
}


/* ============================================================
 * MAPA
 * ============================================================
 */

function rnrConveniosCriarMapaVinculos_(
  vinculos
) {
  var mapa = {};

  (
    vinculos || []
  ).forEach(
    function(vinculo) {
      var idProcedimento =
        rncNormalizarId_(
          rncValorPorAlias_(
            vinculo,
            rncAliases_(
              'PROCEDIMENTOS_CONVENIOS',
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
        vinculo;
    }
  );

  return mapa;
}


/* ============================================================
 * STATUS E VIGÊNCIA
 * ============================================================
 */

function rnrConveniosVinculoAtivo_(
  vinculo
) {
  return rncRegistroAtivo_(
    vinculo,
    rncAliases_(
      'PROCEDIMENTOS_CONVENIOS',
      'ATIVO'
    ),
    true
  );
}


function rnrConveniosVinculoVigente_(
  vinculo
) {
  var dataInicio =
    rncValorPorAlias_(
      vinculo,
      rncAliases_(
        'PROCEDIMENTOS_CONVENIOS',
        'DATA_INICIO'
      )
    );

  var dataFim =
    rncValorPorAlias_(
      vinculo,
      rncAliases_(
        'PROCEDIMENTOS_CONVENIOS',
        'DATA_FIM'
      )
    );

  return rncEstaVigente_(
    dataInicio,
    dataFim
  );
}


/* ============================================================
 * DADOS DO VÍNCULO
 * ============================================================
 */

function rnrConveniosObterCodigo_(
  vinculo
) {
  return rncTexto_(
    rncValorPorAlias_(
      vinculo,
      rncAliases_(
        'PROCEDIMENTOS_CONVENIOS',
        'CODIGO_CONVENIO'
      )
    )
  );
}


function rnrConveniosObterValor_(
  vinculo
) {
  return rncConverterNumero_(
    rncValorPorAlias_(
      vinculo,
      rncAliases_(
        'PROCEDIMENTOS_CONVENIOS',
        'VALOR'
      )
    )
  );
}


function rnrConveniosObterQuantidadeMaxima_(
  vinculo
) {
  return rncConverterNumero_(
    rncValorPorAlias_(
      vinculo,
      rncAliases_(
        'PROCEDIMENTOS_CONVENIOS',
        'QUANTIDADE_MAXIMA'
      )
    )
  );
}


function rnrConveniosExigeAutorizacao_(
  vinculo
) {
  return rncValorAtivo_(
    rncValorPorAlias_(
      vinculo,
      rncAliases_(
        'PROCEDIMENTOS_CONVENIOS',
        'EXIGE_AUTORIZACAO'
      )
    ),
    false
  );
}