import { OpenRouter } from "@openrouter/sdk";
import { backendTools, ToolName } from '../tools';
import prisma from '../prisma';

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
});

const BASE_SYSTEM_PROMPT = `You are FixByte, an intelligent AI Maintenance Assistant embedded in a Computerized Maintenance Management System (CMMS).

## YOUR ROLE
Help maintenance teams manage assets, work orders, preventive maintenance schedules, and spare parts inventory. You can perform REAL database operations using the tools available to you.

## GENERAL ASSISTANCE & WEBSITE INFO
- You are also a helpful general assistant. If the user asks general knowledge questions, programming questions, or questions about this website (FixByte CMMS), answer them directly and helpfully without requiring a tool call.
- If asked about the website, explain that FixByte is a Computerized Maintenance Management System (CMMS) used to track assets, work orders, inventory, and preventive maintenance.

## CRITICAL RULES
1. NEVER fabricate IDs, work order numbers, or confirmation data. Only report what tools actually return.
2. Collect ALL required fields before calling any tool. Ask questions one at a time.
3. Use the APP CONTEXT provided (current page, asset details, logged-in user) to auto-fill fields when possible.
4. If the user says "this asset", "current asset", "this pump" etc., use the assetId from the APP CONTEXT.
5. When a tool fails, report the error clearly and ask how to proceed.
6. Be conversational, concise, and professional.
7. When listing data, format it as a clean readable list.
8. NEVER output raw function calls, JSON, or code snippets as your reply text. ALWAYS use the tool-calling mechanism silently and then respond in plain English.

## MULTI-TURN CONVERSATION
For creation tasks, gather info progressively:
- Ask for one missing field at a time.
- Confirm understanding before executing.
- After successful execution, show the key result (ID, WO number etc.).

## CONTEXT AWARENESS
- If you're on an Asset Details page, work order requests automatically target that asset.
- If a user role is TECHNICIAN, they may not perform deletions — inform them politely.
- Use available technician names to assign work orders by name (match to their ID).

## TOOL USAGE GUIDELINES
- getAssets / getAsset: Use when user asks to list or view assets.
- createAsset: Requires assetName and category minimum.
- createWorkOrder: Requires title, priority, assetId. WorkType defaults to REACTIVE.
- schedulePM: Requires title, frequency, startDate (YYYY-MM-DD), assetId.
- checkStock / getInventory: Use to check parts before issuing.
- issueInventory: Requires inventoryId (get it from checkStock first) and quantity.
- getTechnicians: Use to list available technicians for assignment.
- generateReport: Returns a download URL for the report.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'getAssets',
      description: 'Get a list of all assets in the CMMS. Use the search parameter to filter by name, category, serial number, or location.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Optional search term to filter assets by name, category, location, or serial number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getAsset',
      description: 'Get full details of a specific asset including work orders and maintenance history. You can pass either a UUID or the asset name.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Asset UUID or asset name (e.g. "250kv Generator")' } },
        required: ['id']
      }
    }
  },
   {
     type: 'function',
     function: {
       name: 'createAsset',
       description: 'Create a new asset in the CMMS',
       parameters: {
         type: 'object',
         properties: {
           assetName:     { type: 'string' },
           category:      { type: 'string', description: 'e.g. Pump, Generator, Compressor, HVAC, Conveyor' },
           location:      { type: 'string' },
           manufacturer:  { type: 'string' },
           serialNumber:  { type: 'string' },
           description:   { type: 'string' }
         },
         required: ['assetName', 'category']
       }
     }
   },
   {
     type: 'function',
     function: {
       name: 'updateAsset',
       description: 'Update an existing asset',
       parameters: {
         type: 'object',
         properties: {
           id:           { type: 'string' },
           assetName:    { type: 'string' },
           category:     { type: 'string' },
           location:     { type: 'string' },
           manufacturer: { type: 'string' },
           status:       { type: 'string', enum: ['ACTIVE', 'UNDER_MAINTENANCE', 'BREAKDOWN', 'IDLE', 'RETIRED'] },
           description:  { type: 'string' }
         },
         required: ['id']
       }
     }
   },
  {
    type: 'function',
    function: {
      name: 'deleteAsset',
      description: 'Delete an asset from the CMMS',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getWorkOrders',
      description: 'Get work orders. IMPORTANT: Only include assetId or status in parameters if you have a real value. NEVER pass null or empty string for these fields — simply omit them.',
      parameters: {
        type: 'object',
        properties: {
          assetId: { type: 'string', description: 'Asset UUID — omit this field entirely if not filtering by asset' },
           status:  { type: 'string', description: 'One of: OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD, COMPLETED, CLOSED — omit this field entirely if not filtering by status' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createWorkOrder',
      description: 'Create a new work order',
      parameters: {
        type: 'object',
        properties: {
          title:         { type: 'string' },
          description:   { type: 'string' },
          priority:      { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
           workType:      { type: 'string', enum: ['REACTIVE', 'PREVENTIVE', 'BREAKDOWN', 'INSPECTION'], description: 'Defaults to REACTIVE' },
           assetId:       { type: 'string' },
           assignedTechnicianId:  { type: 'string', description: 'Technician user UUID' }
        },
        required: ['title', 'priority', 'assetId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assignTechnician',
      description: 'Assign a technician to an existing work order',
      parameters: {
        type: 'object',
        properties: {
          workOrderId:  { type: 'string' },
          technicianId: { type: 'string' }
        },
        required: ['workOrderId', 'technicianId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'closeWorkOrder',
      description: 'Mark a work order as completed/closed',
      parameters: {
        type: 'object',
        properties: {
          workOrderId: { type: 'string' },
          notes:       { type: 'string', description: 'Optional closing notes' }
        },
        required: ['workOrderId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getPMSchedules',
      description: 'Get preventive maintenance schedules, optionally for a specific asset',
      parameters: {
        type: 'object',
        properties: {
          assetId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'schedulePM',
      description: 'Schedule a preventive maintenance task for an asset',
      parameters: {
        type: 'object',
        properties: {
          title:         { type: 'string' },
          description:   { type: 'string' },
           frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'], description: 'How often to repeat, e.g. MONTHLY, QUARTERLY' },
           startDate:     { type: 'string', description: 'First maintenance date in YYYY-MM-DD format' },
           assetId:       { type: 'string' }
         },
         required: ['title', 'frequency', 'startDate', 'assetId']
       }
     }
   },
  {
    type: 'function',
    function: {
      name: 'getInventory',
      description: 'Get all spare parts with current stock levels',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkStock',
      description: 'Search spare parts by name to check stock availability',
      parameters: {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'Partial or full name of the spare part' }
        },
        required: ['itemName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'issueInventory',
      description: 'Issue/consume spare parts, reducing stock',
      parameters: {
        type: 'object',
        properties: {
          inventoryId: { type: 'string', description: 'UUID of the spare part (get from checkStock first)' },
          quantity:    { type: 'number' },
          notes:       { type: 'string' }
        },
        required: ['inventoryId', 'quantity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addInventory',
      description: 'Add/restock spare parts, increasing stock',
      parameters: {
        type: 'object',
        properties: {
          inventoryId: { type: 'string' },
          quantity:    { type: 'number' },
          notes:       { type: 'string' }
        },
        required: ['inventoryId', 'quantity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getTechnicians',
      description: 'Get list of all available technicians with their IDs',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generateReport',
      description: 'Generate a CMMS report',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['monthly', 'work-orders'] }
        },
        required: ['type']
      }
    }
  }
];

export async function handleChat(messages: any[], context: any): Promise<string> {
  try {
    const technicians = await prisma.user.findMany({
      where:  { role: { name: 'TECHNICIAN' } },
      select: { id: true, fullName: true }
    });

    const techList = technicians.length
      ? technicians.map(t => `  - ${t.fullName} (ID: ${t.id})`).join('\n')
      : '  (No technicians found)';

    const contextBlock = `
