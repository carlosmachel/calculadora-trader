;(function (win, doc) {
  'use strict'
  var self
  function Formulario () {
    this.metaEmPontos = 1000
    this.limiteEmPontos = 500
    self = this
  }

  function createOption (value, innerHtml) {
    var $option = doc.createElement('option')
    $option.value = value
    $option.innerHTML = innerHtml
    return $option
  }

  var $meta = doc.querySelector('[data-js="meta"]')
  $meta.addEventListener('blur', calcularMeta)

  var $limite = doc.querySelector('[data-js="limite"]')
  $limite.addEventListener('blur', calcularLimite)

  Formulario.prototype.popularAtivos = function popularAtivos (ativos) {
    var $selectAtivos = doc.querySelector("[data-js='ativos']")

    Object.keys(ativos).forEach(function (ativo) {
      $selectAtivos.appendChild(createOption(ativos[ativo], ativo))
    })
  }

  Formulario.prototype.popularEstrategias = function popularEstrategias (estrategia) {
    var $selectEstrategias = doc.querySelector("[data-js='estrategias']")
    $selectEstrategias.appendChild(createOption(estrategia.nome, estrategia.nome))
  }

  function getAtivoSelecionado () {
    return doc.querySelector('[data-js="ativos"] > option:checked').value
  }

  Formulario.getAtivoSelecionado = getAtivoSelecionado

  function calcularMeta () {
    var metaEmReal = this.value
    var ativo = getAtivoSelecionado()

    var metaEmPontos = doc.querySelector('[data-js="metaEmPontos"]')
    self.metaEmPontos = metaEmReal ? metaEmReal / ativo : 0

    metaEmPontos.innerHTML = `${self.metaEmPontos} pts`
  }

  function calcularLimite () {
    var limiteEmReal = this.value
    var ativo = getAtivoSelecionado()

    var limiteEmPontos = doc.querySelector('[data-js="limiteEmPontos"]')
    self.limiteEmPontos = limiteEmReal ? limiteEmReal / ativo : 0

    limiteEmPontos.innerHTML = `${self.limiteEmPontos} pts`
  }

  win.Formulario = Formulario
})(window, document)
