"""Lager appikonene til Rombasen: en blå planet med en liten rakett foran.

Tegnes fire ganger så stort som nødvendig og skaleres ned til slutt – da
blir kantene glatte uten at vi trenger noe mer enn Pillow.
"""

from PIL import Image, ImageDraw
from pathlib import Path

HER = Path(__file__).parent
SKALA = 4

BAKGRUNN = (11, 30, 61)
PLANET = (61, 139, 253)
PLANET_LYS = (142, 203, 255)
PLANET_MORK = (18, 59, 122)
RING = (255, 200, 87)
GLASS = (234, 244, 255)
KANT = (11, 30, 61)
KORALL = (255, 138, 91)
KORALL_KANT = (122, 46, 18)


def lag(storrelse, marg_andel, filnavn):
    s = storrelse * SKALA
    bilde = Image.new("RGBA", (s, s), BAKGRUNN + (255,))
    tegn = ImageDraw.Draw(bilde, "RGBA")

    marg = s * marg_andel
    d = s - 2 * marg  # planetens diameter
    cx, cy = s / 2, s * 0.42
    r = d * 0.5

    # Planeten: en mørkere sirkel, en lysere sirkel forskjøvet mot toppen
    # til venstre (kjerneskygge nederst til høyre blir dermed synlig).
    tegn.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PLANET_MORK)
    tegn.ellipse([cx - r, cy - r, cx + r * 0.7, cy + r * 0.7], fill=PLANET)
    tegn.ellipse([cx - r * 0.55, cy - r * 0.7, cx + r * 0.15, cy - r * 0.1], fill=PLANET_LYS)

    strek = max(2, int(d * 0.018))
    tegn.ellipse([cx - r * 1.32, cy - r * 0.32, cx + r * 1.32, cy + r * 0.32], outline=RING + (200,), width=strek)

    # Raketten: helt nede til venstre, pekende opp mot høyre.
    rb = d * 0.5   # raketthøyde
    rw = rb * 0.34
    rx = s * 0.30
    ry = s * 0.86
    kropp = [rx - rw / 2, ry - rb, rx + rw / 2, ry]
    tegn.rounded_rectangle(kropp, radius=rw * 0.5, fill=GLASS, outline=KANT + (255,), width=strek)

    vindu_r = rw * 0.26
    vindu_c = (rx, ry - rb * 0.72)
    tegn.ellipse([vindu_c[0] - vindu_r, vindu_c[1] - vindu_r, vindu_c[0] + vindu_r, vindu_c[1] + vindu_r],
                 fill=PLANET, outline=KANT + (255,), width=max(2, int(strek * 0.8)))

    finbredde = rw * 0.9
    tegn.polygon([
        (rx - rw / 2, ry - rb * 0.28), (rx - rw / 2 - finbredde, ry), (rx - rw / 2, ry - rb * 0.06)
    ], fill=KORALL, outline=KORALL_KANT + (255,))
    tegn.polygon([
        (rx + rw / 2, ry - rb * 0.28), (rx + rw / 2 + finbredde, ry), (rx + rw / 2, ry - rb * 0.06)
    ], fill=KORALL, outline=KORALL_KANT + (255,))

    for px, py, pr in [(s * 0.80, s * 0.20, d * 0.02), (s * 0.86, s * 0.32, d * 0.014), (s * 0.18, s * 0.68, d * 0.014)]:
        tegn.ellipse([px - pr, py - pr, px + pr, py + pr], fill=GLASS)

    bilde.resize((storrelse, storrelse), Image.LANCZOS).save(HER / filnavn)
    print("skrev", filnavn)


if __name__ == "__main__":
    lag(512, 0.09, "icon-512.png")
    lag(192, 0.09, "icon-192.png")
    lag(180, 0.09, "apple-touch-icon.png")
    lag(512, 0.22, "icon-maskable-512.png")
