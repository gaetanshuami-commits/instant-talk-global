import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import path from "path";

const PORT = Number(process.env.DEEPGRAM_BRIDGE_PORT || 8787);
const ENV_PATH = path.resolve(".env.local");

function loadDeepgramApiKey() {
  try {
    const env = fs.readFileSync(ENV_PATH, "utf8");
    const match = env.match(/^DEEPGRAM_API_KEY=(.+)$/m);
    const apiKey = match?.[1]?.trim();

    if (!apiKey) {
      throw new Error("Missing DEEPGRAM_API_KEY in .env.local");
    }

    return apiKey;
  } catch (error) {
    console.error("ENV_LOAD_ERROR", error);
    process.exit(1);
  }
}

const apiKey = loadDeepgramApiKey();

const server = new WebSocketServer({ host: "127.0.0.1", port: PORT });

server.on("listening", () => {
  console.log(`Deepgram bridge listening on ws://127.0.0.1:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`BRIDGE_PORT_IN_USE: port ${PORT} is already occupied.`);
    console.error("Close the existing bridge process or use another port.");
    process.exit(1);
  }

  console.error("BRIDGE_SERVER_ERROR", error);
});

server.on("connection", (browser, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`BROWSER_CONNECTED ${clientIp}`);

  let keepAliveInterval = null;
  let browserPingInterval = null;

  const dg = new WebSocket(
    "wss://api.deepgram.com/v1/listen?model=nova-3&language=fr&smart_format=true&interim_results=true&endpointing=300",
    {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    }
  );

  const safeBrowserSend = (payload) => {
    try {
      if (browser.readyState === WebSocket.OPEN) {
        browser.send(JSON.stringify(payload));
      }
    } catch (error) {
      console.error("BROWSER_SEND_ERROR", error);
    }
  };

  const cleanup = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }

    if (browserPingInterval) {
      clearInterval(browserPingInterval);
      browserPingInterval = null;
    }

    try {
      if (dg.readyState === WebSocket.OPEN) {
        dg.send(JSON.stringify({ type: "CloseStream" }));
      }
    } catch {}

    try {
      if (
        dg.readyState === WebSocket.OPEN ||
        dg.readyState === WebSocket.CONNECTING
      ) {
        dg.close();
      }
    } catch {}
  };

  dg.on("open", () => {
    console.log("DEEPGRAM_CONNECTED");
    safeBrowserSend({ type: "status", value: "deepgram-open" });

    keepAliveInterval = setInterval(() => {
      if (dg.readyState === WebSocket.OPEN) {
        try {
          dg.send(JSON.stringify({ type: "KeepAlive" }));
        } catch (error) {
          console.error("DEEPGRAM_KEEPALIVE_ERROR", error);
        }
      }
    }, 3000);

    browserPingInterval = setInterval(() => {
      if (browser.readyState === WebSocket.OPEN) {
        try {
          browser.ping();
        } catch (error) {
          console.error("BROWSER_PING_ERROR", error);
        }
      }
    }, 15000);
  });

  dg.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === "Results") {
        const transcript = data.channel?.alternatives?.[0]?.transcript || "";

        safeBrowserSend({
          type: "transcript",
          transcript,
          isFinal: Boolean(data.is_final),
          speechFinal: Boolean(data.speech_final),
        });
      }
    } catch (error) {
      console.error("DG_PARSE_ERROR", error);
    }
  });

  dg.on("error", (error) => {
    console.error("DG_SOCKET_ERROR", error);
    safeBrowserSend({ type: "error", message: "Deepgram socket error" });
  });

  dg.on("close", (code, reason) => {
    console.log(
      `DEEPGRAM_CLOSED code=${code} reason=${reason?.toString?.() || ""}`
    );
    safeBrowserSend({ type: "status", value: "deepgram-closed" });
  });

  browser.on("message", (message, isBinary) => {
    try {
      if (dg.readyState !== WebSocket.OPEN) return;

      if (isBinary) {
        dg.send(message, { binary: true });
        return;
      }

      const payload = JSON.parse(message.toString());

      if (payload?.type === "close") {
        dg.send(JSON.stringify({ type: "CloseStream" }));
      }
    } catch (error) {
      console.error("BROWSER_MESSAGE_ERROR", error);
    }
  });

  browser.on("error", (error) => {
    console.error("BROWSER_SOCKET_ERROR", error);
  });

  browser.on("close", () => {
    console.log("BROWSER_DISCONNECTED");
    cleanup();
  });
});

process.on("SIGINT", () => {
  console.log("BRIDGE_SHUTDOWN SIGINT");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("BRIDGE_SHUTDOWN SIGTERM");
  server.close(() => process.exit(0));
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT_EXCEPTION", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED_REJECTION", reason);
});
