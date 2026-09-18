/*
 * Stjernesamling – rene funksjoner, ingen DOM.
 *
 * Et nivå har noen kurver, hver med en farge og en kapasitet. Løse
 * stjerner ligger i "bakken", og hver skal havne i kurven med samme
 * farge. Alltid løsbart – utfordringen er å holde styr på fargene, ikke
 * å finne riktig rekkefølge, så det trengs ingen løser.
 */
'use strict';

var SpillStjerner = (function () {

  var FARGER = SpillDrivstoff.FARGER;

  function nivaaOppsett(n) {
    var farger;
    if (n <= 2) farger = 2;
    else if (n <= 5) farger = 3;
    else if (n <= 9) farger = 4;
    else if (n <= 14) farger = 5;
    else if (n <= 20) farger = 6;
    else farger = Math.min(FARGER.length, 6 + Math.floor((n - 20) / 6));
    var kapasitet = n <= 6 ? 3 : (n <= 16 ? 4 : 5);
    return { farger: farger, kapasitet: kapasitet };
  }

  var nesteId = 1;

  function lagNivaa(n) {
    var o = nivaaOppsett(n);
    var tilfeldig = Felles.lagTilfeldig(n * 6151 + 31);

    var kurver = [];
    for (var f = 0; f < o.farger; f++) {
      kurver.push({ farge: f, kapasitet: o.kapasitet, fylt: 0 });
    }

    var bakke = [];
    for (var i = 0; i < o.farger; i++) {
      for (var j = 0; j < o.kapasitet; j++) {
        bakke.push({ id: nesteId++, farge: i });
      }
    }
    Felles.stokk(bakke, tilfeldig);

    return { kurver: kurver, bakke: bakke };
  }

  function erFerdig(kurver) {
    return kurver.every(function (k) { return k.fylt === k.kapasitet; });
  }

  return {
    FARGER: FARGER,
    nivaaOppsett: nivaaOppsett,
    lagNivaa: lagNivaa,
    erFerdig: erFerdig
  };
})();
