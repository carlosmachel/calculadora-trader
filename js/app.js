;(function (win, doc, Ordem, Estrategia, Formulario) {
  'use strict'
  function app () {
    var ordens = []
    var ordensFinalizadas = []
    var ordensLog = []
    var estrategias = [new Estrategia('150x100', 150, 100)]
    var operacao
    var operacoes = { semOperacao: -1, compra: 1, venda: 0 }
    var fluxo = ['abertura', 'fechamento', 'cancelamento']
    var ativos = { miniIndice: 0.2, miniDolar: 10 }

    var $tableBody = doc.querySelector('[data-js="ordens"]')

    function obterEstrategiaSelecionadas () {
      var nomeEstrategia = doc.querySelector(
        '[data-js="estrategias"]>option:checked'
      ).value

      return estrategias.filter(function (item) {
        return item.nome === nomeEstrategia
      })[0]
    }

    function gerarOrdem () {
      var operacao = doc.querySelector('[data-js="operacao"]:checked').value
      var qtdContratos = doc.querySelector('[data-js="quantidadeContratos"]')
        .value
      var preco = doc.querySelector('[data-js="preco"]').value
      var estrategia = obterEstrategiaSelecionadas()
      var encerramento = doc.querySelector('[data-js="encerramento"]').checked
      var ordem = new Ordem(operacao, qtdContratos, preco, encerramento)

      ordem.calcularPrecoGain(estrategia.pontosGain)
      ordem.calcularPrecoLoss(estrategia.pontosLoss)
      ordens.push(ordem)

      return ordem
    }

    function handlerInputBlurGain (e) {
      var ordem = ordens.filter(function (item) {
        return item.index === Number(e.target.dataset.index)
      })[0]

      ordem.precoGain = Number(e.target.value)
    }

    function handlerInputBlurLoss (e) {
      var ordem = ordens.filter(function (item) {
        return item.index === Number(e.target.dataset.index)
      })[0]

      ordem.precoLoss = Number(e.target.value)
    }

    function createInput (type, value) {
      var $input = doc.createElement('input')
      $input.type = type
      $input.value = value
      return $input
    }

    function createInputText (id, value, handler) {
      var $td = doc.createElement('td')
      var $input = createInput('number', value)
      $input.setAttribute('data-index', id)
      $input.addEventListener('blur', handler)
      return $td.appendChild($input)
    }

    function createCheckBox (value) {
      var $td = doc.createElement('td')
      var $checkBox = createInput('checkbox', value)
      return $td.appendChild($checkBox)
    }

    function handleCancelOrder (e) {
      ordens = ordens.splice(e.target.dataset.index, 1)
      var $tr = doc.querySelector(`tr[data-index="${e.target.dataset.index}"]`)
      $tableBody.removeChild($tr)
    }

    function createCancelButton (id) {
      var $td = doc.createElement('td')
      var $button = createInput('button', 'X')
      button.setAttribute('data-index', id)
      button.addEventListener('click', handleCancelOrder)

      return $td.appendChild(button)
    }

    function createTableData (innerHtml) {
      var $td = doc.createElement('td')
      $td.innerHTML = innerHtml
      return $td
    }

    function popularTabelaOrdens (ordem) {
      var $tr = doc.createElement('tr')
      $tr.setAttribute('data-index', ordem.index)

      $tr.appendChild(createTableData(ordem.quantidadeDeContratos))

      $tr.appendChild(createTableData(ordem.preco))

      $tr.appendChild(
        createInputText(ordem.index, ordem.precoGain, handlerInputBlurGain)
      )
      $tr.appendChild(
        createInputText(ordem.index, ordem.precoLoss, handlerInputBlurLoss)
      )

      $tr.appendChild(createCheckBox(ordem.aberta))

      $tr.appendChild(createCheckBox(ordem.fechada))

      $tr.appendChild(createCancelButton(ordem.index))

      $tableBody.appendChild($tr)
    }

    var $form = doc.querySelector('[data-js="form"]')
    $form.addEventListener('submit', handleSubmit)

    function handleSubmit (e) {
      e.preventDefault()
      popularTabelaOrdens(gerarOrdem())
    }

    var quantidadeDeContratosOperacao = 0
    var precoMedio = 0
    var metaEmReais
    var metaEmPontos
    var limiteLossEmReais
    var limiteLossEmPontos

    function contabilizarOrdens (ativo, ordem, fluxo) {
      var precoGain = 0
      var precoLoss = 0

      if (precoMedio) {
        if (fluxo === 'abertura') {
          contabilizarAbertura(ativo, ordem)
        } else if (fluxo === 'fechamento') {
          contabilizarFechamento(ativo, ordem)
        } else {
          contabilizarStop(ativo, ordem) // não está certo ainda qual a operação.
        }
      } else {
        precoMedio = ordem.preco
        quantidadeDeContratosOperacao = ordem.quantidadeDeContratos
        operacao = ordem.operacao
      }

      if (operacao === 'compra') {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio + metaEmPontos / quantidadeDeContratosOperacao
          : 0
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio - limiteLossEmPontos / quantidadeDeContratosOperacao
          : 0
      } else {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio - metaEmPontos / quantidadeDeContratosOperacao
          : 0
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio + limiteLossEmPontos / quantidadeDeContratosOperacao
          : 0
      }

      precoMedio = quantidadeDeContratosOperacao ? precoMedio : 0
      operacao = quantidadeDeContratosOperacao ? 'semOperacao' : operacao

      // atualizar os valores na tela.
    }

    function atualizarPrecoOrdens (preco) {
      ordens = ordens.forEach(function (item) {
        if (item.aberta) item.preco = preco
      })
    }

    function contabilizarAbertura () {
      var quantidadeDeContrato = 0
      var precoLoss = 0
      var precoGain = 0
      var valorStopGain = 0

      var quantidadeDeContratosAbertura = calcularQuantidadeDeContratosAbertura()
      if (operacao === ordem.operacao) {
        precoMedio =
          precoMedio * quantidadeDeContratosOperacao +
          ordem.preco *
            quantidadeDeContratosAbertura /
            (quantidadeDeContratosOperacao + quantidadeDeContratosAbertura)

        quantidadeDeContratosOperacao += quantidadeDeContratosAbertura
        ordem.aberta = true

        if (ordem.escalonado) {
          ordens = ordens.map(function (item) {
            if (
              item.preco === ordem.preco &&
              !item.aberta &&
              item.operacao === ordem.operacao
            ) {
              item.aberta = true
            }
            return ordem
          })
        }
        atualizarPrecoOrdens(precoMedio)
      }
    }

    function contabilizarFechamento (ordem) {
      if (operacao === ordem.operacao) {
        precoMedio += ordem.operacao === 'compra'
          ? ordem.quantidadeDeContratos * ((ordem.precoGain - precoMedio) * -1)
          : ordem.precoGain - precoMedio

        quantidadeDeContratosOperacao -= ordem.quantidadeDeContratos
      }

      ordem.fechada = true
      ordens = ordens.filter(function (item) {
        return item.index !== ordem.index
      })

      ordensFinalizadas.push(ordem)
      ordensLog.push(ordem)
      atualizarPrecoOrdens(precoMedio)
    }

    function contabilizarStop (ordem) {
      ordens = ordens
        .map(function (item) {
          if (item.operacao === operacao && item.aberta) {
            item.preco = precoMedio
            item.precoGain = ordem.preco
            item.fechada = true
            ordensFinalizadas.push(item)
          }
          return item
        })
        .filter(function (item) {
          return item !== undefined
        })

      precoMedio = ordem.Preco
      quantidadeDeContratosOperacao = ordem.quantidadeDeContratos
      operacao = ordem.operacao
      ordem.aberta = true
    }

    function calcularQuantidadeDeContratosAbertura (ordem) {
      return ordem.escalonado
        ? ordens
            .filter(function (item) {
              return item.escalonado && item.operacao === ordem.operacao
            })
            .reduce(function (acumulated, currentOrdem) {
              return acumulated + currentOrdem.quantidadeDeContratos
            }, 0)
        : ordem.quantidadeDeContratos
    }

    contabilizarOrdens(
      'miniIndice',
      {
        escalonado: true,
        quantidadeDeContrato: 2,
        preco: 10,
        operacao: 'compra'
      },
      'abertura'
    )

    Formulario.popularEstrategias(estrategias)
    Formulario.popularAtivos(ativos)
  }

  app()
})(window, document, window.Ordem, window.Estrategia, window.Formulario)
