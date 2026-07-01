import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { loadConfig } from "./config.js";

const configuredPort = loadConfig().port;
const WS_PORT = Number(process.env.PORT || configuredPort);
const HOST = process.env.HOST || "0.0.0.0";
const TIMEOUT_MS = 30000;

let cepSocket: WebSocket | null = null;
let pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
let requestId = 0;

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || "/";
  if (url === "/" || url === "/health" || url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "premiere-pro-mcp-bridge" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket) => {
  if (req.url === "/" || req.url === "/ws" || req.url === "/socket" || req.url === "") {
    wss.handleUpgrade(req, socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req);
    });
    return;
  }

  socket.destroy();
});

// Don't let a port conflict crash the whole MCP process.
// Every Claude window spawns its own `node server.js`, but only one can bind
// WS_PORT for the Premiere CEP bridge. Without this handler the WebSocketServer
// emits an unhandled "error" (EADDRINUSE) that kills the process, so the MCP
// stdio transport dies and the client shows "Server disconnected / failed".
wss.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Bridge] Port ${WS_PORT} is already in use — another MCP instance owns the ` +
        `Premiere bridge. This instance stays up but cannot reach Premiere ` +
        `(tool calls will report "Premiere Pro is not connected").`
    );
  } else {
    console.error("[Bridge] WebSocket server error:", err);
  }
});

wss.on("connection", (ws) => {
  console.error(`[Bridge] CEP panel connected`);
  cepSocket = ws;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const pending = pendingRequests.get(msg.id);
      if (pending) {
        pendingRequests.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(msg.error));
        } else {
          pending.resolve(msg.result);
        }
      }
    } catch (e) {
      console.error("[Bridge] Failed to parse message:", e);
    }
  });

  ws.on("close", () => {
    console.error("[Bridge] CEP panel disconnected");
    cepSocket = null;
    for (const [id, pending] of pendingRequests) {
      pending.reject(new Error("CEP panel disconnected"));
      pendingRequests.delete(id);
    }
  });
});

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  console.error("[Bridge] HTTP server error:", err);
});

httpServer.listen(WS_PORT, HOST, () => {
  console.error(`[Bridge] WebSocket server listening on ${HOST}:${WS_PORT}`);
});

export function isConnected(): boolean {
  return cepSocket !== null && cepSocket.readyState === WebSocket.OPEN;
}

export function getPort(): number {
  return WS_PORT;
}

export function callPremiere(functionName: string, args: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isConnected()) {
      reject(new Error("Premiere Pro is not connected. Make sure the MCP Bridge panel is open in Premiere Pro."));
      return;
    }

    const id = String(++requestId);
    pendingRequests.set(id, { resolve, reject });

    cepSocket!.send(JSON.stringify({ id, functionName, args }));

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Timeout waiting for Premiere Pro response (${functionName})`));
      }
    }, TIMEOUT_MS);
  });
}

export function toolResult(result: any) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
