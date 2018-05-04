(function (win, doc) {
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

    function Estrategia(nome, pontosGain, pontosLoss) {
      this.nome = nome;
      this.pontosGain = pontosGain;
      this.pontosLoss = pontosLoss;
    }

    var estrategias = [new Estrategia('150x100', 150, 100)];

    var ordensFinalizadas = [];
    var ordensLog = [];
    var operacao;
    var operacoes = { semOperacao: -1, compra: 1, venda: 0 };
    var fluxo = ["abertura", "fechamento", "cancelamento"];

    var ativos = { miniIndice: 0.2, miniDolar: 10 };


    function popularAtivos() {
      var $selectAtivos = doc.querySelector("[data-js='ativos']");

      Object.keys(ativos).forEach(function (ativo) {
        var $option = doc.createElement('option');
        $option.value = ativos[ativo];
        $option.innerHTML = ativo;
        $selectAtivos.appendChild($option);
      });
    }

    function popularEstrategias() {
      var $selectEstrategias = doc.querySelector("[data-js='estrategias']");

      estrategias.forEach(function (estrategia) {
        var $option = doc.createElement('option');
        $option.value = estrategia.nome;
        $option.innerHTML = estrategia.nome;
        $selectEstrategias.appendChild($option);
      });
    }

    function popularTabelaOrdens(element) {
      var $tableBody = doc.querySelector('[data-js="ordens"]');

      var $tr = doc.createElement('tr');

      var $contratos = doc.createElement('td');
      $contratos.innerHTML = 'contratos';
      $tr.appendChild($contratos);
      var $preco = doc.createElement('td');
      $preco.innerHTML = 'contratos';
      $tr.appendChild($preco);
      var $gain = doc.createElement('td');
      $gain.innerHTML = 'contratos';
      $tr.appendChild($gain);
      var $loss = doc.createElement('td');
      $loss.innerHTML = 'contratos';
      $tr.appendChild($loss);
      var $abertura = doc.createElement('td');
      $abertura.innerHTML = 'contratos';
      $tr.appendChild($abertura);
      var $fechamento = doc.createElement('td');
      $fechamento.innerHTML = 'contratos';
      $tr.appendChild($fechamento);
      var $cancelar = doc.createElement('td');
      $cancelar.innerHTML = 'contratos';
      $tr.appendChild($cancelar);

      $tableBody.appendChild($tr);
    }

    var $form = doc.querySelector('[data-js="form"]');

    $form.addEventListener('submit', function (e) {
      e.preventDefault();

      popularTabelaOrdens(this);
    });


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


    var $meta = doc.querySelector('[data-js="meta"]');
    $meta.addEventListener('blur', calcularMeta);

    function calcularMeta() {
      var metaEmReal = this.value;
      var ativo = doc.querySelector('[data-js="ativos"] > option:checked');

      var metaEmPontos = doc.querySelector('[data-js="metaEmPontos"]');

      metaEmPontos.innerHTML = `${metaEmReal ? metaEmReal / ativo.value : 0} pts`;
    }

    var $limite = doc.querySelector('[data-js="limite"]');
    $limite.addEventListener('blur', calcularLimite);

    function calcularLimite() {
      var limiteEmReal = this.value;
      var ativo = doc.querySelector('[data-js="ativos"] > option:checked');

      var limiteEmPontos = doc.querySelector('[data-js="limiteEmPontos"]');

      limiteEmPontos.innerHTML = `${limiteEmReal ? limiteEmReal / ativo.value : 0} pts`;
    }

    function contabilizarOrdens(ativo, ordem, fluxo) {
      var precoGain = 0;
      var precoLoss = 0;

      if (precoMedio) {
        if (fluxo === "abertura") {
          contabilizarAbertura(ativo, ordem);
        } else if (fluxo === "fechamento") {
          contabilizarFechamento(ativo, ordem);
        } else {
          contabilizarStop(ativo, ordem); // não está certo ainda qual a operação.
        }
      } else {
        precoMedio = ordem.preco;
        quantidadeDeContratosOperacao = ordem.quantidadeDeContratos;
        operacao = ordem.operacao;
      }

      if (operacao === "compra") {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio + (metaEmPontos / quantidadeDeContratosOperacao)
          : 0;
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio - (limiteLossEmPontos / quantidadeDeContratosOperacao)
          : 0;
      } else {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio - (metaEmPontos / quantidadeDeContratosOperacao)
          : 0;
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio + (limiteLossEmPontos / quantidadeDeContratosOperacao)
          : 0;
      }

      precoMedio = quantidadeDeContratosOperacao ? precoMedio : 0;
      operacao = quantidadeDeContratosOperacao ? "semOperacao" : operacao;

      //atualizar os valores na tela.
    }

    function atualizarPrecoOrdens(preco) {
      ordens = ordens.forEach(function (item) {
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
          ordens = ordens.map(function (item) {
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
      ordens = ordens.filter(function (item) {
        return item.index !== ordem.index;
      });

      ordensFinalizadas.push(ordem);
      ordensLog.push(ordem);
      atualizarPrecoOrdens(precoMedio);
    }

    function contabilizarStop(ordem) {
      ordens = ordens
        .map(function (item) {
          if (item.operacao === operacao && item.aberta) {
            item.preco = precoMedio;
            item.precoGain = ordem.preco;
            item.fechada = true;
            ordensFinalizadas.push(item);
          }
          return item;
        })
        .filter(function (item) {
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
          .filter(function (item) {
            return item.escalonado && item.operacao === ordem.operacao;
          })
          .reduce(function (acumulated, currentOrdem) {
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

    popularAtivos();
    popularEstrategias();
  }

  app();
})(window, document);
