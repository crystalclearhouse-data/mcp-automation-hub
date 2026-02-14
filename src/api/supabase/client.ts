import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../utils/env.js';
import { logger } from '../../utils/logger.js';

class SupabaseClientWrapper {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (!this.client) {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured');
      }
      this.client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    }
    return this.client;
  }

  async query(params: {
    table: string;
    select?: string;
    filter?: Record<string, unknown>;
    limit?: number;
  }) {
    logger.debug('Querying Supabase', params);
    let query = this.getClient().from(params.table).select(params.select || '*');

    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    logger.info('Supabase query successful', { count: data?.length });
    return data;
  }

  async insert(params: { table: string; data: Record<string, unknown> }) {
    logger.debug('Inserting into Supabase', params);
    const { data, error } = await this.getClient().from(params.table).insert(params.data).select();
    if (error) throw error;
    
    logger.info('Supabase insert successful', { count: data?.length });
    return data;
  }

  async update(params: {
    table: string;
    data: Record<string, unknown>;
    filter: Record<string, unknown>;
  }) {
    logger.debug('Updating Supabase', params);
    let query = this.getClient().from(params.table).update(params.data);

    Object.entries(params.filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.select();
    if (error) throw error;
    
    logger.info('Supabase update successful', { count: data?.length });
    return data;
  }

  async sync(params: {
    table: string;
    source: string;
    direction: 'to_supabase' | 'from_supabase';
  }) {
    logger.info('Starting Supabase sync', params);
    
    // This is a placeholder for sync logic
    // In a real implementation, you would:
    // 1. Fetch data from source
    // 2. Transform data as needed
    // 3. Insert/update in destination
    
    return {
      status: 'success',
      message: `Sync from ${params.source} to ${params.table} completed`,
      direction: params.direction,
    };
  }
}

export const supabaseClient = new SupabaseClientWrapper();
