# Rombasen

Romstasjon med to rolige spill for de minste. Samme filosofi som
[Fargeflasker](../pwa-flasker): ingen klokke, ingen måte å tape på, alt kan
angres, og en hjelpeknapp som viser et trekk som fører fram.

* **Drivstoff-sortering** – hell fargede drivstoff mellom tanker til hver
  tank har bare én farge. Kjernemekanikken er hentet rett fra Fargeflasker.
* **Stjernesamling** – trykk på en stjerne i bakken, og så på
  stjernebildet med samme farge, til alle er fylt opp.

Velg spill fra romstasjon-skjermen (hub). Fremgang i hvert spill lagres for
seg i `localStorage` under nøkkelen `rombasen`.

## Kjøre spillet

Dobbeltklikk `index.html`, eller start en liten webtjener i mappen:

```
python -m http.server 8323 --directory pwa-rombasen
```

Åpnes det over `http://`, registreres en service worker og spillet virker
offline. Skrifttypene (Baloo 2 og Nunito) hentes fra Google Fonts og trenger
nett første gang.

## Installere på nettbrett eller telefon

Legg mappen på en webtjener (eller GitHub Pages), åpne adressen i Chrome
eller Safari og velg «Legg til på startskjermen».

## Filene

| Fil | Hva den gjør |
| --- | --- |
| `index.html` | Romstasjonen (hub) og begge spillskjermene, alt i én side |
| `styles.css` | Utseende: glass-paneler, 3D-planeter og -tanker, stjernefelt |
| `js/felles.js` | Det spillene deler: lyd, lagring, tilfeldighet, 3D-fargedefs |
| `js/spill-drivstoff.js` | Reglene og løseren for drivstoff-sortering – rene funksjoner |
| `js/spill-stjerner.js` | Nivågeneratoren for stjernesamling – rene funksjoner |
| `js/app-drivstoff.js` | Grensesnittet for drivstoff-sortering |
| `js/app-stjerner.js` | Grensesnittet for stjernesamling |
| `js/hub.js` | Bytter mellom romstasjonen og de to spillene |
| `sw.js` | Service worker – nett først, hurtiglager som reserve |
| `lag_ikon.py` | Lager ikonene med Pillow: `python lag_ikon.py` |

## Slik lages nivåene

**Drivstoff-sortering**: fargene stokkes tilfeldig ut i tankene, og løseren
sjekker at brettet faktisk går an å løse (samme metode som Fargeflasker).

**Stjernesamling**: alltid løsbart – antall løse stjerner i bakken er
akkurat det stjernebildene trenger, så utfordringen ligger i å holde styr
på fargene, ikke i rekkefølgen.

Begge er sådd med nivånummeret, så nivå 7 ser likt ut hver gang.
