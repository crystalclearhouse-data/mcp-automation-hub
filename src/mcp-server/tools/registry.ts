import { ToolHandler } from './index.js';
import { stripeToolHandlers } from './stripe.js';
import { supabaseToolHandlers } from './supabase.js';
import { socialMediaToolHandlers } from './social-media.js';
import { n8nToolHandlers } from './n8n.js';

export const toolHandlers: Record<string, ToolHandler> = {
  ...stripeToolHandlers,
  ...supabaseToolHandlers,
  ...socialMediaToolHandlers,
  ...n8nToolHandlers,
};
