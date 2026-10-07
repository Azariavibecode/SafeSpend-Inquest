import {createClient} from "../frontend/node_modules/genlayer-js/dist/index.js";
import {studionet} from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
import {TransactionStatus} from "../frontend/node_modules/genlayer-js/dist/types/index.js";
import {privateKeyToAccount} from "../frontend/node_modules/viem/_esm/accounts/index.js";
import {writeFileSync} from "node:fs";

const contract="0x4e4349F3DE5e1fE40a5642A9eD0563B0DF6fdBf2";
const sourceCommit="ce687604bf8972d8e8ef8fdb286b26f56a16772e";
const safe="0xEc834bD1F492a8Bd5aa71023550C44D4fB14632A";
const keys=[process.env.TEST_WALLET_A_PRIVATE_KEY,process.env.TEST_WALLET_B_PRIVATE_KEY];
if(keys.some(k=>!/^(0x)?[0-9a-fA-F]{64}$/.test(k||"")))throw Error("Set both secondary-wallet keys");
const wallets=keys.map(k=>privateKeyToAccount(k.startsWith("0x")?k:`0x${k}`));
if(wallets[0].address.toLowerCase()===wallets[1].address.toLowerCase())throw Error("Secondary wallets must differ");
const reader=createClient({chain:studionet});
const writer=w=>createClient({chain:studionet,account:w});
const parse=async(name,args=[])=>JSON.parse(await reader.readContract({address:contract,functionName:name,args}));
const transactions=[];
const normalize=v=>typeof v==="string"?v:v?.txId;
async function write(wallet,functionName,args,label,value){
  const hash=normalize(await writer(wallet).writeContract({address:contract,functionName,args,...(value!==undefined?{value:BigInt(value)}:{})}));
  if(!hash)throw Error(`${label}: missing transaction hash`);
  const receipt=await reader.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:3000,retries:140});
  const status=receipt.status_name||receipt.status;
  const tx=await reader.getTransaction({hash});
  transactions.push({label,hash,actor:wallet.address,status,result_name:tx?.result_name||tx?.resultName||""});
  console.log(`${label}: ${hash} ${status}`);
  return hash;
}
const source=(file,digest,marker)=>JSON.stringify({owner:"Azariavibecode",repo:"SafeSpend-Inquest",commit:sourceCommit,path:`/fixtures/policies/${file}`,digest,marker});
const cases=[
  {name:"compliant",file:"e2e-compliant.md",digest:"86079913a1d1b3f84da934d1d114bfcb6dbe41bad4be8cce6423ac4d6527e56c",marker:"## POLICY E2E-COMPLIANT-001",safeTx:"0x412389dabbc92c5ae61d7869b96522c105e1e841893764ddd922f73c9e99e9dc",expected:"COMPLIANT"},
  {name:"breach",file:"e2e-breach.md",digest:"4fe76c5576b343845fa6b31f03586328e8efbc3eea8b7af91cb3dc8ce849b94e",marker:"## POLICY E2E-BREACH-001",safeTx:"0xb00c0d29568134d4fbec32ad37c46e11577572a2fcc4fb12dfa9274ff24f89a5",expected:"BREACH"},
  {name:"inconclusive",file:"e2e-inconclusive.md",digest:"4823a4d44c75477febf3c9822664e3a5928b307929ada2b0fb0296e58575005b",marker:"## POLICY E2E-INCONCLUSIVE-001",safeTx:"0xf1f7299be32f4bcf18046c36eee756aa89d2fb5d8695d5eee3f267ea180ad9b9",expected:"INCONCLUSIVE"},
];
const before=await parse("get_counts");
const results=[];
for(const c of cases){
  let counts=await parse("get_counts");
  const policyId=BigInt(counts.policy_count);
  await write(wallets[0],"register_policy",[`e2e-${c.name}`,safe,source(c.file,c.digest,c.marker)],`${c.name}_register_policy`,1n);
  let policy=await parse("get_policy",[policyId]);
  if(policy.state!=="DRAFT"||policy.sponsor.toLowerCase()!==wallets[0].address.toLowerCase())throw Error(`${c.name}: policy creation mismatch ${JSON.stringify(policy)}`);
  await write(wallets[0],"authenticate_policy",[policyId],`${c.name}_authenticate_policy`);
  policy=await parse("get_policy",[policyId]);
  if(policy.state!=="ACTIVE")throw Error(`${c.name}: policy source did not authenticate ${JSON.stringify(policy)}`);

  counts=await parse("get_counts");
  const incidentId=BigInt(counts.incident_count);
  const beforeRole={...counts};
  await write(wallets[0],"open_incident",[policyId,c.safeTx],`${c.name}_failure_same_wallet`,1n);
  const afterRole=await parse("get_counts");
  if(afterRole.incident_count!==beforeRole.incident_count||afterRole.total_liability!==beforeRole.total_liability)throw Error(`${c.name}: rejected same-wallet call mutated accounting`);

  await write(wallets[1],"open_incident",[policyId,c.safeTx],`${c.name}_open_incident`,1n);
  let incident=await parse("get_incident",[incidentId]);
  policy=await parse("get_policy",[policyId]);
  if(incident.state!=="OPEN"||policy.state!=="IN_REVIEW")throw Error(`${c.name}: incident/policy phase mismatch`);

  const countBeforeReplay=await parse("get_counts");
  await write(wallets[1],"open_incident",[policyId,c.safeTx],`${c.name}_failure_replay`,1n);
  const countAfterReplay=await parse("get_counts");
  if(countAfterReplay.incident_count!==countBeforeReplay.incident_count||countAfterReplay.total_liability!==countBeforeReplay.total_liability)throw Error(`${c.name}: replay mutated accounting`);

  await write(wallets[1],"freeze_evidence",[incidentId],`${c.name}_freeze_runtime`);
  incident=await parse("get_incident",[incidentId]);
  if(incident.state!=="EVIDENCE_FROZEN")throw Error(`${c.name}: runtime evidence failed ${JSON.stringify(incident)}`);
  await write(wallets[1],"assess_incident",[incidentId],`${c.name}_assess`);
  incident=await parse("get_incident",[incidentId]);
  if(incident.state!=="ASSESSMENT_FINAL"||incident.verdict!==c.expected)throw Error(`${c.name}: expected ${c.expected}, got ${JSON.stringify(incident)}`);

  if(c.expected==="INCONCLUSIVE"){
    await write(wallets[0],"claim_split_refund",[incidentId],`${c.name}_sponsor_refund`);
    await write(wallets[1],"claim_split_refund",[incidentId],`${c.name}_reporter_refund`);
  }else{
    const winner=c.expected==="BREACH"?wallets[1]:wallets[0];
    const loser=c.expected==="BREACH"?wallets[0]:wallets[1];
    const beforeWrong=await parse("get_incident",[incidentId]);
    await write(loser,"claim_settlement",[incidentId],`${c.name}_failure_wrong_claimant`);
    const afterWrong=await parse("get_incident",[incidentId]);
    if(afterWrong.state!==beforeWrong.state||afterWrong.claim_amount!==beforeWrong.claim_amount)throw Error(`${c.name}: wrong claimant mutated settlement`);
    await write(winner,"claim_settlement",[incidentId],`${c.name}_claim_settlement`);
  }
  incident=await parse("get_incident",[incidentId]);
  policy=await parse("get_policy",[policyId]);
  if(incident.state!=="SETTLED"||policy.state!=="CLOSED")throw Error(`${c.name}: terminal state mismatch`);
  results.push({name:c.name,expected:c.expected,policy_id:Number(policyId),incident_id:Number(incidentId),policy,incident});
}
const after=await parse("get_counts");
if(after.policy_count-before.policy_count!==3||after.incident_count-before.incident_count!==3||after.assessed_count-before.assessed_count!==3||after.settled_count-before.settled_count!==3||after.total_liability!=="0")throw Error(`final counters/accounting mismatch ${JSON.stringify({before,after})}`);
const report={generated_at:new Date().toISOString(),network:"StudioNet",chain_id:61999,contract,source_commit:sourceCommit,source_scope:"Synthetic policies prove protocol behavior only; Safe and Blockscout prove runtime identity/execution.",wallets:wallets.map(w=>w.address),safe,before,after,cases:results,transactions};
writeFileSync("verification/studionet-e2e.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
