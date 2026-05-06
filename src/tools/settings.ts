import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ZohoClient } from "../zoho-client.js";

export function registerSettingsTools(
  server: McpServer,
  client: ZohoClient
): void {
  server.registerTool(
    "crm_list_fields",
    {
      title: "List CRM Module Fields",
      description: "List all fields on a CRM module.",
      inputSchema: { module: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module }) => {
      const data = await client.get<Record<string, unknown>>(
        `/crm/v6/settings/fields?module=${module}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_create_custom_field",
    {
      title: "Create Custom Field",
      description: "Create a custom field. data_type options: Single_Line, Multi_Line, Email, Phone, Picklist, Multi_Select_Picklist, Date, DateTime, Number, Currency, Decimal, Percent, Checkbox, URL.",
      inputSchema: {
        module: z.string(),
        field_label: z.string(),
        data_type: z.enum([
          "Single_Line", "Multi_Line", "Email", "Phone",
          "Picklist", "Multi_Select_Picklist", "Date", "DateTime",
          "Number", "Currency", "Decimal", "Percent", "Checkbox", "URL"
        ]),
        pick_list_values: z.array(z.string()).optional(),
        required: z.boolean().optional().default(false),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ module, field_label, data_type, pick_list_values, required }) => {
      const fieldBody: Record<string, unknown> = {
        field_label,
        data_type,
        required: required ?? false,
      };
      if (pick_list_values?.length) {
        fieldBody.pick_list_values = pick_list_values.map((val, i) => ({
          display_value: val,
          actual_value: val,
          sequence_number: i + 1,
        }));
      }
      const data = await client.post<Record<string, unknown>>(
        `/crm/v6/settings/fields?module=${module}`,
        { fields: [fieldBody] }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_delete_custom_field",
    {
      title: "Delete Custom Field",
      description: "Delete a custom field by ID.",
      inputSchema: { module: z.string(), field_id: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ module, field_id }) => {
      const data = await client.delete<Record<string, unknown>>(
        `/crm/v6/settings/fields/${field_id}?module=${module}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_list_pipelines",
    {
      title: "List CRM Pipelines",
      description: "List all pipelines on the Deals module.",
      inputSchema: { module: z.string().default("Deals") },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module }) => {
      const data = await client.get<Record<string, unknown>>(
        `/crm/v6/settings/pipeline?module=${module}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_create_pipeline",
    {
      title: "Create CRM Pipeline",
      description: "Create a new pipeline with custom stages.",
      inputSchema: {
        name: z.string(),
        module: z.string().default("Deals"),
        stages: z.array(
          z.object({
            display_value: z.string(),
            probability: z.number().min(0).max(100),
            forecast_category: z.enum([
              "Closed", "Committed", "BestCase", "Pipeline", "Omitted"
            ]),
          })
        ),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ name, module, stages }) => {
      const stagesPayload = stages.map((s, i) => ({
        display_value: s.display_value,
        actual_value: s.display_value,
        probability: s.probability,
        forecast_category: { name: s.forecast_category },
        sequence_number: i + 1,
      }));
      const data = await client.post<Record<string, unknown>>(
        `/crm/v6/settings/pipeline?module=${module}`,
        { pipeline: [{ display_value: name, stages: stagesPayload }] }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_update_pipeline_stages",
    {
      title: "Update Pipeline Stages",
      description: "Update stages on an existing pipeline.",
      inputSchema: {
        module: z.string().default("Deals"),
        pipeline_id: z.string(),
        stages: z.array(
          z.object({
            display_value: z.string(),
            probability: z.number().min(0).max(100),
            forecast_category: z.enum([
              "Closed", "Committed", "BestCase", "Pipeline", "Omitted"
            ]),
          })
        ),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module, pipeline_id, stages }) => {
      const stagesPayload = stages.map((s, i) => ({
        display_value: s.display_value,
        actual_value: s.display_value,
        probability: s.probability,
        forecast_category: { name: s.forecast_category },
        sequence_number: i + 1,
      }));
      const data = await client.put<Record<string, unknown>>(
        `/crm/v6/settings/pipeline/${pipeline_id}?module=${module}`,
        { pipeline: [{ id: pipeline_id, stages: stagesPayload }] }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_list_tags",
    {
      title: "List CRM Tags",
      description: "List all tags on a CRM module.",
      inputSchema: { module: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module }) => {
      const data = await client.get<Record<string, unknown>>(
        `/crm/v6/settings/tags?module=${module}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_create_tags",
    {
      title: "Create CRM Tags",
      description: "Create one or more tags on a CRM module.",
      inputSchema: { module: z.string(), tags: z.array(z.string()).min(1) },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ module, tags }) => {
      const data = await client.post<Record<string, unknown>>(
        `/crm/v6/settings/tags?module=${module}`,
        { tags: tags.map((name) => ({ name })) }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_add_tags_to_record",
    {
      title: "Add Tags to a CRM Record",
      description: "Apply existing tags to a specific CRM record.",
      inputSchema: {
        module: z.string(),
        record_id: z.string(),
        tag_names: z.array(z.string()).min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module, record_id, tag_names }) => {
      const data = await client.post<Record<string, unknown>>(
        `/crm/v6/${module}/${record_id}/actions/add_tags`,
        { tags: tag_names.map((name) => ({ name })) }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_list_custom_views",
    {
      title: "List CRM Custom Views",
      description: "List all saved custom views on a CRM module.",
      inputSchema: { module: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module }) => {
      const data = await client.get<Record<string, unknown>>(
        `/crm/v6/settings/custom_views?module=${module}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_create_custom_view",
    {
      title: "Create CRM Custom View",
      description: "Create a saved filtered view on a CRM module.",
      inputSchema: {
        module: z.string(),
        name: z.string(),
        display_columns: z.array(z.string()),
        criteria: z.object({
          group_operator: z.enum(["and", "or"]).default("and"),
          group: z.array(
            z.object({
              field: z.object({ api_name: z.string() }),
              comparator: z.string(),
              value: z.union([z.string(), z.array(z.string())]),
            })
          ),
        }),
        sort_by: z.string().optional(),
        sort_order: z.enum(["asc", "desc"]).optional().default("asc"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ module, name, display_columns, criteria, sort_by, sort_order }) => {
      const viewBody: Record<string, unknown> = {
        name,
        display_value: name,
        shared_type: "public",
        criteria,
        fields: display_columns.map((col) => ({ api_name: col })),
      };
      if (sort_by) {
        viewBody.sort_by = sort_by;
        viewBody.sort_order = sort_order;
      }
      const data = await client.post<Record<string, unknown>>(
        `/crm/v6/settings/custom_views?module=${module}`,
        { custom_views: [viewBody] }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "crm_list_layouts",
    {
      title: "List CRM Module Layouts",
      description: "List all layouts for a CRM module.",
      inputSchema: { module: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ module }) => {
      const data = await client.get<Record<string, unknown>>(
        `/crm/v6/settings/layouts?module=${module}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
