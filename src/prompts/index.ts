import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

/**
 * Golden-pattern prompt definitions for the MCP Automation Hub.
 *
 * Each prompt is an actionable, context-aware template designed for
 * DevOps, MCP integration, IaC, and workflow automation.
 */
const PROMPTS = [
  {
    name: 'roadmap-planning',
    description:
      'Propose a 12-month milestone plan covering infra, workflow, security, and data observability',
    arguments: [
      {
        name: 'focus_areas',
        description: 'Comma-separated focus areas (e.g. "infra,security,data")',
        required: false,
      },
    ],
  },
  {
    name: 'infra-module-baseline',
    description:
      'List the top reusable Terraform patterns in this repo and baseline them into new modules',
    arguments: [
      {
        name: 'provider',
        description: 'Cloud provider to target (gcp, aws, azure)',
        required: false,
      },
    ],
  },
  {
    name: 'mcp-server-golden-path',
    description:
      'Design the golden path for adding a new MCP server: files to touch, Terraform, CI wiring, logs',
    arguments: [
      {
        name: 'service_name',
        description: 'Name of the new MCP service to add',
        required: true,
      },
    ],
  },
  {
    name: 'cicd-github-actions',
    description:
      'Generate a working GitHub Actions workflow for build, push, terraform plan/apply, and multi-stage rollout',
    arguments: [
      {
        name: 'deploy_target',
        description: 'Deployment target (cloud-run, gke, docker-compose)',
        required: false,
      },
    ],
  },
  {
    name: 'n8n-pipeline-ingestion',
    description:
      'Adapt an n8n workflow for ingesting audit logs to BigQuery using local naming conventions',
    arguments: [
      {
        name: 'source',
        description: 'Ingestion source (supabase, stripe, github)',
        required: false,
      },
      {
        name: 'destination',
        description: 'Destination store (bigquery, supabase)',
        required: false,
      },
    ],
  },
  {
    name: 'audit-refactor',
    description:
      'Review all infra for security, cost, and operational risk — show concrete remediations',
    arguments: [
      {
        name: 'scope',
        description: 'Audit scope (terraform, docker, workflows, all)',
        required: false,
      },
    ],
  },
  {
    name: 'onboarding-docs',
    description:
      'Author onboarding docs and runbooks showing how to ship new integrations or services through this repo',
    arguments: [
      {
        name: 'service_name',
        description: 'Name of the service or integration to document',
        required: true,
      },
    ],
  },
];

