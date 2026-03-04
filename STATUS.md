# MCP Automation Hub — Status & Prompt/Pattern Library

> **Pinned standards document** — copy these prompts into GitHub issues, PRs, or Copilot Chat to drive context-aware, actionable responses across the Crystal Clear House ecosystem.

## Repository Status

| Area | Status |
|------|--------|
| MCP Server | ✅ Operational |
| TypeScript Build | ✅ Passing |
| CI/CD Pipeline | ✅ Active |
| n8n Integration | 🔧 In Progress |
| Terraform Modules | 🔧 In Progress |
| Observability | 🔧 In Progress |

---

## Golden Prompts

Paste any of these prompts directly into Copilot Chat against this repo for targeted, actionable results.

---

### 1. 📅 Roadmap Planning

```
Propose a 12-month milestone plan for crystalclearhouse-data/mcp-automation-hub,
covering infra, workflow, security, and data observability.

For each quarter provide:
- Key milestones and deliverables
- Infrastructure changes (Terraform, Cloud Run, GCP, Supabase)
- Workflow automation improvements (n8n, GitHub Actions)
- Security hardening steps (OIDC, secret management, RBAC)
- Data observability initiatives (audit trails, BigQuery, dashboards)
- Success metrics and acceptance criteria
```

**MCP Prompt name:** `roadmap-planning`

---

### 2. 🏗️ Infrastructure Module Baseline

```
List the top reusable patterns in this repo's Terraform and show how to baseline
them into new modules for GCP, Supabase, Cloud Run, and event audit schemas.

For each pattern provide:
1. Current implementation
2. Extracted module with variables and outputs
3. Example instantiation
4. Proposed modules/ directory structure
```

**MCP Prompt name:** `infra-module-baseline`

---

### 3. 🚀 MCP Server Golden Path

```
Design the golden path for adding a new MCP server to this repository.

Provide step-by-step instructions and file contents for:
1. TypeScript entry point following src/ patterns
2. mcp-config.json updates
3. Terraform Cloud Run module + IAM bindings
4. GitHub Actions CI build+push + terraform plan/apply
5. Structured logging and health-check endpoint
6. SKILL.md entry and runbook
```

**MCP Prompt name:** `mcp-server-golden-path` (requires `service_name` argument)

---

### 4. ⚙️ CI/CD GitHub Actions Workflow

```
Show a working GitHub Actions workflow for this repo with:
- Build, TypeScript compile, and jest tests
- Docker multi-stage build + push to Artifact Registry
- terraform plan on PRs (post as PR comment)
- terraform apply on merge to main using OIDC (no stored credentials)
- Multi-stage rollout: canary → staging → production with manual approval gate
- Slack/GitHub Deployment status notifications
```

**MCP Prompt name:** `cicd-github-actions`

---

### 5. 🔄 n8n Pipeline Ingestion

```
Take an existing n8n workflow and adapt it for ingesting audit logs into BigQuery
using Crystal Clear House naming conventions.

Requirements:
- Incremental watermark polling from source
- Canonical audit schema: {event_id, timestamp, actor, action, resource, metadata}
- Dead-letter queue and retry with exponential backoff
- HITL approval gate for anomalous batch sizes
- Structured log entry per batch to MCP audit trail

Provide complete n8n workflow JSON and any custom node code.
```

**MCP Prompt name:** `n8n-pipeline-ingestion`

---

### 6. 🔍 Audit & Refactor

```
Review all infra in mcp-automation-hub for security, cost, and operational risk.
Show concrete remediations.

Check for:
Security: exposed secrets, missing OIDC, over-permissive IAM, missing input validation
Cost: over-provisioned Cloud Run, unused resources, Docker image bloat
Operational: missing health checks, no graceful shutdown, absent audit trails, SPOFs

For each finding: Severity | File path + line | Remediation diff
```

**MCP Prompt name:** `audit-refactor`

---

### 7. 📚 Onboarding Docs & Runbooks

```
Author onboarding docs and runbooks for shipping a new integration through
mcp-automation-hub.

Generate:
1. README section with quick-start
2. SKILL.md entry following existing format
3. Runbook: deploy, maintain, incident response, rollback
4. ASCII architecture diagram
5. Environment variable reference (.env.example additions)
6. Testing guide: unit, integration, manual verification
```

**MCP Prompt name:** `onboarding-docs` (requires `service_name` argument)

---

## Golden Path Checklist: Adding a New MCP Service

Use this as a PR checklist template when shipping a new service:

```markdown
## New MCP Service: [SERVICE_NAME]

### Source Code
- [ ] `src/[service]/index.ts` — Entry point with graceful shutdown
- [ ] `src/[service]/tools/index.ts` — Tool definitions
- [ ] `src/[service]/resources/index.ts` — Resource handlers
- [ ] `src/[service]/prompts/index.ts` — Prompt templates
- [ ] `src/[service]/config.ts` — Service-specific config

### Infrastructure
- [ ] `terraform/modules/[service]/main.tf` — Cloud Run service
- [ ] `terraform/modules/[service]/variables.tf` — Input variables
- [ ] `terraform/modules/[service]/outputs.tf` — Output values
- [ ] IAM bindings with least-privilege roles
- [ ] Secret Manager references (no plaintext secrets)

### CI/CD
- [ ] Build step added to `.github/workflows/ci.yml`
- [ ] Docker multi-stage build in `Dockerfile.[service]`
- [ ] Terraform workspace updated in plan/apply jobs
- [ ] OIDC auth configured (no stored GCP credentials)

### Observability
- [ ] Health-check endpoint at `/health`
- [ ] Structured JSON logging to stdout
- [ ] Audit event schema defined and documented
- [ ] Error alerting configured

### Documentation
- [ ] `SKILL.md` updated with new service section
- [ ] `README.md` updated with service overview
- [ ] Runbook created in `docs/runbooks/[service].md`
- [ ] `.env.example` updated with new variables
```

---

## Standard Patterns Reference

### Environment Variable Management

All secrets must be sourced from Google Secret Manager via Workload Identity Federation.  
**Never** commit credentials; use `.env.example` for variable documentation.

### Terraform Module Structure

```
terraform/
├── modules/
│   ├── cloud-run-service/   # Reusable Cloud Run module
│   ├── supabase-schema/     # Supabase table + RLS patterns
│   └── audit-trail/         # Event audit schema (BQ + Supabase)
└── environments/
    ├── staging/
    └── production/
```

### n8n Workflow Conventions

- Workflow names: `[Source]→[Destination]: [Description]`
- Credential names: `[Service]_[Environment]` (e.g. `Supabase_Production`)
- Error paths must always lead to a dead-letter or alert node
- All workflows must emit a structured audit log entry on completion

### Audit Event Schema

```json
{
  "event_id": "uuid-v4",
  "timestamp": "ISO-8601",
  "actor": "service-name or user-id",
  "action": "create|read|update|delete|execute",
  "resource": "resource-type/resource-id",
  "metadata": {}
}
```

---

*Keep this document up to date as new patterns are codified. Reference it in issues, PRs, and Copilot Chat for context-aware automation.*
