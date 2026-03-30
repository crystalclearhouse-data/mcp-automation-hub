  /**
 * CCH Brand Router
 * Maps brand + platform + action to the correct session, URL, and execution rules.
 */

import type { Brand, Platform } from './session-manager.js'

export interface BrandRoute {
  brand: Brand
  platform: Platform
  baseUrl: string
  loginUrl: string
  hitlRequired: boolean
  maxActionsPerHour: number
  allowedActions: ActionType[]
}

export type ActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'read'
  | 'screenshot'
  | 'execute_js'
  | 'post_content'
  | 'upload_media'
  | 'like'
  | 'follow'
  | 'comment'
  | 'dm'

export interface ActionRequest {
  brand: Brand
  platform: Platform
  action: ActionType
  payload: Record<string, unknown>
  requestedBy: string
  confidenceScore?: number
}

export interface RouteValidation {
  allowed: boolean
  reason?: string
  hitlRequired: boolean
  route: BrandRoute | null
}

const ROUTES: BrandRoute[] = [
  {
    brand: 'discobass', platform: 'tiktok',
    baseUrl: 'https://www.tiktok.com', loginUrl: 'https://www.tiktok.com/login',
    hitlRequired: true, maxActionsPerHour: 10,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'upload_media', 'like', 'follow'],
  },
  {
    brand: 'discobass', platform: 'instagram',
    baseUrl: 'https://www.instagram.com', loginUrl: 'https://www.instagram.com/accounts/login/',
    hitlRequired: true, maxActionsPerHour: 10,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'upload_media', 'like', 'follow', 'comment'],
  },
  {
    brand: 'discobass', platform: 'twitter',
    baseUrl: 'https://x.com', loginUrl: 'https://x.com/login',
    hitlRequired: true, maxActionsPerHour: 15,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'like', 'follow'],
  },
  {
    brand: 'discobass', platform: 'youtube',
    baseUrl: 'https://studio.youtube.com', loginUrl: 'https://accounts.google.com',
    hitlRequired: true, maxActionsPerHour: 5,
    allowedActions: ['navigate', 'read', 'screenshot', 'upload_media'],
  },
  {
    brand: 'thesteelezone', platform: 'onlyfans',
    baseUrl: 'https://onlyfans.com', loginUrl: 'https://onlyfans.com',
    hitlRequired: true, maxActionsPerHour: 5,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'upload_media', 'dm'],
  },
  {
    brand: 'thesteelezone', platform: 'tiktok',
    baseUrl: 'https://www.tiktok.com', loginUrl: 'https://www.tiktok.com/login',
    hitlRequired: true, maxActionsPerHour: 10,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'upload_media'],
  },
  {
    brand: 'thesteelezone', platform: 'instagram',
    baseUrl: 'https://www.instagram.com', loginUrl: 'https://www.instagram.com/accounts/login/',
    hitlRequired: true, maxActionsPerHour: 10,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'upload_media'],
  },
  {
    brand: 'thesteelezone', platform: 'twitter',
    baseUrl: 'https://x.com', loginUrl: 'https://x.com/login',
    hitlRequired: true, maxActionsPerHour: 10,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content'],
  },
  {
    brand: 'crystalclear', platform: 'twitter',
    baseUrl: 'https://x.com', loginUrl: 'https://x.com/login',
    hitlRequired: true, maxActionsPerHour: 10,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content'],
  },
  {
    brand: 'crystalclear', platform: 'discord',
    baseUrl: 'https://discord.com/app', loginUrl: 'https://discord.com/login',
    hitlRequired: false, maxActionsPerHour: 60,
    allowedActions: ['navigate', 'read', 'screenshot', 'post_content', 'execute_js'],
  },
  {
    brand: 'crystalclear', platform: 'generic',
    baseUrl: '', loginUrl: '',
    hitlRequired: true, maxActionsPerHour: 20,
    allowedActions: ['navigate', 'click', 'fill', 'read', 'screenshot', 'execute_js'],
  },
]

const actionCounts: Map<string, { count: number; windowStart: number }> = new Map()

function checkRateLimit (route: BrandRoute): boolean {
  const key = `${route.brand}::${route.platform}`
  const now = Date.now()
  const window = actionCounts.get(key)
  if (!window || now - window.windowStart > 60 * 60 * 1000) {
    actionCounts.set(key, { count: 1, windowStart: now })
    return true
  }
  if (window.count >= route.maxActionsPerHour) return false
  window.count++
  return true
}

export class BrandRouter {
  validate (request: ActionRequest): RouteValidation {
    const route = this.findRoute(request.brand, request.platform)
    if (!route) return { allowed: false, reason: `No route for ${request.brand}::${request.platform}`, hitlRequired: true, route: null }
    if (!route.allowedActions.includes(request.action)) return { allowed: false, reason: `Action not permitted`, hitlRequired: true, route }
    if (!checkRateLimit(route)) return { allowed: false, reason: `Rate limit exceeded`, hitlRequired: true, route }
    const hitlRequired = route.hitlRequired || (request.confidenceScore !== undefined && request.confidenceScore < 0.70)
    return { allowed: true, hitlRequired, route }
  }
  getRoutesForBrand (brand: Brand): BrandRoute[] { return ROUTES.filter(r => r.brand === brand) }
  getAllBrands (): Brand[] { return [...new Set(ROUTES.map(r => r.brand))] }
  getRouteTable (): BrandRoute[] { return ROUTES }
  private findRoute (brand: Brand, platform: Platform): BrandRoute | null {
    return ROUTES.find(r => r.brand === brand && r.platform === platform) ?? null
  }
}

export const brandRouter = new BrandRouter()
