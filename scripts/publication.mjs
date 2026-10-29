import fs from 'node:fs';
import path from 'node:path';
import { execFileSync,spawnSync } from 'node:child_process';
import { root,checkPublication } from './check-publication.mjs';
import { approvalPath,requireApproval } from './guard-push.mjs';

const config=JSON.parse(fs.readFileSync(path.join(root,'publication.config.json'),'utf8'));
const local=path.join(root,'.publication'),reviewPath=path.join(local,'review.json');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const save=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
function currentReview(){
 const review=JSON.parse(fs.readFileSync(reviewPath,'utf8'));
 if(git('branch','--show-current')!==config.workingBranch||git('rev-parse','HEAD')!==review.commit||git('status','--porcelain'))throw new Error('The working version changed. Prepare and preview a new review before requesting approval.');
 const checks=checkPublication();if(checks.distDigest!==review.distDigest)throw new Error('The reviewed static files changed.');return review;
}
try{
 const command=process.argv[2]||'status';
 if(command==='prepare'){
  if(git('branch','--show-current')!==config.workingBranch)throw new Error('Prepare reviews only on the local work branch.');
  checkPublication();git('add','--all');const checks=checkPublication();
  if(spawnSync('git',['diff','--cached','--quiet'],{cwd:root}).status!==0)git('commit','-m','Checkpoint portfolio for publication review');
  const review={commit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),...checks,preparedAt:new Date().toISOString(),repository:config.repository,publicUrl:config.publicUrl,approved:false};
  save(reviewPath,review);console.log(JSON.stringify(review,null,2));
 }else if(command==='approve'){
  if(process.argv[3]!=='--confirmation'||process.argv[4]!==config.requiredHumanConfirmation)throw new Error('Approval requires the human’s explicit «Publica els canvis».');
  const review=currentReview();
  save(approvalPath(),{commit:review.commit,remote:config.remote,confirmation:config.requiredHumanConfirmation,approvedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+2*60*60*1000).toISOString()});
  console.log('Exact reviewed commit approved locally. No push performed.');
 }else if(command==='publish'){
  const review=currentReview(),approval=requireApproval(config.remote);
  if(approval.commit!==review.commit||git('remote','get-url','origin')!==config.remote)throw new Error('Publication target or approval changed.');
  const main=spawnSync('git',['rev-parse','--verify','refs/heads/main'],{cwd:root,encoding:'utf8'});
  if(main.status===0&&spawnSync('git',['merge-base','--is-ancestor',main.stdout.trim(),review.commit],{cwd:root}).status!==0)throw new Error('Publication would replace history. Use a new forward commit instead.');
  git('update-ref','refs/heads/main',review.commit);
  execFileSync('git',['push','origin','refs/heads/main:refs/heads/main'],{cwd:root,stdio:'inherit'});
  fs.unlinkSync(approvalPath());save(path.join(local,'last-publication.json'),{commit:review.commit,pushedAt:new Date().toISOString(),repository:config.repository});
  console.log('Approved commit pushed. Verify the Pages workflow and public browser before reporting deployment success.');
 }else if(command==='status'){
  console.log(JSON.stringify({repository:config.repository,plannedPublicUrl:config.publicUrl,branch:git('branch','--show-current'),reviewPrepared:fs.existsSync(reviewPath),approvalPresent:fs.existsSync(approvalPath()),note:'No command publishes automatically; human approval is required.'},null,2));
 }else throw new Error('Use status, prepare, approve, or publish.');
}catch(error){console.error(error.message);process.exitCode=1;}
