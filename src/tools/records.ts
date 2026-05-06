import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ZohoClient } from "../zoho-client.js";

export function registerRecordTools(server: McpServer, client: ZohoClient): void {

  server.registerTool("crm_list_records", {
    title: "List CRM Records",
    description: "List records from any CRM module with pagination.",
    inputSchema: {
      module: z.string(),
      fields: z.array(z.string()).optional(),
      page: z.number().int().min(1).default(1),
      per_page: z.number().int().min(1).max(200).default(20),
      sort_by: z.string().optional(),
      sort_order: z.enum(["asc","desc"]).optional().default("desc"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ module, fields, page, per_page, sort_by, sort_order }) => {
    const params: Record<string, unknown> = { page, per_page };
    if (fields?.length) params.fields = fields.join(",");
    if (sort_by) { params.sort_by = sort_by; params.sort_order = sort_order; }
    const data = await client.get<Record<string, unknown>>(`/crm/v6/${module}`, params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_get_record", {
    title: "Get CRM Record",
    description: "Get a single CRM record by ID.",
    inputSchema: { module: z.string(), record_id: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ module, record_id }) => {
    const data = await client.get<Record<string, unknown>>(`/crm/v6/${module}/${record_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_search_records", {
    title: "Search CRM Records",
    description: "Search records in a CRM module. search_type: word (full text), criteria (e.g. '(Vendor_Role:equals:Photographer)'), email, phone.",
    inputSchema: {
      module: z.string(),
      search_type: z.enum(["word","criteria","email","phone"]),
      value: z.string(),
      page: z.number().int().min(1).default(1),
      per_page: z.number().int().min(1).max(200).default(20),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ module, search_type, value, page, per_page }) => {
    const params: Record<string, unknown> = { page, per_page, [search_type]: value };
    const data = await client.get<Record<string, unknown>>(`/crm/v6/${module}/search`, params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_create_record", {
    title: "Create CRM Record",
    description: "Create a new record in any CRM module. Use crm_list_fields to find field API names. Use crm_list_layouts to get layout and pipeline IDs needed for Deals.",
    inputSchema: {
      module: z.string(),
      fields: z.record(z.unknown()).describe("Field API names and values"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ module, fields }) => {
    const data = await client.post<Record<string, unknown>>(`/crm/v6/${module}`, { data: [fields] });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_update_record", {
    title: "Update CRM Record",
    description: "Update specific fields on an existing CRM record.",
    inputSchema: {
      module: z.string(),
      record_id: z.string(),
      fields: z.record(z.unknown()),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ module, record_id, fields }) => {
    const data = await client.put<Record<string, unknown>>(`/crm/v6/${module}`, { data: [{ id: record_id, ...fields }] });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_delete_record", {
    title: "Delete CRM Record",
    description: "Permanently delete a CRM record. Cannot be undone.",
    inputSchema: { module: z.string(), record_id: z.string() },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async ({ module, record_id }) => {
    const data = await client.delete<Record<string, unknown>>(`/crm/v6/${module}?ids=${record_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_get_users", {
    title: "List CRM Users",
    description: "List users in the Zoho CRM org.",
    inputSchema: { type: z.enum(["AllUsers","ActiveUsers","DeactiveUsers","AdminUsers","CurrentUser"]).default("ActiveUsers") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ type }) => {
    const data = await client.get<Record<string, unknown>>(`/crm/v6/users?type=${type}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_list_modules", {
    title: "List CRM Modules",
    description: "List all modules in the Zoho CRM org.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => {
    const data = await client.get<Record<string, unknown>>("/crm/v6/settings/modules");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("crm_coql_query", {
    title: "Query CRM with COQL",
    description: "Run a COQL SELECT query against Zoho CRM. Must include a WHERE clause. Example: SELECT Deal_Name, Stage FROM Deals WHERE Deal_Name = 'Pre-Raphaelite Editorial, Spring 2026'",
    inputSchema: { query: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ query }) => {
    const data = await client.post<Record<string, unknown>>("/crm/v6/coql", { select_query: query });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });
} 
