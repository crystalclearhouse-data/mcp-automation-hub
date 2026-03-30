import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { sessionManager, Brand, Platform } from './session-manager.js'
import { brandRouter, ActionRequest } from './brand-router.js'
import { Page } from 'playwright'

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
        type: 'object',
        required: ['url'],
        properties: {
          url:      { type: 'string' },
          brand:    { type: 'string', default: 'crystalclear' },
          platform: { type: 'string', default: 'generic' },
          wait_for: { type: 'string', default: 'load' },
        },
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element on the current page.',
      inputSchema: {
        type: 'object',
        required: ['selector'],
        properties: {
          selector:    { type: 'string' },
          brand:       { type: 'string', default: 'crystalclear' },
          platform:    { type: 'string', default: 'generic' },
          wait_before: { type: 'number', default: 0 },
        },
      },
    },
    {
      name: 'browser_fill',
      description: 'Fill a form field with text.',
      inputSchema: {
        type: 'object',
        required: ['selector', 'value'],
        properties: {
          selector:    { type: 'string' },
          value:       { type: 'string' },
          brand:       { type: 'string', default: 'crystalclear' },
          platform:    { type: 'string', default: 'generic' },
          clear_first: { type: 'boolean', default: true },
        },
      },
    },
    {
      name: 'browser_read',
      description: 'Read text content from the current page or a specific element.',
      inputSchema: {
        type: 'object',
        properties: {
          selector:  { type: 'string' },
          brand:     { type: 'string', default: 'crystalclear' },
          platform:  { type: 'string', default: 'generic' },
          max_chars: { type: 'number', default: 5000 },
        },
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page.',
      inputSchema: {
        type: 'object',
        properties: {
          selector:  { type: 'string' },
          brand:     { type: 'string', default: 'crystalclear' },
          platform:  { type: 'string', default: 'generic' },
          full_page: { type: 'boolean', default: false },
        },
      },
    },
    {
      name: 'browser_execute_js',
      description: 'Execute JavaScript in the browser context.',
      inputSchema: {
        type: 'object',
        required: ['script'],
        properties: {
          script:   { type: 'string' },
          brand:    { type: 'string', default: 'crystalclear' },
          platform: { type: 'string', default: 'generic' },
        },
      },
    },
    {
      name: 'browser_post_content',
      description: 'Post content to a social platform. Always requires HITL approval.',
      inputSchema: {
        type: 'object',
        required: ['brand', 'platform', 'content'],
        properties: {
          brand:             { type: 'string' },
          platform:          { type: 'string' },
          content:           { type: 'string' },
          media_path:        { type: 'string' },
          hitl_approved:     { type: 'boolean', default: false },
          hitl_log_id:       { type: 'string' },
          confidence_score:  { type: 'number' },
        },
      },
    },
    {
      name: 'session_status',
      description: 'Check which brand sessions are currently saved.',
      inputSchema: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
        },
      },
    },
    {
      name: 'session_clear',
      description: 'Clear a saved session to force re-login.',
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

const activePages: Map<string, Page> = new Map()

async function getPage(brand: Brand = 'crystalclear', platform: Platform = 'generic'): Promise<Page> {
  const key = brand + '::' + platform
  const existing = activePages.get(key)
  if (existing && !existing.isClosed()) return existing
  const context = await sessionManager.getContext({ brand, platform })
  const pages = context.pages()
  const page = pages.length > 0 ? pages[0] : await context.newPage()
  activePages.set(key, page)
  return page
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: false }
}

