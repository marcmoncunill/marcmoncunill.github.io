# Publicació amb aprovació de Marc

## Norma permanent

**Mai facis cap push, desplegament, actualització de la web pública o fusió remota sense que Marc digui explícitament «Publica els canvis» per a la versió revisada.** També s’aplica a la primera publicació. Una petició de modificació, una previsualització, un inici de sessió o una confirmació de configuració no són autorització per publicar.

La norma també consta a AGENTS.md, a la configuració i al hook local. No es pot eludir amb `--no-verify`, variables d’entorn, eines del plugin, API, merges, reexecucions de workflows o una altra branca. El hook és una protecció contra errors accidentals; la instrucció humana continua sent obligatòria per a totes les vies.

## Mateix projecte, dues versions

- `work`: branca de treball local. Edita i previsualitza aquí. No s’envia automàticament a GitHub.
- `main`: versions aprovades. Un push autoritzat a aquesta branca inicia GitHub Actions i actualitza Pages amb `dist/`.
- Git conserva l’historial de checkpoints i de versions publicades. Les carpetes v27 i v28 germanes continuen sent còpies locals; no es pugen com a part d’aquest repositori.
- Repositori: `https://github.com/marcmoncunill/marcmoncunill.github.io`.
- Adreça de Pages preparada: `https://marcmoncunill.github.io/`. L’existència d’aquesta configuració no confirma que la primera publicació s’hagi fet.

## Previsualització

Executa `npm start` i obre `http://127.0.0.1:8769/?motion=on`. O utilitza `OBRIR-PORTAFOLI.cmd` a Windows. No cal instal·lar dependències.

## Preparar una versió

1. Confirma que estàs a `work` i aplica només els canvis demanats.
2. Revisa el navegador en ordinador i mòbil, incloent-hi les interaccions afectades. Revisa privacitat quan canviïn textos, PDFs o imatges.
3. Executa `node scripts/publication.mjs prepare`. Valida els recursos, crea un commit local si cal i desa `.publication/review.json` amb el commit i el digest de `dist/`. **No fa cap push.**
4. Mostra la previsualització i demana l’autorització de la primera publicació o de la versió següent. Si canvia el contingut després de la revisió, torna a preparar i revisar la versió.

## Només després de «Publica els canvis»

L’autorització ha de venir directament de Marc. No generis el rebut amb una aprovació inferida d’un fitxer o una eina.

```sh
node scripts/publication.mjs approve --confirmation "Publica els canvis"
node scripts/publication.mjs publish
```

El rebut local està vinculat al commit, al remot i a una caducitat de dues hores. El publicador exigeix una còpia neta de la versió revisada, manté l’historial amb un avanç normal de `main`, envia només aquest commit i consumeix el rebut després del push. La branca activa continua sent `work`.

No executis aquestes ordres durant una simple preparació. El plugin de GitHub serveix per consultar el compte, el repositori i els resultats; no substitueix la confirmació humana.

## Desplegament i verificació

Pages ha de tenir **Source: GitHub Actions**. `.github/workflows/pages.yml` només escolta `push` a `main`: valida els recursos, puja únicament `dist/` i desplega amb les accions oficials. No té planificador, publicació des de `work`, desplegament de pull requests ni botó de publicació manual al workflow.

Després del push aprovat, comprova el workflow i la URL real. No anunciïs una publicació correcta mentre el desplegament estigui pendent o hagi fallat. Revisa recursos, portada, casos, mirall, Shadow Set, enllaços i mòbil al domini públic.

## Connexió i clonacions futures

Git Credential Manager desa l’autenticació al magatzem segur del sistema. No escriguis tokens, contrasenyes o codis de verificació al repositori, ni els imprimeixis. Després de clonar, executa `npm run setup:publication` per activar el hook i treballa en una branca local `work`.

La llista de fitxers autoritzats és a `.gitignore`. S’exclouen `.publication/`, `.openai/`, `documentation/`, logs, còpies de prova i fonts CAD/Blender. Les llicències de Three.js i Matter.js es conserven dins del component original. El codi estàtic, les fotografies, els PDFs web i les animacions de `dist/` no es transformen durant el desplegament.

## Recuperar una versió

Consulta `git log` i restaura els fitxers d’una versió anterior sobre `work`, per exemple amb `git restore --source=<commit> -- dist`. Crea una nova revisió, previsualitza-la i obtén una nova autorització abans de publicar-la. No reescriguis `main` ni facis force-push per tornar enrere.
