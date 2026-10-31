# HandesTECH local website

Open HandesTECH.slnx in Visual Studio 2026 and press F5.
The local address is http://localhost:5180.

Website content is in wwwroot/index.html and wwwroot/assets.
This ASP.NET Core host serves the current website locally. It does not yet implement payments, accounts, bookings or video delivery.

The proposed catalogue contains 44 course outlines across Structural, Architecture, Mechanical, Electrical Power, Telecommunications, Infrastructure, BIM & VDC, and Automation. Course availability and formats are confirmed by enquiry. Technical SVG diagrams are illustrative rather than construction documents.

The interface includes discipline, level and search filters, saved courses, syllabus dialogs, service enquiries, scroll reveals and reduced-motion support.

## Visual Studio MCP

Install the supplied VS-MCPServer.vsix extension by Coding With Calvin. Close Visual Studio if its installer requests it. After reopening, select Tools > MCP Server > Start Server. Its default endpoint is http://localhost:5050.

Codex's configuration must contain:

```toml
[mcp_servers.visualstudio]
url = "http://localhost:5050"
```

Restart Codex if the new server is not discovered. A connection is verified only when the MCP server responds and its tools are available.
