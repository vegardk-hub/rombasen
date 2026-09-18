/*
 * Rombasen – navigasjon mellom romstasjonen og spillene.
 */
'use strict';

(function () {

  var sideHub = document.getElementById('side-hub');
  var sideDrivstoff = document.getElementById('side-drivstoff');
  var sideStjerner = document.getElementById('side-stjerner');

  function visHub() {
    sideDrivstoff.classList.add('skjult');
    sideStjerner.classList.add('skjult');
    sideHub.classList.remove('skjult');
  }

  function visDrivstoff() {
    sideHub.classList.add('skjult');
    sideStjerner.classList.add('skjult');
    sideDrivstoff.classList.remove('skjult');
    AppDrivstoff.apne();
  }

  function visStjerner() {
    sideHub.classList.add('skjult');
    sideDrivstoff.classList.add('skjult');
    sideStjerner.classList.remove('skjult');
    AppStjerner.apne();
  }

  document.getElementById('knappStartDrivstoff').addEventListener('click', visDrivstoff);
  document.getElementById('knappStartStjerner').addEventListener('click', visStjerner);
  document.getElementById('knappTilbakeDrivstoff').addEventListener('click', visHub);
  document.getElementById('knappTilbakeStjerner').addEventListener('click', visHub);

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
