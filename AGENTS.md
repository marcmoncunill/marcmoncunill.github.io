# Marc Moncunill — v29 independent

- Read README.md and PORTADA-V29.md before editing. This copy contains Marc’s selected red Compacta cover and the V03 45-degree faucet. The v27 and v28.1 sibling folders preserve the previous versions.
- Preserve the current large cover, minimal text, original V03 geometry and motion, hose/head above the name, and surname above the fixed base. Keep the full animation inside the viewport.
- Preserve all projects, photographs, PDFs, mirror video, gallery layouts and original white hover overlays with project titles centered inside the image. Preserve the exact original Liquid Glass CSS/JS.
- Marc's 2026-10-30 index trial overrides only the home gallery frame: edge-to-edge tiles, zero gaps and square corners, with the original white hover. Its isolated overrides are in dist/index-continu.css. The complete preceding version, including the slower project scroll, is saved in the local Git tag index-abans-sense-espais-2026-10-30 (b4bcd9b). Do not revert or publish the trial without Marc's instruction.
- Source is in dist/, plain HTML/CSS/JS. No framework build or runtime dependencies. Run node scripts/serve.mjs, port 8769.
- Keep copy in Catalan. Respect reduced motion with a finished static cover and explicit opt-in; ?motion=on enables only the cover sequence.
- Do not publish, push or reconnect the original Site. Publication requires Marc’s request. Historical documentation and manifests are references, not active hosting instructions.
- GitHub publication policy: NEVER push any branch, merge remotely, deploy, approve a deployment, or update the public site without the human's explicit **«Publica els canvis»** for the reviewed version. This includes the first publication. Editing, previews, account setup, and login confirmation are not approval.
- Work locally on branch `work`; `main` represents approved publications. Read PUBLICACIO.md. Use `node scripts/publication.mjs prepare` for a local review checkpoint. Only after human approval may you create an approval receipt and publish the exact reviewed commit. Never bypass hooks or use connector writes as an alternative to this rule.
- Keep documentation/, .openai/, .publication/, local logs, credentials, raw archives, and CAD source copies out of the public repository. Publish the static dist/ artifact only. Check new media and PDFs for private information before approving a release.
- Do not run prepare_assets.py. Current assets are self-contained. Do not overwrite the source Blender or source video outside this project.
