import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { createZohoClient } from "./zoho-client.js";
import { registerSettingsTools } from "./tools/settings.js";
import { registerRecordTools } from "./tools/records.js";

const server = new McpServer({ name: "zoho-crm-mcp-server", version: "1.0.0" });
const client = createZohoClient();

registerSettingsTools(server, client);
registerRecordTools(server, client);

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "zoho-crm-mcp-server", version: "1.0.0" });
});

app.post("/mcp", async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || "3000");
app.listen(port, () => {
  console.error(`Zoho CRM MCP server running on port ${port}`);
});
