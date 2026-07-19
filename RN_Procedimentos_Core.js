/**
 * ============================================================
 * ÁRYA SAÚDE
 * PROCEDIMENTOS — NÚCLEO
 * ARQUIVO: RN_Procedimentos_Core.gs
 * ============================================================
 *
 * Responsabilidades:
 * - leitura da aba PROCEDIMENTOS;
 * - listagens gerais;
 * - consultas individuais;
 * - coordenação das habilitações;
 * - coordenação dos vínculos com convênios;
 * - validação das seleções;
 * - preparação dos objetos de retorno.
 *
 * Funções internas usam o prefixo:
 * rnrCore
 */


/* ============================================================
 * CONFIGURAÇÃO
 * ============================================================
 */

var ARYA_RN_PROCEDIMENTOS_CONFIG = {
  VERSAO:
    '2.0.0',

  SOMENTE_ATIVOS_POR_PADRAO:
    true,

  EXIGIR_HABILITACAO_PROFISSIONAL:
    true,

  EXIGIR_VINCULO_COM_CONVENIO:
    true,

  ACEITAR_HABILITACAO_GERAL_SEM_CONVENIO:
    true,

  EXIGIR_VIGENCIA_HABILITACAO:
    true,

  EXIGIR_VIGENCIA_CONVENIO:
    true
};


/* ============================================================
 * LISTAGEM GERAL
 * ============================================================
 */

function rnrCoreListar_(filtros) {
  rnrCoreExigirDependencias_();

  rnUsuariosObterContextoAtual();

  var configuracao =
    filtros || {};

  var procedimentos =
    rnrCoreLerProcedimentos_();

  if (
    configuracao.incluirInativos !== true &&
    ARYA_RN_PROCEDIMENTOS_CONFIG
      .SOMENTE_ATIVOS_POR_PADRAO
  ) {
    procedimentos =
      procedimentos.filter(
        function(procedimento) {
          return rnrCoreProcedimentoAtivo_(
            procedimento
          );
        }
      );
  }

  procedimentos =
    rnrCoreAplicarFiltros_(
      procedimentos,
      configuracao
    );

  return procedimentos
    .map(
      function(procedimento) {
        return rnrCorePrepararRetorno_(
          procedimento,
          null,
          null,
          ''
        );
      }
    )
    .sort(
      rnrCoreOrdenarPorNome_
    );
}


function rnrCoreListarAtivos_() {
  return rnrCoreListar_({
    incluirInativos:
      false
  });
}


function rnrCoreListarOpcoesGerais_() {
  return rnrCoreListarAtivos_()
    .map(
      function(procedimento) {
        return {
          idProcedimento:
            procedimento.idProcedimento,

          codigo:
            procedimento.codigo,

          nomeProcedimento:
            procedimento.nomeProcedimento,

          nomeExibicao:
            procedimento.nomeExibicao
        };
      }
    );
}


/* ============================================================
 * CONSULTA INDIVIDUAL
 * ============================================================
 */

function rnrCoreBuscarPorIdPublico_(
  idProcedimento
) {
  rnrCoreExigirDependencias_();

  rnUsuariosObterContextoAtual();

  var idNormalizado =
    rncNormalizarId_(
      idProcedimento
    );

  if (!idNormalizado) {
    throw new Error(
      'Informe o ID do procedimento.'
    );
  }

  var procedimento =
    rnrCoreBuscarRegistroPorId_(
      idNormalizado
    );

  return procedimento
    ? rnrCorePrepararRetorno_(
        procedimento,
        null,
        null,
        ''
      )
    : null;
}


function rnrCoreExigirExistente_(
  idProcedimento
) {
  var procedimento =
    rnrCoreBuscarPorIdPublico_(
      idProcedimento
    );

  if (!procedimento) {
    throw new Error(
      'Procedimento não encontrado.'
    );
  }

  return procedimento;
}


function rnrCoreExigirAtivo_(
  idProcedimento
) {
  var procedimento =
    rnrCoreExigirExistente_(
      idProcedimento
    );

  if (!procedimento.ativo) {
    throw new Error(
      'O procedimento selecionado está inativo.'
    );
  }

  return procedimento;
}


/* ============================================================
 * PROCEDIMENTOS DO PROFISSIONAL
 * ============================================================
 */

