/**
 * ============================================================
 * ÁRYA SAÚDE — RN_Envios.gs
 * ============================================================
 *
 * Responsável pelo ciclo de vida dos envios de protocolos:
 *
 * - instalação das planilhas necessárias;
 * - criação e numeração automática dos envios;
 * - salvamento de rascunhos;
 * - alteração de status;
 * - submissão;
 * - abertura para correção;
 * - ressubmissão;
 * - cancelamento;
 * - aprovação;
 * - faturamento;
 * - armazenamento de referências do PDF;
 * - histórico imutável das operações.
 *
 * Um ENVIO pode conter vários itens:
 *
 * - itens de convênio;
 * - itens particulares;
 * - ou os dois tipos simultaneamente.
 *
 * Os itens serão administrados pelo arquivo RN_Protocolos.gs.
 */


/**
 * ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

const RN_ENVIOS_CONFIG = Object.freeze({
  VERSAO_MODULO: '1.0.0',

  PROPRIEDADE_DATABASE_ID: 'ARYA_DATABASE_ID',

  PLANILHA_ENVIOS: 'PROTOCOLOS_ENVIOS',
  PLANILHA_CONTADORES: 'PROTOCOLOS_CONTADORES',
  PLANILHA_HISTORICO: 'PROTOCOLOS_HISTORICO',

  PREFIXO_NUMERO: 'ENV',

  CONTADOR_ENVIO: 'ENVIO',

  TIMEZONE: 'America/Sao_Paulo',

  LOCK_TIMEOUT_MS: 30000
});


/**
 * ============================================================
 * STATUS OFICIAIS
 * ============================================================
 */

const RN_ENVIOS_STATUS = Object.freeze({
  RASCUNHO: 'RASCUNHO',
  ENVIADO: 'ENVIADO',
  EM_ANALISE: 'EM_ANALISE',
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  APROVADO_COM_RESSALVAS: 'APROVADO_COM_RESSALVAS',
  REJEITADO: 'REJEITADO',
  FATURADO: 'FATURADO',
  CANCELADO: 'CANCELADO'
});


/**
 * ============================================================
 * EVENTOS DO HISTÓRICO
 * ============================================================
 */

const RN_ENVIOS_EVENTOS = Object.freeze({
  ENVIO_CRIADO: 'ENVIO_CRIADO',
  RASCUNHO_SALVO: 'RASCUNHO_SALVO',
  ENVIO_ATUALIZADO: 'ENVIO_ATUALIZADO',
  ENVIO_SUBMETIDO: 'ENVIO_SUBMETIDO',
  ENVIO_EM_ANALISE: 'ENVIO_EM_ANALISE',
  PENDENCIA_REGISTRADA: 'PENDENCIA_REGISTRADA',
  ENVIO_REABERTO: 'ENVIO_REABERTO',
  ENVIO_RESSUBMETIDO: 'ENVIO_RESSUBMETIDO',
  ENVIO_APROVADO: 'ENVIO_APROVADO',
  ENVIO_APROVADO_COM_RESSALVAS: 'ENVIO_APROVADO_COM_RESSALVAS',
  ENVIO_REJEITADO: 'ENVIO_REJEITADO',
  ENVIO_FATURADO: 'ENVIO_FATURADO',
  ENVIO_CANCELADO: 'ENVIO_CANCELADO',
  PDF_VINCULADO: 'PDF_VINCULADO',
  QUANTIDADE_ITENS_ATUALIZADA: 'QUANTIDADE_ITENS_ATUALIZADA'
});


/**
 * ============================================================
 * CABEÇALHOS DAS PLANILHAS
 * ============================================================
 */

const RN_ENVIOS_COLUNAS = Object.freeze([
  'ID',
  'NUMERO',
  'VERSAO',
  'STATUS',

  'PROFISSIONAL_ID',
  'PROFISSIONAL_NOME',
  'PROFISSIONAL_EMAIL',

  'TIPO_CONTEUDO',
  'QUANTIDADE_ITENS',

  'OBSERVACOES',
  'MOTIVO_STATUS_JSON',

  'PDF_ID',
  'PDF_URL',

  'DATA_CRIACAO',
  'DATA_ATUALIZACAO',
  'DATA_ENVIO',
  'DATA_ULTIMA_RESSUBMISSAO',
  'DATA_FINALIZACAO',

  'CRIADO_POR',
  'ATUALIZADO_POR',

  'ATIVO',
  'METADADOS_JSON'
]);


const RN_ENVIOS_CONTADORES_COLUNAS = Object.freeze([
  'CHAVE',
  'ANO',
  'ULTIMO_NUMERO',
  'DATA_ATUALIZACAO'
]);


const RN_ENVIOS_HISTORICO_COLUNAS = Object.freeze([
  'ID',
  'ENVIO_ID',
  'ENVIO_NUMERO',
  'VERSAO',
  'EVENTO',
  'STATUS_ANTERIOR',
  'STATUS_NOVO',
  'USUARIO_ID',
  'USUARIO_NOME',
  'USUARIO_EMAIL',
  'DATA_EVENTO',
  'DESCRICAO',
  'DADOS_JSON'
]);


/**
 * ============================================================
 * API PRINCIPAL
 * ============================================================
 */

