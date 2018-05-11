;(function (win) {
  'use strict'
  function Estrategia (nome, pontosGain, pontosLoss) {
    this.nome = nome
    this.pontosGain = pontosGain
    this.pontosLoss = pontosLoss
  }

  Estrategia.calculateId = (function estrategia () {
    var id = 0

    return function calculateId () {
      return ++id
    }
  })()

  win.Estrategia = Estrategia
})(window)
