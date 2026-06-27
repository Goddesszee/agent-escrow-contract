# AgentEscrow — AI Consensus Payment Escrow for AI Agents

**Track:** Agentic Economy Infrastructure  
**Built on:** GenLayer Bradbury Testnet  
**Contract:** `agent_escrow.py`  

---

## What it is

AgentEscrow lets a client hire an AI agent (or human), lock payment on-chain, and have the work automatically verified and paid out — **with no human arbiter**.

When the agent submits their deliverable URL, **5 GenLayer AI validator nodes fetch the URL live**, read the content, and reach subjective consensus on whether it meets the original brief. Payment releases on approval. No court, no middleman, no oracle.

This is only possible on GenLayer — it requires live web access + LLM subjective consensus at the blockchain protocol level.

---

## How it works

```
Client posts job + locks GEN payment
        ↓
Agent completes work, submits a public URL
        ↓
GenLayer: 5 validators fetch the URL live
          Each validator runs LLM reasoning:
          "Does this deliverable meet the brief?"
          Consensus via eq_principle_prompt_non_comparative
        ↓
APPROVED → payment sent to agent automatically
REJECTED → status set to "disputed", client can manually resolve
```

---

## Contract methods

| Method | Who calls it | What it does |
|---|---|---|
| `post_job(agent, brief)` | Client (payable) | Posts job, locks GEN in escrow |
| `submit_deliverable(job_id, url)` | Agent | Submits work URL, triggers AI evaluation |
| `client_approve(job_id)` | Client | Manually approves a disputed job |
| `client_refund(job_id)` | Client | Refunds an open job with no submission |
| `get_job(job_id)` | Anyone | Returns full job details |
| `get_jobs_for_client(address)` | Anyone | Lists all job IDs for a client |
| `get_jobs_for_agent(address)` | Anyone | Lists all job IDs for an agent |

---

## Tech stack

- **Intelligent Contract:** Python, GenLayer SDK (`py-genlayer:test`)
- **AI evaluation:** `gl.get_webpage()` + `gl.eq_principle_prompt_non_comparative`
- **Frontend:** React (Vite), GenLayer JS SDK
- **Testnet:** GenLayer Bradbury

---

## Getting started

### Run the contract in GenLayer Studio

1. Go to [studio.genlayer.com](https://studio.genlayer.com)
2. Paste the contents of `contract/agent_escrow.py`
3. Deploy (no constructor args needed)
4. Try the flow:
   - Call `post_job` with an agent address, brief, and send some GEN as value
   - Call `submit_deliverable` with the job_id and a public URL
   - Watch the AI validators evaluate in the logs panel

### Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

Replace `CONTRACT_ADDRESS` in `src/App.jsx` with your deployed contract address.

To connect to GenLayer Bradbury testnet, update the client config in `src/App.jsx`:

```js
import { bradbury } from 'genlayer-js/chains';
const client = createClient({ chain: bradbury, account });
```

---

## Why GenLayer makes this possible

Traditional escrow contracts can't verify work quality — they only know if a transaction happened. GenLayer's Intelligent Contracts can:

- **Fetch live URLs** at evaluation time via `gl.get_webpage()`
- **Reason about content** using LLMs across 5 independent validator nodes
- **Reach consensus on subjective decisions** via `eq_principle_prompt_non_comparative`

No oracle. No centralized judge. No trust required.

---

## Deployed contract

- **Bradbury Testnet:** `0xYOUR_DEPLOYED_ADDRESS`
- **Studio link:** `https://studio.genlayer.com/0xYOUR_DEPLOYED_ADDRESS`
- **GitHub:** `https://github.com/Goddesszee/agent-escrow-contract`