const RN_Envios = {

  /**
   * Cria as estruturas necessárias para o módulo.
   *
   * @return {Object}
   */
  instalar: function () {
    const spreadsheet = rnEnviosObterSpreadsheet_();

    const abaEnvios = rnEnviosObterOuCriarAba_(
      spreadsheet,
      RN_ENVIOS_CONFIG.PLANILHA_ENVIOS,
      RN_ENVIOS_COLUNAS
    );

    const abaContadores = rnEnviosObterOuCriarAba_(
      spreadsheet,
      RN_ENVIOS_CONFIG.PLANILHA_CONTADORES,
      RN_ENVIOS_CONTADORES_COLUNAS
    );

    const abaHistorico = rnEnviosObterOuCriarAba_(
      spreadsheet,
      RN_ENVIOS_CONFIG.PLANILHA_HISTORICO,
      RN_ENVIOS_HISTORICO_COLUNAS
    );

    rnEnviosFormatarAbaEnvios_(abaEnvios);
    rnEnviosFormatarAbaContadores_(abaContadores);
    rnEnviosFormatarAbaHistorico_(abaHistorico);

    return {
      sucesso: true,
      modulo: 'RN_Envios',
      versao: RN_ENVIOS_CONFIG.VERSAO_MODULO,
      spreadsheetId: spreadsheet.getId(),
      planilhas: [
        abaEnvios.getName(),
        abaContadores.getName(),
        abaHistorico.getName()
      ]
    };
  },


  /**
   * Cria um novo envio em estado de rascunho.
   *
   * @param {Object} dados
   * @return {Object}
   */
  criar: function (dados) {
    dados = dados || {};

    return rnEnviosComLock_(function () {
      RN_Envios.instalar();

      const agora = rnEnviosAgora_();
      const usuario = rnEnviosResolverUsuario_(dados.usuario);
      const profissional = rnEnviosNormalizarProfissional_(dados.profissional);

      rnEnviosValidarProfissional_(profissional);

      const envio = {
        ID: Utilities.getUuid(),
        NUMERO: rnEnviosGerarProximoNumero_(),
        VERSAO: 1,
        STATUS: RN_ENVIOS_STATUS.RASCUNHO,

        PROFISSIONAL_ID: profissional.id,
        PROFISSIONAL_NOME: profissional.nome,
        PROFISSIONAL_EMAIL: profissional.email,

        TIPO_CONTEUDO: rnEnviosNormalizarTipoConteudo_(
          dados.tipoConteudo || 'NAO_DEFINIDO'
        ),

        QUANTIDADE_ITENS: 0,

        OBSERVACOES: rnEnviosLimparTexto_(dados.observacoes),
        MOTIVO_STATUS_JSON: '',

        PDF_ID: '',
        PDF_URL: '',

        DATA_CRIACAO: agora,
        DATA_ATUALIZACAO: agora,
        DATA_ENVIO: '',
        DATA_ULTIMA_RESSUBMISSAO: '',
        DATA_FINALIZACAO: '',

        CRIADO_POR: usuario.email || usuario.id || profissional.email,
        ATUALIZADO_POR: usuario.email || usuario.id || profissional.email,

        ATIVO: true,

        METADADOS_JSON: rnEnviosSerializarJson_(
          dados.metadados || {}
        )
      };

      rnEnviosInserirRegistro_(envio);

      rnEnviosRegistrarHistorico_({
        envio: envio,
        evento: RN_ENVIOS_EVENTOS.ENVIO_CRIADO,
        statusAnterior: '',
        statusNovo: envio.STATUS,
        usuario: usuario,
        descricao: 'Envio criado em estado de rascunho.',
        dados: {
          tipoConteudo: envio.TIPO_CONTEUDO
        }
      });

      return rnEnviosHidratarRegistro_(envio);
    });
  },


  /**
   * Retorna um envio pelo ID ou pelo número.
   *
   * @param {string} identificador
   * @return {Object|null}
   */
  obter: function (identificador) {
    rnEnviosValidarTextoObrigatorio_(
      identificador,
      'O ID ou número do envio deve ser informado.'
    );

    RN_Envios.instalar();

    const resultado = rnEnviosLocalizarRegistro_(identificador);

    if (!resultado) {
      return null;
    }

    return rnEnviosHidratarRegistro_(resultado.registro);
  },


  /**
   * Retorna um envio ou lança erro quando ele não existe.
   *
   * @param {string} identificador
   * @return {Object}
   */
  obterObrigatorio: function (identificador) {
    const envio = RN_Envios.obter(identificador);

    if (!envio) {
      throw new Error(
        'Envio não encontrado: ' + String(identificador)
      );
    }

    return envio;
  },


  /**
   * Lista envios de acordo com os filtros informados.
   *
   * Filtros aceitos:
   *
   * {
   *   profissionalId,
   *   profissionalEmail,
   *   status,
   *   ativo,
   *   dataInicial,
   *   dataFinal,
   *   busca,
   *   limite,
   *   deslocamento
   * }
   *
   * @param {Object} filtros
   * @return {Object}
   */
  listar: function (filtros) {
    filtros = filtros || {};

    RN_Envios.instalar();

    const registros = rnEnviosLerTodosRegistros_()
      .map(rnEnviosHidratarRegistro_)
      .filter(function (envio) {
        return rnEnviosAplicarFiltros_(envio, filtros);
      })
      .sort(function (a, b) {
        return rnEnviosTimestamp_(b.dataAtualizacao) -
          rnEnviosTimestamp_(a.dataAtualizacao);
      });

    const deslocamento = Math.max(
      0,
      Number(filtros.deslocamento || 0)
    );

    const limiteSolicitado = Number(filtros.limite || 100);

    const limite = Math.min(
      Math.max(limiteSolicitado, 1),
      500
    );

    const pagina = registros.slice(
      deslocamento,
      deslocamento + limite
    );

    return {
      sucesso: true,
      total: registros.length,
      deslocamento: deslocamento,
      limite: limite,
      envios: pagina
    };
  },


  /**
   * Atualiza os dados permitidos enquanto o envio estiver editável.
   *
   * @param {string} identificador
   * @param {Object} alteracoes
   * @param {Object} usuario
   * @return {Object}
   */
  salvarRascunho: function (identificador, alteracoes, usuario) {
    alteracoes = alteracoes || {};

    return rnEnviosComLock_(function () {
      const localizado = rnEnviosLocalizarRegistroObrigatorio_(
        identificador
      );

      const envioAnterior = rnEnviosHidratarRegistro_(
        localizado.registro
      );

      rnEnviosGarantirEditavel_(envioAnterior);

      const usuarioResolvido = rnEnviosResolverUsuario_(usuario);
      const registro = localizado.registro;

      if (
        Object.prototype.hasOwnProperty.call(
          alteracoes,
          'profissional'
        )
      ) {
        const profissional = rnEnviosNormalizarProfissional_(
          alteracoes.profissional
        );

        rnEnviosValidarProfissional_(profissional);

        registro.PROFISSIONAL_ID = profissional.id;
        registro.PROFISSIONAL_NOME = profissional.nome;
        registro.PROFISSIONAL_EMAIL = profissional.email;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          alteracoes,
          'tipoConteudo'
        )
      ) {
        registro.TIPO_CONTEUDO =
          rnEnviosNormalizarTipoConteudo_(
            alteracoes.tipoConteudo
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          alteracoes,
          'observacoes'
        )
      ) {
        registro.OBSERVACOES = rnEnviosLimparTexto_(
          alteracoes.observacoes
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          alteracoes,
          'metadados'
        )
      ) {
        const metadadosAtuais =
          rnEnviosDesserializarJson_(
            registro.METADADOS_JSON,
            {}
          );

        const novosMetadados = rnEnviosMesclarObjetos_(
          metadadosAtuais,
          alteracoes.metadados || {}
        );

        registro.METADADOS_JSON =
          rnEnviosSerializarJson_(novosMetadados);
      }

      registro.DATA_ATUALIZACAO = rnEnviosAgora_();
      registro.ATUALIZADO_POR =
        usuarioResolvido.email ||
        usuarioResolvido.id ||
        registro.PROFISSIONAL_EMAIL;

      rnEnviosAtualizarRegistro_(
        localizado.linha,
        registro
      );

      rnEnviosRegistrarHistorico_({
        envio: registro,
        evento: RN_ENVIOS_EVENTOS.RASCUNHO_SALVO,
        statusAnterior: envioAnterior.status,
        statusNovo: registro.STATUS,
        usuario: usuarioResolvido,
        descricao: 'Alterações do envio salvas.',
        dados: {
          camposAlterados: Object.keys(alteracoes)
        }
      });

      return rnEnviosHidratarRegistro_(registro);
    });
  },


  /**
   * Atualiza a quantidade de itens do envio.
   *
   * Esta função será chamada pelo RN_Protocolos.gs.
   *
   * @param {string} identificador
   * @param {number} quantidade
   * @param {string} tipoConteudo
   * @param {Object} usuario
   * @return {Object}
   */
  atualizarResumoItens: function (
    identificador,
    quantidade,
    tipoConteudo,
    usuario
  ) {
    return rnEnviosComLock_(function () {
      const localizado = rnEnviosLocalizarRegistroObrigatorio_(
        identificador
      );

      const envio = rnEnviosHidratarRegistro_(
        localizado.registro
      );

      rnEnviosGarantirEditavel_(envio);

      quantidade = Number(quantidade);

      if (
        !Number.isFinite(quantidade) ||
        quantidade < 0 ||
        Math.floor(quantidade) !== quantidade
      ) {
        throw new Error(
          'A quantidade de itens deve ser um número inteiro igual ou maior que zero.'
        );
      }

      localizado.registro.QUANTIDADE_ITENS = quantidade;
      localizado.registro.TIPO_CONTEUDO =
        rnEnviosNormalizarTipoConteudo_(
          tipoConteudo || localizado.registro.TIPO_CONTEUDO
        );

      localizado.registro.DATA_ATUALIZACAO =
        rnEnviosAgora_();

      const usuarioResolvido =
        rnEnviosResolverUsuario_(usuario);

      localizado.registro.ATUALIZADO_POR =
        usuarioResolvido.email ||
        usuarioResolvido.id ||
        localizado.registro.PROFISSIONAL_EMAIL;

      rnEnviosAtualizarRegistro_(
        localizado.linha,
        localizado.registro
      );

      rnEnviosRegistrarHistorico_({
        envio: localizado.registro,
        evento:
          RN_ENVIOS_EVENTOS.QUANTIDADE_ITENS_ATUALIZADA,
        statusAnterior: localizado.registro.STATUS,
        statusNovo: localizado.registro.STATUS,
        usuario: usuarioResolvido,
        descricao:
          'Resumo dos itens do envio atualizado.',
        dados: {
          quantidadeItens: quantidade,
          tipoConteudo:
            localizado.registro.TIPO_CONTEUDO
        }
      });

      return rnEnviosHidratarRegistro_(
        localizado.registro
      );
    });
  },


  /**
   * Submete o envio para análise.
   *
   * @param {string} identificador
   * @param {Object} usuario
   * @return {Object}
   */
  submeter: function (identificador, usuario) {
    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      const envio = rnEnviosHidratarRegistro_(
        localizado.registro
      );

      if (envio.status !== RN_ENVIOS_STATUS.RASCUNHO) {
        throw new Error(
          'Somente envios em rascunho podem ser submetidos.'
        );
      }

      rnEnviosValidarParaSubmissao_(envio);

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.ENVIADO,
        evento: RN_ENVIOS_EVENTOS.ENVIO_SUBMETIDO,
        usuario: usuario,
        descricao:
          'Envio submetido para conferência administrativa.',
        motivo: null,
        configurarDatas: function (registro, agora) {
          registro.DATA_ENVIO = agora;
          registro.DATA_FINALIZACAO = '';
        }
      });
    });
  },


  /**
   * Coloca o envio em análise.
   *
   * @param {string} identificador
   * @param {Object} usuario
   * @return {Object}
   */
  iniciarAnalise: function (identificador, usuario) {
    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.EM_ANALISE
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.EM_ANALISE,
        evento: RN_ENVIOS_EVENTOS.ENVIO_EM_ANALISE,
        usuario: usuario,
        descricao:
          'Conferência administrativa iniciada.',
        motivo: null
      });
    });
  },


  /**
   * Registra uma pendência.
   *
   * motivo:
   *
   * {
   *   codigo,
   *   titulo,
   *   descricao,
   *   camposAfetados: []
   * }
   *
   * @param {string} identificador
   * @param {Object} motivo
   * @param {Object} usuario
   * @return {Object}
   */
  registrarPendencia: function (
    identificador,
    motivo,
    usuario
  ) {
    rnEnviosValidarMotivoStatus_(motivo);

    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.PENDENTE
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.PENDENTE,
        evento:
          RN_ENVIOS_EVENTOS.PENDENCIA_REGISTRADA,
        usuario: usuario,
        descricao:
          'Envio devolvido ao profissional para correção.',
        motivo: motivo
      });
    });
  },


  /**
   * Reabre um envio pendente para edição.
   *
   * @param {string} identificador
   * @param {Object} usuario
   * @return {Object}
   */
  abrirParaCorrecao: function (identificador, usuario) {
    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      if (
        localizado.registro.STATUS !==
        RN_ENVIOS_STATUS.PENDENTE
      ) {
        throw new Error(
          'Somente envios pendentes podem ser reabertos para correção.'
        );
      }

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.RASCUNHO,
        evento: RN_ENVIOS_EVENTOS.ENVIO_REABERTO,
        usuario: usuario,
        descricao:
          'Envio reaberto para correção pelo profissional.',
        motivo: null,
        preservarMotivoAnterior: true
      });
    });
  },


  /**
   * Ressubmete um envio corrigido.
   *
   * O envio deve estar em rascunho e já ter sido enviado
   * anteriormente.
   *
   * @param {string} identificador
   * @param {Object} usuario
   * @return {Object}
   */
  ressubmeter: function (identificador, usuario) {
    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      const envio = rnEnviosHidratarRegistro_(
        localizado.registro
      );

      if (envio.status !== RN_ENVIOS_STATUS.RASCUNHO) {
        throw new Error(
          'O envio deve estar em rascunho para ser ressubmetido.'
        );
      }

      if (!envio.dataEnvio) {
        throw new Error(
          'Este envio ainda não possui uma submissão anterior. Utilize a função submeter.'
        );
      }

      rnEnviosValidarParaSubmissao_(envio);

      localizado.registro.VERSAO =
        Number(localizado.registro.VERSAO || 1) + 1;

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.ENVIADO,
        evento:
          RN_ENVIOS_EVENTOS.ENVIO_RESSUBMETIDO,
        usuario: usuario,
        descricao:
          'Envio corrigido e ressubmetido para conferência.',
        motivo: null,
        configurarDatas: function (registro, agora) {
          registro.DATA_ULTIMA_RESSUBMISSAO = agora;
          registro.DATA_FINALIZACAO = '';
        }
      });
    });
  },


  /**
   * Aprova o envio.
   *
   * @param {string} identificador
   * @param {Object} usuario
   * @return {Object}
   */
  aprovar: function (identificador, usuario) {
    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.APROVADO
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.APROVADO,
        evento: RN_ENVIOS_EVENTOS.ENVIO_APROVADO,
        usuario: usuario,
        descricao: 'Envio aprovado.',
        motivo: null,
        configurarDatas: function (registro, agora) {
          registro.DATA_FINALIZACAO = agora;
        }
      });
    });
  },


  /**
   * Aprova o envio com ressalvas.
   *
   * @param {string} identificador
   * @param {Object} motivo
   * @param {Object} usuario
   * @return {Object}
   */
  aprovarComRessalvas: function (
    identificador,
    motivo,
    usuario
  ) {
    rnEnviosValidarMotivoStatus_(motivo);

    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.APROVADO_COM_RESSALVAS
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus:
          RN_ENVIOS_STATUS.APROVADO_COM_RESSALVAS,
        evento:
          RN_ENVIOS_EVENTOS
            .ENVIO_APROVADO_COM_RESSALVAS,
        usuario: usuario,
        descricao: 'Envio aprovado com ressalvas.',
        motivo: motivo,
        configurarDatas: function (registro, agora) {
          registro.DATA_FINALIZACAO = agora;
        }
      });
    });
  },


  /**
   * Rejeita o envio.
   *
   * @param {string} identificador
   * @param {Object} motivo
   * @param {Object} usuario
   * @return {Object}
   */
  rejeitar: function (identificador, motivo, usuario) {
    rnEnviosValidarMotivoStatus_(motivo);

    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.REJEITADO
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.REJEITADO,
        evento: RN_ENVIOS_EVENTOS.ENVIO_REJEITADO,
        usuario: usuario,
        descricao: 'Envio rejeitado.',
        motivo: motivo,
        configurarDatas: function (registro, agora) {
          registro.DATA_FINALIZACAO = agora;
        }
      });
    });
  },


  /**
   * Marca o envio como faturado.
   *
   * @param {string} identificador
   * @param {Object} usuario
   * @return {Object}
   */
  marcarFaturado: function (identificador, usuario) {
    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.FATURADO
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.FATURADO,
        evento: RN_ENVIOS_EVENTOS.ENVIO_FATURADO,
        usuario: usuario,
        descricao:
          'Envio marcado como faturado.',
        motivo: null,
        configurarDatas: function (registro, agora) {
          registro.DATA_FINALIZACAO =
            registro.DATA_FINALIZACAO || agora;
        }
      });
    });
  },


  /**
   * Cancela o envio.
   *
   * @param {string} identificador
   * @param {Object} motivo
   * @param {Object} usuario
   * @return {Object}
   */
  cancelar: function (identificador, motivo, usuario) {
    motivo = motivo || {
      codigo: 'CANCELAMENTO',
      titulo: 'Envio cancelado',
      descricao:
        'O envio foi cancelado.',
      camposAfetados: []
    };

    rnEnviosValidarMotivoStatus_(motivo);

    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      rnEnviosValidarTransicao_(
        localizado.registro.STATUS,
        RN_ENVIOS_STATUS.CANCELADO
      );

      return rnEnviosAlterarStatusInterno_({
        localizado: localizado,
        novoStatus: RN_ENVIOS_STATUS.CANCELADO,
        evento: RN_ENVIOS_EVENTOS.ENVIO_CANCELADO,
        usuario: usuario,
        descricao: 'Envio cancelado.',
        motivo: motivo,
        configurarDatas: function (registro, agora) {
          registro.DATA_FINALIZACAO = agora;
          registro.ATIVO = false;
        }
      });
    });
  },


  /**
   * Vincula o PDF gerado ao envio.
   *
   * @param {string} identificador
   * @param {Object} pdf
   * @param {Object} usuario
   * @return {Object}
   */
  vincularPdf: function (identificador, pdf, usuario) {
    pdf = pdf || {};

    rnEnviosValidarTextoObrigatorio_(
      pdf.id,
      'O ID do arquivo PDF deve ser informado.'
    );

    return rnEnviosComLock_(function () {
      const localizado =
        rnEnviosLocalizarRegistroObrigatorio_(
          identificador
        );

      const usuarioResolvido =
        rnEnviosResolverUsuario_(usuario);

      localizado.registro.PDF_ID =
        String(pdf.id).trim();

      localizado.registro.PDF_URL =
        rnEnviosLimparTexto_(pdf.url);

      localizado.registro.DATA_ATUALIZACAO =
        rnEnviosAgora_();

      localizado.registro.ATUALIZADO_POR =
        usuarioResolvido.email ||
        usuarioResolvido.id ||
        localizado.registro.PROFISSIONAL_EMAIL;

      rnEnviosAtualizarRegistro_(
        localizado.linha,
        localizado.registro
      );

      rnEnviosRegistrarHistorico_({
        envio: localizado.registro,
        evento: RN_ENVIOS_EVENTOS.PDF_VINCULADO,
        statusAnterior: localizado.registro.STATUS,
        statusNovo: localizado.registro.STATUS,
        usuario: usuarioResolvido,
        descricao:
          'Arquivo PDF vinculado ao envio.',
        dados: {
          pdfId: localizado.registro.PDF_ID,
          pdfUrl: localizado.registro.PDF_URL
        }
      });

      return rnEnviosHidratarRegistro_(
        localizado.registro
      );
    });
  },


  /**
   * Retorna o histórico do envio.
   *
   * @param {string} identificador
   * @return {Array<Object>}
   */
  obterHistorico: function (identificador) {
    const envio = RN_Envios.obterObrigatorio(
      identificador
    );

    RN_Envios.instalar();

    const spreadsheet = rnEnviosObterSpreadsheet_();

    const aba = spreadsheet.getSheetByName(
      RN_ENVIOS_CONFIG.PLANILHA_HISTORICO
    );

    const registros = rnEnviosLerAbaComoObjetos_(
      aba,
      RN_ENVIOS_HISTORICO_COLUNAS
    );

    return registros
      .filter(function (registro) {
        return registro.ENVIO_ID === envio.id;
      })
      .map(function (registro) {
        return {
          id: registro.ID,
          envioId: registro.ENVIO_ID,
          envioNumero: registro.ENVIO_NUMERO,
          versao: Number(registro.VERSAO || 1),
          evento: registro.EVENTO,
          statusAnterior:
            registro.STATUS_ANTERIOR || '',
          statusNovo: registro.STATUS_NOVO || '',
          usuario: {
            id: registro.USUARIO_ID || '',
            nome: registro.USUARIO_NOME || '',
            email: registro.USUARIO_EMAIL || ''
          },
          dataEvento: registro.DATA_EVENTO,
          descricao: registro.DESCRICAO || '',
          dados: rnEnviosDesserializarJson_(
            registro.DADOS_JSON,
            {}
          )
        };
      })
      .sort(function (a, b) {
        return rnEnviosTimestamp_(a.dataEvento) -
          rnEnviosTimestamp_(b.dataEvento);
      });
  },


  /**
   * Retorna as constantes necessárias ao front-end.
   *
   * @return {Object}
   */
  obterConfiguracoesPublicas: function () {
    return {
      modulo: 'RN_Envios',
      versao: RN_ENVIOS_CONFIG.VERSAO_MODULO,
      status: RN_ENVIOS_STATUS,
      eventos: RN_ENVIOS_EVENTOS
    };
  }
};