function fail(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const a = args as Record<string, unknown>

  try {
    if (name === 'browser_navigate') {
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      const waitUntil = (a.wait_for as 'load' | 'domcontentloaded' | 'networkidle') ?? 'load'
      await page.goto(a.url as string, { waitUntil })
      const title = await page.title()
      return ok('Navigated to: ' + String(a.url) + ' | Title: ' + title)
    }

    if (name === 'browser_click') {
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      if (a.wait_before) await page.waitForTimeout(a.wait_before as number)
      const selector = a.selector as string
      try {
        await page.click(selector, { timeout: 5000 })
      } catch {
        await page.getByText(selector).first().click()
      }
      return ok('Clicked: ' + selector)
    }

    if (name === 'browser_fill') {
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      if (a.clear_first !== false) await page.fill(a.selector as string, '')
      await page.fill(a.selector as string, a.value as string)
      return ok('Filled ' + String(a.selector) + ' with ' + String((a.value as string).length) + ' chars')
    }

    if (name === 'browser_read') {
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      const maxChars = (a.max_chars as number) ?? 5000
      let text: string
      if (a.selector) {
        text = await page.locator(a.selector as string).first().innerText()
      } else {
        text = await page.innerText('body')
      }
      text = text.trim().slice(0, maxChars)
      const title = await page.title()
      const url = page.url()
      return ok(JSON.stringify({ url, title, text }, null, 2))
    }

    if (name === 'browser_screenshot') {
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      let buffer: Buffer
      if (a.selector) {
        buffer = await page.locator(a.selector as string).first().screenshot()
      } else {
        buffer = await page.screenshot({ fullPage: (a.full_page as boolean) ?? false })
      }
      return { content: [{ type: 'image' as const, data: buffer.toString('base64'), mimeType: 'image/png' }] }
    }

    if (name === 'browser_execute_js') {
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      const result = await page.evaluate(a.script as string)
      return ok('JS result: ' + JSON.stringify(result))
    }

    if (name === 'browser_post_content') {
      const req: ActionRequest = {
        brand: a.brand as Brand,
        platform: a.platform as Platform,
        action: 'post_content',
        payload: a as Record<string, unknown>,
        requestedBy: 'agent',
        confidenceScore: a.confidence_score as number | undefined,
      }
      const validation = brandRouter.validate(req)
      if (!validation.allowed) return fail('BLOCKED: ' + String(validation.reason))
      if (validation.hitlRequired && !a.hitl_approved) {
        return ok('HITL REQUIRED: Approve this action before posting. Brand: ' + String(a.brand) + ' Platform: ' + String(a.platform) + ' Content: ' + String((a.content as string).slice(0, 100)))
      }
      if (a.hitl_approved && !a.hitl_log_id) {
        return fail('BLOCKED: hitl_approved=true requires hitl_log_id for audit trail.')
      }
      const page = await getPage(a.brand as Brand, a.platform as Platform)
      const postResult = await postToPlatform(page, a.platform as Platform, a)
      await sessionManager.saveSession({ brand: a.brand as Brand, platform: a.platform as Platform })
      return ok(postResult)
    }

    if (name === 'session_status') {
      const sessions = sessionManager.listSavedSessions()
      const filtered = a.brand ? sessions.filter(s => s.brand === a.brand) : sessions
      if (filtered.length === 0) return ok('No saved sessions found. Log in first.')
      const lines = filtered.map(s => 'ok ' + s.brand + '::' + s.platform)
      return ok('Saved sessions (' + String(filtered.length) + '):
' + lines.join('
'))
    }

    if (name === 'session_clear') {
      await sessionManager.clearSession({ brand: a.brand as Brand, platform: a.platform as Platform })
      return ok('Cleared session: ' + String(a.brand) + '::' + String(a.platform))
    }

    return fail('Unknown tool: ' + name)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return fail('Error: ' + msg)
  }
})

async function postToPlatform(page: Page, platform: Platform, args: Record<string, unknown>): Promise<string> {
  const content = args.content as string
  const preview = content.slice(0, 50)

  if (platform === 'twitter') {
    await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 10000 })
    await page.fill('[data-testid="tweetTextarea_0"]', content)
    await page.waitForTimeout(1000)
    await page.click('[data-testid="tweetButton"]')
    await page.waitForTimeout(2000)
    return 'Posted to X: ' + preview
  }

  if (platform === 'instagram') {
    await page.goto('https://www.instagram.com', { waitUntil: 'networkidle' })
    return 'Instagram: open composer manually. Caption queued: ' + preview
  }

  if (platform === 'tiktok') {
    await page.goto('https://www.tiktok.com/creator-center/upload', { waitUntil: 'networkidle' })
    return 'TikTok: upload page opened. Caption queued: ' + preview
  }

  if (platform === 'onlyfans') {
    await page.goto('https://onlyfans.com', { waitUntil: 'networkidle' })
    return 'OnlyFans: home loaded. Post manually via UI. Content queued: ' + preview
  }

  return 'No platform posting logic for ' + platform + '. Use navigate+click+fill sequence.'
}

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[CCH Browser Bridge] Running')
  process.on('SIGINT', async () => { await sessionManager.shutdown(); process.exit(0) })
  process.on('SIGTERM', async () => { await sessionManager.shutdown(); process.exit(0) })
}

main().catch(err => { console.error('[CCH Browser Bridge] Fatal:', err); process.exit(1) })
