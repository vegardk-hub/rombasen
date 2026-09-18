/*
 * Stjernesamling – grensesnittet.
 *
 * To skjermer: et rutenett der hun velger ett av de tolv stjernetegnene,
 * og selve spillet der løse stjerner i bakken skal trykkes på plass i
 * stjernebildet. Samme velg-og-treff-mønster som drivstoffspillet: feil
 * plass rister bare litt og lar en velge på nytt.
 */
'use strict';

var AppStjerner = (function () {

  var Spill = SpillStjerner;
  var Lyd = Felles.Lyd;
  var GEM = 'M0,-11 C1,-4 1,-4 11,0 C1,4 1,4 0,11 C-1,4 -1,4 -11,0 C-1,-4 -1,-4 0,-11 Z';
  var GLIMT = 'M0,-4 C0.3,-1.2 0.3,-1.2 4,0 C0.3,1.2 0.3,1.2 0,4 C-0.3,1.2 -0.3,1.2 -4,0 C-0.3,-1.2 -0.3,-1.2 0,-4 Z';

  var sideGrid = document.getElementById('side-stjerner-grid');
  var sideSpill = document.getElementById('side-stjerner-spill');
  var konstEl = document.getElementById('konstellasjon');
  var bakkeBoks = document.getElementById('bakkeBoks');
  var tittelEl = document.getElementById('stjernetegnTittel');

  var tilstand = {
    tegnId: null,
    navn: '',
    punkter: [],
    strok: [],
    bakke: [],
    historikk: [],
    valgt: null,
    laast: false
  };

  var elPunkter = [], elStjerner = {};

  Felles.lagGemDefs(Spill.FARGER);

  function glimtSvg(cx, cy, forsinkelse) {
    return '<path class="glimt" style="animation-delay:' + forsinkelse + 's" transform="translate(' + cx + ',' + cy + ')" d="' + GLIMT + '" fill="#ffffff"/>';
  }

  // Svak bakgrunnsstøv av små stjerner, som på et ekte stjernekart – samme
  // sett hver gang for et gitt tegn, så det ikke "hopper" ved ny tegning.
  function bakgrunnsstjerner(seed) {
    var tilfeldig = Felles.lagTilfeldig(seed);
    var svg = '';
    for (var i = 0; i < 55; i++) {
      var x = (tilfeldig() * 200).toFixed(1);
      var y = (tilfeldig() * 200).toFixed(1);
      var r = (0.5 + tilfeldig() * 1.1).toFixed(2);
      var o = (0.25 + tilfeldig() * 0.55).toFixed(2);
      svg += '<circle class="dust" cx="' + x + '" cy="' + y + '" r="' + r + '" style="fill:#ffffff;opacity:' + o + '"/>';
    }
    return svg;
  }

  /* ================= rutenett ================= */

  function tegnMiniSvg(tegn) {
    var svg = '<svg viewBox="0 0 200 200" class="tegn-mini" aria-hidden="true">' +
      '<rect width="200" height="200" fill="#000000"/>' +
      bakgrunnsstjerner(hashKode(tegn.id));
    tegn.strok.forEach(function (kjede) {
      var pts = kjede.map(function (i) { return tegn.punkter[i][0] + ',' + tegn.punkter[i][1]; }).join(' ');
      svg += '<polyline points="' + pts + '"/>';
    });
    tegn.punkter.forEach(function (p) {
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6.5"/>';
    });
    svg += '</svg>';
    return svg;
  }

  function hashKode(tekst) {
    var h = 0;
    for (var i = 0; i < tekst.length; i++) h = (h * 31 + tekst.charCodeAt(i)) >>> 0;
    return h;
  }

  function tegnGrid() {
    var container = document.getElementById('tegnGrid');
    container.innerHTML = '';
    Spill.TEGN.forEach(function (tegn) {
      var fullfort = !!Felles.data.stjerner.fullfort[tegn.id];
      var el = document.createElement('button');
      el.className = 'tegn-kort glass' + (fullfort ? ' fullfort' : '');
      el.innerHTML = tegnMiniSvg(tegn) +
        '<div class="tegn-navn">' + tegn.navn + '</div>' +
        (fullfort ? '<svg class="tegn-merke" viewBox="0 0 46 46" aria-hidden="true"><path d="M23,3 C25,15 25,15 40,20 C25,25 25,25 23,40 C21,25 21,25 6,20 C21,15 21,15 23,3 Z" fill="#ffc857"/></svg>' : '');
      el.setAttribute('aria-label', tegn.navn + (fullfort ? ', fullført' : ''));
      el.addEventListener('click', function () { velgTegn(tegn.id); });
      container.appendChild(el);
    });
  }

  function apneGrid() {
    sideSpill.classList.add('skjult');
    sideGrid.classList.remove('skjult');
    tegnGrid();
  }

  function velgTegn(id) {
    sideGrid.classList.add('skjult');
    sideSpill.classList.remove('skjult');
    startTegn(id);
  }

  /* ================= spillskjermen ================= */

  function startTegn(id) {
    var nivaa = Spill.lagNivaa(id);
    tilstand.tegnId = nivaa.id;
    tilstand.navn = nivaa.navn;
    tilstand.punkter = nivaa.punkter;
    tilstand.strok = nivaa.strok;
    tilstand.bakke = nivaa.bakke;
    tilstand.historikk = [];
    tilstand.valgt = null;
    tilstand.laast = false;
    tittelEl.textContent = nivaa.navn;
    visTips('Trykk på en stjerne, og så på riktig plass i stjernebildet 👆');
    tegn();
    oppdaterKnapper();
  }

  function startPaaNytt() {
    if (tilstand.laast) return;
    startTegn(tilstand.tegnId);
  }

  function lagKonstellasjonSvg() {
    var html = '<svg viewBox="0 0 200 200" class="konst-svg" aria-hidden="true">' +
      '<rect width="200" height="200" fill="#000000"/>' +
      bakgrunnsstjerner(hashKode(tilstand.tegnId) + 1);
    tilstand.strok.forEach(function (kjede) {
      var pts = kjede.map(function (i) {
        var p = tilstand.punkter[i];
        return p.x + ',' + p.y;
      }).join(' ');
      html += '<polyline class="konst-linje" points="' + pts + '"/>';
    });
    tilstand.punkter.forEach(function (p, i) {
      if (p.fylt) {
        html += '<g class="punkt punkt-fylt" transform="translate(' + p.x + ',' + p.y + ')">' +
          '<path d="' + GEM + '" fill="url(#gem-' + p.farge + ')" style="filter: drop-shadow(0 0 5px rgba(255,255,255,.5))"/>' +
          glimtSvg(-4, -4, (i % 5) * 0.3) +
          '</g>';
      } else {
        var farge = Spill.FARGER[p.farge];
        html += '<g class="punkt punkt-tom" data-i="' + i + '" transform="translate(' + p.x + ',' + p.y + ')">' +
          '<circle class="traff" r="16"/>' +
          '<circle class="slot" r="9" style="stroke:' + farge.kode + ';fill:' + farge.kode + '30"/>' +
          '<circle class="slot-kjerne" r="3.2" fill="' + farge.kode + '"/>' +
          '</g>';
      }
    });
    html += '</svg>';
    return html;
  }

  function tegnKonstellasjon() {
    konstEl.innerHTML = lagKonstellasjonSvg();
    elPunkter = {};
    konstEl.querySelectorAll('.punkt-tom').forEach(function (g) {
      var i = Number(g.dataset.i);
      elPunkter[i] = g;
      g.addEventListener('click', function () { klikkPunkt(i); });
    });
  }

  function tegnBakke() {
    bakkeBoks.innerHTML = '';
    elStjerner = {};
    tilstand.bakke.forEach(function (st, idx) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('viewBox', '-14 -14 28 28');
      el.setAttribute('class', 'stjerne' + (tilstand.valgt === st.id ? ' valgt' : ''));
      el.dataset.id = st.id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', Spill.FARGER[st.farge].navn + ' stjerne');
      el.innerHTML = '<path d="' + GEM + '" fill="url(#gem-' + st.farge + ')" style="filter: drop-shadow(0 0 4px rgba(255,255,255,.5))"/>' +
        glimtSvg(-4, -4, (idx % 5) * 0.3);
      el.addEventListener('click', function () { klikkStjerne(st.id); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); klikkStjerne(st.id); }
      });
      bakkeBoks.appendChild(el);
      elStjerner[st.id] = el;
    });
  }

  function tegn() {
    tegnKonstellasjon();
    tegnBakke();
  }

  /* ---------- trykk ---------- */

  function klikkStjerne(id) {
    if (tilstand.laast) return;
    if (tilstand.valgt === id) {
      tilstand.valgt = null;
      Lyd.slipp();
      tegnBakke();
      return;
    }
    tilstand.valgt = id;
    Lyd.plukk();
    skjulTips();
    tegnBakke();
  }

  function klikkPunkt(i) {
    if (tilstand.laast) return;
    var punkt = tilstand.punkter[i];
    if (tilstand.valgt === null) { rist(elPunkter[i]); return; }
    var st = tilstand.bakke.find(function (s) { return s.id === tilstand.valgt; });
    if (!st) { tilstand.valgt = null; return; }
    if (punkt.farge !== st.farge) {
      rist(elPunkter[i]);
      Lyd.nei();
      tilstand.valgt = null;
      tegnBakke();
      return;
    }
    flytt(st, i);
  }

  function rist(el) {
    if (!el) return;
    el.classList.remove('rist');
    void el.getBoundingClientRect();
    el.classList.add('rist');
    setTimeout(function () { el.classList.remove('rist'); }, 340);
  }

  /* ---------- flytting ---------- */

  function flytt(st, punktIndeks) {
    tilstand.laast = true;
    tilstand.historikk.push({
      punkter: tilstand.punkter.map(function (p) { return { x: p.x, y: p.y, farge: p.farge, fylt: p.fylt }; }),
      bakke: tilstand.bakke.map(function (s) { return { id: s.id, farge: s.farge }; })
    });
    tilstand.valgt = null;
    skjulTips();

    var eSt = elStjerner[st.id], eMaal = elPunkter[punktIndeks];
    var rSt = eSt.getBoundingClientRect(), rMaal = eMaal.getBoundingClientRect();

    var klon = eSt.cloneNode(true);
    klon.classList.remove('valgt');
    klon.classList.add('flytur');
    klon.style.left = rSt.left + 'px';
    klon.style.top = rSt.top + 'px';
    document.body.appendChild(klon);
    eSt.classList.add('borte');

    void klon.offsetWidth;
    klon.style.left = (rMaal.left + rMaal.width / 2 - rSt.width / 2) + 'px';
    klon.style.top = (rMaal.top + rMaal.height / 2 - rSt.height / 2) + 'px';
    klon.style.transform = 'scale(1.1)';
    Lyd.hell();

    setTimeout(function () {
      klon.remove();
      tilstand.bakke = tilstand.bakke.filter(function (s) { return s.id !== st.id; });
      tilstand.punkter[punktIndeks].fylt = true;
      tegn();
      Lyd.plukk();

      if (Spill.erFerdig(tilstand.punkter)) {
        setTimeout(visSeier, 300);
      } else {
        tilstand.laast = false;
        oppdaterKnapper();
      }
    }, 380);
  }

  function angre() {
    if (tilstand.laast || !tilstand.historikk.length) return;
    var forrige = tilstand.historikk.pop();
    tilstand.punkter = forrige.punkter;
    tilstand.bakke = forrige.bakke;
    tilstand.valgt = null;
    Lyd.slipp();
    tegn();
    oppdaterKnapper();
  }

  function oppdaterKnapper() {
    document.getElementById('knappAngreStjerner').disabled = tilstand.historikk.length === 0;
  }

  /* ---------- hint ---------- */

  function hint() {
    if (tilstand.laast) return;
    var maal = -1;
    for (var i = 0; i < tilstand.punkter.length; i++) {
      if (!tilstand.punkter[i].fylt) { maal = i; break; }
    }
    if (maal === -1) return;
    var farge = tilstand.punkter[maal].farge;
    var st = tilstand.bakke.find(function (s) { return s.farge === farge; });
    if (!st) return;

    tilstand.valgt = st.id;
    tegnBakke();
    elPunkter[maal].classList.add('peker');
    setTimeout(function () { elPunkter[maal] && elPunkter[maal].classList.remove('peker'); }, 4600);
    visTips('Trykk på plassen som lyser opp 👀');
  }

  /* ---------- tips ---------- */

  var tipsEl = document.getElementById('tipsStjerner');
  function visTips(tekst) {
    tipsEl.textContent = tekst || '';
    tipsEl.classList.toggle('borte', !tekst);
  }
  function skjulTips() { tipsEl.classList.add('borte'); }

  /* ---------- seier ---------- */

  var seier = document.getElementById('seierStjerner');

  function visSeier() {
    Felles.data.stjerner.fullfort[tilstand.tegnId] = true;
    Felles.lagreData();
    document.getElementById('seierTittelStjerner').textContent = 'Bra jobba!';
    document.getElementById('seierTekstStjerner').textContent =
      'Du fylte hele ' + tilstand.navn.toLowerCase() + '!';
    seier.classList.remove('skjult');
    glitterfeiring();
    Lyd.seier();

    setTimeout(function () {
      Felles.siNavn(tilstand.navn);
    }, 2300);
  }

  function glitterfeiring() {
    konfetti();
    var boks = document.getElementById('glitterStjerner');
    boks.innerHTML = '';
    var farger = Spill.FARGER;
    for (var i = 0; i < 26; i++) {
      var vinkel = Math.random() * Math.PI * 2;
      var avstand = 90 + Math.random() * 170;
      var tx = (Math.cos(vinkel) * avstand).toFixed(0) + 'px';
      var ty = (Math.sin(vinkel) * avstand).toFixed(0) + 'px';
      var farge = farger[i % farger.length];
      var el = document.createElement('div');
      el.className = 'burst-stjerne';
      el.style.setProperty('--tx', tx);
      el.style.setProperty('--ty', ty);
      el.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
      el.innerHTML = '<svg viewBox="-11 -11 22 22"><path d="' + GEM + '" fill="' + farge.lys + '"/></svg>';
      boks.appendChild(el);
    }
  }

  function konfetti() {
    var boks = document.getElementById('konfettiStjerner');
    boks.innerHTML = '';
    for (var i = 0; i < 90; i++) {
      var b = document.createElement('i');
      if (Math.random() < 0.4) b.className = 'stjerneform';
      b.style.left = (Math.random() * 100) + '%';
      b.style.background = Spill.FARGER[i % Spill.FARGER.length].kode;
      b.style.animationDelay = (Math.random() * 1.3).toFixed(2) + 's';
      b.style.animationDuration = (2 + Math.random() * 1.8).toFixed(2) + 's';
      b.style.transform = 'scale(' + (0.6 + Math.random() * 0.9).toFixed(2) + ')';
      boks.appendChild(b);
    }
  }

  /* ---------- knapper ---------- */

  document.getElementById('knappAngreStjerner').addEventListener('click', angre);
  document.getElementById('knappHintStjerner').addEventListener('click', hint);
  document.getElementById('knappStartPaaNyttStjerner').addEventListener('click', startPaaNytt);
  document.getElementById('knappTilbakeSpill').addEventListener('click', function () {
    seier.classList.add('skjult');
    apneGrid();
  });
  document.getElementById('knappSpillIgjenStjerner').addEventListener('click', function () {
    seier.classList.add('skjult');
    startTegn(tilstand.tegnId);
  });
  document.getElementById('knappNyttTegnStjerner').addEventListener('click', function () {
    seier.classList.add('skjult');
    apneGrid();
  });

  return { apneGrid: apneGrid };
})();
