# { "Depends": "py-genlayer:test" }

from genlayer import *
from dataclasses import dataclass
import json


@allow_storage
@dataclass
class EscrowJob:
    job_id: str
    client: Address
    agent: Address
    amount_gwei: u256
    brief: str
    deliverable_url: str
    status: str        # "open" | "submitted" | "approved" | "disputed" | "refunded"
    verdict: str
    reasoning: str


class AgentPaymentEscrow(gl.Contract):
    """
    Agent Payment Escrow — Agentic Economy Track (GenLayer Bradbury Hackathon)

    Client posts a job with a natural-language brief and locks GEN payment.
    Agent submits a deliverable URL when work is done.
    5 GenLayer AI validators fetch the URL, read the content live,
    and reach subjective consensus on whether it meets the brief.
    Payment releases automatically on APPROVED. No human arbiter needed.

    This contract is only possible on GenLayer — it requires live web
    access and LLM subjective consensus at the protocol level.
    """

    jobs: TreeMap[str, EscrowJob]
    job_counter: u256
    total_escrowed: u256

    def __init__(self) -> None:
        self.job_counter = u256(0)
        self.total_escrowed = u256(0)

    # ── Write: Client creates job ───────────────────────────────────

    @gl.public.write.payable
    def post_job(self, agent: Address, brief: str) -> None:
        """
        Client posts a job and locks payment in escrow.
        gl.message.value is the GEN amount to lock.
        agent: wallet address of the agent being hired.
        brief: natural language description of what must be delivered.
        """
        assert gl.message.value > u256(0), "Must lock payment to create a job"
        assert len(brief) >= 20, "Brief must be at least 20 characters"
        assert len(brief) <= 2000, "Brief must be under 2000 characters"

        job_id = str(self.job_counter)
        self.job_counter = self.job_counter + u256(1)

        job = EscrowJob(
            job_id=job_id,
            client=gl.message.sender,
            agent=agent,
            amount_gwei=gl.message.value,
            brief=brief,
            deliverable_url="",
            status="open",
            verdict="",
            reasoning="",
        )
        self.jobs[job_id] = job
        self.total_escrowed = self.total_escrowed + gl.message.value

    # ── Write: Agent submits deliverable ───────────────────────────

    @gl.public.write
    def submit_deliverable(self, job_id: str, deliverable_url: str) -> None:
        """
        Agent submits the public URL of their completed work.
        This triggers live AI evaluation by 5 validators automatically.
        deliverable_url must be publicly accessible (GitHub repo, doc, website, etc.)
        """
        assert job_id in self.jobs, "Job not found"
        job = self.jobs[job_id]

        assert gl.message.sender == job.agent, "Only the assigned agent can submit"
        assert job.status == "open", "Job is not open for submission"
        assert deliverable_url.startswith("http"), "Deliverable must be a valid URL"
        assert len(deliverable_url) <= 500, "URL too long"

        job.deliverable_url = deliverable_url
        job.status = "submitted"
        self.jobs[job_id] = job

        # Run AI evaluation — non-deterministic block across 5 validators
        brief = job.brief
        url = deliverable_url

        def evaluate() -> str:
            # Fetch the live content of the deliverable
            try:
                content = gl.get_webpage(url, mode="text")
                if len(content) > 4000:
                    content = content[:4000] + "\n...[content truncated for evaluation]"
            except Exception:
                content = "[Error: could not fetch deliverable URL]"

            prompt = f"""You are an impartial AI escrow evaluator.

A client hired an agent with this brief:
---BRIEF START---
{brief}
---BRIEF END---

The agent submitted this URL as their deliverable: {url}

Content fetched live from the URL:
---CONTENT START---
{content}
---CONTENT END---

Your task: decide if the deliverable substantially meets the brief.
Ask yourself:
- Does the content actually exist at this URL?
- Does it address the core requirements in the brief?
- Is it complete enough to warrant releasing payment?

Be reasonable — minor imperfections are fine. Reject only if the work
clearly does not meet the brief or the URL has no relevant content.

Reply with ONLY this JSON (no extra text, no markdown):
{{"verdict": "APPROVED", "reasoning": "one sentence"}}
or
{{"verdict": "REJECTED", "reasoning": "one sentence"}}"""

            return gl.exec_prompt(prompt)

        result_str = gl.eq_principle_prompt_non_comparative(evaluate)

        # Parse verdict from LLM output
        try:
            clean = result_str.strip()
            # Strip markdown fences if model added them
            if "```" in clean:
                parts = clean.split("```")
                for part in parts:
                    part = part.strip()
                    if part.startswith("{") or part.startswith("json\n{"):
                        clean = part.replace("json\n", "").strip()
                        break
            parsed = json.loads(clean)
            verdict = str(parsed.get("verdict", "REJECTED")).upper().strip()
            reasoning = str(parsed.get("reasoning", "No reasoning provided"))
            if verdict not in ("APPROVED", "REJECTED"):
                verdict = "REJECTED"
                reasoning = "Unexpected verdict format from evaluator"
        except Exception:
            verdict = "REJECTED"
            reasoning = "Could not parse AI evaluation — manual review needed"

        # Write verdict back to storage
        job2 = self.jobs[job_id]
        job2.verdict = verdict
        job2.reasoning = reasoning

        if verdict == "APPROVED":
            job2.status = "approved"
            self.jobs[job_id] = job2
            self._release_payment(job2)
        else:
            job2.status = "disputed"
            self.jobs[job_id] = job2

    # ── Write: Manual resolution ────────────────────────────────────

    @gl.public.write
    def client_approve(self, job_id: str) -> None:
        """
        Client can manually approve a disputed job.
        Use this if the AI verdict was wrong and you want to pay the agent.
        """
        assert job_id in self.jobs, "Job not found"
        job = self.jobs[job_id]
        assert gl.message.sender == job.client, "Only the client can approve"
        assert job.status in ("disputed", "submitted"), "Nothing to approve"

        job.status = "approved"
        job.verdict = "APPROVED"
        job.reasoning = "Manually approved by client"
        self.jobs[job_id] = job
        self._release_payment(job)

    @gl.public.write
    def client_refund(self, job_id: str) -> None:
        """
        Client claims a refund on an open job (before agent submits).
        Can only refund if status is still 'open'.
        """
        assert job_id in self.jobs, "Job not found"
        job = self.jobs[job_id]
        assert gl.message.sender == job.client, "Only the client can refund"
        assert job.status == "open", "Can only refund an open job with no submission"

        job.status = "refunded"
        self.jobs[job_id] = job
        self.total_escrowed = self.total_escrowed - job.amount_gwei
        gl.emit_transfer(job.client, job.amount_gwei)

    # ── Internal ────────────────────────────────────────────────────

    def _release_payment(self, job: EscrowJob) -> None:
        self.total_escrowed = self.total_escrowed - job.amount_gwei
        gl.emit_transfer(job.agent, job.amount_gwei)

    # ── View methods ────────────────────────────────────────────────

    @gl.public.view
    def get_job(self, job_id: str) -> EscrowJob:
        assert job_id in self.jobs, "Job not found"
        return self.jobs[job_id]

    @gl.public.view
    def get_job_count(self) -> u256:
        return self.job_counter

    @gl.public.view
    def get_total_escrowed(self) -> u256:
        return self.total_escrowed

    @gl.public.view
    def get_jobs_for_client(self, client: Address) -> list[str]:
        result: list[str] = []
        for i in range(int(self.job_counter)):
            jid = str(i)
            if jid in self.jobs and self.jobs[jid].client == client:
                result.append(jid)
        return result

    @gl.public.view
    def get_jobs_for_agent(self, agent: Address) -> list[str]:
        result: list[str] = []
        for i in range(int(self.job_counter)):
            jid = str(i)
            if jid in self.jobs and self.jobs[jid].agent == agent:
                result.append(jid)
        return result
