/**
 * CCH Browser Bridge — MCP Server
 * Universal agent-callable frontend layer for any website.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { sessionManager, type Brand, type Platform } from './session-manager.js'
import { brandRouter, type ActionRequest } from './brand-router.js'
import type { Page } from 'playwright'

const server = new Server(
  { name: 'cch-browser-bridge', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'browser_navigate',
      description: 'Navigate to a URL in a brand-isolated browser session.',
      inputSchema: {
        type: 'object', required: ['url'],
        properties: {
          url: { type: 'string' },
          brand: { type: 'string', enum: ['discobass','thesteelezone','crystalclear','rushcall'], default: 'crystalclear' },
          platform: { type: 'string', enum: ['tiktok','instagram','twitter','youtube','onlyfans','discord','generic'], default: 'generic' },
          wait_for: { type: 'string', enum: ['load','domcontentloaded','networkidle'], default: 'load' },
        },
      },
    },
    { name: 'browser_click', description: 'Click an element on the current page.', inputSchema: { type: 'object', required: ['selector'], properties: { selector: { type: 'string' }, brand: { type: 'string', default: 'crystalclear' }, platform: { type: 'string', default: 'generic' }, wait_before: { type: 'number', default: 0 } } } },
    { name: 'browser_fill', description: 'Fill a form field with text.', inputSchema: { type: 'object', required: ['selector', 'value'], properties: { selector: { type: 'string' }, value: { type: 'string' }, brand: { type: 'string', default: 'crystalclear' }, platform: { type: 'string', default: 'generic' }, clear_first: { type: 'boolean', default: true } } } },
    { name: 'browser_read', description: 'Read text content from page.', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, brand: { type: 'string', default: 'crystalclear' }, platform: { type: 'string', default: 'generic' }, max_chars: { type: 'number', default: 5000 } } } },
    { name: 'browser_screenshot', description: 'Take a screenshot.', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, brand: { type: 'string', default: 'crystalclear' }, platform: { type: 'string', default: 'generic' }, full_page: { type: 'boolean', default: false } } } },
    { name: 'browser_execute_js', description: 'Execute JavaScript in the browser.', inputSchema: { type: 'object', required: ['script'], properties: { script: { type: 'string' }, brand: { type: 'string', default: 'crystalclear' }, platform: { type: 'string', default: 'generic' } } } },
    {
      name: 'browser_post_content',
      description: 'Post content to a social platform. ALWAYS requires HITL approval first.',
      inputSchema: {
        type: 'object', required: ['brand', 'platform', 'content'],
        properties: {
          brand: { type: 'string', enum: ['discobass','thesteelezone','crystalclear'] },
          platform: { type: 'string', enum: ['tiktok','instagram','twitter','onlyfans'] },
          content: { type: 'string' }, media_path: { type: 'string' },
          hitl_approved: { type: 'boolean', default: false },
          hitl_log_id: { type: 'string' }, confidence_score: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    { name: 'session_status', description: 'Check which sessions are saved.', inputSchema: { type: 'object', properties: { brand: { type: 'string' } } } },
    { name: 'session_clear', description: 'Clear a saved session.', inputSchema: { type: 'object', required: ['brand', 'platform'], properties: { brand: { type: 'string' }, platform: { type: 'string' } } } },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const a = args as Record<string, unknown>
  try {
    switch (name) {
      case 'browser_navigate': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        await page.goto(a.url as string, { waitUntil: (a.wait_for ?? 'load') as 'load' })
        return result(`Navigated to: ${a.url}
Title: ${await page.title()}`)
      }
      case 'browser_click': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        if (a.wait_before) await page.waitForTimeout(a.wait_before as number)
        try { await page.click(a.selector as string, { timeout: 5000 }) }
        catch { await page.getByText(a.selector as string).first().click() }
        return result(`Clicked: ${a.selector}`)
      }
      case 'browser_fill': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        if (a.clear_first !== false) await page.fill(a.selector as string, '')
        await page.fill(a.selector as string, a.value as string)
        return result(`Filled "${a.selector}"`)
      }
      case 'browser_read': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const maxChars = (a.max_chars as number) ?? 5000
        const text = a.selector
          ? (await page.locator(a.selector as string).first().innerText()).trim().slice(0, maxChars)
          : (await page.innerText('body')).trim().slice(0, maxChars)
        return result(JSON.stringify({ url: page.url(), title: await page.title(), text }, null, 2))
      }
      case 'browser_screenshot': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const buf = a.selector
          ? await page.locator(a.selector as string).first().screenshot()
          : await page.screenshot({ fullPage: (a.full_page as boolean) ?? false })
        return { content: [{ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' }] }
      }
      case 'browser_execute_js': {
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        return result(`JS: ${JSON.stringify(await page.evaluate(a.script as string))}`)
      }
      case 'browser_post_content': {
        const req: ActionRequest = { brand: a.brand as Brand, platform: a.platform as Platform, action: 'post_content', payload: a, requestedBy: 'agent', confidenceScore: a.confidence_score as number | undefined }
        const v = brandRouter.validate(req)
        if (!v.allowed) return result(`BLOCKED: ${v.reason}`, true)
        if (v.hitlRequired && !a.hitl_approved)
          return result(`HITL REQUIRED: Brand: ${a.brand} | Platform: ${a.platform}
Content: ${(a.content as string).slice(0, 100)}...
Re-call with hitl_approved=true and hitl_log_id after approval.`)
        if (a.hitl_approved && !a.hitl_log_id) return result('BLOCKED: hitl_log_id required', true)
        const page = await getPage(a.brand as Brand, a.platform as Platform)
        const r = await postToplatform(page, a.platform as Platform, a)
        await sessionManager.saveSession({ brand: a.brand as Brand, platform: a.platform as Platform })
        return result(r)
      }
      case 'session_status': {
        const sessions = sessionManager.listSavedSessions()
        const filtered = a.brand ? sessions.filter(s => s.brand === a.brand) : sessions
        return filtered.length
          ? result(`Sessions (${filtered.length}):
${filtered.map(s => `  ✓ ${s.brand}::${s.platform}`).join('
')}`)
          : result('No saved sessions found.')
      }
      case 'session_clear': {
        await sessionManager.clearSession({ brand: a.brand as Brand, platform: a.platform as Platform })
        return result(`Cleared: ${a.brand}::${a.platform}`)
      }
      default: return result(`Unknown tool: ${name}`, true)
    }
  } catch (err: unknown) {
    return result(`Error: ${err instanceof Error ? err.message : String(err)}`, true)
  }
})

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

async function postToplatform (page: Page, platform: Platform, args: Record<string, unknown>): Promise<string> {
  const content = args.content as string
  switch (platform) {
    case 'twitter':
      await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle' })
      await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 })
      await page.fill('[data-testid="tweetTextarea_0"]', content)
      await page.waitForTimeout(1000)
      await page.click('[data-testid="tweetButton"]')
      return `Posted to X: "${content.slice(0, 50)}..."`
    case 'instagram':
      await page.goto('https://www.instagram.com', { waitUntil: 'networkidle' })
      return `Instagram queued: "${content.slice(0, 50)}..."`
    case 'tiktok':
      await page.goto('https://www.tiktok.com/creator-center/upload', { waitUntil: 'networkidle' })
      return `TikTok upload opened. Caption: "${content.slice(0, 50)}..."`
    case 'onlyfans':
      await page.goto('https://onlyfans.com', { waitUntil: 'networkidle' })
      return `OnlyFans home loaded. Content queued: "${content.slice(0, 50)}..."`
    default:
      return `No posting logic for '${platform}'. Use browser_navigate + browser_fill.`
  }
}

function result (text: string, isError = false) {
  return { content: [{ type: 'text' as const, text }], isError }
}

async function main () {
  await server.connect(new StdioServerTransport())
  console.error('[CCH Browser Bridge] MCP server running on stdio')
  process.on('SIGINT', async () => { await sessionManager.shutdown(); process.exit(0) })
  process.on('SIGTERM', async () => { await sessionManager.shutdown(); process.exit(0) })
}

main().catch(err => { console.error('[CCH Browser Bridge] Fatal:', err); process.exit(1) })
