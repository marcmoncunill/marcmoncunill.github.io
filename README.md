# Marc Moncunill — Portafoli v29 · Compacta V03

Portada Compacta vermella seleccionada per Marc, amb la nova aixeta a 45 graus re-renderitzada des del projecte 3D en Full HD, 240 fotogrames a 30 fps.

Codi del portafoli existent, amb recursos locals i sense framework ni dependències d’instal·lació. La font del web és `dist/`: el desplegament no transforma el disseny ni les animacions.

## Obrir la web

Executa `node scripts/serve.mjs` en aquesta carpeta i obre http://127.0.0.1:8769/?motion=on per veure la seqüència amb scroll, també amb moviment reduït al sistema.

La web recorda l’elecció d’activar o aturar la portada en aquest navegador, també en tornar dels projectes o obrir un enllaç sense paràmetres. Sense una elecció prèvia es respecta el moviment reduït i es mostra la portada acabada. La petita icona inferior permet activar o aturar l’animació.

No cal instal·lar dependències. Tot el codi i tots els recursos necessaris són a `dist/`.

L’índex incorpora Amazon Dock com a projecte protagonista sobre negre, en un bloc d’alçada intermèdia que deixa veure part de la portada de l’aixeta i de la fila següent quan s'arriba a Projectes. El carregador i la plataforma es veuen més grans i sencers; en mòbil només es retallen marges foscos buits de la fotografia. El nom visible és Amazon Dock a tot el web i es conserva l’enllaç `#/project/ev-charger`. Les altres imatges mantenen les proporcions i el hover blanc originals. Una única franja blanca de 8px, sense text visible, separa els projectes d'Experimentació. `?ev-motion=on` activa explícitament el moviment subtil d’Amazon Dock per revisar-lo; el seu botó de pausa és independent de la portada i es respecta el moviment reduït per defecte.

El detall `#/project/ev-charger` incorpora la revisió v05 d'Amazon Dock amb l'ambient d'estudi de referència aportat per Marc, basada en la v04 corregida: 360 fotogrames a pantalla completa, controlats amb scroll natiu reversible des de l'entrada, sense botons d'activació, pausa, vídeo o salt. Després del render hi ha 0,9 pantalles de blanc pur; la introducció original apareix progressivament sobre aquest blanc i es retira abans de tornar al render en sentit invers. Carrega una sola resolució per visita, amb memòria limitada i neteja en sortir. No hi ha reproducció autònoma; amb moviment reduït se suprimeix el desplaçament addicional del text. Una fallada tècnica conserva una alternativa estàtica i permet llegir el cas. Els controls de la portada de l'aixeta i del bloc protagonista continuen independents i intactes.

## Versions i publicació

Amazon Dock presenta imatges grans amb títols i text al costat. Les galeries manuals canvien la imatge, el peu i l’explicació conjuntament, amb fletxes, teclat, gest horitzontal tàctil i ampliació. Els quatre estats LED es consulten al mateix espai; no hi ha reproducció automàtica. En mòbil les columnes s’apilen. Es conserven totes les imatges del projecte, amb els renders ampliats retallant només marges blancs buits. A la pàgina només es mostra el plànol general ampliable; els plànols de peces i l’explosionat es consulten a `assets/documents/amazon-dock-planols.pdf`, amb set pàgines vectorials. Les dades dels altres projectes es presenten com a crèdits tipogràfics sense taula, preservant tots els valors i les etiquetes accessibles. La portada, l’índex, la immersió, Liquid Glass i les galeries dels altres projectes es conserven. Recuperació anterior a aquesta proposta: `abans-amazon-dock-grafic-2026-11-01`.

Treballa i previsualitza localment a `work`. La branca `main` es reserva per a les versions aprovades; GitHub Actions en publica només `dist/` a GitHub Pages.

**No es fa cap push ni desplegament sense la instrucció explícita de Marc: «Publica els canvis».** La norma també s’aplica a la primera publicació.

- [Repositori](https://github.com/marcmoncunill/marcmoncunill.github.io)
- [Adreça configurada per a Pages](https://marcmoncunill.github.io/)
- [Procés de revisió, publicació i recuperació de versions](PUBLICACIO.md)

`npm run check` valida els recursos i la preparació per publicar. `node scripts/publication.mjs prepare` crea un checkpoint local per revisar: no envia res a GitHub. Després d’una clonació, `npm run setup:publication` activa el bloqueig local de publicacions no aprovades.

Les còpies de proves, els informes locals i les credencials s’exclouen del repositori. Les llicències de les biblioteques del component Shadow Set es conserven amb els seus fitxers originals.