/**
 * ============================================================
 * FUNÇÕES GLOBAIS DE COMPATIBILIDADE
 * ============================================================
 *
 * Estas funções podem ser chamadas diretamente pelo
 * google.script.run no PortalApi.gs ou no HTML.
 */

function rnEnviosInstalar() {
  return RN_Envios.instalar();
}


function rnEnviosCriar(dados) {
  return RN_Envios.criar(dados);
}


function rnEnviosObter(identificador) {
  return RN_Envios.obter(identificador);
}


function rnEnviosListar(filtros) {
  return RN_Envios.listar(filtros);
}


function rnEnviosSalvarRascunho(
  identificador,
  alteracoes,
  usuario
) {
  return RN_Envios.salvarRascunho(
    identificador,
    alteracoes,
    usuario
  );
}


function rnEnviosSubmeter(identificador, usuario) {
  return RN_Envios.submeter(
    identificador,
    usuario
  );
}


function rnEnviosIniciarAnalise(
  identificador,
  usuario
) {
  return RN_Envios.iniciarAnalise(
    identificador,
    usuario
  );
}


function rnEnviosRegistrarPendencia(
  identificador,
  motivo,
  usuario
) {
  return RN_Envios.registrarPendencia(
    identificador,
    motivo,
    usuario
  );
}


