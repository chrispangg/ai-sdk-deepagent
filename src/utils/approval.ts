/**
 * Utilities for applying tool approval configuration.
 */

import { tool, type ToolSet } from "ai";
import type { InterruptOnConfig, DynamicApprovalConfig } from "../types.ts";

/**
 * Callback type for requesting approval from the user.
 */
export type ApprovalCallback = (request: {
  approvalId: string;
  toolCallId: string;
  toolName: string;
  args: unknown;
}) => Promise<boolean>;

/**
 * Check if approval is needed based on config.
 */
async function checkNeedsApproval(
  config: boolean | DynamicApprovalConfig,
  args: unknown
): Promise<boolean> {
  if (typeof config === "boolean") {
    return config;
  }
  
  if (config.shouldApprove) {
    return config.shouldApprove(args);
  }
  
  return true;
}

/**
 * Convert interruptOn config to needsApproval function for a tool.
 */
function configToNeedsApproval(
  config: boolean | DynamicApprovalConfig
): boolean | ((args: unknown) => boolean | Promise<boolean>) {
  if (typeof config === "boolean") {
    return config;
  }
  
  if (config.shouldApprove) {
    return config.shouldApprove;
  }
  
  return true;
}

let approvalCounter = 0;
function generateApprovalId(): string {
  return `approval-${Date.now()}-${++approvalCounter}`;
}

/**
 * Apply interruptOn configuration to a toolset.
 * 
 * This adds the `needsApproval` property to tools based on the config.
 * 
 * @param tools - The original toolset
 * @param interruptOn - Configuration mapping tool names to approval settings
 * @returns New toolset with needsApproval applied
 * 
 * @example
 * ```typescript
 * const approvedTools = applyInterruptConfig(tools, {
 *   write_file: true,
 *   execute: { shouldApprove: (args) => args.command.includes('rm') },
 * });
 * ```
 */
export function applyInterruptConfig(
  tools: ToolSet,
  interruptOn?: InterruptOnConfig
): ToolSet {
  if (!interruptOn) {
    return tools;
  }

  const result: ToolSet = {};

  for (const [name, tool] of Object.entries(tools)) {
    const config = interruptOn[name];
    
    if (config === undefined || config === false) {
      // No approval needed - use tool as-is
      result[name] = tool;
    } else {
      // Apply needsApproval
      result[name] = {
        ...tool,
        needsApproval: configToNeedsApproval(config),
      };
    }
  }

  return result;
}

/**
 * Wrap tools with approval checking that intercepts execution.
 * 
 * Unlike applyInterruptConfig which just sets needsApproval metadata,
 * this actually wraps the execute function to request approval before running.
 * 
 * @param tools - The original toolset
 * @param interruptOn - Configuration mapping tool names to approval settings
 * @param onApprovalRequest - Callback to request approval from user
 * @returns New toolset with wrapped execute functions
 */
export function wrapToolsWithApproval(
  tools: ToolSet,
  interruptOn: InterruptOnConfig | undefined,
  onApprovalRequest: ApprovalCallback | undefined
): ToolSet {
  if (!interruptOn || !onApprovalRequest) {
    return tools;
  }

  const result: ToolSet = {};

  for (const [name, existingTool] of Object.entries(tools)) {
    const config = interruptOn[name];
    
    console.error(`[DEBUG] wrapToolsWithApproval processing tool: ${name}, config: ${JSON.stringify(config)}`);
    
    if (config === undefined || config === false) {
      // No approval needed - use tool as-is
      result[name] = existingTool;
    } else {
      // Wrap the execute function with approval check
      const originalExecute = existingTool.execute;
      if (!originalExecute) {
        // Tool has no execute function - skip wrapping
        console.error(`[DEBUG] Tool ${name} has no execute function, skipping`);
        result[name] = existingTool;
        continue;
      }
      
      console.error(`[DEBUG] Wrapping tool ${name} with approval check`);
      
      // Create a completely new tool using the AI SDK tool() function
      // This ensures proper integration with AI SDK's execution mechanism
      result[name] = tool({
        description: existingTool.description,
        inputSchema: existingTool.inputSchema,
        execute: async (args, options) => {
          console.error(`[DEBUG] Tool ${name} execute called, checking approval...`);
          
          // Check if this specific call needs approval
          const needsApproval = await checkNeedsApproval(config, args);
          console.error(`[DEBUG] Tool ${name} needsApproval: ${needsApproval}`);
          
          if (needsApproval) {
            // Generate unique IDs for this approval request
            const approvalId = generateApprovalId();
            const toolCallId = options?.toolCallId || approvalId;
            
            console.error(`[DEBUG] Requesting approval for ${name}...`);
            // Request approval from user
            const approved = await onApprovalRequest({
              approvalId,
              toolCallId,
              toolName: name,
              args,
            });
            console.error(`[DEBUG] Approval result for ${name}: ${approved}`);
            
            if (!approved) {
              // User denied - return an error message instead of executing
              return `Tool execution denied by user. The ${name} tool was not executed.`;
            }
          }
          
          // Approved or no approval needed - execute the tool
          return originalExecute(args, options);
        },
      });
    }
  }

  return result;
}

/**
 * Check if a toolset has any tools requiring approval.
 */
export function hasApprovalTools(interruptOn?: InterruptOnConfig): boolean {
  if (!interruptOn) return false;
  return Object.values(interruptOn).some((v) => v !== false);
}
