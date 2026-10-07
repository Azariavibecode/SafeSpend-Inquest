import{createClient}from"../frontend/node_modules/genlayer-js/dist/index.js";
import{studionet}from"../frontend/node_modules/genlayer-js/dist/chains/index.js";
import{TransactionStatus}from"../frontend/node_modules/genlayer-js/dist/types/index.js";
import{privateKeyToAccount}from"../frontend/node_modules/viem/_esm/accounts/index.js";
import{writeFileSync}from"node:fs";
const contract="0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2",sourceCommit="ce687604bf8972d8e8ef8fdb286b26f56a16772e",safe="0xEc834bD1F492a8Bd5aa71023550C44D4fB14632A";
const keys=[process.env.TEST_WALLET_A_PRIVATE_KEY,process.env.TEST_WALLET_B_PRIVATE_KEY];
if(keys.some(k=>!/^(0x)?[0-9a-fA-F]{64}$/.test(k||"")))throw Error("Set both secondary-wallet keys");
const wallets=keys.map(k=>privateKeyToAccount(k.startsWith("0x")?k:`0x${k}`));
const reader=createClient({chain:studionet}),writer=w=>createClient({chain:studionet,account:w});
const parse=async(n,a=[])=>JSON.parse(await reader.readContract({address:contract,functionName:n,args:a}));
const transactions=[];
function txhash(v){return typeof v==="string"?v:v?.txId}
async function write(w,fn,args,label,value){
 const hash=txhash(await writer(w).writeContract({address:contract,functionName:fn,args,...(value!==undefined?{value:BigInt(value)}:{})}));
 const receipt=await reader.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:3000,retries:140});
 const tx=await reader.getTransaction({hash}),result=tx.result_name||tx.resultName||"";
 transactions.push({label,hash,actor:w.address,status:receipt.status_name||receipt.status,result});
 console.log(`${label}: ${hash} ${receipt.status_name||receipt.status} ${result}`);
 return{hash,result};
}
const source=(file,digest,marker)=>JSON.stringify({owner:"Azariavibecode",repo:"SafeSpend-Inquest",commit:sourceCommit,path:`/fixtures/policies/${file}`,digest,marker});
const cases=[
 {name:"breach",file:"e2e-breach.md",digest:"4fe76c5576b343845fa6b31f03586328e8efbc3eea8b7af91cb3dc8ce849b94e",marker:"## POLICY E2E-BREACH-001",safeTx:"0xb00c0d29568134d4fbec32ad37c46e11577572a2fcc4fb12dfa9274ff24f89a5",expected:"BREACH"},
 {name:"inconclusive",file:"e2e-inconclusive.md",digest:"4823a4d44c75477febf3c9822664e3a5928b307929ada2b0fb0296e58575005b",marker:"## POLICY E2E-INCONCLUSIVE-001",safeTx:"0xf1f7299be32f4bcf18046c36eee756aa89d2fb5d8695d5eee3f267ea180ad9b9",expected:"INCONCLUSIVE"},
];
const startCounts=await parse("get_counts");
if(startCounts.policy_count!==1||startCounts.incident_count!==1||startCounts.assessed_count!==1)throw Error(`Unexpected resume point ${JSON.stringify(startCounts)}`);
let inc=await parse("get_incident",[0n]);
if(inc.verdict!=="COMPLIANT"||inc.state!=="ASSESSMENT_FINAL")throw Error(`First case isn't ready for settlement: ${JSON.stringify(inc)}`);
await write(wallets[0],"claim_settlement",[0n],"compliant_claim_settlement");
inc=await parse("get_incident",[0n]);
let pol=await parse("get_policy",[0n]);
if(inc.state!=="SETTLED"||pol.state!=="CLOSED")throw Error("Compliant settlement readback mismatch");
const resultCases=[{name:"compliant",expected:"COMPLIANT",policy_id:0,incident_id:0,incident:inc,policy:pol,assessment_attempts:[
 {hash:"0x8eda0ab186c5f8621c9f4c150e83f76add720965a71b49777f9f2a8fbabc3ea8",result:"MAJORITY_DISAGREE",readback:"EVIDENCE_FROZEN"},
 {hash:"0x6d5665f061685c7b434f710341d131e53e33516a9a699f4646a85806c19a9976",result:"MAJORITY_AGREE",readback:"COMPLIANT"}
]}];
for(const c of cases){
 let counts=await parse("get_counts"),pid=BigInt(counts.policy_count);
 await write(wallets[0],"register_policy",[`e2e-${c.name}`,safe,source(c.file,c.digest,c.marker)],`${c.name}_register_policy`,1n);
 pol=await parse("get_policy",[pid]);if(pol.state!=="DRAFT")throw Error(`${c.name}: register readback`);
 await write(wallets[0],"authenticate_policy",[pid],`${c.name}_authenticate_policy`);
 pol=await parse("get_policy",[pid]);if(pol.state!=="ACTIVE")throw Error(`${c.name}: source auth readback`);
 counts=await parse("get_counts");const iid=BigInt(counts.incident_count),preRole=counts;
 await write(wallets[0],"open_incident",[pid,c.safeTx],`${c.name}_failure_same_wallet`,1n);
 let post=await parse("get_counts");if(post.incident_count!==preRole.incident_count||post.total_liability!==preRole.total_liability)throw Error(`${c.name}: self-open mutated state`);
 await write(wallets[1],"open_incident",[pid,c.safeTx],`${c.name}_open_incident`,1n);
 inc=await parse("get_incident",[iid]);if(inc.state!=="OPEN")throw Error(`${c.name}: open readback`);
 counts=await parse("get_counts");await write(wallets[1],"open_incident",[pid,c.safeTx],`${c.name}_failure_replay`,1n);
 post=await parse("get_counts");if(post.incident_count!==counts.incident_count||post.total_liability!==counts.total_liability)throw Error(`${c.name}: replay mutated state`);
 await write(wallets[1],"freeze_evidence",[iid],`${c.name}_freeze_runtime`);
 inc=await parse("get_incident",[iid]);if(inc.state!=="EVIDENCE_FROZEN")throw Error(`${c.name}: runtime verification ${JSON.stringify(inc)}`);
 const attempts=[];let outcome="";
 for(let attempt=0;attempt<3;attempt++){
  const action=await write(wallets[1],"assess_incident",[iid],`${c.name}_assess_${attempt+1}`);
  inc=await parse("get_incident",[iid]);attempts.push({hash:action.hash,result:action.result,state:inc.state,verdict:inc.verdict});
  if(action.result==="MAJORITY_AGREE"&&inc.state==="ASSESSMENT_FINAL"){outcome=inc.verdict;break;}
  if(inc.state!=="EVIDENCE_FROZEN")throw Error(`${c.name}: unexpected post-disagreement mutation ${JSON.stringify(inc)}`);
 }
 if(outcome!==c.expected)throw Error(`${c.name}: expected ${c.expected}; observed ${outcome||"consensus unavailable"}; attempts=${JSON.stringify(attempts)}`);
 if(outcome==="INCONCLUSIVE"){
  await write(wallets[0],"claim_split_refund",[iid],`${c.name}_sponsor_refund`);
  await write(wallets[1],"claim_split_refund",[iid],`${c.name}_reporter_refund`);
 }else{
  const winner=outcome==="BREACH"?wallets[1]:wallets[0],loser=outcome==="BREACH"?wallets[0]:wallets[1];
  const beforeWrong=await parse("get_incident",[iid]);await write(loser,"claim_settlement",[iid],`${c.name}_failure_wrong_claimant`);
  const afterWrong=await parse("get_incident",[iid]);if(afterWrong.state!==beforeWrong.state||afterWrong.claim_amount!==beforeWrong.claim_amount)throw Error(`${c.name}: wrong claimant mutated settlement`);
  await write(winner,"claim_settlement",[iid],`${c.name}_claim_settlement`);
 }
 inc=await parse("get_incident",[iid]);pol=await parse("get_policy",[pid]);
 if(inc.state!=="SETTLED"||pol.state!=="CLOSED")throw Error(`${c.name}: settlement readback mismatch`);
 resultCases.push({name:c.name,expected:c.expected,policy_id:Number(pid),incident_id:Number(iid),policy:pol,incident:inc,assessment_attempts:attempts});
}
const after=await parse("get_counts");
if(after.policy_count!==3||after.incident_count!==3||after.assessed_count!==3||after.settled_count!==3||after.total_liability!=="0")throw Error(`Final accounting mismatch: ${JSON.stringify(after)}`);
const report={generated_at:new Date().toISOString(),network:"StudioNet",chain_id:61999,contract,source_commit:sourceCommit,source_scope:"The policies are synthetic sponsor declarations. Safe Transaction Service and Blockscout establish runtime identity and execution.",wallets:wallets.map(w=>w.address),safe,start_counts:startCounts,final_counts:after,cases:resultCases,transactions};
writeFileSync("verification/studionet-e2e.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
