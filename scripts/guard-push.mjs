import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { root } from './check-publication.mjs';

export function approvalPath(){return path.resolve(root,execFileSync('git',['rev-parse','--git-path','publication-approval.json'],{cwd:root,encoding:'utf8'}).trim());}
export function requireApproval(remoteUrl){
 const config=JSON.parse(fs.readFileSync(path.join(root,'publication.config.json'),'utf8'));
 let approval;try{approval=JSON.parse(fs.readFileSync(approvalPath(),'utf8'));}catch{throw new Error('Push blocked: no human-approved publication receipt. Request «Publica els canvis» for the reviewed version.');}
 if(approval.confirmation!==config.requiredHumanConfirmation||approval.remote!==config.remote||remoteUrl!==config.remote||!Number.isFinite(Date.parse(approval.expiresAt))||Date.now()>Date.parse(approval.expiresAt)||!/^[a-f0-9]{40,64}$/.test(approval.commit))throw new Error('Push blocked: missing, expired, or mismatched publication approval.');
 return approval;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const approval=requireApproval(process.argv[3]);
  const updates=fs.readFileSync(0,'utf8').trim().split('\n').filter(Boolean);
  if(updates.length!==1)throw new Error('Push blocked: publish only the single approved main commit.');
  const [,sha,remoteRef]=updates[0].trim().split(/\s+/);
  if(remoteRef!=='refs/heads/main'||sha!==approval.commit)throw new Error('Push blocked: branch or commit is not approved.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