/** Prompt message templates keyed by prompt name. */
function buildPromptMessages(
  name: string,
  args: Record<string, string>
): Array<{ role: 'user'; content: { type: 'text'; text: string } }> {
  switch (name) {
    case 'roadmap-planning': {
      const areas = args['focus_areas'] ?? 'infra, workflow, security, data observability';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Propose a 12-month milestone plan for the crystalclearhouse-data/mcp-automation-hub repository.

Focus areas: ${areas}

For each quarter, provide:
1. Key milestones and deliverables
2. Infrastructure changes (Terraform modules, Cloud Run, GCP, Supabase)
3. Workflow automation improvements (n8n, GitHub Actions)
4. Security hardening steps (OIDC, secret management, RBAC)
5. Data observability initiatives (audit trails, BigQuery, dashboards)
6. Success metrics and acceptance criteria

Format the plan as a structured quarterly roadmap with concrete, actionable items.`,
          },
        },
      ];
    }

    case 'infra-module-baseline': {
      const provider = args['provider'] ?? 'gcp';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Analyse the Terraform configuration in this repository for ${provider.toUpperCase()} and:

1. List the top reusable infrastructure patterns found (e.g. Cloud Run services, Supabase schemas, event audit tables)
2. For each pattern, show:
   - Current implementation
   - How to extract it into a reusable module with variables and outputs
   - Example instantiation
3. Propose a modules/ directory structure following Terraform best practices
4. Show how to enforce these patterns via a module registry or local module source

Output concrete HCL diffs and module definitions.`,
          },
        },
      ];
    }

    case 'mcp-server-golden-path': {
      const service = args['service_name'] ?? 'new-mcp-service';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Design the complete golden path for adding a new MCP server named "${service}" to this repository.

Provide step-by-step instructions and concrete file contents for:

1. **Source code** — TypeScript entry point, tool/resource/prompt registrations following src/ patterns
2. **MCP config** — Updates to mcp-config.json
3. **Terraform** — Cloud Run service module, IAM bindings, env var management
4. **GitHub Actions** — CI build+push step for the new service, terraform plan/apply integration
5. **Observability** — Structured logging, health-check endpoint, audit trail schema
6. **Documentation** — SKILL.md entry, README update, runbook section

Show all file paths and contents so this can be followed as a repeatable checklist.`,
          },
        },
      ];
    }

    case 'cicd-github-actions': {
      const target = args['deploy_target'] ?? 'cloud-run';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate a production-ready GitHub Actions workflow for this repository targeting ${target}.

The workflow must include:

1. **Trigger** — push to main, PRs, and manual workflow_dispatch
2. **Build & Test** — pnpm install, TypeScript compile, jest tests with coverage
3. **Docker** — Multi-stage build optimised for Node.js, push to Artifact Registry
4. **Terraform Plan** — Run \`terraform plan\` on PRs and post results as PR comment
5. **Terraform Apply** — Run \`terraform apply\` on merge to main with OIDC auth (no stored credentials)
6. **Multi-stage rollout** — Canary → staging → production gate with manual approval
7. **Notifications** — Slack or GitHub Deployment status on success/failure

Use OIDC for Google Cloud authentication, Workload Identity Federation, and pinned action versions.
Show the complete .github/workflows/ci.yml content.`,
          },
        },
      ];
    }

    case 'n8n-pipeline-ingestion': {
      const source = args['source'] ?? 'supabase';
      const destination = args['destination'] ?? 'bigquery';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Adapt an n8n workflow to ingest audit logs from ${source} into ${destination} using Crystal Clear House naming conventions.

Requirements:
1. **Source node** — ${source} trigger/poll node with incremental watermark
2. **Transform** — Map fields to the canonical audit event schema: {event_id, timestamp, actor, action, resource, metadata}
3. **Error handling** — Dead-letter queue, retry with exponential backoff, alert on failure
4. **Destination** — ${destination} insert with schema enforcement and deduplication
5. **HITL gate** — Human-in-the-loop approval node for anomalous batch sizes
6. **Observability** — Emit structured log entry per batch to MCP audit trail

Provide the complete n8n workflow JSON and any custom node code required.`,
          },
        },
      ];
    }

    case 'audit-refactor': {
      const scope = args['scope'] ?? 'all';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Perform a comprehensive audit of the ${scope === 'all' ? 'entire repository' : scope + ' configuration'} in mcp-automation-hub for:

**Security**
- Exposed secrets or hard-coded credentials
- Missing OIDC/Workload Identity where passwords are used
- Overly permissive IAM roles
- Missing input validation in MCP tools

**Cost**
- Over-provisioned Cloud Run min-instances
- Unused resources or idle services
- BigQuery slot reservations vs on-demand
- Docker image bloat

**Operational Risk**
- Missing health checks or readiness probes
- No graceful shutdown handling
- Absence of structured logging or audit trails
- Single points of failure

For each finding provide:
- Severity: Critical / High / Medium / Low
- Location: file path and line range
- Concrete remediation diff`,
          },
        },
      ];
    }

    case 'onboarding-docs': {
      const service = args['service_name'] ?? 'new-service';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Author complete onboarding documentation for shipping the "${service}" integration through the mcp-automation-hub repository.

Generate:

1. **README section** — Overview, prerequisites, quick-start (clone → configure → run)
2. **SKILL.md entry** — Agent skill descriptor following existing format
3. **Runbook** — Step-by-step operational runbook for:
   - Initial deployment
   - Routine maintenance
   - Incident response (service down, data pipeline failure)
   - Rolling back a bad deploy
4. **Architecture diagram** (ASCII) — Service interactions and data flow
5. **Environment variable reference** — All required vars with descriptions and examples (.env.example additions)
6. **Testing guide** — Unit, integration, and manual verification steps

Follow the existing documentation style in CONTRIBUTING.md and SETUP.md.`,
          },
        },
      ];
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

/**
 * Registers all golden-pattern prompts on the given MCP server.
 */
export function registerPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: promptArgs } = request.params;
    logger.info(`Prompt requested: ${name}`);

    const args = (promptArgs as Record<string, string>) ?? {};
    const messages = buildPromptMessages(name, args);

    return { messages };
  });
}
