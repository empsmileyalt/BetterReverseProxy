export const config = {
  runtime: 'edge', // Compiles instantly on high-speed global edge node pools
};

export default async function handler(request) {
  // 1. Intercept incoming player web client upgrade frames
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response(
      "The URL you have requested is the physical WebSocket address of 'EaglercraftXServer' " +
      "To correctly join this server, load the latest EaglercraftX client, click the 'Direct Connect' " +
      "button on the 'Multiplayer' screen, and enter wss://better-reverse-proxy.vercel.app/ as the server address.",
      { status: 400, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  // 2. Open a native browser-compliant WebSocket connection pair
  const [clientSocket, serverSocket] = new WebSocketPair();
  serverSocket.accept();

  // TARGET YOUR WORKING PRIMARY PORT ON PRISMATICYSKY
  const TARGET_BACKEND = 'ws://89.117.77.192:25643/';
  
  try {
    // Open a direct, high-speed outbound stream to your server
    const backendSocket = new WebSocket(TARGET_BACKEND);

    // Pipe client inputs straight down to Velocity
    serverSocket.addEventListener('message', (event) => {
      if (backendSocket.readyState === WebSocket.OPEN) {
        backendSocket.send(event.data);
      }
    });

    // Pipe server packets straight back up to your browser client
    backendSocket.addEventListener('message', (event) => {
      serverSocket.send(event.data);
    });

    // Handle structural recycles if a player leaves
    backendSocket.addEventListener('close', () => serverSocket.close());
    serverSocket.addEventListener('close', () => backendSocket.close());
    backendSocket.addEventListener('error', () => serverSocket.close());
    serverSocket.addEventListener('error', () => backendSocket.close());

  } catch (err) {
    return new Response("Failed to bridge connection to backend Velocity server", { status: 502 });
  }

  // 3. Return the active connection parameters cleanly to the browser
  return new Response(null, {
    status: 101,
    webSocket: clientSocket,
  });
}
