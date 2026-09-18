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

  // Punktene er lagt så nært den virkelige stjernefiguren som en enkel
  // strektegning tillater – de kjente linjemønstrene astronomibøker
  // bruker, ikke en oppspedd fantasiform.
  var TEGN = [
    {
      // Væren: en enkel bue av fire–fem stjerner (Hamal, Sheratan, Mesarthim …)
      id: 'vaeren', navn: 'Væren',
      punkter: [[45, 120], [70, 100], [98, 80], [122, 55], [138, 38]],
      strok: [[0, 1, 2, 3, 4]]
    },
    {
      // Tyren: Hyadenes V-formede «ansikt» med Aldebaran i spissen, og to horn
      id: 'tyren', navn: 'Tyren',
      punkter: [[70, 90], [85, 110], [100, 122], [120, 105], [135, 85],
                [55, 60], [45, 30], [150, 55], [160, 25]],
      strok: [[0, 1, 2, 3, 4], [0, 5, 6], [4, 7, 8]]
    },
    {
      // Tvillingene: to hoder tett sammen øverst, kropp ned, bein som deler seg
      id: 'tvillingene', navn: 'Tvillingene',
      punkter: [[88, 28], [116, 33], [80, 64], [128, 68], [75, 103], [138, 108],
                [55, 138], [153, 143], [38, 168], [163, 173], [68, 172], [138, 168]],
      strok: [[0, 2, 4, 6, 8], [6, 10], [1, 3, 5, 7, 9], [7, 11], [2, 3]]
    },
    {
      // Krepsen: svak, enkel Y-form rundt Krybben-stjernehopen
      id: 'krepsen', navn: 'Krepsen',
      punkter: [[100, 20], [100, 55], [100, 90], [70, 130], [130, 130], [55, 160], [145, 160]],
      strok: [[0, 1, 2], [2, 3, 5], [2, 4, 6]]
    },
    {
      // Løven: sigden (baklengs spørsmålstegn) for manken, og en trekant for kroppen
      id: 'loven', navn: 'Løven',
      punkter: [[70, 140], [65, 115], [72, 90], [88, 72], [105, 68], [112, 85],
                [115, 140], [150, 130], [165, 110]],
      strok: [[0, 1, 2, 3, 4, 5], [0, 6, 7, 8], [4, 6]]
    },
    {
      // Jomfruen: bred Y-form med Spica i bunnen, to armer opp
      id: 'jomfruen', navn: 'Jomfruen',
      punkter: [[100, 172], [100, 137], [100, 112], [75, 87], [55, 62], [40, 42],
                [125, 87], [148, 64], [165, 44]],
      strok: [[0, 1, 2], [2, 3, 4, 5], [2, 6, 7, 8]]
    },
    {
      // Vekten: den skjeve firkanten mellom Zubenelgenubi og Zubeneschamali
      id: 'vekten', navn: 'Vekten',
      punkter: [[70, 70], [140, 85], [120, 140], [60, 125], [155, 115], [165, 95]],
      strok: [[0, 1, 2, 3, 0], [1, 4, 5]]
    },
    {
      // Skorpionen: den lange, karakteristiske hale-kroken med brodden ytterst
      id: 'skorpionen', navn: 'Skorpionen',
      punkter: [[40, 60], [55, 75], [70, 85], [85, 100], [95, 120], [100, 145],
                [110, 165], [125, 178], [145, 182], [162, 170], [172, 150], [168, 128]],
      strok: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]
    },
    {
      // Skytten: «tekannen» – kroppen, tuten og hanken
      id: 'skytten', navn: 'Skytten',
      punkter: [[70, 90], [110, 80], [130, 105], [115, 140], [75, 140],
                [150, 90], [168, 80], [55, 110], [50, 125]],
      strok: [[0, 1, 2, 3, 4, 0], [2, 5, 6], [0, 7, 8, 4]]
    },
    {
      // Steinbukken: den brede, flate båt-/trekantformen
      id: 'steinbukken', navn: 'Steinbukken',
      punkter: [[50, 90], [70, 120], [85, 135], [100, 145], [115, 140], [140, 130], [165, 95], [120, 75]],
      strok: [[0, 1, 2, 3, 4, 5, 6, 7, 0]]
    },
    {
      // Vannmannen: vannkrukken (Y-form) med to bølgende strømmer av vann
      id: 'vannmannen', navn: 'Vannmannen',
      punkter: [[100, 50], [100, 80], [80, 100], [120, 95],
                [65, 125], [75, 150], [60, 175], [135, 120], [150, 145], [140, 172]],
      strok: [[0, 1], [1, 2, 4, 5, 6], [1, 3, 7, 8, 9]]
    },
    {
      // Fiskene: to lange kjeder som møtes i knuten og ender i hver sin fisk-sirkel
      id: 'fiskene', navn: 'Fiskene',
      punkter: [[100, 110], [80, 90], [55, 75], [35, 55], [25, 30], [45, 20], [65, 32],
                [125, 125], [150, 140], [170, 160], [165, 185], [140, 190], [120, 175]],
      strok: [[0, 1, 2, 3, 4, 5, 6], [0, 7, 8, 9, 10, 11, 12]]
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
