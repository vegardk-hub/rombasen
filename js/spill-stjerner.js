/*
 * Stjernesamling – rene funksjoner, ingen DOM.
 *
 * Tolv ekte stjernetegn, hvert tegnet som et sett med punkter (stjerner)
 * og streker mellom dem, i et 0–200 koordinatsystem. Hvert punkt trenger
 * én stjerne i riktig farge. Alltid løsbart – utfordringen ligger i å
 * holde styr på fargene, ikke i rekkefølgen, så det trengs ingen løser.
 */
'use strict';

var SpillStjerner = (function () {

  // Seks farger, hentet fra samme palett som drivstoffet – blå er
  // fortsatt den vi ser mest av, resten gir variasjon å holde styr på.
  var FARGER = [0, 1, 2, 3, 4, 6].map(function (i) { return SpillDrivstoff.FARGER[i]; });

  var TEGN = [
    {
      id: 'vaeren', navn: 'Væren',
      punkter: [[100, 150], [70, 140], [60, 110], [55, 80], [65, 60], [85, 55],
                [130, 140], [140, 110], [145, 80], [135, 60], [115, 55]],
      strok: [[0, 1, 2, 3, 4, 5], [0, 6, 7, 8, 9, 10]]
    },
    {
      id: 'tyren', navn: 'Tyren',
      punkter: [[100, 105], [130, 120], [130, 160], [100, 175], [70, 160], [70, 120],
                [55, 95], [50, 65], [60, 40], [145, 95], [150, 65], [140, 40]],
      strok: [[0, 1, 2, 3, 4, 5, 0], [5, 6, 7, 8], [1, 9, 10, 11]]
    },
    {
      id: 'tvillingene', navn: 'Tvillingene',
      punkter: [[70, 60], [70, 85], [70, 110], [70, 135], [70, 160], [70, 180],
                [130, 60], [130, 85], [130, 110], [130, 135], [130, 160], [130, 180]],
      strok: [[0, 6], [5, 11], [0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]]
    },
    {
      id: 'krepsen', navn: 'Krepsen',
      punkter: [[60, 75], [42, 90], [48, 115], [70, 122], [82, 100],
                [140, 145], [158, 130], [152, 105], [130, 98], [118, 120]],
      strok: [[0, 1, 2, 3, 4, 0], [5, 6, 7, 8, 9, 5], [4, 9]]
    },
    {
      id: 'loven', navn: 'Løven',
      punkter: [[90, 62], [116, 76], [116, 104], [90, 118], [64, 104], [64, 76],
                [110, 140], [135, 150], [155, 140], [165, 115], [155, 95]],
      strok: [[0, 1, 2, 3, 4, 5, 0], [3, 6, 7, 8, 9, 10]]
    },
    {
      id: 'jomfruen', navn: 'Jomfruen',
      punkter: [[50, 60], [65, 110], [80, 60], [95, 110], [110, 60],
                [120, 95], [138, 105], [150, 90], [138, 75]],
      strok: [[0, 1, 2, 3, 4], [4, 5, 6, 7, 8, 5]]
    },
    {
      id: 'vekten', navn: 'Vekten',
      punkter: [[60, 70], [100, 70], [140, 70], [65, 100], [80, 120], [100, 128], [120, 120], [135, 100],
                [75, 150], [125, 150]],
      strok: [[0, 1, 2], [1, 5], [3, 4, 5, 6, 7], [3, 8], [7, 9], [8, 9]]
    },
    {
      id: 'skorpionen', navn: 'Skorpionen',
      punkter: [[50, 60], [65, 110], [80, 60], [95, 110], [110, 60],
                [125, 90], [140, 115], [155, 135], [168, 122], [168, 148]],
      strok: [[0, 1, 2, 3, 4, 5, 6, 7], [7, 8], [7, 9]]
    },
    {
      id: 'skytten', navn: 'Skytten',
      punkter: [[50, 150], [70, 130], [90, 110], [110, 90], [130, 70], [150, 50],
                [133, 40], [158, 65], [55, 115], [85, 145]],
      strok: [[0, 1, 2, 3, 4, 5], [5, 6], [5, 7], [8, 1, 9]]
    },
    {
      id: 'steinbukken', navn: 'Steinbukken',
      punkter: [[60, 50], [75, 90], [90, 120], [120, 50], [105, 90],
                [105, 140], [125, 150], [145, 145], [155, 128], [148, 112]],
      strok: [[0, 1, 2], [3, 4, 2], [2, 5, 6, 7, 8, 9]]
    },
    {
      id: 'vannmannen', navn: 'Vannmannen',
      punkter: [[50, 85], [66, 70], [82, 85], [98, 70], [114, 85], [130, 70],
                [50, 135], [66, 120], [82, 135], [98, 120], [114, 135], [130, 120]],
      strok: [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]]
    },
    {
      id: 'fiskene', navn: 'Fiskene',
      punkter: [[70, 45], [55, 70], [55, 110], [70, 135], [130, 45], [145, 70], [145, 110], [130, 135],
                [65, 90], [100, 90], [135, 90]],
      strok: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10]]
    }
  ];

  function farger(punktAntall, id) {
    var tilfeldig = Felles.lagTilfeldig(hashKode(id) + punktAntall * 97);
    var liste = [];
    for (var i = 0; i < punktAntall; i++) liste.push(i % FARGER.length);
    return Felles.stokk(liste, tilfeldig);
  }

  function hashKode(tekst) {
    var h = 0;
    for (var i = 0; i < tekst.length; i++) h = (h * 31 + tekst.charCodeAt(i)) >>> 0;
    return h;
  }

  var nesteId = 1;

  function lagNivaa(id) {
    var tegn = TEGN.filter(function (t) { return t.id === id; })[0];
    if (!tegn) return null;

    var fargeliste = farger(tegn.punkter.length, tegn.id);
    var punkter = tegn.punkter.map(function (p, i) {
      return { x: p[0], y: p[1], farge: fargeliste[i], fylt: false };
    });

    var bakke = [];
    var tilfeldig = Felles.lagTilfeldig(hashKode(tegn.id) * 7 + 3);
    var rekkefolge = Felles.stokk(fargeliste.slice(), tilfeldig);
    rekkefolge.forEach(function (f) { bakke.push({ id: nesteId++, farge: f }); });

    return { id: tegn.id, navn: tegn.navn, punkter: punkter, strok: tegn.strok, bakke: bakke };
  }

  function erFerdig(punkter) {
    return punkter.every(function (p) { return p.fylt; });
  }

  return {
    FARGER: FARGER,
    TEGN: TEGN,
    lagNivaa: lagNivaa,
    erFerdig: erFerdig
  };
})();