## CURRENT APP CONTEXT
- Current Page: ${context?.currentPath || 'Unknown'}
- Asset ID in View: ${context?.assetId  || 'None'}
- Asset Name in View: ${context?.assetName || 'None'}
- Logged-in User: ${context?.userName || 'Unknown'} (${context?.userRole || 'Admin'})

## AVAILABLE TECHNICIANS
${techList}
`;

    const apiMessages: any[] = [
      { role: 'system', content: BASE_SYSTEM_PROMPT + '\n\n' + contextBlock },
      ...messages
    ];

    const sanitizeResponse = (text: string): string => {
      const cleaned = text
        .replace(/<?\bfunction=[a-zA-Z]+>[^]*?<\/function>/g, '')
        .replace(/^[a-zA-Z]+\{[\s\S]*?\}\s*$/gm, '')
        .replace(/\bfunction=[a-zA-Z]+>[\s\S]*?<\/function>/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/<\/?function[^>]*>/g, '')
        .trim();
      return cleaned || 'Operation completed successfully.';
    };

    const firstResponse = await openrouter.chat.send({
      chatRequest: {
        model: 'google/gemma-4-26b-a4b-it:free',
        messages: apiMessages,
        tools: tools as any,
        toolChoice: 'auto',
        maxTokens: 1024,
      }
    });

    const firstMessage = (firstResponse as any).choices[0].message;

    if (!firstMessage.toolCalls || firstMessage.toolCalls.length === 0) {
      return sanitizeResponse(firstMessage.content || 'I am not sure how to help with that.');
    }

    apiMessages.push(firstMessage);

    for (const toolCall of firstMessage.toolCalls) {
      const fnName = toolCall.function.name as ToolName;
      const args   = JSON.parse(toolCall.function.arguments || '{}');

      console.log(`🔧 AI → Tool: ${fnName}`, args);

      let result: any;
      try {
        if (backendTools[fnName]) {
          result = await backendTools[fnName](args);
        } else {
          result = { error: `Tool "${fnName}" not found` };
        }
      } catch (err: any) {
        console.error(`❌ Tool error [${fnName}]:`, err.message);
        result = { error: err.message || 'Tool execution failed' };
      }

      console.log(`✅ Tool result [${fnName}]:`, JSON.stringify(result).slice(0, 200));

      apiMessages.push({
        role:         'tool',
        tool_call_id: toolCall.id,
        content:      JSON.stringify(result)
      });
    }

    const secondResponse = await openrouter.chat.send({
      chatRequest: {
        model: 'google/gemma-4-26b-a4b-it:free',
        messages: apiMessages,
        maxTokens: 1024,
      }
    });

    return sanitizeResponse((secondResponse as any).choices[0].message.content
      || 'Operation completed successfully.');

  } catch (error: any) {
    console.error('AI Chat error:', error);

    if (error?.status === 401 || error?.message?.includes('api_key')) {
      return '⚠️ Invalid API key. Please check your OPENROUTER_API_KEY in the backend .env file.';
    }
    if (error?.status === 503 || error?.message?.includes('model')) {
      return '⚠️ AI model is currently loading. Please try again in a moment.';
    }
    return 'Sorry, I encountered an error connecting to the AI. Please try again.';
  }
}
