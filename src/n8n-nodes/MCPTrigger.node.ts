import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export class MCPTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MCP Trigger',
    name: 'mcpTrigger',
    icon: 'file:mcp.svg',
    group: ['trigger'],
    version: 1,
    description: 'Trigger workflows from MCP automation hub',
    defaults: {
      name: 'MCP Trigger',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Event Type',
        name: 'eventType',
        type: 'options',
        options: [
          {
            name: 'Stripe Event',
            value: 'stripe',
          },
          {
            name: 'Social Media Event',
            value: 'social',
          },
          {
            name: 'Supabase Event',
            value: 'supabase',
          },
          {
            name: 'Custom Event',
            value: 'custom',
          },
        ],
        default: 'custom',
        description: 'The type of event to trigger on',
      },
      {
        displayName: 'Filter',
        name: 'filter',
        type: 'string',
        default: '',
        description: 'JSON filter for event data',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const eventType = this.getNodeParameter('eventType', 0) as string;
    const filter = this.getNodeParameter('filter', 0) as string;

    // Process trigger logic
    return [items];
  }
}