function rnEnviosAbrirParaCorrecao(
  identificador,
  usuario
) {
  return RN_Envios.abrirParaCorrecao(
    identificador,
    usuario
  );
}


function rnEnviosRessubmeter(
  identificador,
  usuario
) {
  return RN_Envios.ressubmeter(
    identificador,
    usuario
  );
}


function rnEnviosAprovar(
  identificador,
  usuario
) {
  return RN_Envios.aprovar(
    identificador,
    usuario
  );
}


function rnEnviosAprovarComRessalvas(
  identificador,
  motivo,
  usuario
) {
  return RN_Envios.aprovarComRessalvas(
    identificador,
    motivo,
    usuario
  );
}


function rnEnviosRejeitar(
  identificador,
  motivo,
  usuario
) {
  return RN_Envios.rejeitar(
    identificador,
    motivo,
    usuario
  );
}


function rnEnviosMarcarFaturado(
  identificador,
  usuario
) {
  return RN_Envios.marcarFaturado(
    identificador,
    usuario
  );
}


function rnEnviosCancelar(
  identificador,
  motivo,
  usuario
) {
  return RN_Envios.cancelar(
    identificador,
    motivo,
    usuario
  );
}


function rnEnviosVincularPdf(
  identificador,
  pdf,
  usuario
) {
  return RN_Envios.vincularPdf(
    identificador,
    pdf,
    usuario
  );
}


