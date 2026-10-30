# Marc Moncunill — Portafoli v29 · Compacta V03

Portada Compacta vermella seleccionada per Marc, amb la nova aixeta a 45 graus re-renderitzada des del projecte 3D en Full HD, 240 fotogrames a 30 fps.

Codi del portafoli existent, amb recursos locals i sense framework ni dependències d’instal·lació. La font del web és `dist/`: el desplegament no transforma el disseny ni les animacions.

## Obrir la web

Executa `node scripts/serve.mjs` en aquesta carpeta i obre http://127.0.0.1:8769/?motion=on per veure la seqüència amb scroll, també amb moviment reduït al sistema.

La web recorda l’elecció d’activar o aturar la portada en aquest navegador, també en tornar dels projectes o obrir un enllaç sense paràmetres. Sense una elecció prèvia es respecta el moviment reduït i es mostra la portada acabada. La petita icona inferior permet activar o aturar l’animació.

No cal instal·lar dependències. Tot el codi i tots els recursos necessaris són a `dist/`.

L’índex incorpora EV Charger com a projecte protagonista sobre negre, després de la portada de l’aixeta. Les altres imatges es mostren senceres, amb files adaptades a les seves proporcions i el hover blanc original. `?ev-motion=on` activa explícitament el moviment subtil d’EV per revisar-lo; el seu botó de pausa és independent de la portada i es respecta el moviment reduït per defecte.

## Versions i publicació

Treballa i previsualitza localment a `work`. La branca `main` es reserva per a les versions aprovades; GitHub Actions en publica només `dist/` a GitHub Pages.

**No es fa cap push ni desplegament sense la instrucció explícita de Marc: «Publica els canvis».** La norma també s’aplica a la primera publicació.

- [Repositori](https://github.com/marcmoncunill/marcmoncunill.github.io)
- [Adreça configurada per a Pages](https://marcmoncunill.github.io/)
- [Procés de revisió, publicació i recuperació de versions](PUBLICACIO.md)

`npm run check` valida els recursos i la preparació per publicar. `node scripts/publication.mjs prepare` crea un checkpoint local per revisar: no envia res a GitHub. Després d’una clonació, `npm run setup:publication` activa el bloqueig local de publicacions no aprovades.

Les còpies de proves, els informes locals i les credencials s’exclouen del repositori. Les llicències de les biblioteques del component Shadow Set es conserven amb els seus fitxers originals.
