import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Not WebSocket', { status: 400 });
  }

  const { socket, head } = await req.socket;

  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
  }

  wss.handleUpgrade(socket, head, async (ws) => {
    const dgUrl = 'ws://127.0.0.1:8787';
    let dgWs: any = null;

    ws.on('message', (data) => {
      if (dgWs?.readyState === 1) {
        dgWs.send(data);
      }
    });

    ws.on('close', () => {
      if (dgWs) {
        dgWs.close();
        dgWs = null;
      }
    });

    try {
      const { WebSocket } = await import('ws');
      dgWs = new WebSocket(dgUrl);

      dgWs.on('message', (data: any) => {
        if (ws.readyState === 1) {
          ws.send(data);
        }
      });

      dgWs.on('open', () => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'bridge_ready' }));
        }
      });

      dgWs.on('close', () => {
        ws.close();
      });

      dgWs.on('error', (error: any) => {
        console.error('[API] DG error:', error);
        ws.close();
      });
    } catch (error) {
      console.error('[API] Error:', error);
      ws.close();
    }
  });

  return new Response(null, { status: 101 });
}
