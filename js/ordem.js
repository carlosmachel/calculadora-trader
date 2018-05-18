;(function (win) {
  'use strict'
  function Ordem (operacao, quantidadeDeContratos, preco, escalonado) {
    this.index = Ordem.calculateId()
    this.operacao = operacao
    this.quantidadeDeContratos = quantidadeDeContratos
    this.preco = preco
    this.precoGain = 0
    this.precoLoss = 0
    this.abriu = false
    this.fechadoGain = false
    this.fechadoLoss = false
    this.escalonado = escalonado
  }

  Ordem.prototype.calcularPrecoGain = function calcularPrecoGain (pontos) {
    this.precoGain = this.operacao === 'compra'
      ? +this.preco + pontos
      : +this.preco - pontos
  }

  Ordem.prototype.calcularPrecoLoss = function calcularPrecoLoss (pontos) {
    this.precoLoss = this.operacao === 'compra'
      ? +this.preco - pontos
      : +this.preco + pontos
  }

  Ordem.calculateId = (function ordem () {
    var id = 0

    return function calculateId () {
      return ++id
    }
  })()

  win.Ordem = Ordem
})(window)
