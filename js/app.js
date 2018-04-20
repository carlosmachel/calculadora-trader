(function() {
  "use strict";

  function app() {
    function Ordem(
      index,
      operacao,
      quantidadeDeContratos,
      preco,
      precoGain,
      precoLoss,
      aberta,
      fechada,
      escalonado
    ) {
      this.index = index;
      this.operacao = operacao;
      this.quantidadeDeContratos = quantidadeDeContratos;
      this.preco = preco;
      this.precoGain = precoGain;
      this.precoLoss = precoLoss;
      this.aberta = aberta;
      this.fechada = fechada;
      this.escalonado;
    }

    var ordens = [];

    ordens.push({
      escalonado: true,
      quantidadeDeContratos: 2,
      preco: 10,
      operacao: "compra"
    });

    ordens.push({
      escalonado: true,
      quantidadeDeContratos: 2,
      preco: 10,
      operacao: "compra"
    });

    ordens.push({
      escalonado: true,
      quantidadeDeContratos: 2,
      preco: 10,
      operacao: "compra"
    });

    var ordensFinalizadas = [];
    var ordensLog = [];
    var operacao;
    var operacoes = { semOperacao: -1, compra: 1, venda: 0 };
    var fluxo = ["abertura", "fechamento", "cancelamento"];
    var ativos = { miniIndice: 0.2, miniDolar: 10 };

    var quantidadeDeContratosOperacao = 0;
    var precoMedio = 0;
    var metaEmReais;
    var metaEmPontos;
    var limiteLossEmReais;
    var limiteLossEmPontos;

    var estrategia = (function estrategia() {
      var idEstrategia = 0;

      return function calculateId() {
        return ++idEstrategia;
      };
    })();

    var ordem = (function ordem() {
      var idOrdem = 0;

      return function calculateId() {
        return ++idOrdem;
      };
    })();

    function calcularMeta(metaEmReal, ativo) {
      return metaEmReal ? metaEmReal / ativos[ativo] : 0;
    }

    function calcularLimite(limiteEmReal, ativo) {
      return limiteEmReal ? limiteEmReal / ativos[ativo] : 0;
    }

    function contabilizarOrdens(ativo, ordem, fluxo) {
      if (precoMedio) {
        if (fluxo === "abertura") {
          contabilizarAbertura(ativo, ordem);
        } else if (fluxo === "fechamento") {
          contabilizarFechamento(ativo, ordem);
        } else {
          contabilizarStop(ativo, ordem);
        }
      } else {
        precoMedio = ordem.preco;
        quantidadeDeContratosOperacao = ordem.quantidadeDeContratos;
        operacao = ordem.operacao;
      }

      if (operacao === "compra") {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio + metaEmPontos / quantidadeDeContratosOperacao
          : 0;
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio - limiteLossEmPontos / quantidadeDeContratosOperacao
          : 0;
      } else {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio - metaEmPontos / quantidadeDeContratosOperacao
          : 0;
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio + limiteLossEmPontos / quantidadeDeContratosOperacao
          : 0;
      }

      precoMedio = quantidadeDeContratosOperacao ? precoMedio : 0;
      operacao = quantidadeDeContratosOperacao ? "semOperacao" : operacao;

      //atualizar os valores na tela.
    }

    function atualizarPrecoOrdens(preco) {
      ordens = ordens.forEach(function(item) {
        if (item.aberta) item.preco = preco;
      });
    }

    function contabilizarAbertura() {
      var quantidadeDeContrato = 0;
      var precoLoss = 0;
      var precoGain = 0;
      var valorStopGain = 0;

      var quantidadeDeContratosAbertura = calcularQuantidadeDeContratosAbertura();
      if (operacao === ordem.operacao) {
        precoMedio =
          precoMedio * quantidadeDeContratosOperacao +
          ordem.preco *
            quantidadeDeContratosAbertura /
            (quantidadeDeContratosOperacao + quantidadeDeContratosAbertura);

        quantidadeDeContratosOperacao += quantidadeDeContratosAbertura;
        ordem.aberta = true;

        if (ordem.escalonado) {
          ordens = ordens.map(function(item) {
            if (
              item.preco === ordem.preco &&
              !item.aberta &&
              item.operacao === ordem.operacao
            )
              item.aberta = true;
            return ordem;
          });
        }
        atualizarPrecoOrdens(precoMedio);
      }
    }

    function contabilizarFechamento(ordem) {
      if (operacao === ordem.operacao) {
        precoMedio +=
          ordem.operacao === "compra"
            ? ordem.quantidadeDeContratos *
              ((ordem.precoGain - precoMedio) * -1)
            : ordem.precoGain - precoMedio;

        quantidadeDeContratosOperacao -= ordem.quantidadeDeContratos;
      }

      ordem.fechada = true;
      ordens = ordens.filter(function(item) {
        return item.index !== ordem.index;
      });

      ordensFinalizadas.push(ordem);
      ordensLog.push(ordem);
      atualizarPrecoOrdens(precoMedio);
    }

    function contabilizarStop(ordem) {
      ordens = ordens
        .map(function(item) {
          if (item.operacao === operacao && item.aberta) {
            item.preco = precoMedio;
            item.precoGain = ordem.preco;
            item.fechada = true;
            ordensFinalizadas.push(item);
          }
          return item;
        })
        .filter(function(item) {
          return item !== undefined;
        });

      precoMedio = ordem.Preco;
      quantidadeDeContratosOperacao = ordem.quantidadeDeContratos;
      operacao = ordem.operacao;
      ordem.aberta = true;
    }

    function calcularQuantidadeDeContratosAbertura(ordem) {
      return ordem.escalonado
        ? ordens
            .filter(function(item) {
              return item.escalonado && item.operacao === ordem.operacao;
            })
            .reduce(function(acumulated, currentOrdem) {
              return acumulated + currentOrdem.quantidadeDeContratos;
            }, 0)
        : ordem.quantidadeDeContratos;
    }

    contabilizarOrdens(
      "miniIndice",
      {
        escalonado: true,
        quantidadeDeContrato: 2,
        preco: 10,
        operacao: "compra"
      },
      "abertura"
    );
  }

  app();
})();