function rnEnviosObterHistorico(identificador) {
  return RN_Envios.obterHistorico(
    identificador
  );
}


/**
 * ============================================================
 * INSTALAÇÃO E ACESSO AO BANCO
 * ============================================================
 */

function rnEnviosObterSpreadsheet_() {
  const propriedades =
    PropertiesService.getScriptProperties();

  const databaseId = propriedades.getProperty(
    RN_ENVIOS_CONFIG.PROPRIEDADE_DATABASE_ID
  );

  if (databaseId) {
    try {
      return SpreadsheetApp.openById(databaseId);
    } catch (erro) {
      throw new Error(
        'Não foi possível abrir a planilha configurada em ' +
        RN_ENVIOS_CONFIG.PROPRIEDADE_DATABASE_ID +
        '. Verifique o ID e as permissões. Detalhes: ' +
        erro.message
      );
    }
  }

  const ativa = SpreadsheetApp.getActiveSpreadsheet();

  if (!ativa) {
    throw new Error(
      'Nenhuma planilha ativa foi encontrada. ' +
      'Configure a propriedade de script ' +
      RN_ENVIOS_CONFIG.PROPRIEDADE_DATABASE_ID +
      ' com o ID da planilha principal.'
    );
  }

  return ativa;
}


function rnEnviosObterOuCriarAba_(
  spreadsheet,
  nome,
  colunas
) {
  let aba = spreadsheet.getSheetByName(nome);

  if (!aba) {
    aba = spreadsheet.insertSheet(nome);
  }

  rnEnviosGarantirCabecalho_(aba, colunas);

  return aba;
}


function rnEnviosGarantirCabecalho_(aba, colunas) {
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
    aba
      .getRange(1, 1, 1, colunas.length)
      .setValues([colunas]);

    aba.setFrozenRows(1);

    return;
  }

  colunas.forEach(function (coluna) {
    if (cabecalhoAtual.indexOf(coluna) === -1) {
      aba
        .getRange(1, aba.getLastColumn() + 1)
        .setValue(coluna);
    }
  });

  aba.setFrozenRows(1);
}


function rnEnviosFormatarAbaEnvios_(aba) {
  aba.getRange(1, 1, 1, RN_ENVIOS_COLUNAS.length)
    .setFontWeight('bold');

  aba.setFrozenRows(1);

  const larguras = {
    1: 220,
    2: 150,
    3: 80,
    4: 180,
    5: 180,
    6: 220,
    7: 220,
    8: 160,
    9: 110,
    10: 280,
    11: 300,
    12: 220,
    13: 300,
    14: 170,
    15: 170,
    16: 170,
    17: 190,
    18: 170,
    19: 220,
    20: 220,
    21: 80,
    22: 320
  };

  Object.keys(larguras).forEach(function (coluna) {
    aba.setColumnWidth(
      Number(coluna),
      larguras[coluna]
    );
  });
}


function rnEnviosFormatarAbaContadores_(aba) {
  aba.getRange(
    1,
    1,
    1,
    RN_ENVIOS_CONTADORES_COLUNAS.length
  ).setFontWeight('bold');

  aba.setFrozenRows(1);
}


function rnEnviosFormatarAbaHistorico_(aba) {
  aba.getRange(
    1,
    1,
    1,
    RN_ENVIOS_HISTORICO_COLUNAS.length
  ).setFontWeight('bold');

  aba.setFrozenRows(1);
}


/**
 * ============================================================
 * NUMERAÇÃO
 * ============================================================
 */

function rnEnviosGerarProximoNumero_() {
  const spreadsheet = rnEnviosObterSpreadsheet_();

  const aba = spreadsheet.getSheetByName(
    RN_ENVIOS_CONFIG.PLANILHA_CONTADORES
  );

  const ano = Number(
    Utilities.formatDate(
      new Date(),
      RN_ENVIOS_CONFIG.TIMEZONE,
      'yyyy'
    )
  );

  const chave =
    RN_ENVIOS_CONFIG.CONTADOR_ENVIO +
    '_' +
    ano;

  const registros = rnEnviosLerAbaComoObjetos_(
    aba,
    RN_ENVIOS_CONTADORES_COLUNAS
  );

  let linhaEncontrada = -1;
  let ultimoNumero = 0;

  registros.forEach(function (registro, indice) {
    if (registro.CHAVE === chave) {
      linhaEncontrada = indice + 2;
      ultimoNumero = Number(
        registro.ULTIMO_NUMERO || 0
      );
    }
  });

  const proximoNumero = ultimoNumero + 1;
  const agora = rnEnviosAgora_();

  if (linhaEncontrada > 0) {
    aba
      .getRange(
        linhaEncontrada,
        1,
        1,
        RN_ENVIOS_CONTADORES_COLUNAS.length
      )
      .setValues([[
        chave,
        ano,
        proximoNumero,
        agora
      ]]);
  } else {
    aba.appendRow([
      chave,
      ano,
      proximoNumero,
      agora
    ]);
  }

  return [
    RN_ENVIOS_CONFIG.PREFIXO_NUMERO,
    ano,
    String(proximoNumero).padStart(6, '0')
  ].join('-');
}


