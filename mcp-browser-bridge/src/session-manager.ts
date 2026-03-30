/**
 * CCH Session Manager
 * Manages brand-isolated Playwright browser contexts with persistent storage.
 * Sessions live at: ~/.cch/sessions/{brand}/{platform}/
 */

import { chromium, BrowserContext, Browser } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

export type Brand = 'discobass' | 'thesteelezone' | 'crystalclear' | 'rushcall'

export type Platform = 'tiktok' | 'instagram' | 'twitter' | 'youtube' | 'onlyfans' | 'discord' | 'generic'

export interface SessionKey { brand: Brand; platform: Platform }

export interface ActiveSession {
  key: SessionKey
  context: BrowserContext
  createdAt: Date
  lastUsedAt: Date
}

const CCH_SESSIONS_ROOT = process.env.CCH_SESSIONS_DIR ?? path.join(os.homedir(), '.cch', 'sessions')
const HEADLESS = process.env.CCH_HEADLESS !== 'false'
const CONTEXT_TTL_MS = 30 * 60 * 1000

export class SessionManager {
  private browser: Browser | null = null
  private sessions: Map<string, ActiveSession> = new Map()
  private gcInterval: NodeJS.Timeout | null = null

  constructor () {
    this.gcInterval = setInterval(() => this.gcSessions(), 5 * 60 * 1000)
  }

  async getContext (key: SessionKey): Promise<BrowserContext> {
    const sessionId = this.sessionId(key)
    const existing = this.sessions.get(sessionId)
    if (existing) { existing.lastUsedAt = new Date(); return existing.context }
    const browser = await this.ensureBrowser()
    const storageFile = this.storageFile(key)
    const storageState = fs.existsSync(storageFile) ? storageFile : undefined
    const context = await browser.newContext({
      storageState, userAgent: this.userAgent(key.platform),
      viewport: { width: 1280, height: 800 }, locale: 'en-US', timezoneId: 'America/Los_Angeles',
    })
    this.sessions.set(sessionId, { key, context, createdAt: new Date(), lastUsedAt: new Date() })
    return context
  }

  async saveSession (key: SessionKey): Promise<void> {
    const session = this.sessions.get(this.sessionId(key))
    if (!session) return
    const storageFile = this.storageFile(key)
    fs.mkdirSync(path.dirname(storageFile), { recursive: true })
    await session.context.storageState({ path: storageFile })
  }

  isLoggedIn (key: SessionKey): boolean { return fs.existsSync(this.storageFile(key)) }

  async clearSession (key: SessionKey): Promise<void> {
    const session = this.sessions.get(this.sessionId(key))
    if (session) { await session.context.close(); this.sessions.delete(this.sessionId(key)) }
    const f = this.storageFile(key)
    if (fs.existsSync(f)) fs.unlinkSync(f)
  }

  listSavedSessions (): SessionKey[] {
    const results: SessionKey[] = []
    if (!fs.existsSync(CCH_SESSIONS_ROOT)) return results
    for (const brand of fs.readdirSync(CCH_SESSIONS_ROOT)) {
      const brandDir = path.join(CCH_SESSIONS_ROOT, brand)
      if (!fs.statSync(brandDir).isDirectory()) continue
      for (const f of fs.readdirSync(brandDir))
        results.push({ brand: brand as Brand, platform: f.replace('.json', '') as Platform })
    }
    return results
  }

  async shutdown (): Promise<void> {
    if (this.gcInterval) clearInterval(this.gcInterval)
    for (const s of this.sessions.values()) await s.context.close().catch(() => {})
    this.sessions.clear()
    if (this.browser) { await this.browser.close().catch(() => {}); this.browser = null }
  }

  private async ensureBrowser (): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: HEADLESS,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
      })
    }
    return this.browser
  }

  private sessionId (k: SessionKey): string { return `${k.brand}::${k.platform}` }
  private storageFile (k: SessionKey): string { return path.join(CCH_SESSIONS_ROOT, k.brand, `${k.platform}.json`) }

  private userAgent (platform: Platform): string {
    const mobile = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    const desktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    return (platform === 'tiktok' || platform === 'instagram') ? mobile : desktop
  }

  private async gcSessions (): Promise<void> {
    const now = Date.now()
    for (const [id, s] of this.sessions.entries()) {
      if (now - s.lastUsedAt.getTime() > CONTEXT_TTL_MS) {
        await s.context.close().catch(() => {})
        this.sessions.delete(id)
      }
    }
  }
}

export const sessionManager = new SessionManager()
