import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ZohoClient } from "../zoho-client.js";

export function registerSettingsTools(server: McpServer, client: ZohoClient): void {

  server.registerTool("crm_list_fields", {
    title: "List CRM Module Fields",
    description: "List all fields on a CRM module (Contacts, Deals, Leads, Accounts).",
    inputSchema: { module: z.string().describe("Module API name e.g. Contacts, Deals") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ module }) => {
    const data = await client.get<Record<string, unknown>>(`/crm/v6/settings/fields?module=${module}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_create_custom_field", {
    title: "Create Custom Field on CRM Module",
    description: "Create a custom field on a Zoho CRM module. Supported data_type values: Single_Line, Multi_Line, Email, Phone, Picklist, Multi_Select_Picklist, Date, DateTime, Number, Currency, Decimal, Percent, Checkbox, URL. For Picklist types provide pick_list_values array.",
    inputSchema: {
      module: z.string().describe("Module API name e.g. Contacts, Deals"),
      field_label: z.string().describe("Display label e.g. 'Vendor Role'"),
      data_type: z.enum(["Single_Line","Multi_Line","Email","Phone","Picklist","Multi_Select_Picklist","Date","DateTime","Number","Currency","Decimal","Percent","Checkbox","URL"]),
      pick_list_values: z.array(z.string()).optional().describe("Options for Picklist fields"),
      required: z.boolean().optional().default(false),
      tooltip: z.string().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false,