/**
 * ============================================================
 * PERSISTÊNCIA
 * ============================================================
 */

function rnEnviosInserirRegistro_(registro) {
  const spreadsheet = rnEnviosObterSpreadsheet_();

  const aba = spreadsheet.getSheetByName(
    RN_ENVIOS_CONFIG.PLANILHA_ENVIOS
  );

  const linha = RN_ENVIOS_COLUNAS.map(
    function (coluna) {
      return rnEnviosValorParaCelula_(
        registro[coluna]
      );
    }
  );

  aba.appendRow(linha);
}


function rnEnviosAtualizarRegistro_(numeroLinha, registro) {
  const spreadsheet = rnEnviosObterSpreadsheet_();

  const aba = spreadsheet.getSheetByName(
    RN_ENVIOS_CONFIG.PLANILHA_ENVIOS
  );

  const valores = RN_ENVIOS_COLUNAS.map(
    function (coluna) {
      return rnEnviosValorParaCelula_(
        registro[coluna]
      );
    }
  );

  aba
    .getRange(
      numeroLinha,
      1,
      1,
      RN_ENVIOS_COLUNAS.length
    )
    .setValues([valores]);
}


function rnEnviosLerTodosRegistros_() {
  const spreadsheet = rnEnviosObterSpreadsheet_();

  const aba = spreadsheet.getSheetByName(
    RN_ENVIOS_CONFIG.PLANILHA_ENVIOS
  );

  return rnEnviosLerAbaComoObjetos_(
    aba,
    RN_ENVIOS_COLUNAS
  );
}


function rnEnviosLerAbaComoObjetos_(
  aba,
  colunasEsperadas
) {
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  const ultimaColuna = Math.max(
    aba.getLastColumn(),
    colunasEsperadas.length
  );

  const valores = aba
    .getRange(
      1,
      1,
      ultimaLinha,
      ultimaColuna
    )
    .getValues();

  const cabecalho = valores[0].map(
    function (valor) {
      return String(valor || '').trim();
    }
  );

  return valores
    .slice(1)
    .filter(function (linha) {
      return linha.some(function (valor) {
        return valor !== '' && valor !== null;
      });
    })
    .map(function (linha) {
      const objeto = {};

      cabecalho.forEach(function (coluna, indice) {
        if (coluna) {
          objeto[coluna] = linha[indice];
        }
      });

      return objeto;
    });
}


function rnEnviosLocalizarRegistro_(identificador) {
  RN_Envios.instalar();

  const spreadsheet = rnEnviosObterSpreadsheet_();

  const aba = spreadsheet.getSheetByName(
    RN_ENVIOS_CONFIG.PLANILHA_ENVIOS
  );

  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  const registros = rnEnviosLerAbaComoObjetos_(
    aba,
    RN_ENVIOS_COLUNAS
  );

  const termo = String(identificador)
    .trim()
    .toUpperCase();

  for (let indice = 0; indice < registros.length; indice++) {
    const registro = registros[indice];

    const id = String(
      registro.ID || ''
    ).trim().toUpperCase();

    const numero = String(
      registro.NUMERO || ''
    ).trim().toUpperCase();

    if (id === termo || numero === termo) {
      return {
        linha: indice + 2,
        registro: registro
      };
    }
  }

  return null;
}


function rnEnviosLocalizarRegistroObrigatorio_(
  identificador
) {
  const resultado = rnEnviosLocalizarRegistro_(
    identificador
  );

  if (!resultado) {
    throw new Error(
      'Envio não encontrado: ' +
      String(identificador)
    );
  }

  return resultado;
}


/**
 * ============================================================
 * ALTERAÇÃO DE STATUS
 * ============================================================
 */

function rnEnviosAlterarStatusInterno_(opcoes) {
  const registro = opcoes.localizado.registro;
  const statusAnterior = registro.STATUS;
  const agora = rnEnviosAgora_();

  rnEnviosValidarTransicao_(
    statusAnterior,
    opcoes.novoStatus
  );

  const usuario =
    rnEnviosResolverUsuario_(opcoes.usuario);

  registro.STATUS = opcoes.novoStatus;
  registro.DATA_ATUALIZACAO = agora;

  registro.ATUALIZADO_POR =
    usuario.email ||
    usuario.id ||
    registro.PROFISSIONAL_EMAIL;

  if (opcoes.motivo) {
    registro.MOTIVO_STATUS_JSON =
      rnEnviosSerializarJson_(
        rnEnviosNormalizarMotivoStatus_(
          opcoes.motivo
        )
      );
  } else if (!opcoes.preservarMotivoAnterior) {
    registro.MOTIVO_STATUS_JSON = '';
  }

  if (
    typeof opcoes.configurarDatas ===
    'function'
  ) {
    opcoes.configurarDatas(registro, agora);
  }

  rnEnviosAtualizarRegistro_(
    opcoes.localizado.linha,
    registro
  );

  rnEnviosRegistrarHistorico_({
    envio: registro,
    evento: opcoes.evento,
    statusAnterior: statusAnterior,
    statusNovo: registro.STATUS,
    usuario: usuario,
    descricao: opcoes.descricao,
    dados: {
      motivo: opcoes.motivo || null
    }
  });

  return rnEnviosHidratarRegistro_(registro);
}


