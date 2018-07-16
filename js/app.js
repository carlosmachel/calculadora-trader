;(function (win, doc, Ordem, Estrategia, Formulario) {
  'use strict'
  function app () {
    var quantidadeDeContratosOperacao = 0
    var precoMedio = 0
    var ordens = []
    var ordensFinalizadas = []
    var ordensLog = []
    var estrategias = []
    var operacao
    var operacoes = { semOperacao: -1, compra: 1, venda: 0 }
    var fluxo = ['abertura', 'fechamento', 'cancelamento']
    var ativos = { miniIndice: 0.2, miniDolar: 10 }

    var $tableBody = doc.querySelector('[data-js="ordens"]')
    var $tableBodyEstrategia = doc.querySelector('[data-js="estrategia"]')

    function obterEstrategiaSelecionadas () {
      var nomeEstrategia = doc.querySelector('[data-js="estrategias"]>option:checked').value

      return estrategias.filter(function (item) {
        return item.nome === nomeEstrategia
      })[0]
    }

    function gerarEstrategia () {
      var nome = doc.querySelector('[data-js="nomeEstrategia"]').value
      var quantidadesPontosGain = doc.querySelector('[data-js="quantidadePontosGain"]').value
      var quantidadesPontosLoss = doc.querySelector('[data-js="quantidadePontosLoss"]').value

      var estrategia = new Estrategia(nome, quantidadesPontosGain, quantidadesPontosLoss)
      estrategias.push(estrategia)
      popularTabelaEstrategias(estrategia)
      formulario.popularEstrategias(estrategia)
    }

    function gerarOrdem () {
      var operacao = doc.querySelector('[data-js="operacao"]:checked').value
      var qtdContratos = Number(doc.querySelector('[data-js="quantidadeContratos"]').value)
      var preco = Number(doc.querySelector('[data-js="preco"]').value)
      var estrategia = obterEstrategiaSelecionadas()
      var encerramento = doc.querySelector('[data-js="encerramento"]').checked
      if (encerramento) {
        for (var i = 0; i < qtdContratos; i++) {
          var ordem = new Ordem(operacao, 1, preco, encerramento)
          ordem.calcularPrecoGain(+estrategia.pontosGain * (i + 1))
          ordem.calcularPrecoLoss(+estrategia.pontosLoss)
          popularTabelaOrdens(ordem)
          ordens.push(ordem)
        }
      } else {
        var ordem = new Ordem(operacao, qtdContratos, preco, encerramento)
        ordem.calcularPrecoGain(+estrategia.pontosGain)
        ordem.calcularPrecoLoss(+estrategia.pontosLoss)
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

    function createButton (children) {
      var $button = doc.createElement('button')
      $button.appendChild(children)
      return $button
    }

    function createInputText (id, value, handler) {
      var $td = doc.createElement('td')
      var $input = createInput('number', value)
      $input.setAttribute('data-index', id)
      $input.addEventListener('blur', handler)
      $td.appendChild($input)
      return $td
    }

    function createCheckBox (value, eventHandler, eventType, type, disabled) {
      var $td = doc.createElement('td')
      var $checkBox = createInput('checkbox', value)
      $checkBox.setAttribute('data-js', type)
      if (disabled) {
        $checkBox.setAttribute('disabled', 'disabled')
      }
      if (eventHandler) {
        $checkBox.addEventListener(eventType, eventHandler)
      }
      $td.appendChild($checkBox)
      return $td
    }

    function createCancelButton (id, handleCancel) {
      var $td = doc.createElement('td')
      var $i = doc.createElement('i')
      $i.classList.add('fas', 'fa-trash')
      var $button = createButton($i)
      $button.setAttribute('data-index', id)
      $button.setAttribute('data-js', id)
      $button.classList.add('button-icon', 'button-icon--remove')
      $button.addEventListener('click', handleCancel)
      $td.appendChild($button)
      return $td
    }

    function getOrder (id) {
      return ordens.filter(function (ordem) {
        return ordem.index === Number(id)
      })[0]
    }

    function getEstrategia (id) {
      return estrategias.filter(function (estrategia) {
        return estrategia.index === Number(id)
      })[0]
    }

    function removeOrderTable (ordem) {
      var $tr = doc.querySelector(`tr[data-index="${ordem.index}"]`)
      $tableBody.removeChild($tr)
    }

    function removeEstrategiaTable (estrategia) {
      var $tr = doc.querySelector(`tr[data-index="${estrategia.nome}"]`)
      $tableBodyEstrategia.removeChild($tr)
    }

    function handleCancelOrder (e) {
      var ordem = getOrder(e.target.dataset.index)
      removeOrder(ordem)
      removeOrderTable(ordem)
    }

    function handleCancelEstrategia (e) {
      var estrategia = getEstrategia(e.target.dataset.index)
      removeEstrategia(estrategia)
      removeEstrategiaTable(estrategia)
    }

    function handleClickOrderOpen (e) {
      var ordem = getOrder(e.target.parentElement.parentElement.dataset.index)

      ordens.forEach(function (item) {
        if (item.preco === ordem.preco) {
          item.abriu = !item.abriu

          var $checkbox = doc.querySelector(`[data-index="${item.index}"]>td>[data-js="abriu"]`)
          $checkbox.setAttribute('disabled', 'disabled')
          $checkbox.checked = 'checked'

          $checkbox = doc.querySelector(`[data-index="${item.index}"]>td>[data-js="gain"]`)
          $checkbox.removeAttribute('disabled')

          $checkbox = doc.querySelector(`[data-index="${item.index}"]>td>[data-js="loss"]`)
          $checkbox.removeAttribute('disabled')

          var $button = doc.querySelector(`[data-index="${item.index}"]>td>[data-js="${item.index}"]`)
          $button.setAttribute('disabled', 'disabled')
        }
      })
      contabilizarOrdens(Formulario.getAtivoSelecionado(), ordem, 'abertura')
    }

    function handleClickOrderGainClose (e) {
      var ordem = getOrder(e.target.parentElement.parentElement.dataset.index)

      ordens.forEach(function (item) {
        if (item.preco === ordem.preco) {
          var $checkbox = doc.querySelector(`[data-index="${item.index}"]>td>[data-js="gain"]`)
          $checkbox.setAttribute('disabled', 'disabled')
          $checkbox.checked = 'checked'
          item.fechadoGain = !item.fechadoGain
        }
      })
      contabilizarOrdens(Formulario.getAtivoSelecionado(), ordem, 'fechamento')
    }

    function handleClickOrderLossClose (e) {
      var ordem = getOrder(e.target.parentElement.parentElement.dataset.index)

      ordens.forEach(function (item) {
        if (item.preco === ordem.preco) {
          var $checkbox = doc.querySelector(`[data-index="${item.index}"]>td>[data-js="loss"]`)
          $checkbox.setAttribute('disabled', 'disabled')
          $checkbox.checked = 'checked'
          item.fechadoLoss = !item.fechadoLoss
        }
      })
      contabilizarOrdens(Formulario.getAtivoSelecionado(), ordem, 'fechamento')
    }

    function createTableData (innerHtml) {
      var $td = doc.createElement('td')
      $td.innerHTML = innerHtml
      return $td
    }

    function popularTabelaOrdens (ordem) {
      var $tr = doc.createElement('tr')
      $tr.appendChild(createTableData(''))
      $tr.setAttribute('data-index', ordem.index)

      $tr.appendChild(createTableData(ordem.quantidadeDeContratos))

      $tr.appendChild(createTableData(ordem.preco))

      $tr.appendChild(createInputText(ordem.index, ordem.precoGain, handlerInputBlurGain))
      $tr.appendChild(createInputText(ordem.index, ordem.precoLoss, handlerInputBlurLoss))

      $tr.appendChild(createCheckBox(ordem.abriu, handleClickOrderOpen, 'click', 'abriu', false))
      $tr.appendChild(createCheckBox(ordem.fechadoGain, handleClickOrderGainClose, 'click', 'gain', true))
      $tr.appendChild(createCheckBox(ordem.fechadoLoss, handleClickOrderLossClose, 'click', 'loss', true))

      $tr.appendChild(createCancelButton(ordem.index, handleCancelOrder))
      $tableBody.appendChild($tr)
    }

    function popularTabelaEstrategias (estrategia) {
      var $tr = doc.createElement('tr')
      $tr.setAttribute('data-index', estrategia.id)
      $tr.appendChild(createTableData(''))
      $tr.appendChild(createTableData(estrategia.nome))
      $tr.appendChild(createTableData(estrategia.pontosGain))
      $tr.appendChild(createTableData(estrategia.pontosLoss))
      $tr.appendChild(createCancelButton(estrategia.index, handleCancelEstrategia))
      $tableBodyEstrategia.appendChild($tr)
    }

    var $formOperacao = doc.querySelector('[data-js="form-operacao"]')
    $formOperacao.addEventListener('submit', handleSubmitOperacao)

    var $formEstrategia = doc.querySelector('[data-js="form-estrategia"]')
    $formEstrategia.addEventListener('submit', handleSubmitEstrategia)

    function handleSubmitOperacao (e) {
      e.preventDefault()
      gerarOrdem()
    }

    function handleSubmitEstrategia (e) {
      e.preventDefault()
      gerarEstrategia()
    }

    function contabilizarOrdens (ativo, ordem, fluxo) {
      var precoGain = 0
      var precoLoss = 0

      if (precoMedio) {
        if (operacao !== ordem.operacao && ordem.quantidadeDeContratos > quantidadeDeContratosOperacao) {
          contabilizarViradaDeMao(ordem)
        } else if (fluxo === 'abertura') {
          contabilizarAbertura(ordem)
        } else {
          contabilizarFechamento(ordem)
        }
      } else {
        precoMedio = ordem.preco
        quantidadeDeContratosOperacao = calcularQuantidadeDeContratosAbertura(ordem)
        operacao = ordem.operacao
      }

      if (operacao === 'compra') {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio + formulario.metaEmPontos / quantidadeDeContratosOperacao
          : 0
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio - formulario.limiteEmPontos / quantidadeDeContratosOperacao
          : 0
      } else {
        precoGain = quantidadeDeContratosOperacao
          ? precoMedio - formulario.metaEmPontos / quantidadeDeContratosOperacao
          : 0
        precoLoss = quantidadeDeContratosOperacao
          ? precoMedio + formulario.limiteEmPontos / quantidadeDeContratosOperacao
          : 0
      }

      precoMedio = quantidadeDeContratosOperacao ? precoMedio : 0
      operacao = quantidadeDeContratosOperacao ? operacao : 'semOperacao'

      atualizarResumo(operacao, precoMedio, precoGain, precoLoss, ordem)
    }

    function atualizarResumo (operacao, precoMedio, precoGain, precoLoss, ordem) {
      var $stopGain = doc.querySelector('[data-js-value="stopGain"]')
      $stopGain.textContent = Math.round(Number(precoGain))
      var $stopLoss = doc.querySelector('[data-js-value="stopLoss"]')
      $stopLoss.textContent = Math.round(Number(precoLoss))
      var $precoMedio = doc.querySelector('[data-js-value="precoMedio"]')
      $precoMedio.textContent = Math.round(Number(precoMedio))
      var $quantidadeDeContratosAbertos = doc.querySelector('[data-js-value="quantidadeDeContratosAbertos"]')
      $quantidadeDeContratosAbertos.textContent = quantidadeDeContratosOperacao
        ? quantidadeDeContratosOperacao
        : quantidadeDeContratosOperacao

      var $operacao = doc.querySelector('[data-js-value="operacao"]')
      $operacao.textContent = operacao === 'compra'
        ? 'ponta compradora'
        : operacao === 'venda' ? 'ponta vendedora' : 'sem operação'
      highlightResumoOperacao(operacao, $operacao)
    }

    function highlightResumoOperacao (operacao, $operacao) {
      const operacoes = {
        compra: 'resumo__operacao--compra',
        venda: 'resumo__operacao--venda'
      }

      $operacao.classList = ''
      $operacao.classList.add(operacoes[operacao])
    }

    function atualizarPrecoOrdens (preco) {
      ordens.forEach(function (item) {
        if (item.aberta) item.preco = Math.round(Number(preco))
      })
    }

    function removeOrder (ordem) {
      ordens = ordens.filter(function (item) {
        return item.index !== ordem.index
      })
    }

    function removeEstrategia(estrategia) {
      estrategias = estrategias.filter(function (item) {
        return item.nome !== estrategia.nome
      })
    }

    function contabilizarAbertura (ordem) {
      var precoLoss = 0
      var precoGain = 0
      var valorStopGain = 0

      var quantidadeDeContratosAbertura = calcularQuantidadeDeContratosAbertura(ordem)

      if (ordem.operacao === operacao) {
        precoMedio =
          (precoMedio * quantidadeDeContratosOperacao + ordem.preco * quantidadeDeContratosAbertura) /
          (quantidadeDeContratosOperacao + quantidadeDeContratosAbertura)

        quantidadeDeContratosOperacao += quantidadeDeContratosAbertura
      } else {
        var quantidadeDePontos = (precoMedio - ordem.preco) * quantidadeDeContratosAbertura
        quantidadeDePontos = operacao === 'compra' ? quantidadeDePontos : quantidadeDePontos * -1
        quantidadeDeContratosOperacao -= quantidadeDeContratosAbertura
        precoMedio += quantidadeDePontos / quantidadeDeContratosOperacao
      }

      if (ordem.escalonado) {
        ordens = ordens.map(function (item) {
          if (item.preco === ordem.preco && !item.abriu && item.operacao === ordem.operacao) {
            item.abriu = true
          }
          return item
        })
      }
      atualizarPrecoOrdens(precoMedio)
    }

    function contabilizarFechamento (ordem) {
      var quantidadeEmPontos = ordem.fechadoGain ? ordem.precoGain - precoMedio : ordem.precoLoss - precoMedio
      var quantidadeContratosFechamento = calcularQuantidadeContratosFechamento(ordem)
      quantidadeEmPontos = quantidadeEmPontos * quantidadeContratosFechamento
      quantidadeDeContratosOperacao -= quantidadeContratosFechamento
      precoMedio += quantidadeEmPontos / quantidadeDeContratosOperacao * -1

      var excluir = false
      ordens.forEach(function (item) {
        excluir =
          (ordem.fechadoGain && item.precoGain === ordem.precoGain) ||
          (ordem.fechadoLoss && item.precoLoss === ordem.precoLoss)
        if (excluir) {
          removeOrder(item)
          removeOrderTable(item)
          ordensFinalizadas.push(item)
          ordensLog.push(item)
        }
      })

      atualizarPrecoOrdens(precoMedio)
    }

    function operacaoGain (preco) {
      return (operacao === 'compra' && preco >= precoMedio) || (operacao === 'venda' && preco <= precoMedio)
    }

    function contabilizarViradaDeMao (ordem) {
      ordens = ordens.map(function (item) {
        if (item.operacao === operacao && item.abriu) {
          item.preco = precoMedio
          if (operacaoGain(ordem.preco)) {
            item.precoGain = ordem.preco
            item.fechadoGain = true
          } else {
            item.precoLoss = ordem.preco
            item.fechadoLoss = true
          }
        }
        return item
      })

      ordens.forEach(function (item) {
        if (item.fechadoGain || item.fechadoLoss) {
          removeOrderTable(item)
          ordensFinalizadas.push(item)
          ordensLog.push(item)
        }
      })

      precoMedio = ordem.preco
      ordem.quantidadeDeContratos -= quantidadeDeContratosOperacao
      quantidadeDeContratosOperacao = ordem.quantidadeDeContratos
      operacao = ordem.operacao
    }

    function calcularQuantidadeDeContratosAbertura (ordem) {
      return ordem.escalonado
        ? ordens
            .filter(function (item) {
              return (
                item.escalonado === ordem.escalonado && item.operacao === ordem.operacao && item.preco === ordem.preco
              )
            })
            .reduce(function (acumulated, currentOrdem) {
              return acumulated + currentOrdem.quantidadeDeContratos
            }, 0)
        : ordens
            .filter(function (item) {
              return item.preco === ordem.preco && item.operacao === ordem.operacao
            })
            .reduce(function (acumulated, currentOrdem) {
              return acumulated + currentOrdem.quantidadeDeContratos
            }, 0)
    }

    function calcularQuantidadeContratosFechamento (ordem) {
      return ordens
        .filter(function (item) {
          return (
            item.operacao == ordem.operacao &&
            ((ordem.fechadoGain && item.precoGain === ordem.precoGain) ||
              (ordem.fechadoLoss && item.precoLoss === ordem.precoLoss))
          )
        })
        .reduce(function (acumulated, currentOrdem) {
          return acumulated + currentOrdem.quantidadeDeContratos
        }, 0)
    }

    var formulario = new Formulario()
    formulario.popularAtivos(ativos)
  }

  app()
})(window, document, window.Ordem, window.Estrategia, window.Formulario)
