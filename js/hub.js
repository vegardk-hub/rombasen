/*
 * Rombasen – navigasjon mellom romstasjonen og spillene.
 */
'use strict';

(function () {

  var sideHub = document.getElementById('side-hub');
  var sideDrivstoff = document.getElementById('side-drivstoff');
  var sideStjernerGrid = document.getElementById('side-stjerner-grid');
  var sideStjernerSpill = document.getElementById('side-stjerner-spill');

  function skjulAlle() {
    sideHub.classList.add('skjult');
    sideDrivstoff.classList.add('skjult');
    sideStjernerGrid.classList.add('skjult');
    sideStjernerSpill.classList.add('skjult');
  }

  function visHub() {
    skjulAlle();
    sideHub.classList.remove('skjult');
  }

  function visDrivstoff() {
    skjulAlle();
    sideDrivstoff.classList.remove('skjult');
    AppDrivstoff.apne();
  }

  function visStjernerGrid() {
    skjulAlle();
    sideStjernerGrid.classList.remove('skjult');
    AppStjerner.apneGrid();
  }

  document.getElementById('knappStartDrivstoff').addEventListener('click', visDrivstoff);
  document.getElementById('knappStartStjerner').addEventListener('click', visStjernerGrid);
  document.getElementById('knappTilbakeDrivstoff').addEventListener('click', visHub);
  document.getElementById('knappTilbakeGrid').addEventListener('click', visHub);

  var knappLyd = document.getElementById('knappLydHub');
  var lydBuer = document.getElementById('lydBuer');
  function tegnLydknapp() {
    lydBuer.style.opacity = Felles.data.lyd ? '1' : '0.25';
  }
  knappLyd.addEventListener('click', function () {
    Felles.data.lyd = !Felles.data.lyd;
    Felles.lagreData();
    tegnLydknapp();
    if (Felles.data.lyd) Felles.Lyd.plukk();
  });
  tegnLydknapp();

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }

})();