function rnEnviosValidarTransicao_(
  statusAtual,
  novoStatus
) {
  if (statusAtual === novoStatus) {
    throw new Error(
      'O envio já está com o status ' +
      novoStatus +
      '.'
    );
  }

  const transicoes = {};

  transicoes[RN_ENVIOS_STATUS.RASCUNHO] = [
    RN_ENVIOS_STATUS.ENVIADO,
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[RN_ENVIOS_STATUS.ENVIADO] = [
    RN_ENVIOS_STATUS.EM_ANALISE,
    RN_ENVIOS_STATUS.PENDENTE,
    RN_ENVIOS_STATUS.APROVADO,
    RN_ENVIOS_STATUS.APROVADO_COM_RESSALVAS,
    RN_ENVIOS_STATUS.REJEITADO,
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[RN_ENVIOS_STATUS.EM_ANALISE] = [
    RN_ENVIOS_STATUS.PENDENTE,
    RN_ENVIOS_STATUS.APROVADO,
    RN_ENVIOS_STATUS.APROVADO_COM_RESSALVAS,
    RN_ENVIOS_STATUS.REJEITADO,
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[RN_ENVIOS_STATUS.PENDENTE] = [
    RN_ENVIOS_STATUS.RASCUNHO,
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[RN_ENVIOS_STATUS.APROVADO] = [
    RN_ENVIOS_STATUS.FATURADO,
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[
    RN_ENVIOS_STATUS.APROVADO_COM_RESSALVAS
  ] = [
    RN_ENVIOS_STATUS.FATURADO,
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[RN_ENVIOS_STATUS.REJEITADO] = [
    RN_ENVIOS_STATUS.CANCELADO
  ];

  transicoes[RN_ENVIOS_STATUS.FATURADO] = [];

  transicoes[RN_ENVIOS_STATUS.CANCELADO] = [];

  const permitidos = transicoes[statusAtual];

  if (!permitidos) {
    throw new Error(
      'Status atual inválido: ' +
      String(statusAtual)
    );
  }

  if (permitidos.indexOf(novoStatus) === -1) {
    throw new Error(
      'Transição de status não permitida: ' +
      statusAtual +
      ' → ' +
      novoStatus +
      '.'
    );
  }
}


/**
 * ============================================================
 * HISTÓRICO
 * ============================================================
 */

function rnEnviosRegistrarHistorico_(dados) {
  const spreadsheet = rnEnviosObterSpreadsheet_();

  const aba = spreadsheet.getSheetByName(
    RN_ENVIOS_CONFIG.PLANILHA_HISTORICO
  );

  const usuario =
    rnEnviosResolverUsuario_(dados.usuario);

  const registro = {
    ID: Utilities.getUuid(),
    ENVIO_ID: dados.envio.ID,
    ENVIO_NUMERO: dados.envio.NUMERO,
    VERSAO: Number(dados.envio.VERSAO || 1),
    EVENTO: dados.evento,
    STATUS_ANTERIOR:
      dados.statusAnterior || '',
    STATUS_NOVO: dados.statusNovo || '',
    USUARIO_ID: usuario.id || '',
    USUARIO_NOME: usuario.nome || '',
    USUARIO_EMAIL: usuario.email || '',
    DATA_EVENTO: rnEnviosAgora_(),
    DESCRICAO:
      rnEnviosLimparTexto_(dados.descricao),
    DADOS_JSON:
      rnEnviosSerializarJson_(dados.dados || {})
  };

  aba.appendRow(
    RN_ENVIOS_HISTORICO_COLUNAS.map(
      function (coluna) {
        return rnEnviosValorParaCelula_(
          registro[coluna]
        );
      }
    )
  );
}


/**
 * ============================================================
 * VALIDAÇÕES
 * ============================================================
 */

function rnEnviosGarantirEditavel_(envio) {
  if (envio.status !== RN_ENVIOS_STATUS.RASCUNHO) {
    throw new Error(
      'Este envio não pode ser editado porque está com o status ' +
      envio.status +
      '.'
    );
  }

  if (envio.ativo === false) {
    throw new Error(
      'Este envio está inativo.'
    );
  }
}


function rnEnviosValidarParaSubmissao_(envio) {
  const erros = [];

  if (!envio.profissional.id) {
    erros.push(
      'O profissional responsável não foi identificado.'
    );
  }

  if (!envio.profissional.nome) {
    erros.push(
      'O nome do profissional responsável não foi informado.'
    );
  }

  if (
    !Number.isFinite(envio.quantidadeItens) ||
    envio.quantidadeItens <= 0
  ) {
    erros.push(
      'O envio deve possuir pelo menos um protocolo.'
    );
  }

  if (
    !envio.tipoConteudo ||
    envio.tipoConteudo === 'NAO_DEFINIDO'
  ) {
    erros.push(
      'O tipo de conteúdo do envio não foi definido.'
    );
  }

  if (erros.length > 0) {
    throw new Error(
      'O envio não pode ser submetido:\n- ' +
      erros.join('\n- ')
    );
  }
}


function rnEnviosValidarProfissional_(
  profissional
) {
  rnEnviosValidarTextoObrigatorio_(
    profissional.id,
    'O ID do profissional deve ser informado.'
  );

  rnEnviosValidarTextoObrigatorio_(
    profissional.nome,
    'O nome do profissional deve ser informado.'
  );

  if (
    profissional.email &&
    !rnEnviosEmailValido_(profissional.email)
  ) {
    throw new Error(
      'O e-mail do profissional é inválido.'
    );
  }
}


function rnEnviosValidarMotivoStatus_(motivo) {
  if (
    !motivo ||
    typeof motivo !== 'object' ||
    Array.isArray(motivo)
  ) {
    throw new Error(
      'O motivo do status deve ser informado.'
    );
  }

  rnEnviosValidarTextoObrigatorio_(
    motivo.codigo,
    'O código do motivo deve ser informado.'
  );

  rnEnviosValidarTextoObrigatorio_(
    motivo.titulo,
    'O título do motivo deve ser informado.'
  );

  rnEnviosValidarTextoObrigatorio_(
    motivo.descricao,
    'A descrição do motivo deve ser informada.'
  );

  if (
    motivo.camposAfetados !== undefined &&
    !Array.isArray(motivo.camposAfetados)
  ) {
    throw new Error(
      'camposAfetados deve ser uma lista.'
    );
  }
}


function rnEnviosValidarTextoObrigatorio_(
  valor,
  mensagem
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    throw new Error(mensagem);
  }
}


/**
 * ============================================================
 * NORMALIZAÇÃO E HIDRATAÇÃO
 * ============================================================
 */

function rnEnviosHidratarRegistro_(registro) {
  return {
    id: String(registro.ID || ''),
    numero: String(registro.NUMERO || ''),
    versao: Number(registro.VERSAO || 1),
    status: String(
      registro.STATUS ||
      RN_ENVIOS_STATUS.RASCUNHO
    ),

    profissional: {
      id: String(
        registro.PROFISSIONAL_ID || ''
      ),
      nome: String(
        registro.PROFISSIONAL_NOME || ''
      ),
      email: String(
        registro.PROFISSIONAL_EMAIL || ''
      )
    },

    tipoConteudo: String(
      registro.TIPO_CONTEUDO ||
      'NAO_DEFINIDO'
    ),

    quantidadeItens: Number(
      registro.QUANTIDADE_ITENS || 0
    ),

    observacoes: String(
      registro.OBSERVACOES || ''
    ),

    motivoStatus:
      rnEnviosDesserializarJson_(
        registro.MOTIVO_STATUS_JSON,
        null
      ),

    pdf: {
      id: String(registro.PDF_ID || ''),
      url: String(registro.PDF_URL || '')
    },

    dataCriacao:
      rnEnviosNormalizarDataSaida_(
        registro.DATA_CRIACAO
      ),

    dataAtualizacao:
      rnEnviosNormalizarDataSaida_(
        registro.DATA_ATUALIZACAO
      ),

    dataEnvio:
      rnEnviosNormalizarDataSaida_(
        registro.DATA_ENVIO
      ),

    dataUltimaRessubmissao:
      rnEnviosNormalizarDataSaida_(
        registro.DATA_ULTIMA_RESSUBMISSAO
      ),

    dataFinalizacao:
      rnEnviosNormalizarDataSaida_(
        registro.DATA_FINALIZACAO
      ),

    criadoPor: String(
      registro.CRIADO_POR || ''
    ),

    atualizadoPor: String(
      registro.ATUALIZADO_POR || ''
    ),

    ativo: rnEnviosBooleano_(
      registro.ATIVO,
      true
    ),

    metadados:
      rnEnviosDesserializarJson_(
        registro.METADADOS_JSON,
        {}
      )
  };
}


function rnEnviosNormalizarProfissional_(valor) {
  valor = valor || {};

  return {
    id: rnEnviosLimparTexto_(
      valor.id ||
      valor.ID ||
      valor.usuarioId ||
      ''
    ),

    nome: rnEnviosLimparTexto_(
      valor.nome ||
      valor.NOME ||
      valor.name ||
      ''
    ),

    email: rnEnviosLimparTexto_(
      valor.email ||
      valor.EMAIL ||
      ''
    ).toLowerCase()
  };
}


function rnEnviosResolverUsuario_(valor) {
  valor = valor || {};

  const emailSessao =
    rnEnviosObterEmailSessao_();

  return {
    id: rnEnviosLimparTexto_(
      valor.id ||
      valor.ID ||
      valor.usuarioId ||
      ''
    ),

    nome: rnEnviosLimparTexto_(
      valor.nome ||
      valor.NOME ||
      valor.name ||
      ''
    ),

    email: rnEnviosLimparTexto_(
      valor.email ||
      valor.EMAIL ||
      emailSessao ||
      ''
    ).toLowerCase()
  };
}


function rnEnviosObterEmailSessao_() {
  if (
    typeof AUTH_SESSAO_EMAIL_ATUAL_ !== 'undefined' &&
    AUTH_SESSAO_EMAIL_ATUAL_
  ) {
    return AUTH_SESSAO_EMAIL_ATUAL_;
  }

  try {
    return (
      Session
        .getActiveUser()
        .getEmail() || ''
    );
  } catch (erro) {
    return '';
  }
}


function rnEnviosNormalizarTipoConteudo_(valor) {
  const tipo = rnEnviosLimparTexto_(valor)
    .toUpperCase()
    .replace(/\s+/g, '_');

  const permitidos = [
    'NAO_DEFINIDO',
    'CONVENIO',
    'PARTICULAR',
    'MISTO'
  ];

  if (permitidos.indexOf(tipo) === -1) {
    throw new Error(
      'Tipo de conteúdo inválido: ' +
      String(valor) +
      '. Valores permitidos: ' +
      permitidos.join(', ') +
      '.'
    );
  }

  return tipo;
}


function rnEnviosNormalizarMotivoStatus_(motivo) {
  return {
    codigo: rnEnviosLimparTexto_(
      motivo.codigo
    ),

    titulo: rnEnviosLimparTexto_(
      motivo.titulo
    ),

    descricao: rnEnviosLimparTexto_(
      motivo.descricao
    ),

    camposAfetados:
      Array.isArray(motivo.camposAfetados)
        ? motivo.camposAfetados.map(
            rnEnviosLimparTexto_
          )
        : []
  };
}


/**
 * ============================================================
 * FILTROS
 * ============================================================
 */

function rnEnviosAplicarFiltros_(envio, filtros) {
  if (
    filtros.profissionalId &&
    envio.profissional.id !==
      String(filtros.profissionalId)
  ) {
    return false;
  }

  if (
    filtros.profissionalEmail &&
    envio.profissional.email.toLowerCase() !==
      String(filtros.profissionalEmail)
        .trim()
        .toLowerCase()
  ) {
    return false;
  }

  if (filtros.status) {
    const statusPermitidos = Array.isArray(
      filtros.status
    )
      ? filtros.status
      : [filtros.status];

    const normalizados =
      statusPermitidos.map(function (status) {
        return String(status)
          .trim()
          .toUpperCase();
      });

    if (
      normalizados.indexOf(envio.status) === -1
    ) {
      return false;
    }
  }

  if (
    filtros.ativo !== undefined &&
    envio.ativo !==
      rnEnviosBooleano_(filtros.ativo, true)
  ) {
    return false;
  }

  if (filtros.dataInicial) {
    const inicial = rnEnviosTimestamp_(
      filtros.dataInicial
    );

    if (
      rnEnviosTimestamp_(envio.dataCriacao) <
      inicial
    ) {
      return false;
    }
  }

  if (filtros.dataFinal) {
    const final = rnEnviosTimestamp_(
      filtros.dataFinal
    );

    if (
      rnEnviosTimestamp_(envio.dataCriacao) >
      final
    ) {
      return false;
    }
  }

  if (filtros.busca) {
    const busca = String(filtros.busca)
      .trim()
      .toLowerCase();

    const conteudo = [
      envio.numero,
      envio.status,
      envio.profissional.id,
      envio.profissional.nome,
      envio.profissional.email,
      envio.observacoes
    ]
      .join(' ')
      .toLowerCase();

    if (conteudo.indexOf(busca) === -1) {
      return false;
    }
  }

  return true;
}


/**
 * ============================================================
 * UTILITÁRIOS
 * ============================================================
 */

function rnEnviosComLock_(callback) {
  const lock = LockService.getScriptLock();

  lock.waitLock(
    RN_ENVIOS_CONFIG.LOCK_TIMEOUT_MS
  );

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}


function rnEnviosAgora_() {
  return new Date();
}


function rnEnviosNormalizarDataSaida_(valor) {
  if (!valor) {
    return '';
  }

  if (
    Object.prototype.toString.call(valor) ===
    '[object Date]'
  ) {
    if (isNaN(valor.getTime())) {
      return '';
    }

    return valor.toISOString();
  }

  const data = new Date(valor);

  if (isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toISOString();
}


function rnEnviosTimestamp_(valor) {
  if (!valor) {
    return 0;
  }

  const data = new Date(valor);
  const timestamp = data.getTime();

  return isNaN(timestamp) ? 0 : timestamp;
}


function rnEnviosLimparTexto_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor).trim();
}


function rnEnviosEmailValido_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || '').trim()
  );
}


function rnEnviosSerializarJson_(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return '';
  }

  try {
    return JSON.stringify(valor);
  } catch (erro) {
    throw new Error(
      'Não foi possível converter os dados para JSON: ' +
      erro.message
    );
  }
}


