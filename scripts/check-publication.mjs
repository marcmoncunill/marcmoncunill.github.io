import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const root=fileURLToPath(new URL('../',import.meta.url));
const slash=value=>value.split(path.sep).join('/');
export function checkPublication(){
 const dist=path.join(root,'dist'),files=[],errors=[];
 function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const absolute=path.join(dir,item.name);
  if(item.isSymbolicLink())errors.push(`Symbolic link: ${slash(path.relative(root,absolute))}`);
  else if(item.isDirectory())walk(absolute);else files.push(absolute);
 }}
 walk(dist);files.sort((a,b)=>{const x=slash(path.relative(dist,a)),y=slash(path.relative(dist,b));return x<y?-1:x>y?1:0;});
 const paths=new Set(files.map(file=>slash(path.relative(dist,file))));
 const digest=crypto.createHash('sha256');let bytes=0,references=0;
 function checkRef(from,value){
  if(!value||/^(?:data:|https?:|mailto:|tel:|#|blob:)/i.test(value)||value.includes('${'))return;
  const clean=decodeURIComponent(value.split(/[?#]/)[0]);if(!clean)return;
  if(clean.startsWith('/')){errors.push(`Root-relative URL in ${from}: ${clean}`);return;}
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(from),clean));
  if(!paths.has(target))errors.push(`Missing or wrong-case resource in ${from}: ${clean}`);
  references++;
 }
 const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{30,}\b/,/\bAKIA[0-9A-Z]{16}\b/];
 for(const file of files){
  const rel=slash(path.relative(dist,file)),data=fs.readFileSync(file);bytes+=data.length;
  digest.update(rel+'\0');digest.update(crypto.createHash('sha256').update(data).digest());
  if(data.length>=100*1024*1024)errors.push(`File exceeds GitHub's normal file limit: ${rel}`);
  if(/(?:^|\/)(?:\.env(?:\.|$)|documentation|source-cad|qa(?:\.|\/)|demo\.html)|\.(?:zip|blend|stp|step|pem|key|log|pid)$/i.test(rel))errors.push(`Non-public file in dist: ${rel}`);
  if(!/\.(?:html|css|js|json|svg|txt)$/.test(rel))continue;
  const text=data.toString('utf8');
  if(secretPatterns.some(pattern=>pattern.test(text)))errors.push(`Potential credential in ${rel}`);
  if(!rel.includes('/vendor/')&&/(?:C:[\\/]Users[\\/]|file:\/\/\/|\/Users\/|\/home\/)/i.test(text))errors.push(`Local private path in ${rel}`);
  if(/\.html$/.test(rel))for(const match of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g))checkRef(rel,match[1]);
  if(/\.css$/.test(rel))for(const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g))checkRef(rel,match[1]);
  if(/\.js$/.test(rel)&&!rel.includes('/vendor/'))for(const match of text.matchAll(/\b(?:from\s*|import\s*\(|new\s+URL\s*\()\s*["']([^"']+)["']/g))checkRef(rel,match[1]);
 }
 const metadataText=fs.readFileSync(path.join(dist,'image-data.js'),'utf8');
 const metadata=JSON.parse(metadataText.slice(metadataText.indexOf('=')+1).trim().replace(/;$/,''));
 for(const [name,info] of Object.entries(metadata)){
  if(!paths.has('assets/'+name))errors.push(`Missing original image: ${name}`);
  for(const [variant] of info.variants||[])if(!paths.has('assets/'+variant))errors.push(`Missing responsive image: ${variant}`);
 }
 const mediaText=fs.readFileSync(path.join(dist,'cover-media.js'),'utf8');
 const media=JSON.parse(mediaText.slice(mediaText.indexOf('=')+1).trim().replace(/;$/,''));
 for(let n=1;n<=media.frames;n++)if(!paths.has(`${media.directory}frame-${String(n).padStart(3,'0')}.webp`))errors.push(`Missing cover frame ${n}`);
 const evManifest='assets/ev-charger-v05/manifest.json';
 if(paths.has('ev-detail.js')&&!paths.has(evManifest))errors.push('Missing EV Charger v05 manifest.');
 if(paths.has(evManifest)){
  const ev=JSON.parse(fs.readFileSync(path.join(dist,evManifest),'utf8'));
  if(ev.project_id!=='ev-charger'||ev.frame_count!==360||!ev.version.includes('v05'))errors.push('Unexpected EV Charger media version.');
  checkRef(evManifest,ev.poster);checkRef(evManifest,ev.video);
  for(const name of ['mobile','desktop','4k']){
   const tier=ev.tiers[name];
   if(!tier){errors.push(`Missing EV tier: ${name}`);continue;}
   for(let n=1;n<=ev.frame_count;n++)checkRef(evManifest,`${tier.directory}/${String(n).padStart(4,'0')}.webp`);
  }
 }
 if(bytes>1024**3)errors.push('Static artifact exceeds the GitHub Pages site limit.');
 const tracked=spawnSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'});
 if(tracked.status===0)for(const name of tracked.stdout.split('\0').filter(Boolean)){
  const allowed=/^(?:dist\/|\.github\/|\.githooks\/|scripts\/(?:serve\.mjs|build-responsive-images\.py|check-publication\.mjs|publication\.mjs|guard-push\.mjs)$|(?:\.gitignore|\.gitattributes|AGENTS\.md|README\.md|PUBLICACIO\.md|publication\.config\.json|package\.json|SOURCE-MANIFEST-V29\.json|OBRIR-PORTAFOLI\.cmd)$)/.test(name);
  if(!allowed)errors.push(`Private or unapproved source tracked by Git: ${name}`);
 }
 if(errors.length)throw new Error(errors.join('\n'));
 return {files:files.length,bytes,references,distDigest:digest.digest('hex')};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(checkPublication(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
