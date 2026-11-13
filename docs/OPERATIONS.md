# Zukai Production Operations & Quality Runbook

This runbook covers day-to-day operations, health monitoring, queue lifecycle, and ongoing quality review processes for the Zukai platform.

---

## 1. Worker Lifecycle & Service Management

The Zukai worker is a Node.js Fastify microservice responsible for claiming queued audio jobs, running document text extraction, invoking Gemini for scriptwriting, synthesizing neural audio, and assembling finished audio tracks with chapters and transcripts.

### Starting the Worker Daemon

#### Development Mode:
```bash
cd worker
npm run dev
```

#### Production Mode:
```bash
cd worker
npm run build
npm run start
```

### Health Endpoints:
- `GET /healthz` — Returns `200 OK` if the process is responsive.
- `GET /readyz` — Returns `200 OK` if Supabase connection and Gemini credentials are authenticated.

---

## 2. Queue Mechanics & State Machine

1. **Job Enqueue**: Client uploads document and calls `create_audio_job` RPC (`status = 'queued'`).
2. **Job Claim**: Worker polls `claim_next_job(p_vt_seconds := 600)`.
   - Atomically transitions job to `status = 'extracting'`.
   - Starts worker heartbeat loop updating `heartbeat_at`, `progress`, and `current_step`.
3. **Execution Stages**:
   - `extracting` (10–25%): PDF / DOCX / PPTX parsing.
   - `scripting` (25–65%): Gemini two-pass script generation with adversarial shielding.
   - `voicing` (65–90%): Neural TTS audio chunk streaming.
   - `assembling` (90–100%): ffmpeg loudness normalization (-16 LUFS) and chapter alignment.
4. **Completion**: Worker calls `complete_job` RPC (`status = 'ready'`), uploads audio to `audio` bucket, updates `audio_jobs.quality_meta`, and emits real-time update.
5. **Recovery**: If a worker crashes, the visibility timeout expires (10 minutes) and the next worker re-claims the job. After 3 failed attempts, status transitions to `failed`.

---

## 3. Quality Alerts & Incident Thresholds

The following metric thresholds trigger operational alerts:

| Metric | Threshold | Severity | Immediate Action |
| :--- | :--- | :--- | :--- |
| **Negative Feedback Rate** | $> 15\%$ over 24h | Warning | Run `npm run feedback:report` to identify prompt/voice issues |
| **Hard-Fail / Injection Rate** | $> 0.1\%$ of jobs | Critical | Revert latest prompt revision and investigate source text |
| **TTS Synthesis Failure Rate**| $> 2\%$ of jobs | High | Verify TTS quotas and check network egress |
| **Avg Job Duration** | $> 120$ seconds | Medium | Check document sizes and Gemini API latency |
| **Queue Depth** | $> 50$ jobs waiting | High | Spin up additional worker replicas |

---

## 4. Human Review & Feedback Routine

### Weekly Feedback Report:
Every Monday morning, run the automated listener feedback aggregation:
```bash
cd worker
npm run feedback:report
```
Review `worker/eval/results/FEEDBACK_REPORT.md` to identify:
- Recurring user-reported issues (`too_fast`, `missed_important_part`, etc.).
- Performance drift between English and Hinglish explanations.
- Tracks with lowest listener satisfaction.

### Monthly Human Quality Review Protocol (45-Minute Routine):
1. Sample 10 randomly selected production tracks (5 English, 5 Hinglish).
2. Open `worker/eval/review.html` in a web browser.
3. Compare the source excerpt with the generated narration script and audio track.
4. Score each dimension (1 to 5) according to `docs/QUALITY_RUBRIC.md`.
5. Export review ratings to `worker/eval/human-reviews/YYYY-MM.json`.
6. Any dimension scoring $< 4.0$ triggers a prompt revision issue for the next sprint.