function rnEnviosDesserializarJson_(
  valor,
  padrao
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return padrao;
  }

  if (
    typeof valor === 'object' &&
    !(valor instanceof Date)
  ) {
    return valor;
  }

  try {
    return JSON.parse(String(valor));
  } catch (erro) {
    return padrao;
  }
}


function rnEnviosValorParaCelula_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  if (
    typeof valor === 'object' &&
    !(valor instanceof Date)
  ) {
    return rnEnviosSerializarJson_(valor);
  }

  return valor;
}


function rnEnviosBooleano_(valor, padrao) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return padrao;
  }

  if (typeof valor === 'boolean') {
    return valor;
  }

  const texto = String(valor)
    .trim()
    .toLowerCase();

  if (
    ['true', '1', 'sim', 's', 'yes'].indexOf(
      texto
    ) !== -1
  ) {
    return true;
  }

  if (
    ['false', '0', 'não', 'nao', 'n', 'no']
      .indexOf(texto) !== -1
  ) {
    return false;
  }

  return padrao;
}


function rnEnviosMesclarObjetos_(base, alteracoes) {
  const resultado = {};

  Object.keys(base || {}).forEach(
    function (chave) {
      resultado[chave] = base[chave];
    }
  );

  Object.keys(alteracoes || {}).forEach(
    function (chave) {
      resultado[chave] = alteracoes[chave];
    }
  );

  return resultado;
}