import { ToolHandler } from './index.js';
import { supabaseClient } from '../../api/supabase/client.js';
import { logger } from '../../utils/logger.js';

export const supabaseToolHandlers: Record<string, ToolHandler> = {
  supabase_query: {
    name: 'supabase_query',
    description: 'Query data from Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        select: { type: 'string', description: 'Columns to select (default: *)' },
        filter: { type: 'object', description: 'Filter conditions' },
        limit: { type: 'number', description: 'Limit results' },
      },
      required: ['table'],
    },
    execute: async (args) => {
      try {
        const data = await supabaseClient.query({
          table: args.table as string,
          select: args.select as string,
          filter: args.filter as Record<string, unknown>,
          limit: args.limit as number,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Supabase query failed', { error });
        throw error;
      }
    },
  },

  supabase_insert: {
    name: 'supabase_insert',
    description: 'Insert data into Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to insert' },
      },
      required: ['table', 'data'],
    },
    execute: async (args) => {
      try {
        const result = await supabaseClient.insert({
          table: args.table as string,
          data: args.data as Record<string, unknown>,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Supabase insert failed', { error });
        throw error;
      }
    },
  },

  supabase_update: {
    name: 'supabase_update',
    description: 'Update data in Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to update' },
        filter: { type: 'object', description: 'Filter conditions' },
      },
      required: ['table', 'data', 'filter'],
    },
    execute: async (args) => {
      try {
        const result = await supabaseClient.update({
          table: args.table as string,
          data: args.data as Record<string, unknown>,
          filter: args.filter as Record<string, unknown>,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Supabase update failed', { error });
        throw error;
      }
    },
  },

  supabase_sync: {
    name: 'supabase_sync',
    description: 'Sync data between Supabase and external service',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        source: { type: 'string', description: 'Source service (stripe, social)' },
        direction: { type: 'string', description: 'Sync direction (to_supabase, from_supabase)' },
      },
      required: ['table', 'source', 'direction'],
    },
    execute: async (args) => {
      try {
        const result = await supabaseClient.sync({
          table: args.table as string,
          source: args.source as string,
          direction: args.direction as 'to_supabase' | 'from_supabase',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Supabase sync failed', { error });
        throw error;
      }
    },
  },
};
