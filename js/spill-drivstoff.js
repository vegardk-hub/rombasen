/*
 * Drivstoff-sortering – rene funksjoner, ingen DOM.
 *
 * En tank er en liste med fargenumre der indeks 0 er bunnen. Et nivå er løst
 * når hver tank enten er tom eller full av ett drivstoff. Samme spilleregler
 * som det opprinnelige flaskespillet, bare med rom-tema.
 */
'use strict';

var SpillDrivstoff = (function () {

  var FARGER = [
    { navn: 'himmelblå', kode: '#3d8bfd', lys: '#8ecbff' },
    { navn: 'korall',    kode: '#ff8a5b', lys: '#ffb18c' },
    { navn: 'gull',      kode: '#ffc857', lys: '#ffe0a3' },
    { navn: 'turkis',    kode: '#1fcfd4', lys: '#7ceef1' },
    { navn: 'lilla',     kode: '#9b5de5', lys: '#c39bff' },
    { navn: 'lime',      kode: '#b9e01f', lys: '#dcf277' },
    { navn: 'rosa',      kode: '#ff7ec4', lys: '#ffb2dc' },
    { navn: 'grønn',     kode: '#33bf4c', lys: '#79e58c' },
    { navn: 'oransje',   kode: '#ff8c2b', lys: '#ffb877' },
    { navn: 'lys blå',   kode: '#6ea3ff', lys: '#b8d2ff' }
  ];

  function kopi(tanker) {
    return tanker.map(function (t) { return t.slice(); });
  }

  function toppFarge(tank) {
    return tank.length ? tank[tank.length - 1] : -1;
  }

  function toppAntall(tank) {
    if (!tank.length) return 0;
    var farge = tank[tank.length - 1], n = 1;
    for (var i = tank.length - 2; i >= 0 && tank[i] === farge; i--) n++;
    return n;
  }

  function ensfarget(tank) {
    for (var i = 1; i < tank.length; i++) if (tank[i] !== tank[0]) return false;
    return tank.length > 0;
  }

  function erKomplett(tank, kapasitet) {
    return tank.length === kapasitet && ensfarget(tank);
  }

  function kanHelle(tanker, fra, til, kapasitet) {
    if (fra === til) return 0;
    var a = tanker[fra], b = tanker[til];
    if (!a.length || b.length >= kapasitet) return 0;
    if (b.length && toppFarge(b) !== toppFarge(a)) return 0;
    return Math.min(toppAntall(a), kapasitet - b.length);
  }

  function helle(tanker, fra, til, antall) {
    for (var i = 0; i < antall; i++) tanker[til].push(tanker[fra].pop());
  }

  function erFerdig(tanker, kapasitet) {
    for (var i = 0; i < tanker.length; i++) {
      var t = tanker[i];
      if (t.length !== 0 && !erKomplett(t, kapasitet)) return false;
    }
    return true;
  }

  function nokkel(tanker) {
    return tanker.map(function (t) { return t.join(','); }).sort().join('|');
  }

  function trekkListe(tanker, kapasitet) {
    var trekk = [];
    for (var fra = 0; fra < tanker.length; fra++) {
      var a = tanker[fra];
      if (!a.length || erKomplett(a, kapasitet)) continue;
      for (var til = 0; til < tanker.length; til++) {
        var antall = kanHelle(tanker, fra, til, kapasitet);
        if (!antall) continue;
        var b = tanker[til];
        if (!b.length && ensfarget(a)) continue;

        var poeng = 0;
        if (b.length) {
          poeng += 40;
          if (b.length + antall === kapasitet) poeng += 60;
        }
        if (antall === a.length) poeng += 15;
        poeng += antall;
        trekk.push({ fra: fra, til: til, antall: antall, poeng: poeng });
      }
    }
    trekk.sort(function (x, y) { return y.poeng - x.poeng; });
    return trekk;
  }

  function loes(tanker, kapasitet, grense) {
    grense = grense || 80000;
    var sett = {}, sti = [], teller = 0;

    function sok(st) {
      if (erFerdig(st, kapasitet)) return true;
      if (++teller > grense) return false;
      var k = nokkel(st);
      if (sett[k]) return false;
      sett[k] = 1;

      var trekk = trekkListe(st, kapasitet);
      for (var i = 0; i < trekk.length; i++) {
        var t = trekk[i];
        var ny = kopi(st);
        helle(ny, t.fra, t.til, t.antall);
        sti.push(t);
        if (sok(ny)) return true;
        sti.pop();
      }
      return false;
    }

    return sok(kopi(tanker)) ? sti.slice() : null;
  }

  function nivaaOppsett(n) {
    var farger;
    if (n <= 2) farger = 2;
    else if (n <= 5) farger = 3;
    else if (n <= 9) farger = 4;
    else if (n <= 13) farger = 5;
    else if (n <= 17) farger = 6;
    else if (n <= 22) farger = 7;
    else if (n <= 28) farger = 8;
    else if (n <= 35) farger = 9;
    else farger = 10;
    return { farger: farger, kapasitet: n <= 6 ? 3 : 4, tomme: 2 };
  }

  function lagNivaa(n) {
    var o = nivaaOppsett(n);
    var tilfeldig = Felles.lagTilfeldig(n * 7919 + 13);
    var reserve = null;

    for (var forsok = 0; forsok < 400; forsok++) {
      var enheter = [];
      for (var f = 0; f < o.farger; f++) {
        for (var i = 0; i < o.kapasitet; i++) enheter.push(f);
      }
      Felles.stokk(enheter, tilfeldig);

      var tanker = [];
      for (var b = 0; b < o.farger; b++) {
        tanker.push(enheter.slice(b * o.kapasitet, (b + 1) * o.kapasitet));
      }
      for (var t = 0; t < o.tomme; t++) tanker.push([]);
      if (erFerdig(tanker, o.kapasitet)) continue;

      var fasit = loes(tanker, o.kapasitet);
      if (!fasit) continue;
      if (fasit.length >= o.farger + 1) {
        return { tanker: tanker, kapasitet: o.kapasitet, fasit: fasit };
      }
      if (!reserve) reserve = { tanker: tanker, kapasitet: o.kapasitet, fasit: fasit };
    }

    return reserve || { tanker: [[0, 0, 0], [0], []], kapasitet: 3, fasit: null };
  }

  return {
    FARGER: FARGER,
    kopi: kopi,
    toppFarge: toppFarge,
    toppAntall: toppAntall,
    ensfarget: ensfarget,
    erKomplett: erKomplett,
    kanHelle: kanHelle,
    helle: helle,
    erFerdig: erFerdig,
    loes: loes,
    nivaaOppsett: nivaaOppsett,
    lagNivaa: lagNivaa
  };
})();