function rnrCoreListarDoProfissionalAtual_(
  filtros
) {
  var contexto =
    rnUsuariosExigirProfissionalVinculado();

  return rnrCoreListarDoProfissional_(
    contexto.idProfissional,
    filtros
  );
}


function rnrCoreListarDoProfissional_(
  idProfissional,
  filtros
) {
  rnrCoreExigirDependencias_();

  var contexto =
    rnUsuariosObterContextoAtual();

  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  if (!profissionalNormalizado) {
    throw new Error(
      'Informe o ID do profissional.'
    );
  }

  if (
    !contexto.administrativo &&
    rncChave_(contexto.idProfissional) !==
      rncChave_(profissionalNormalizado)
  ) {
    throw new Error(
      'O usuário conectado não pode consultar procedimentos de outro profissional.'
    );
  }

  var configuracao =
    filtros || {};

  var tipoAtendimento =
    rncNormalizarTipoAtendimento_(
      configuracao.tipoAtendimento
    );

  var idConvenio =
    rncNormalizarId_(
      configuracao.idConvenio
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  if (
    tipoAtendimento ===
      tipoConvenio &&
    !idConvenio
  ) {
    throw new Error(
      'Informe o convênio para listar procedimentos conveniados.'
    );
  }

  if (
    tipoAtendimento ===
      tipoConvenio
  ) {
    rnConveniosExigirAtivo(
      idConvenio
    );
  }

  var procedimentos =
    rnrCoreLerProcedimentos_();

  if (
    configuracao.incluirInativos !== true
  ) {
    procedimentos =
      procedimentos.filter(
        function(procedimento) {
          return rnrCoreProcedimentoAtivo_(
            procedimento
          );
        }
      );
  }

  procedimentos =
    rnrCoreAplicarFiltros_(
      procedimentos,
      configuracao
    );

  var habilitacoes =
    rnrHabilitacoesObterDoProfissional_(
      profissionalNormalizado,
      tipoAtendimento,
      idConvenio
    );

  var mapaHabilitacoes =
    rnrHabilitacoesCriarMapa_(
      habilitacoes
    );

  var mapaConvenios = {};

  if (
    tipoAtendimento ===
      tipoConvenio
  ) {
    var vinculos =
      rnrConveniosObterVinculosValidos_(
        idConvenio
      );

    mapaConvenios =
      rnrConveniosCriarMapaVinculos_(
        vinculos
      );
  }

  var retorno = [];

  procedimentos.forEach(
    function(procedimento) {
      var idProcedimento =
        rnrCoreObterIdProcedimento_(
          procedimento
        );

      var chave =
        rncChave_(
          idProcedimento
        );

      var habilitacao =
        mapaHabilitacoes[
          chave
        ] || null;

      if (
        ARYA_RN_PROCEDIMENTOS_CONFIG
          .EXIGIR_HABILITACAO_PROFISSIONAL &&
        !habilitacao
      ) {
        return;
      }

      var vinculoConvenio =
        null;

      if (
        tipoAtendimento ===
          tipoConvenio
      ) {
        vinculoConvenio =
          mapaConvenios[
            chave
          ] || null;

        if (
          ARYA_RN_PROCEDIMENTOS_CONFIG
            .EXIGIR_VINCULO_COM_CONVENIO &&
          !vinculoConvenio
        ) {
          return;
        }
      }

      retorno.push(
        rnrCorePrepararRetorno_(
          procedimento,
          habilitacao,
          vinculoConvenio,
          tipoAtendimento ||
            tipoParticular
        )
      );
    }
  );

  return retorno.sort(
    rnrCoreOrdenarPorNome_
  );
}


/* ============================================================
 * PARTICULAR
 * ============================================================
 */

function rnrCoreListarParticularesAtual_() {
  return rnrCoreListarDoProfissionalAtual_({
    tipoAtendimento:
      ARYA_RN_CONFIG
        .TIPO_ATENDIMENTO
        .PARTICULAR
  });
}


function rnrCoreListarParticulares_(
  idProfissional
) {
  return rnrCoreListarDoProfissional_(
    idProfissional,
    {
      tipoAtendimento:
        ARYA_RN_CONFIG
          .TIPO_ATENDIMENTO
          .PARTICULAR
    }
  );
}


/* ============================================================
 * CONVÊNIO
 * ============================================================
 */

function rnrCoreListarConvenioAtual_(
  idConvenio
) {
  var contexto =
    rnUsuariosExigirProfissionalVinculado();

  return rnrCoreListarConvenio_(
    contexto.idProfissional,
    idConvenio
  );
}


function rnrCoreListarConvenio_(
  idProfissional,
  idConvenio
) {
  return rnrCoreListarDoProfissional_(
    idProfissional,
    {
      tipoAtendimento:
        ARYA_RN_CONFIG
          .TIPO_ATENDIMENTO
          .CONVENIO,

      idConvenio:
        idConvenio
    }
  );
}


function rnrCoreListarOpcoesAtual_(
  tipoAtendimento,
  idConvenio
) {
  var tipo =
    rncNormalizarTipoAtendimento_(
      tipoAtendimento
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  var procedimentos;

  if (
    tipo ===
    tipoParticular
  ) {
    procedimentos =
      rnrCoreListarParticularesAtual_();
  } else if (
    tipo ===
    tipoConvenio
  ) {
    procedimentos =
      rnrCoreListarConvenioAtual_(
        idConvenio
      );
  } else {
    throw new Error(
      'Tipo de atendimento inválido.'
    );
  }

  return procedimentos.map(
    function(procedimento) {
      return {
        idProcedimento:
          procedimento.idProcedimento,

        codigo:
          procedimento.codigoAplicavel ||
          procedimento.codigo,

        nomeProcedimento:
          procedimento.nomeProcedimento,

        nomeExibicao:
          procedimento.nomeExibicao,

        valor:
          procedimento.valorAplicavel,

        modalidade:
          procedimento.modalidade
      };
    }
  );
}


/* ============================================================
 * VALIDAÇÕES
 * ============================================================
 */

function rnrCoreEstaPermitido_(
  idProfissional,
  idProcedimento,
  tipoAtendimento,
  idConvenio
) {
  var profissionalNormalizado =
    rncNormalizarId_(
      idProfissional
    );

  var procedimentoNormalizado =
    rncNormalizarId_(
      idProcedimento
    );

  var tipo =
    rncNormalizarTipoAtendimento_(
      tipoAtendimento
    );

  if (
    !profissionalNormalizado ||
    !procedimentoNormalizado ||
    !tipo
  ) {
    return false;
  }

  var procedimentos =
    rnrCoreListarDoProfissional_(
      profissionalNormalizado,
      {
        tipoAtendimento:
          tipo,

        idConvenio:
          idConvenio || ''
      }
    );

  return procedimentos.some(
    function(procedimento) {
      return (
        rncChave_(
          procedimento.idProcedimento
        ) ===
        rncChave_(
          procedimentoNormalizado
        )
      );
    }
  );
}


function rnrCoreExigirPermitido_(
  idProfissional,
  idProcedimento,
  tipoAtendimento,
  idConvenio
) {
  var procedimentos =
    rnrCoreListarDoProfissional_(
      idProfissional,
      {
        tipoAtendimento:
          tipoAtendimento,

        idConvenio:
          idConvenio || ''
      }
    );

  var encontrado =
    procedimentos.find(
      function(procedimento) {
        return (
          rncChave_(
            procedimento.idProcedimento
          ) ===
          rncChave_(
            idProcedimento
          )
        );
      }
    );

  if (!encontrado) {
    throw new Error(
      'O procedimento selecionado não está permitido para o profissional e para a modalidade informada.'
    );
  }

  return encontrado;
}


function rnrCoreValidarSelecao_(
  dados
) {
  if (
    !dados ||
    typeof dados !== 'object'
  ) {
    throw new Error(
      'Informe os dados da seleção.'
    );
  }

  var contexto =
    rnUsuariosObterContextoAtual();

  var idProfissional =
    rncNormalizarId_(
      dados.idProfissional ||
      contexto.idProfissional
    );

  var idProcedimento =
    rncNormalizarId_(
      dados.idProcedimento
    );

  var tipoAtendimento =
    rncNormalizarTipoAtendimento_(
      dados.tipoAtendimento
    );

  var idConvenio =
    rncNormalizarId_(
      dados.idConvenio
    );

  var tipoParticular =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  var erros = [];
  var avisos = [];
  var procedimento = null;

  if (!idProfissional) {
    erros.push(
      'Profissional não informado.'
    );
  }

  if (!idProcedimento) {
    erros.push(
      'Procedimento não informado.'
    );
  }

  if (
    tipoAtendimento !==
      tipoParticular &&
    tipoAtendimento !==
      tipoConvenio
  ) {
    erros.push(
      'Tipo de atendimento inválido.'
    );
  }

  if (
    tipoAtendimento ===
      tipoConvenio &&
    !idConvenio
  ) {
    erros.push(
      'Convênio não informado.'
    );
  }

  if (!erros.length) {
    try {
      procedimento =
        rnrCoreExigirPermitido_(
          idProfissional,
          idProcedimento,
          tipoAtendimento,
          idConvenio
        );
    } catch (erroProcedimento) {
      erros.push(
        erroProcedimento.message
      );
    }
  }

  if (
    procedimento &&
    procedimento.valorAplicavel === null
  ) {
    avisos.push(
      'O procedimento não possui valor cadastrado para a modalidade selecionada.'
    );
  }

  return {
    valido:
      erros.length === 0,

    erros:
      erros,

    avisos:
      avisos,

    procedimento:
      procedimento,

    dadosNormalizados: {
      idProfissional:
        idProfissional,

      idProcedimento:
        idProcedimento,

      tipoAtendimento:
        tipoAtendimento,

      idConvenio:
        idConvenio
    }
  };
}


/* ============================================================
 * LEITURA INTERNA
 * ============================================================
 */

function rnrCoreLerProcedimentos_() {
  var nomeAba =
    rncNomeAba_(
      'PROCEDIMENTOS'
    );

  if (
    !dbAbaExiste(
      nomeAba
    )
  ) {
    throw new Error(
      'A aba PROCEDIMENTOS não foi encontrada.'
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


function rnrCoreBuscarRegistroPorId_(
  idProcedimento
) {
  var chaveBusca =
    rncChave_(
      idProcedimento
    );

  if (!chaveBusca) {
    return null;
  }

  var procedimentos =
    rnrCoreLerProcedimentos_();

  for (
    var indice = 0;
    indice < procedimentos.length;
    indice++
  ) {
    var idRegistro =
      rnrCoreObterIdProcedimento_(
        procedimentos[indice]
      );

    if (
      rncChave_(idRegistro) ===
      chaveBusca
    ) {
      return procedimentos[indice];
    }
  }

  return null;
}


/* ============================================================
 * FILTROS
 * ============================================================
 */

function rnrCoreAplicarFiltros_(
  procedimentos,
  filtros
) {
  var resultado =
    (
      procedimentos || []
    ).slice();

  if (filtros.nome) {
    var nomeFiltro =
      rncRemoverAcentos_(
        filtros.nome
      ).toUpperCase();

    resultado =
      resultado.filter(
        function(procedimento) {
          var nome =
            rncRemoverAcentos_(
              rnrCoreObterNomeProcedimento_(
                procedimento
              )
            ).toUpperCase();

          return (
            nome.indexOf(
              nomeFiltro
            ) !== -1
          );
        }
      );
  }

  if (filtros.codigo) {
    var codigoFiltro =
      rncChave_(
        filtros.codigo
      );

    resultado =
      resultado.filter(
        function(procedimento) {
          var codigo =
            rncValorPorAlias_(
              procedimento,
              rncAliases_(
                'PROCEDIMENTOS',
                'CODIGO'
              )
            );

          return (
            rncChave_(codigo) ===
            codigoFiltro
          );
        }
      );
  }

  return resultado;
}


/* ============================================================
 * DADOS DO PROCEDIMENTO
 * ============================================================
 */

function rnrCoreObterIdProcedimento_(
  procedimento
) {
  return rncNormalizarId_(
    rncValorPorAlias_(
      procedimento,
      rncAliases_(
        'PROCEDIMENTOS',
        'ID_PROCEDIMENTO'
      )
    )
  );
}


function rnrCoreObterNomeProcedimento_(
  procedimento
) {
  var nome =
    rncTexto_(
      rncValorPorAlias_(
        procedimento,
        rncAliases_(
          'PROCEDIMENTOS',
          'NOME'
        )
      )
    );

  var descricao =
    rncTexto_(
      rncValorPorAlias_(
        procedimento,
        rncAliases_(
          'PROCEDIMENTOS',
          'DESCRICAO'
        )
      )
    );

  return (
    nome ||
    descricao ||
    rnrCoreObterIdProcedimento_(
      procedimento
    )
  );
}


function rnrCoreProcedimentoAtivo_(
  procedimento
) {
  return rncRegistroAtivo_(
    procedimento,
    rncAliases_(
      'PROCEDIMENTOS',
      'ATIVO'
    ),
    true
  );
}


/* ============================================================
 * RETORNO
 * ============================================================
 */

function rnrCorePrepararRetorno_(
  procedimento,
  habilitacao,
  vinculoConvenio,
  tipoAtendimento
) {
  var idProcedimento =
    rnrCoreObterIdProcedimento_(
      procedimento
    );

  var codigo =
    rncTexto_(
      rncValorPorAlias_(
        procedimento,
        rncAliases_(
          'PROCEDIMENTOS',
          'CODIGO'
        )
      )
    );

  var nomeProcedimento =
    rnrCoreObterNomeProcedimento_(
      procedimento
    );

  var valorParticular =
    rncConverterNumero_(
      rncValorPorAlias_(
        procedimento,
        rncAliases_(
          'PROCEDIMENTOS',
          'VALOR_PARTICULAR'
        )
      )
    );

  var tipoConvenio =
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .CONVENIO;

  var modalidade =
    tipoAtendimento ||
    ARYA_RN_CONFIG
      .TIPO_ATENDIMENTO
      .PARTICULAR;

  var codigoConvenio =
    vinculoConvenio
      ? rnrConveniosObterCodigo_(
          vinculoConvenio
        )
      : '';

  var valorConvenio =
    vinculoConvenio
      ? rnrConveniosObterValor_(
          vinculoConvenio
        )
      : null;

  var codigoAplicavel =
    modalidade ===
      tipoConvenio
      ? (
          codigoConvenio ||
          codigo
        )
      : codigo;

  var valorAplicavel =
    modalidade ===
      tipoConvenio
      ? valorConvenio
      : valorParticular;

  return {
    idProcedimento:
      idProcedimento,

    codigo:
      codigo,

    nomeProcedimento:
      nomeProcedimento,

    nomeExibicao:
      codigoAplicavel
        ? codigoAplicavel +
          ' — ' +
          nomeProcedimento
        : nomeProcedimento,

    descricao:
      rncTexto_(
        rncValorPorAlias_(
          procedimento,
          rncAliases_(
            'PROCEDIMENTOS',
            'DESCRICAO'
          )
        )
      ),

    duracaoMinutos:
      rncConverterNumero_(
        rncValorPorAlias_(
          procedimento,
          rncAliases_(
            'PROCEDIMENTOS',
            'DURACAO_MINUTOS'
          )
        )
      ),

    valorParticular:
      valorParticular,

    codigoConvenio:
      codigoConvenio,

    valorConvenio:
      valorConvenio,

    codigoAplicavel:
      codigoAplicavel,

    valorAplicavel:
      valorAplicavel,

    modalidade:
      modalidade,

    habilitado:
      Boolean(
        habilitacao
      ),

    vinculadoAoConvenio:
      Boolean(
        vinculoConvenio
      ),

    quantidadeMaxima:
      vinculoConvenio
        ? rnrConveniosObterQuantidadeMaxima_(
            vinculoConvenio
          )
        : null,

    exigeAutorizacao:
      vinculoConvenio
        ? rnrConveniosExigeAutorizacao_(
            vinculoConvenio
          )
        : false,

    ativo:
      rnrCoreProcedimentoAtivo_(
        procedimento
      )
  };
}


function rnrCoreOrdenarPorNome_(
  procedimentoA,
  procedimentoB
) {
  return rncTexto_(
    procedimentoA.nomeProcedimento
  ).localeCompare(
    rncTexto_(
      procedimentoB.nomeProcedimento
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

function rnrCoreValidarDependencias_() {
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

    RNConvenios:
      typeof rnConveniosExigirAtivo ===
        'function',

    ProcedimentosHabilitacoes:
      typeof rnrHabilitacoesObterDoProfissional_ ===
        'function',

    ProcedimentosConvenios:
      typeof rnrConveniosObterVinculosValidos_ ===
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


function rnrCoreExigirDependencias_() {
  var resultado =
    rnrCoreValidarDependencias_();

  if (!resultado.valido) {
    throw new Error(
      'Dependências ausentes no módulo de procedimentos: ' +
      resultado.ausentes.join(', ') +
      '.'
    );
  }
}