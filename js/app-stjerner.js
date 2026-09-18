/*
 * Stjernesamling – grensesnittet.
 *
 * Trykk på en stjerne i bakken, og så på kurven med samme farge. Feil kurv
 * rister bare litt og lar en velge på nytt – akkurat som i drivstoffspillet.
 */
'use strict';

var AppStjerner = (function () {

  var Spill = SpillStjerner;
  var Lyd = Felles.Lyd;
  var GEM = 'M0,-11 C1,-4 1,-4 11,0 C1,4 1,4 0,11 C-1,4 -1,4 -11,0 C-1,-4 -1,-4 0,-11 Z';

  var initialisert = false;

  var tilstand = {
    nivaa: 1,
    kurver: [],
    bakke: [],
    historikk: [],
    valgt: null,
    laast: false
  };

  var side = document.getElementById('side-stjerner');
  var kurveRad = document.getElementById('kurveRad');
  var bakkeBoks = document.getElementById('bakkeBoks');
  var elKurver = [], elStjerner = {};

  Felles.lagGemDefs(Spill.FARGER);

  /* ---------- oppsett av nivå ---------- */

  function startNivaa(n) {
    var nivaa = Spill.lagNivaa(n);
    tilstand.nivaa = n;
    tilstand.kurver = nivaa.kurver;
    tilstand.bakke = nivaa.bakke;
    tilstand.historikk = [];
    tilstand.valgt = null;
    tilstand.laast = false;
    Felles.data.stjerner.sisteNivaa = n;
    Felles.lagreData();
    document.getElementById('nivaaTallStjerner').textContent = n;
    visTips(n === 1 ? 'Trykk på en stjerne, og så på riktig kurv 👆' : '');
    tegn();
    oppdaterKnapper();
  }

  function startPaaNytt() {
    if (tilstand.laast) return;
    var nivaa = Spill.lagNivaa(tilstand.nivaa);
    tilstand.kurver = nivaa.kurver;
    tilstand.bakke = nivaa.bakke;
    tilstand.historikk = [];
    tilstand.valgt = null;
    Lyd.slipp();
    tegn();
    oppdaterKnapper();
  }

  /* ---------- tegning ---------- */

  function posisjoner(k) {
    var pts = [];
    var step = k > 1 ? 64 / (k - 1) : 0;
    for (var i = 0; i < k; i++) {
      var x = 16 + i * step;
      var y = 48 + (k > 1 ? (i % 2 === 0 ? -15 : 15) : 0);
      pts.push([x, y]);
    }
    return pts;
  }

  function lagKurveSvg(kurv) {
    var pts = posisjoner(kurv.kapasitet);
    var linje = pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var html = '<svg viewBox="0 0 96 96">' +
      '<polyline points="' + linje + '" fill="none" stroke="#7c8fc4" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round" opacity="0.7"/>';
    pts.forEach(function (p, i) {
      if (i < kurv.fylt) {
        html += '<g transform="translate(' + p[0] + ',' + p[1] + ')" style="filter: drop-shadow(0 3px 3px rgba(0,0,0,.4))">' +
          '<path d="' + GEM.replace(/[-\d.]+/g, function (num) { return (parseFloat(num) * 1.4).toFixed(1); }) + '" fill="url(#gem-' + kurv.farge + ')"/></g>';
      } else {
        html += '<circle class="slot" cx="' + p[0] + '" cy="' + p[1] + '" r="10"/>';
      }
    });
    html += '</svg>';
    return html;
  }

  function tegnKurver() {
    kurveRad.innerHTML = '';
    elKurver = [];
    tilstand.kurver.forEach(function (kurv, i) {
      var el = document.createElement('button');
      el.className = 'kurve';
      if (kurv.fylt >= kurv.kapasitet) el.classList.add('full');
      el.innerHTML = lagKurveSvg(kurv) +
        '<div class="kurve-tekst" style="color:' + Felles.juster(Spill.FARGER[kurv.farge].lys, 0.4) + '">' +
        kurv.fylt + ' av ' + kurv.kapasitet + ' ' + Spill.FARGER[kurv.farge].navn + '</div>';
      el.addEventListener('click', function () { klikkKurve(i); });
      kurveRad.appendChild(el);
      elKurver[i] = el;
    });
  }

  function tegnBakke() {
    bakkeBoks.innerHTML = '';
    elStjerner = {};
    tilstand.bakke.forEach(function (st) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('viewBox', '0 0 24 24');
      el.setAttribute('class', 'stjerne' + (tilstand.valgt === st.id ? ' valgt' : ''));
      el.dataset.id = st.id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', Spill.FARGER[st.farge].navn + ' stjerne');
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M12,1 C13,7 13,7 23,12 C13,17 13,17 12,23 C11,17 11,17 1,12 C11,7 11,7 12,1 Z');
      p.setAttribute('fill', 'url(#gem-' + st.farge + ')');
      el.appendChild(p);
      el.addEventListener('click', function () { klikkStjerne(st.id); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); klikkStjerne(st.id); }
      });
      bakkeBoks.appendChild(el);
      elStjerner[st.id] = el;
    });
  }

  function tegn() {
    tegnKurver();
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

  function klikkKurve(i) {
    if (tilstand.laast) return;
    if (tilstand.valgt === null) { rist(elKurver[i]); return; }
    var st = tilstand.bakke.find(function (s) { return s.id === tilstand.valgt; });
    var kurv = tilstand.kurver[i];
    if (!st) { tilstand.valgt = null; return; }
    if (kurv.fylt >= kurv.kapasitet || kurv.farge !== st.farge) {
      rist(elKurver[i]);
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
    void el.offsetWidth;
    el.classList.add('rist');
    setTimeout(function () { el.classList.remove('rist'); }, 340);
  }

  /* ---------- flytting ---------- */

  function flytt(st, kurvIndeks) {
    tilstand.laast = true;
    tilstand.historikk.push({
      kurver: tilstand.kurver.map(function (k) { return { farge: k.farge, kapasitet: k.kapasitet, fylt: k.fylt }; }),
      bakke: tilstand.bakke.map(function (s) { return { id: s.id, farge: s.farge }; })
    });
    tilstand.valgt = null;
    skjulTips();

    var eSt = elStjerner[st.id], eKurv = elKurver[kurvIndeks];
    var rSt = eSt.getBoundingClientRect(), rKurv = eKurv.getBoundingClientRect();

    var klon = eSt.cloneNode(true);
    klon.classList.remove('valgt');
    klon.classList.add('flytur');
    klon.style.left = rSt.left + 'px';
    klon.style.top = rSt.top + 'px';
    document.body.appendChild(klon);
    eSt.classList.add('borte');

    void klon.offsetWidth;
    klon.style.left = (rKurv.left + rKurv.width / 2 - rSt.width / 2) + 'px';
    klon.style.top = (rKurv.top + rKurv.height / 2 - rSt.height / 2) + 'px';
    klon.style.transform = 'scale(0.5)';
    klon.style.opacity = '0';
    Lyd.hell();

    setTimeout(function () {
      klon.remove();
      tilstand.bakke = tilstand.bakke.filter(function (s) { return s.id !== st.id; });
      var kurv = tilstand.kurver[kurvIndeks];
      kurv.fylt++;
      var blePlutseligFull = kurv.fylt === kurv.kapasitet;
      tegn();
      if (blePlutseligFull) {
        elKurver[kurvIndeks].classList.add('nyferdig');
        Lyd.ferdig();
      }
      if (Spill.erFerdig(tilstand.kurver)) {
        setTimeout(visSeier, blePlutseligFull ? 550 : 250);
      } else {
        tilstand.laast = false;
        oppdaterKnapper();
      }
    }, 380);
  }

  function angre() {
    if (tilstand.laast || !tilstand.historikk.length) return;
    var forrige = tilstand.historikk.pop();
    tilstand.kurver = forrige.kurver;
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
    var kandidat = null, kurvIndeks = -1;
    for (var i = 0; i < tilstand.kurver.length && !kandidat; i++) {
      var kurv = tilstand.kurver[i];
      if (kurv.fylt >= kurv.kapasitet) continue;
      var st = tilstand.bakke.find(function (s) { return s.farge === kurv.farge; });
      if (st) { kandidat = st; kurvIndeks = i; }
    }
    if (!kandidat) {
      visTips('Det er ikke flere trekk igjen 🙂');
      return;
    }
    tilstand.valgt = kandidat.id;
    tegnBakke();
    elKurver[kurvIndeks].classList.add('peker');
    setTimeout(function () { elKurver[kurvIndeks].classList.remove('peker'); }, 4600);
    visTips('Trykk på kurven som lyser opp 👀');
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
    if (tilstand.nivaa + 1 > Felles.data.stjerner.opplaast) {
      Felles.data.stjerner.opplaast = tilstand.nivaa + 1;
    }
    Felles.lagreData();
    document.getElementById('seierTekstStjerner').textContent =
      'Nivå ' + tilstand.nivaa + ' er ferdig. Alle stjernebildene er fylt opp!';
    seier.classList.remove('skjult');
    konfetti();
    Lyd.seier();
  }

  function konfetti() {
    var boks = document.getElementById('konfettiStjerner');
    boks.innerHTML = '';
    for (var i = 0; i < 55; i++) {
      var b = document.createElement('i');
      b.style.left = (Math.random() * 100) + '%';
      b.style.background = Spill.FARGER[i % Spill.FARGER.length].kode;
      b.style.animationDelay = (Math.random() * 1.1).toFixed(2) + 's';
      b.style.animationDuration = (2 + Math.random() * 1.6).toFixed(2) + 's';
      b.style.transform = 'scale(' + (0.6 + Math.random() * 0.8).toFixed(2) + ')';
      boks.appendChild(b);
    }
  }

  /* ---------- nivåvelger ---------- */

  var velger = document.getElementById('velgerStjerner');

  function visVelger() {
    var liste = document.getElementById('nivaalisteStjerner');
    liste.innerHTML = '';
    var antall = Math.max(30, Felles.data.stjerner.opplaast + 5);
    for (var n = 1; n <= antall; n++) {
      var b = document.createElement('button');
      b.className = 'nivaaknapp';
      b.textContent = n;
      if (n < Felles.data.stjerner.opplaast) b.classList.add('klart');
      if (n === tilstand.nivaa) b.classList.add('naa');
      if (n > Felles.data.stjerner.opplaast) {
        b.classList.add('laast');
        b.disabled = true;
        b.innerHTML = '<svg viewBox="0 0 18 18"><rect x="4" y="8" width="10" height="8" rx="2" fill="none" stroke="#9fb3d6" stroke-width="2"/><path d="M6,8 V5 a3,3 0 0 1 6,0 v3" fill="none" stroke="#9fb3d6" stroke-width="2"/></svg>';
      } else {
        (function (m) {
          b.addEventListener('click', function () {
            velger.classList.add('skjult');
            startNivaa(m);
          });
        })(n);
      }
      liste.appendChild(b);
    }
    velger.classList.remove('skjult');
    var naa = liste.querySelector('.naa');
    if (naa) liste.scrollTop = Math.max(0, naa.offsetTop - liste.clientHeight / 2);
  }

  /* ---------- knapper ---------- */

  document.getElementById('knappAngreStjerner').addEventListener('click', angre);
  document.getElementById('knappHintStjerner').addEventListener('click', hint);
  document.getElementById('knappStartPaaNyttStjerner').addEventListener('click', startPaaNytt);
  document.getElementById('knappNivaaerStjerner').addEventListener('click', visVelger);
  document.getElementById('knappLukkVelgerStjerner').addEventListener('click', function () {
    velger.classList.add('skjult');
  });
  document.getElementById('knappNesteStjerner').addEventListener('click', function () {
    seier.classList.add('skjult');
    startNivaa(tilstand.nivaa + 1);
  });
  document.getElementById('knappOmIgjenStjerner').addEventListener('click', function () {
    seier.classList.add('skjult');
    startNivaa(tilstand.nivaa);
  });

  /* ---------- åpning ---------- */

  function apne() {
    if (!initialisert) {
      initialisert = true;
      startNivaa(Felles.data.stjerner.sisteNivaa);
    }
  }

  return { apne: apne };
})();
