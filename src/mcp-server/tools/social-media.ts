import { ToolHandler } from './index.js';
import { socialMediaClient } from '../../api/social/client.js';
import { logger } from '../../utils/logger.js';

export const socialMediaToolHandlers: Record<string, ToolHandler> = {
  twitter_post: {
    name: 'twitter_post',
    description: 'Post a tweet to Twitter',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Tweet text' },
        media: { type: 'array', description: 'Media URLs' },
      },
      required: ['text'],
    },
    execute: async (args) => {
      try {
        const result = await socialMediaClient.twitter.post({
          text: args.text as string,
          media: args.media as string[],
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
        logger.error('Twitter post failed', { error });
        throw error;
      }
    },
  },

  facebook_post: {
    name: 'facebook_post',
    description: 'Post to Facebook',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Post message' },
        link: { type: 'string', description: 'Link to share' },
      },
      required: ['message'],
    },
    execute: async (args) => {
      try {
        const result = await socialMediaClient.facebook.post({
          message: args.message as string,
          link: args.link as string,
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
        logger.error('Facebook post failed', { error });
        throw error;
      }
    },
  },

  linkedin_post: {
    name: 'linkedin_post',
    description: 'Post to LinkedIn',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Post text' },
        visibility: { type: 'string', description: 'Post visibility (PUBLIC, CONNECTIONS)' },
      },
      required: ['text'],
    },
    execute: async (args) => {
      try {
        const result = await socialMediaClient.linkedin.post({
          text: args.text as string,
          visibility: (args.visibility as string) || 'PUBLIC',
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
        logger.error('LinkedIn post failed', { error });
        throw error;
      }
    },
  },
};
