;(function (win, doc) {
  'use strict'
  function Formulario () {}

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

  Formulario.popularAtivos = function popularAtivos (ativos) {
    var $selectAtivos = doc.querySelector("[data-js='ativos']")

    Object.keys(ativos).forEach(function (ativo) {
      $selectAtivos.appendChild(createOption(ativos[ativo], ativo))
    })
  }

  Formulario.popularEstrategias = function popularEstrategias (estrategias) {
    var $selectEstrategias = doc.querySelector("[data-js='estrategias']")

    estrategias.forEach(function (estrategia) {
      $selectEstrategias.appendChild(
        createOption(estrategia.nome, estrategia.nome)
      )
    })
  }

  function calcularMeta () {
    var metaEmReal = this.value
    var ativo = doc.querySelector('[data-js="ativos"] > option:checked')

    var metaEmPontos = doc.querySelector('[data-js="metaEmPontos"]')

    metaEmPontos.innerHTML = `${metaEmReal ? metaEmReal / ativo.value : 0} pts`
  }

  function calcularLimite () {
    var limiteEmReal = this.value
    var ativo = doc.querySelector('[data-js="ativos"] > option:checked')

    var limiteEmPontos = doc.querySelector('[data-js="limiteEmPontos"]')

    limiteEmPontos.innerHTML = `${limiteEmReal ? limiteEmReal / ativo.value : 0} pts`
  }

  win.Formulario = Formulario
})(window, document)
