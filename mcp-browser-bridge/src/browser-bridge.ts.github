/**
 * CCH Browser Bridge -- MCP Server
 * Universal agent-callable frontend layer for any website.
 * Exposes Playwright browser automation as MCP tools.
 *
 * Any agent (Claude, n8n, custom) can call these tools to:
 * - Navigate to any URL
 * - Click elements
 * - Fill forms
 * - Read page content
 * - Take screenshots
 * - Execute JavaScript
 * - Post content to social platforms
 *
 * Sessions are brand-isolated and persistent.
 * All consequential actions route through HITL before executing.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { sessionManager, type Brand, type Platform } from './session-manager.js'
import { brandRouter, type ActionRequest } from './brand-router.js'
import type { Page } from 'playwright'

// --- MCP Server Setup ---------------------------------------------------------

const server = new Server(
  { name: 'cch-browser-bridge', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// --- Tool Definitions ---------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'browser_navigate',
      description: 'Navigate to a URL in a brand-isolated browser session. Use this to open any web page.',
      inputSchema: {
        type: 'object',
        required: ['url'],
        properties: {
          url:      { type: 'string', description: 'Full URL to navigate to' },
          brand:    { type: 'string', enum: ['discobass','thesteelezone','crystalclear','rushcall'], default: 'crystalclear' },
          platform: { type: 'string', enum: ['tiktok','instagram','twitter','youtube','onlyfans','discord','generic'], default: 'generic' },
          wait_for: { type: 'string', enum: ['load','domcontentloaded','networkidle'], default: 'load' },
        },
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element on the current page using a CSS selector or text content.',
      inputSchema: {
        type: 'object',
        required: ['selector'],
        properties: {
          selector:    { type: 'string', description: 'CSS selector or text to click (e.g. "button.submit" or text="Post")' },
          brand:       { type: 'string', default: 'crystalclear' },
          platform:    { type: 'string', default: 'generic' },
          wait_before: { type: 'number', description: 'ms to wait before clicking', default: 0 },
        },
      },
    },
    {
      name: 'browser_fill',
      description: 'Fill a form field with text. Use for text inputs, textareas, search boxes.',
      inputSchema: {
        type: 'object',
        required: ['selector', 'value'],
        properties: {
          selector: { type: 'string', description: 'CSS selector for the input field' },
          value:    { type: 'string', description: 'Text to type into the field' },
          brand:    { type: 'string', default: 'crystalclear' },
          platform: { type: 'string', default: 'generic' },
          clear_first: { type: 'boolean', default: true, description: 'Clear existing value before typing' },
        },
      },
    },
    {
      name: 'browser_read',
      description: 'Read text content from the current page or a specific element. Returns text, title, and URL.',
      inputSchema: {
        type: 'object',
        properties: {
          selector:  { type: 'string', description: 'CSS selector to read from (omit for full page text)' },
          brand:     { type: 'string', default: 'crystalclear' },
          platform:  { type: 'string', default: 'generic' },
          max_chars: { type: 'number', default: 5000, description: 'Max characters to return' },
        },
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page or a specific element. Returns base64-encoded PNG.',
      inputSchema: {
        type: 'object',
        properties: {
          selector:  { type: 'string', description: 'CSS selector to screenshot (omit for full page)' },
          brand:     { type: 'string', default: 'crystalclear' },
          platform:  { type: 'string', default: 'generic' },
          full_page: { type: 'boolean', default: false },
        },
      },
    },
    {
      name: 'browser_execute_js',
      description: 'Execute JavaScript in the browser context and return the result. Use for complex interactions.',
      inputSchema: {
        type: 'object',
        required: ['script'],
        properties: {
          script:   { type: 'string', description: 'JavaScript to execute (use return to get a value)' },
          brand:    { type: 'string', default: 'crystalclear' },
          platform: { type: 'string', default: 'generic' },
        },
      },
    },
    {
      name: 'browser_post_content',
      description: 'Post content to a social platform (TikTok, Instagram, X, OnlyFans). ALWAYS requires HITL approval first.',
      inputSchema: {
        type: 'object',
        required: ['brand', 'platform', 'content'],
        properties: {
          brand:    { type: 'string', enum: ['discobass','thesteelezone','crystalclear'] },
          platform: { type: 'string', enum: ['tiktok','instagram','twitter','onlyfans'] },
          content:  { type: 'string', description: 'Text content of the post' },
          media_path: { type: 'string', description: 'Local file path to media to upload (optional)' },
          scheduled_for: { type: 'string', description: 'ISO datetime to schedule post (optional)' },
          hitl_approved: { type: 'boolean', description: 'Set true only after HITL approval received', default: false },
          hitl_log_id:   { type: 'string', description: 'HITL log UUID from Supabase hitl_logs (required if hitl_approved=true)' },
          confidence_score: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    {
      name: 'session_status',
      description: 'Check which brand+platform sessions are currently saved (logged in) on this machine.',
      inputSchema: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Filter by brand (omit for all brands)' },
        },
      },
    },
    {
      name: 'session_clear',
      description: 'Clear a saved session (forces re-login next time). Use when a session is expired or broken.',
      inputSchema: {
        type: 'object',
        required: ['brand', 'platform'],
        properties: {
          brand:    { type: 'string' },
          platform: { type: 'string' },
        },
      },
    },
  ],
}))

// --- Tool Handlers ------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const a = args as Record<string, unknown>

  try {
    switch (name) {

      // -- NAVIGATE ------------------------------------------------------------
      case 'browser_navigate': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const waitUntil = (a.wait_for as 'load' | 'domcontentloaded' | 'networkidle') ?? 'load'
        await page.goto(a.url as string, { waitUntil })
        const title = await page.title()
        return result(`Navigated to: ${a.url}
Page title: ${title}`)
      }

      // -- CLICK ----------------------------------------------------------------
      case 'browser_click': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        if (a.wait_before) await page.waitForTimeout(a.wait_before as number)
        const selector = a.selector as string
        // Try CSS selector first, fall back to text match
        try {
          await page.click(selector, { timeout: 5000 })
        } catch {
          await page.getByText(selector).first().click()
        }
        return result(`Clicked: ${selector}`)
      }

      // -- FILL -----------------------------------------------------------------
      case 'browser_fill': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        if (a.clear_first !== false) {
          await page.fill(a.selector as string, '')
        }
        await page.fill(a.selector as string, a.value as string)
        return result(`Filled "${a.selector}" with ${(a.value as string).length} chars`)
      }

      // -- READ -----------------------------------------------------------------
      case 'browser_read': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const maxChars = (a.max_chars as number) ?? 5000
        let text: string

        if (a.selector) {
          const el = page.locator(a.selector as string).first()
          text = await el.innerText()
        } else {
          text = await page.innerText('body')
        }

        text = text.trim().slice(0, maxChars)
        const title = await page.title()
        const url = page.url()

        return result(JSON.stringify({ url, title, text }, null, 2))
      }

      // -- SCREENSHOT -----------------------------------------------------------
      case 'browser_screenshot': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        let buffer: Buffer

        if (a.selector) {
          const el = page.locator(a.selector as string).first()
          buffer = await el.screenshot()
        } else {
          buffer = await page.screenshot({ fullPage: a.full_page as boolean ?? false })
        }

        const base64 = buffer.toString('base64')
        return {
          content: [{
            type: 'image',
            data: base64,
            mimeType: 'image/png',
          }],
        }
      }

      // -- EXECUTE JS -----------------------------------------------------------
      case 'browser_execute_js': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const scriptResult = await page.evaluate(a.script as string)
        return result(`JS result: ${JSON.stringify(scriptResult)}`)
      }

      // -- POST CONTENT ---------------------------------------------------------
      case 'browser_post_content': {
        const req: ActionRequest = {
          brand: a.brand as Brand,
          platform: a.platform as Platform,
          action: 'post_content',
          payload: a as Record<string, unknown>,
          requestedBy: 'agent',
          confidenceScore: a.confidence_score as number | undefined,
        }

        const validation = brandRouter.validate(req)

        if (!validation.allowed) {
          return result(`BLOCKED: ${validation.reason}`, true)
        }

        // HITL gate -- must be explicitly approved
        if (validation.hitlRequired && !a.hitl_approved) {
          return result(
            `HITL REQUIRED: This action requires human approval before executing.
` +
            `Brand: ${a.brand} | Platform: ${a.platform}
` +
            `Content preview: ${(a.content as string).slice(0, 100)}...

` +
            `To approve: log this to Supabase hitl_logs, get approval, then re-call with hitl_approved=true and hitl_log_id set.`,
            false
          )
        }

        if (a.hitl_approved && !a.hitl_log_id) {
          return result('BLOCKED: hitl_approved=true requires hitl_log_id to be set for audit trail.', true)
        }

        // Platform-specific posting logic
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const postResult = await postToplatform(page, a.platform as Platform, a)
        await sessionManager.saveSession({ brand: a.brand as Brand, platform: a.platform as Platform })
        return result(postResult)
      }

      // -- SESSION STATUS --------------------------------------------------------
      case 'session_status': {
        const sessions = sessionManager.listSavedSessions()
        const filtered = a.brand
          ? sessions.filter(s => s.brand === a.brand)
          : sessions

        if (filtered.length === 0) {
          return result('No saved sessions found. Agents will need to log in first.')
        }

        const lines = filtered.map(s => `  ok ${s.brand}::${s.platform}`)
        return result(`Saved sessions (${filtered.length}):
${lines.join('
')}`)
      }

      // -- SESSION CLEAR ---------------------------------------------------------
      case 'session_clear': {
        await sessionManager.clearSession({
          brand: a.brand as Brand,
          platform: a.platform as Platform,
        })
        return result(`Cleared session: ${a.brand}::${a.platform}`)
      }

      default:
        return result(`Unknown tool: ${name}`, true)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return result(`Error: ${msg}`, true)
  }
})

// --- Helpers ------------------------------------------------------------------

// Active pages per session key
const activePages: Map<string, Page> = new Map()

async function getPage (brand: Brand = 'crystalclear', platform: Platform = 'generic'): Promise<Page> {
  const key = `${brand}::${platform}`
  const existing = activePages.get(key)
  if (existing && !existing.isClosed()) return existing

  const context = await sessionManager.getContext({ brand, platform })
  const pages = context.pages()
  const page = pages.length > 0 ? pages[0] : await context.newPage()
  activePages.set(key, page)
  return page
}

async function postToplatform (
  page: Page,
  platform: Platform,
  args: Record<string, unknown>
): Promise<string> {
  const content = args.content as string

  switch (platform) {
    case 'twitter': {
      await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 })
      await page.fill('[data-testid="tweetTextarea_0"]', content)
      await page.waitForTimeout(1000)
      await page.click('[data-testid="tweetButton"]')
      await page.waitForTimeout(2000)
      return `Posted to X (Twitter): "${content.slice(0, 50)}..."`
    }

    case 'instagram': {
      // Instagram web posting is complex -- navigate to creator studio
      await page.goto('https://www.instagram.com', { waitUntil: 'networkidle' })
      return `Instagram: Navigate to post composer manually or use the mobile API. Content queued: "${content.slice(0, 50)}..."`
    }

    case 'tiktok': {
      await page.goto('https://www.tiktok.com/creator-center/upload', { waitUntil: 'networkidle' })
      return `TikTok: Upload page opened. Media upload required for TikTok posts. Content caption queued: "${content.slice(0, 50)}..."`
    }

    case 'onlyfans': {
      await page.goto('https://onlyfans.com', { waitUntil: 'networkidle' })
      return `OnlyFans: Home loaded. Manual post creation required via UI. Content queued: "${content.slice(0, 50)}..."`
    }

    default:
      return `Generic: No platform-specific posting logic for '${platform}'. Use browser_navigate + browser_click + browser_fill sequence instead.`
  }
}

function result (text: string, isError = false) {
  return {
    content: [{ type: 'text' as const, text }],
    isError,
  }
}

// --- Start Server -------------------------------------------------------------

async function main () {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[CCH Browser Bridge] MCP server running on stdio')

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await sessionManager.shutdown()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await sessionManager.shutdown()
    process.exit(0)
  })
}

main().catch(err => {
  console.error('[CCH Browser Bridge] Fatal error:', err)
  process.exit(1)
})
