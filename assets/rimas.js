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

  // Palabras que no aportan significado al contexto.
  var VACIAS = {};
  ('a al algo algun alguna alguno algunos ante antes aqui asi aun bajo bien cada como con contra cual cuando de del desde donde dos e el ella ellas ello ellos en entre era eres es esa ese eso esta este esto estoy estan fue ha han hay he la las le les lo los mas me mi mis mucho muy nada ni no nos nosotros o os otra otro para pero poco por porque que quien se sea ser si sin sobre son su sus tambien tan tanto te ti todo todos tu tus un una uno unos unas y ya yo cancion tema letra va trata habla sobre')
    .split(' ').forEach(function (w) { VACIAS[w] = true; });

  // Vectores de significado (datos/vectores-es.bin): una fila de enteros
  // de 8 bits por palabra, en el mismo orden que la lista de palabras.
  Diccionario.prototype.cargarVectores = function (buffer) {
    var v = new Int8Array(buffer), n = this.palabras.length;
    this.dim = v.length / n;
    this.vec = v;
    this.normas = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var s = 0, o = i * this.dim;
      for (var j = 0; j < this.dim; j++) s += v[o + j] * v[o + j];
      this.normas[i] = Math.sqrt(s);
    }
  };

  Diccionario.prototype.indice = function (w) {
    if (w in this.porForma) return this.porForma[w];
    var s = sinTilde(w);
    return s in this.sinTildes ? this.sinTildes[s] : -1;
  };

  // Para el contexto: si la palabra no está, prueba quitándole el plural
  // o un prefijo (desamor → amor, reencuentro → encuentro).
  Diccionario.prototype.indiceContexto = function (w) {
    var prueba = [w, w.replace(/es$/, ''), w.replace(/s$/, '')];
    var m = w.match(/^(des|re|in|im|sin|super|ex|anti)(.{3,})$/);
    if (m) prueba.push(m[2], m[2].replace(/s$/, ''));
    for (var k = 0; k < prueba.length; k++) {
      var i = this.indice(prueba[k]);
      if (i >= 0 && this.normas[i]) return i;
    }
    return -1;
  };

  // Convierte el texto de contexto en un vector de significado.
  Diccionario.prototype.contexto = function (texto) {
    if (!this.vec || !texto) return null;
    var trozos = texto.toLowerCase().split(/[^a-záéíóúüñ]+/).filter(Boolean);
    var suma = new Float32Array(this.dim), usadas = [], ignoradas = [];
    for (var k = 0; k < trozos.length; k++) {
      var w = trozos[k];
      if (VACIAS[sinTilde(w)]) continue;
      var i = this.indiceContexto(w);
      if (i < 0) { ignoradas.push(w); continue; }
      var o = i * this.dim, nr = this.normas[i];
      for (var j = 0; j < this.dim; j++) suma[j] += this.vec[o + j] / nr;
      usadas.push(w);
    }
    if (!usadas.length) return { vector: null, usadas: usadas, ignoradas: ignoradas };
    var t = 0;
    for (j = 0; j < this.dim; j++) t += suma[j] * suma[j];
    t = Math.sqrt(t);
    for (j = 0; j < this.dim; j++) suma[j] /= t;
    return { vector: suma, usadas: usadas, ignoradas: ignoradas };
  };

  // Cercanía (coseno) entre la palabra i y el vector de contexto,
  // con un pequeño empujón a las palabras más usadas.
  Diccionario.prototype.afinidad = function (i, v) {
    var nr = this.normas[i];
    if (!nr) return -1;
    var s = 0, o = i * this.dim;
    for (var j = 0; j < this.dim; j++) s += this.vec[o + j] * v[j];
    var frec = 1 - Math.log(i + 2) / Math.log(this.palabras.length + 2);
    return s / nr + 0.06 * frec;
  };

  // Busca rimas. Devuelve consonantes y asonantes agrupadas por sílabas.
  // opciones: { contexto: vector, silabas: n (4 = 4 o más) }
  // Con contexto, cada lista va ordenada por cercanía al contexto.
  Diccionario.prototype.rimas = function (entrada, opciones) {
    opciones = opciones || {};
    var p = entrada.toLowerCase().trim().replace(/[^a-záéíóúüñ]/g, '');
    if (!p) return null;
    var sugerencia = null;
    if (!(p in this.porForma) && (sinTilde(p) in this.sinTildes)) {
      var cand = this.palabras[this.sinTildes[sinTilde(p)]];
      if (cand !== p) { sugerencia = cand; p = cand; }
    }
    var c = claves(p);
    if (!c) return null;
    var cons = [], aso = [], ctx = opciones.contexto, sil = opciones.silabas;
    for (var i = 0; i < this.palabras.length; i++) {
      var w = this.palabras[i], d = this.datos[i];
      if (!d || w === p) continue;
      if (sil && (sil >= 4 ? d.silabas < 4 : d.silabas !== sil)) continue;
      var lista = d.consonante === c.consonante ? cons : (d.asonante === c.asonante ? aso : null);
      if (!lista) continue;
      var x = { palabra: w, silabas: d.silabas };
      if (ctx) x.afinidad = this.afinidad(i, ctx);
      lista.push(x);
    }
    if (ctx) {
      var orden = function (a, b) { return b.afinidad - a.afinidad; };
      cons.sort(orden); aso.sort(orden);
    }
    return { palabra: p, sugerencia: sugerencia, conocida: p in this.porForma, claves: c,
             consonantes: ctx ? cons : agrupar(cons), asonantes: ctx ? aso : agrupar(aso),
             conContexto: !!ctx,
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
