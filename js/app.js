;(function (win, doc, Ordem, Estrategia, Formulario) {
  'use strict'
  function app () {
    var quantidadeDeContratosOperacao = 0
    var precoMedio = 0
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
      var qtdContratos = Number(
        doc.querySelector('[data-js="quantidadeContratos"]').value
      )
      var preco = Number(doc.querySelector('[data-js="preco"]').value)
      var estrategia = obterEstrategiaSelecionadas()
      var encerramento = doc.querySelector('[data-js="encerramento"]').checked
      if (encerramento) {
        for (var i = 0; i < qtdContratos; i++) {
          var ordem = new Ordem(operacao, 1, preco, encerramento)
          ordem.calcularPrecoGain(estrategia.pontosGain * (i + 1))
          ordem.calcularPrecoLoss(estrategia.pontosLoss)
          popularTabelaOrdens(ordem)
          ordens.push(ordem)
        }
      } else {
        var ordem = new Ordem(operacao, qtdContratos, preco, encerramento)
        ordem.calcularPrecoGain(estrategia.pontosGain)
        ordem.calcularPrecoLoss(estrategia.pontosLoss)
        popularTabelaOrdens(ordem)
        ordens.push(ordem)
      }
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
      $td.appendChild($input)
      return $td
    }

    function createCheckBox (value, eventHandler, eventType, type) {
      var $td = doc.createElement('td')
      var $checkBox = createInput('checkbox', value)
      $checkBox.setAttribute('data-js', type)
      if (eventHandler) {
        $checkBox.addEventListener(eventType, handleClickOrderOpen)
      }
      $td.appendChild($checkBox)
      return $td
    }

    function getOrder (id) {
      return ordens.filter(function (ordem) {
        return ordem.index === Number(id)
      })[0]
    }

    function handleCancelOrder (e) {
      ordens = getOrder(e.target.dataset.index)
      var $tr = doc.querySelector(`tr[data-index="${e.target.dataset.index}"]`)
      $tableBody.removeChild($tr)
    }

    function createCancelButton (id) {
      var $td = doc.createElement('td')
      var $button = createInput('button', 'X')
      $button.setAttribute('data-index', id)
      $button.addEventListener('click', handleCancelOrder)
      $td.appendChild($button)
      return $td
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

      $tr.appendChild(
        createCheckBox(ordem.abriu, handleClickOrderOpen, 'click', 'abriu')
      )
      $tr.appendChild(createCheckBox(ordem.fechadoGain))
      $tr.appendChild(createCheckBox(ordem.fechadoLoss))
      $tr.appendChild(createCancelButton(ordem.index))

      $tableBody.appendChild($tr)
    }

    var $form = doc.querySelector('[data-js="form"]')
    $form.addEventListener('submit', handleSubmit)

    function handleSubmit (e) {
      e.preventDefault()
      gerarOrdem()
    }

    function handleClickOrderOpen (e) {
      var ordem = getOrder(e.target.parentElement.parentElement.dataset.index)

      ordens.forEach(function (item) {
        if (item.preco === ordem.preco) {
          var $checkbox = doc.querySelector(
            `[data-index="${item.index}"]>td>[data-js="abriu"]`
          )
          $checkbox.setAttribute('disabled', 'disabled')
          $checkbox.checked = 'checked'

          item.abriu = !item.abriu
        }
      })
      contabilizarOrdens(Formulario.getAtivoSelecionado(), ordem, 'abertura')
    }

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
          ? precoMedio + formulario.metaEmPontos / quantidadeDeContratosOperacao
          : 0
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio -
              formulario.limiteEmPontos / quantidadeDeContratosOperacao
          : 0
      } else {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio - formulario.metaEmPontos / quantidadeDeContratosOperacao
          : 0
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio +
              formulario.limiteEmPontos / quantidadeDeContratosOperacao
          : 0
      }

      precoMedio = quantidadeDeContratosOperacao ? precoMedio : 0
      operacao = quantidadeDeContratosOperacao ? operacao : 'semOperacao'

      atualizarResumo(operacao, precoMedio, precoGain, precoLoss, ordem)
      // atualizar os valores na tela.
    }

    function atualizarResumo (
      operacao,
      precoMedio,
      precoGain,
      precoLoss,
      ordem
    ) {
      var $stopGain = doc.querySelector('[data-js-value="stopGain"]')
      $stopGain.textContent = precoGain
      var $stopLoss = doc.querySelector('[data-js-value="stopLoss"]')
      $stopLoss.textContent = precoLoss
      var $precoMedio = doc.querySelector('[data-js-value="precoMedio"]')
      $precoMedio.textContent = precoMedio
      var $quantidadeDeContratosAbertos = doc.querySelector(
        '[data-js-value="quantidadeDeContratosAbertos"]'
      )
      $quantidadeDeContratosAbertos.textContent = quantidadeDeContratosOperacao

      var $operacao = doc.querySelector('[data-js-value="operacao"]')
      $operacao.textContent = operacao
    }

    function atualizarPrecoOrdens (preco) {
      ordens.forEach(function (item) {
        if (item.aberta) item.preco = preco
      })
    }

    function contabilizarAbertura (ativo, ordem) {
      var quantidadeDeContrato = 0
      var precoLoss = 0
      var precoGain = 0
      var valorStopGain = 0

      var quantidadeDeContratosAbertura = calcularQuantidadeDeContratosAbertura(
        ordem
      )
      if (operacao === ordem.operacao) {
        precoMedio =
          (precoMedio * quantidadeDeContratosOperacao +
            ordem.preco * quantidadeDeContratosAbertura) /
          (quantidadeDeContratosOperacao + quantidadeDeContratosAbertura)

        quantidadeDeContratosOperacao += quantidadeDeContratosAbertura
        ordem.abriu = true

        if (ordem.escalonado) {
          ordens = ordens.map(function (item) {
            if (
              item.preco === ordem.preco &&
              !item.abriu &&
              item.operacao === ordem.operacao
            ) {
              item.abriu = true
            }
            return item
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
      ordem.abriu = true
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

    var formulario = new Formulario()

    formulario.popularEstrategias(estrategias)
    formulario.popularAtivos(ativos)
  }

  app()
})(window, document, window.Ordem, window.Estrategia, window.Formulario)
