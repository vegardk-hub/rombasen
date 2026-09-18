/*
 * Rombasen – det spillene deler: lyd, lagring, tilfeldighet og fargedefs.
 */
'use strict';

var Felles = (function () {

  var LAGER = 'rombasen';

  var data = {
    lyd: true,
    drivstoff: { opplaast: 1, sisteNivaa: 1 },
    stjerner: { opplaast: 1, sisteNivaa: 1 }
  };

  function lastData() {
    try {
      var raa = localStorage.getItem(LAGER);
      if (!raa) return;
      var d = JSON.parse(raa);
      if (!d || typeof d !== 'object') return;
      data.lyd = d.lyd !== false;
      ['drivstoff', 'stjerner'].forEach(function (spill) {
        if (d[spill]) {
          data[spill].opplaast = Math.max(1, d[spill].opplaast | 0);
          data[spill].sisteNivaa = Math.max(1, d[spill].sisteNivaa | 0);
        }
      });
    } catch (e) { /* privat modus eller file:// – vi klarer oss uten */ }
  }

  function lagreData() {
    try { localStorage.setItem(LAGER, JSON.stringify(data)); } catch (e) { }
  }

  lastData();

  /* ---------- lyd ---------- */

  var ctx = null;
  function kontekst() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = false; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx || null;
  }

  function tone(frekvens, forsinkelse, lengde, volum, type, sluttfrekvens) {
    var c = kontekst();
    if (!c || !data.lyd) return;
    var t = c.currentTime + forsinkelse;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(frekvens, t);
    if (sluttfrekvens) osc.frequency.exponentialRampToValueAtTime(sluttfrekvens, t + lengde);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volum, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + lengde);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + lengde + 0.05);
  }

  var Lyd = {
    plukk: function () { tone(660, 0, 0.09, 0.16, 'triangle'); },
    slipp: function () { tone(420, 0, 0.09, 0.12, 'triangle'); },
    hell: function () { tone(300, 0, 0.34, 0.14, 'sine', 620); },
    nei: function () { tone(200, 0, 0.14, 0.12, 'square', 150); },
    ferdig: function () {
      tone(660, 0, 0.12, 0.16, 'triangle');
      tone(880, 0.09, 0.16, 0.16, 'triangle');
    },
    seier: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, i * 0.13, 0.22, 0.17, 'triangle');
      });
      tone(1319, 0.55, 0.5, 0.15, 'triangle');
    }
  };

  /* ---------- tilfeldighet ---------- */

  // Mulberry32, seedet med nivånummeret – et nivå skal se likt ut hver gang.
  function lagTilfeldig(fro) {
    var a = fro >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function stokk(liste, tilfeldig) {
    for (var i = liste.length - 1; i > 0; i--) {
      var j = Math.floor(tilfeldig() * (i + 1));
      var m = liste[i]; liste[i] = liste[j]; liste[j] = m;
    }
    return liste;
  }

  /* ---------- farger ---------- */

  function heksTall(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  function tallHeks(rgb) {
    return '#' + rgb.map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }
  // Blander en farge mot hvitt (t > 0, lysere) eller svart (t < 0, mørkere).
  function juster(hex, t) {
    var rgb = heksTall(hex);
    var mot = t > 0 ? [255, 255, 255] : [0, 0, 0];
    var a = Math.abs(t);
    return tallHeks(rgb.map(function (v, i) { return v + (mot[i] - v) * a; }));
  }

  // Lager ett radialGradient-par (høylys/base/kjerneskygge) per farge, én
  // gang, slik at spillene kan referere til dem med fill="url(#gem-N)".
  function lagGemDefs(farger) {
    if (document.getElementById('gemDefs')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'gemDefs');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    farger.forEach(function (f, i) {
      var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      grad.setAttribute('id', 'gem-' + i);
      grad.setAttribute('cx', '34%'); grad.setAttribute('cy', '28%'); grad.setAttribute('r', '75%');
      [[0, juster(f.lys, 0.55)], [45, f.lys], [100, juster(f.kode, -0.28)]].forEach(function (s) {
        var stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', s[0] + '%');
        stop.setAttribute('stop-color', s[1]);
        grad.appendChild(stop);
      });
      defs.appendChild(grad);
    });
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  return {
    data: data,
    lagreData: lagreData,
    Lyd: Lyd,
    lagTilfeldig: lagTilfeldig,
    stokk: stokk,
    juster: juster,
    lagGemDefs: lagGemDefs
  };
})();
