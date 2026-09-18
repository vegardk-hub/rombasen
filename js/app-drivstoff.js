/*
 * Drivstoff-sortering – grensesnittet.
 *
 * Samme filosofi som resten av Rombasen: ingen tidtaking, ingen måte å
 * tape på, alt kan angres. Trykker man på en tank det ikke går an å
 * helle i, blir den bare den nye valgte i stedet for å gi et avslag.
 */
'use strict';

var AppDrivstoff = (function () {

  var Spill = SpillDrivstoff;
  var Lyd = Felles.Lyd;

  var initialisert = false;

  var tilstand = {
    nivaa: 1,
    kapasitet: 4,
    tanker: [],
    start: [],
    historikk: [],
    valgt: null,
    laast: false
  };

  var side = document.getElementById('side-drivstoff');
  var brett = document.getElementById('brettDrivstoff');
  var elTanker = [], elVaeske = [];

  Felles.lagGemDefs(Spill.FARGER);

  /* ---------- oppsett av nivå ---------- */

  function startNivaa(n) {
    var nivaa = Spill.lagNivaa(n);
    tilstand.nivaa = n;
    tilstand.kapasitet = nivaa.kapasitet;
    tilstand.tanker = Spill.kopi(nivaa.tanker);
    tilstand.start = Spill.kopi(nivaa.tanker);
    tilstand.historikk = [];
    tilstand.valgt = null;
    tilstand.laast = false;
    Felles.data.drivstoff.sisteNivaa = n;
    Felles.lagreData();
    document.getElementById('nivaaTallDrivstoff').textContent = n;
    visTips(n === 1 ? 'Trykk på en tank, og så på en annen 👆' : '');
    tegn();
    oppdaterKnapper();
  }

  function startPaaNytt() {
    if (tilstand.laast) return;
    tilstand.tanker = Spill.kopi(tilstand.start);
    tilstand.historikk = [];
    tilstand.valgt = null;
    Lyd.slipp();
    tegn();
    oppdaterKnapper();
  }

  /* ---------- tegning ---------- */

  var OMRISS =
    '<svg class="omriss" viewBox="0 0 68 160" aria-hidden="true">' +
      '<rect class="kant" x="4" y="6" width="60" height="148" rx="28"/>' +
      '<rect class="blank" x="11" y="16" width="7" height="118" rx="3.5"/>' +
      '<path class="fin" d="M 14 128 L 2 152 L 14 144 Z"/>' +
      '<path class="fin" d="M 54 128 L 66 152 L 54 144 Z"/>' +
    '</svg>';

  function radInndeling(antall) {
    var rader = Math.ceil(antall / 5);
    var igjen = antall, ut = [];
    for (var r = 0; r < rader; r++) {
      var n = Math.ceil(igjen / (rader - r));
      ut.push(n);
      igjen -= n;
    }
    return ut;
  }

  function settBredde(inndeling) {
    var maks = Math.max.apply(null, inndeling);
    var rader = inndeling.length;
    var mellomrom = Math.min(20, Math.max(8, brett.clientWidth * 0.03));
    var radAvstand = 26;

    var etterBredde = (brett.clientWidth - (maks - 1) * mellomrom - 8) / maks;
    var etterHoyde = (brett.clientHeight - (rader - 1) * radAvstand - 18) / (rader * (160 / 68));
    var bredde = Math.min(etterBredde, etterHoyde, 110);
    bredde = Math.max(30, bredde);
    document.documentElement.style.setProperty('--tankbredde', bredde.toFixed(1) + 'px');
  }

  function tegn() {
    var tanker = tilstand.tanker;
    var inndeling = radInndeling(tanker.length);
    brett.innerHTML = '';
    settBredde(inndeling);

    elTanker = [];
    elVaeske = [];
    var enhet = 100 / tilstand.kapasitet;
    var i = 0;

    inndeling.forEach(function (antall) {
      var rad = document.createElement('div');
      rad.className = 'rad';
      for (var k = 0; k < antall; k++) {
        rad.appendChild(lagTank(i, tanker[i], enhet));
        i++;
      }
      brett.appendChild(rad);
    });
  }

  function lagTank(indeks, innhold, enhet) {
    var el = document.createElement('div');
    el.className = 'tank';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', beskriv(innhold));
    el.dataset.i = indeks;
    el.innerHTML = OMRISS +
      '<svg class="merke" viewBox="0 0 46 46" aria-hidden="true"><path d="M23,3 C25,15 25,15 40,20 C25,25 25,25 23,40 C21,25 21,25 6,20 C21,15 21,15 23,3 Z" fill="#ffc857"/></svg>';

    var vaeske = document.createElement('div');
    vaeske.className = 'vaeske';
    innhold.forEach(function (farge) {
      vaeske.appendChild(lagDel(farge, enhet));
    });
    el.insertBefore(vaeske, el.firstChild);

    if (tilstand.valgt === indeks) el.classList.add('valgt');
    if (Spill.erKomplett(innhold, tilstand.kapasitet)) el.classList.add('ferdig');

    el.addEventListener('click', function () { klikk(indeks); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); klikk(indeks); }
    });

    elTanker[indeks] = el;
    elVaeske[indeks] = vaeske;
    return el;
  }

  function lagDel(farge, hoyde) {
    var d = document.createElement('div');
    d.className = 'del';
    d.style.height = hoyde + '%';
    d.style.background = 'linear-gradient(90deg,' + Spill.FARGER[farge].kode + ' 0%,' +
      Spill.FARGER[farge].lys + ' 42%,' + Spill.FARGER[farge].kode + ' 100%)';
    d.dataset.farge = farge;
    return d;
  }

  function beskriv(innhold) {
    if (!innhold.length) return 'Tom tank';
    var navn = innhold.map(function (f) { return Spill.FARGER[f].navn; });
    return 'Tank med ' + navn.join(', ') + ' nedenfra';
  }

  /* ---------- trykk ---------- */

  function klikk(i) {
    if (tilstand.laast) return;
    var tanker = tilstand.tanker;

    if (tilstand.valgt === null) {
      if (!tanker[i].length) { rist(i); return; }
      if (Spill.erKomplett(tanker[i], tilstand.kapasitet)) { rist(i); return; }
      tilstand.valgt = i;
      elTanker[i].classList.add('valgt');
      Lyd.plukk();
      skjulTips();
      return;
    }

    if (tilstand.valgt === i) {
      tilstand.valgt = null;
      elTanker[i].classList.remove('valgt');
      Lyd.slipp();
      return;
    }

    var fra = tilstand.valgt;
    var antall = Spill.kanHelle(tanker, fra, i, tilstand.kapasitet);
    if (antall > 0) {
      hell(fra, i, antall);
      return;
    }

    rist(i);
    elTanker[fra].classList.remove('valgt');
    if (tanker[i].length && !Spill.erKomplett(tanker[i], tilstand.kapasitet)) {
      tilstand.valgt = i;
      elTanker[i].classList.add('valgt');
    } else {
      tilstand.valgt = null;
    }
  }

  function rist(i) {
    var el = elTanker[i];
    if (!el) return;
    Lyd.nei();
    el.classList.remove('rist');
    void el.offsetWidth;
    el.classList.add('rist');
    setTimeout(function () { el.classList.remove('rist'); }, 340);
  }

  /* ---------- hellingen ---------- */

  function hell(fra, til, antall) {
    tilstand.laast = true;
    tilstand.historikk.push(Spill.kopi(tilstand.tanker));
    tilstand.valgt = null;
    skjulTips();

    var farge = Spill.toppFarge(tilstand.tanker[fra]);
    var nivaaTil = tilstand.tanker[til].length;
    var eFra = elTanker[fra], eTil = elTanker[til];
    var rFra = eFra.getBoundingClientRect(), rTil = eTil.getBoundingClientRect();

    var tilVenstre = rFra.left <= rTil.left;
    var vinkel = tilVenstre ? 54 : -54;
    var munnX = rFra.left + rFra.width / 2;
    var munnY = rFra.top + rFra.height * 0.08;
    var maalX = rTil.left + rTil.width / 2;
    var maalY = rTil.top - rTil.height * 0.14;

    eFra.classList.remove('valgt');
    eFra.style.zIndex = '40';
    eFra.style.transition = 'transform .24s cubic-bezier(.4,.1,.3,1)';
    eFra.style.transform = 'translate(' + (maalX - munnX).toFixed(1) + 'px,' +
      (maalY - munnY).toFixed(1) + 'px) rotate(' + vinkel + 'deg)';

    var overflate = rTil.top + rTil.height * (0.94 - 0.85 * nivaaTil / tilstand.kapasitet);

    setTimeout(function () {
      var straale = document.createElement('div');
      straale.className = 'straale';
      straale.style.left = (maalX - 4) + 'px';
      straale.style.top = maalY + 'px';
      straale.style.width = '8px';
      straale.style.height = '0px';
      straale.style.background = Spill.FARGER[farge].kode;
      document.body.appendChild(straale);
      void straale.offsetWidth;
      straale.style.height = Math.max(6, overflate - maalY + 4) + 'px';
      Lyd.hell();

      var enhet = 100 / tilstand.kapasitet;
      var deler = elVaeske[fra].children;
      for (var k = 0; k < antall; k++) {
        deler[deler.length - 1 - k].style.height = '0%';
      }
      var nye = [];
      for (var m = 0; m < antall; m++) {
        var d = lagDel(farge, enhet);
        d.style.height = '0%';
        elVaeske[til].appendChild(d);
        nye.push(d);
      }
      void elVaeske[til].offsetWidth;
      nye.forEach(function (d) { d.style.height = enhet + '%'; });

      setTimeout(function () {
        straale.style.height = '0px';
        straale.style.opacity = '0';
        setTimeout(function () { straale.remove(); }, 200);
        eFra.style.transform = '';
        setTimeout(function () {
          eFra.style.zIndex = '';
          eFra.style.transition = '';
          fullfor(fra, til, antall);
        }, 240);
      }, 320);
    }, 250);
  }

  function fullfor(fra, til, antall) {
    var varFerdig = tilstand.tanker.map(function (t) {
      return Spill.erKomplett(t, tilstand.kapasitet);
    });
    Spill.helle(tilstand.tanker, fra, til, antall);
    tegn();

    var blePlutseligFerdig = !varFerdig[til] &&
      Spill.erKomplett(tilstand.tanker[til], tilstand.kapasitet);
    if (blePlutseligFerdig) {
      elTanker[til].classList.add('nyferdig');
      Lyd.ferdig();
    }

    if (Spill.erFerdig(tilstand.tanker, tilstand.kapasitet)) {
      setTimeout(visSeier, blePlutseligFerdig ? 550 : 250);
    } else {
      tilstand.laast = false;
      oppdaterKnapper();
    }
  }

  function angre() {
    if (tilstand.laast || !tilstand.historikk.length) return;
    tilstand.tanker = tilstand.historikk.pop();
    tilstand.valgt = null;
    Lyd.slipp();
    tegn();
    oppdaterKnapper();
  }

  function oppdaterKnapper() {
    document.getElementById('knappAngreDrivstoff').disabled = tilstand.historikk.length === 0;
  }

  /* ---------- hint ---------- */

  function hint() {
    if (tilstand.laast) return;
    var fasit = Spill.loes(tilstand.tanker, tilstand.kapasitet);
    if (!fasit || !fasit.length) {
      visTips('Det går ikke videre herfra – trykk Angre 🙂');
      return;
    }
    tilstand.valgt = null;
    tegn();
    peker(fasit[0].fra);
    peker(fasit[0].til);
    visTips('Hell fra den ene til den andre 👀');
  }

  function peker(i) {
    var el = elTanker[i];
    if (!el) return;
    el.classList.add('peker');
    setTimeout(function () { el.classList.remove('peker'); }, 4600);
  }

  /* ---------- tips ---------- */

  var tipsEl = document.getElementById('tipsDrivstoff');
  function visTips(tekst) {
    tipsEl.textContent = tekst || '';
    tipsEl.classList.toggle('borte', !tekst);
  }
  function skjulTips() { tipsEl.classList.add('borte'); }

  /* ---------- seier ---------- */

  var seier = document.getElementById('seierDrivstoff');

  function visSeier() {
    if (tilstand.nivaa + 1 > Felles.data.drivstoff.opplaast) {
      Felles.data.drivstoff.opplaast = tilstand.nivaa + 1;
    }
    Felles.lagreData();
    document.getElementById('seierTekstDrivstoff').textContent =
      'Nivå ' + tilstand.nivaa + ' er ferdig. Alle tankene har sitt eget drivstoff!';
    seier.classList.remove('skjult');
    konfetti();
    Lyd.seier();
  }

  function konfetti() {
    var boks = document.getElementById('konfettiDrivstoff');
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

  var velger = document.getElementById('velgerDrivstoff');

  function visVelger() {
    var liste = document.getElementById('nivaalisteDrivstoff');
    liste.innerHTML = '';
    var antall = Math.max(30, Felles.data.drivstoff.opplaast + 5);
    for (var n = 1; n <= antall; n++) {
      var b = document.createElement('button');
      b.className = 'nivaaknapp';
      b.textContent = n;
      if (n < Felles.data.drivstoff.opplaast) b.classList.add('klart');
      if (n === tilstand.nivaa) b.classList.add('naa');
      if (n > Felles.data.drivstoff.opplaast) {
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

  document.getElementById('knappAngreDrivstoff').addEventListener('click', angre);
  document.getElementById('knappHintDrivstoff').addEventListener('click', hint);
  document.getElementById('knappStartPaaNyttDrivstoff').addEventListener('click', startPaaNytt);
  document.getElementById('knappNivaaerDrivstoff').addEventListener('click', visVelger);
  document.getElementById('knappLukkVelgerDrivstoff').addEventListener('click', function () {
    velger.classList.add('skjult');
  });
  document.getElementById('knappNesteDrivstoff').addEventListener('click', function () {
    seier.classList.add('skjult');
    startNivaa(tilstand.nivaa + 1);
  });
  document.getElementById('knappOmIgjenDrivstoff').addEventListener('click', function () {
    seier.classList.add('skjult');
    startNivaa(tilstand.nivaa);
  });

  var tidtaker = null;
  window.addEventListener('resize', function () {
    if (side.classList.contains('skjult')) return;
    clearTimeout(tidtaker);
    tidtaker = setTimeout(function () { if (!tilstand.laast) tegn(); }, 150);
  });

  /* ---------- åpning ---------- */

  function apne() {
    if (!initialisert) {
      initialisert = true;
      startNivaa(Felles.data.drivstoff.sisteNivaa);
    } else {
      tegn();
    }
  }

  return { apne: apne };
})();
