# Taurus Coach 2.0 — Gezondheid koppelen

De app haalt de gegevens uit je eigen Home Assistant via een beveiligde **https**-verbinding. Het token blijft alleen op je iPhone staan.

1. **FITAGE**: de weegschaal staat al in Home Assistant. Je hoeft niets te doen.
2. **Apple Watch**: open de Home Assistant-app op je iPhone en ga naar Instellingen → Companion-app → Sensoren. Zet daar de Apple Health-sensoren aan (hartslag, rusthartslag, HRV, slaap, stappen, actieve energie) en geef iOS toestemming.
3. **configuration.yaml**: voeg dit toe en herstart Home Assistant daarna:
   ```yaml
   http:
     cors_allowed_origins:
       - https://vlasakkersmart-glitch.github.io
   ```
4. **Token**: in Home Assistant ga je naar je profiel → Beveiliging → Langlevende toegangstokens → Token aanmaken.
5. **Koppelen**: open in Taurus Coach het tabblad Gezondheid en tik op Koppelen. Vul je externe https-adres in, bijvoorbeeld van Nabu Casa. Plak het token, geef toestemming en tik op "Verbinding testen". Controleer daarna welke sensoren de app heeft gekozen.

Beperkingen:
- Home Assistant bewaart ruwe historie standaard 10 dagen. Oudere gegevens komen uit de langetermijnstatistiek (daggemiddelden) als die er is.
- De hartslag tijdens een training is een benadering. De Companion-app levert hooguit elke ±30 seconden een waarde. Live hartslag in de app is niet mogelijk.

## Trainingsherinneringen (optioneel)

Een website kan zelf geen meldingen sturen als hij dicht is. Via Home Assistant gaat dat wel:

1. In Taurus Coach ga je naar Gezondheid → Beheren en zet je "Zet mijn trainingsstatus in Home Assistant" aan. Daarna tik je op Opslaan. Vanaf dat moment werkt de app de sensor `sensor.taurus_coach` bij. Die bevat alleen de datum van je laatste training, je weekdoel en de tekst van Sophie; geen gezondheidswaarden.
2. Kopieer de automatisering uit dat scherm naar Home Assistant: Instellingen → Automatiseringen → Nieuw → YAML. Vervang `JOUW_IPHONE` door de naam van je iPhone. Die vind je via Ontwikkelaarshulpmiddelen → Acties → zoek op "notify.mobile_app".

Om 18:30 krijg je dan een melding als je die dag nog moet trainen. Tik je op de melding, dan opent de app.
