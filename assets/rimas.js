/* Lumbra — motor de rimas en español.
   Todo se calcula en el navegador a partir de datos/palabras-es.txt
   (palabras ordenadas de más a menos frecuente). */
(function (raiz) {
  'use strict';

  var FUERTES = 'aeoáéóíú';
  var TILDES = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };

  function sinTilde(s) {
    return s.replace(/[áéíóúü]/g, function (c) { return TILDES[c]; });
  }

  // Marca qué letras suenan como vocal.
  function vocales(p) {
    var v = [];
    for (var i = 0; i < p.length; i++) {
      var c = p[i], sig = p[i + 1] || '';
      var esVocal = 'aeiouáéíóúü'.indexOf(c) !== -1;
      // u muda en que/qui y gue/gui
      if (c === 'u' && i > 0 && (p[i - 1] === 'q' || p[i - 1] === 'g') && 'eéií'.indexOf(sig) !== -1) esVocal = false;
      // y final tras vocal suena como i (rey, estoy)
      if (c === 'y' && i === p.length - 1 && i > 0 && 'aeiouáéíóú'.indexOf(p[i - 1]) !== -1) esVocal = true;
      v.push(esVocal);
    }
    return v;
  }

  function esFuerte(c) { return FUERTES.indexOf(c) !== -1; }

  // Agrupa las vocales en núcleos silábicos (diptongos e hiatos).
  function nucleos(p) {
    var v = vocales(p), lista = [], actual = null;
    for (var i = 0; i < p.length; i++) {
      if (!v[i]) { actual = null; continue; }
      var c = p[i] === 'y' ? 'i' : p[i];
      if (actual) {
        var prev = p[actual[actual.length - 1]];
        if (prev === 'y') prev = 'i';
        if (esFuerte(prev) && esFuerte(c)) { actual = null; } // hiato
      }
      if (!actual) { actual = []; lista.push(actual); }
      actual.push(i);
    }
    return lista;
  }

  // Devuelve el índice de la vocal tónica y el número de sílabas.
  function analizar(p) {
    var ns = nucleos(p);
    if (!ns.length) return null;
    var tonico = -1;
    for (var k = 0; k < ns.length && tonico < 0; k++) {
      for (var j = 0; j < ns[k].length; j++) {
        if ('áéíóú'.indexOf(p[ns[k][j]]) !== -1) { tonico = k; break; }
      }
    }
    if (tonico < 0) {
      var ultima = p[p.length - 1];
      tonico = ns.length === 1 ? 0 : ('aeiouns'.indexOf(ultima) !== -1 ? ns.length - 2 : ns.length - 1);
    }
    var n = ns[tonico], idx = n[n.length - 1];
    var conTilde = n.filter(function (i) { return 'áéíóú'.indexOf(p[i]) !== -1; });
    var fuertes = n.filter(function (i) { return esFuerte(p[i]); });
    if (conTilde.length) idx = conTilde[0];
    else if (fuertes.length) idx = fuertes[0];
    return { nucleos: ns, tonico: tonico, indice: idx, silabas: ns.length };
  }

  // Pasa la terminación a sonido (España: distingue s y z).
  function fonetica(t) {
    t = t.replace(/ch/g, 'C').replace(/ll/g, 'Y').replace(/rr/g, 'R')
         .replace(/qu(?=[eéií])/g, 'k').replace(/gu(?=[eéií])/g, 'g').replace(/gü/g, 'gu');
    t = sinTilde(t);
    t = t.replace(/c(?=[ei])/g, 'z').replace(/c/g, 'k').replace(/g(?=[ei])/g, 'j')
         .replace(/v/g, 'b').replace(/h/g, '').replace(/x/g, 'ks').replace(/w/g, 'u');
    t = t.replace(/([aeiou])y$/, '$1i').replace(/y/g, 'Y');
    return t;
  }

  // Claves de rima de una palabra.
  function claves(p) {
    var a = analizar(p);
    if (!a) return null;
    var cola = p.slice(a.indice);
    var aso = [sinTilde(p[a.indice])];
    for (var k = a.tonico + 1; k < a.nucleos.length; k++) {
      var n = a.nucleos[k];
      var f = n.filter(function (i) { return esFuerte(p[i]); });
      var letra = p[(f.length ? f[0] : n[n.length - 1])];
      aso.push(sinTilde(letra === 'y' ? 'i' : letra));
    }
    return {
      consonante: fonetica(cola),
      asonante: aso.join('-'),
      terminacion: sinTilde(cola),
      silabas: a.silabas,
      aguda: a.tonico === a.nucleos.length - 1
    };
  }

  function Diccionario(texto) {
    this.palabras = texto.split('\n').filter(Boolean);
    this.datos = [];
    this.porForma = {};
    this.sinTildes = {};
    for (var i = 0; i < this.palabras.length; i++) {
      var w = this.palabras[i], c = claves(w);
      this.datos.push(c);
      this.porForma[w] = i;
      var s = sinTilde(w);
      if (!(s in this.sinTildes)) this.sinTildes[s] = i;
    }
  }

  // Busca rimas. Devuelve consonantes y asonantes agrupadas por sílabas.
  Diccionario.prototype.rimas = function (entrada) {
    var p = entrada.toLowerCase().trim().replace(/[^a-záéíóúüñ]/g, '');
    if (!p) return null;
    var sugerencia = null;
    if (!(p in this.porForma) && (sinTilde(p) in this.sinTildes)) {
      var cand = this.palabras[this.sinTildes[sinTilde(p)]];
      if (cand !== p) { sugerencia = cand; p = cand; }
    }
    var c = claves(p);
    if (!c) return null;
    var cons = [], aso = [];
    for (var i = 0; i < this.palabras.length; i++) {
      var w = this.palabras[i], d = this.datos[i];
      if (!d || w === p) continue;
      if (d.consonante === c.consonante) cons.push({ palabra: w, silabas: d.silabas });
      else if (d.asonante === c.asonante) aso.push({ palabra: w, silabas: d.silabas });
    }
    return { palabra: p, sugerencia: sugerencia, conocida: p in this.porForma, claves: c,
             consonantes: agrupar(cons), asonantes: agrupar(aso),
             totalConsonantes: cons.length, totalAsonantes: aso.length };
  };

  function agrupar(lista) {
    var g = {};
    lista.forEach(function (x) { (g[x.silabas] = g[x.silabas] || []).push(x.palabra); });
    return Object.keys(g).map(Number).sort(function (a, b) { return a - b; })
      .map(function (s) { return { silabas: s, palabras: g[s] }; });
  }

  var api = { claves: claves, analizar: analizar, Diccionario: Diccionario };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.LumbraRimas = api;
})(this);
