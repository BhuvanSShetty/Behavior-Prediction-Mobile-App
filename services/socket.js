let ws;

export const connectSocket = (token) => {
  ws = new WebSocket("ws://10.0.2.2:5050/ws");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "REGISTER", token }));
  };

  ws.onmessage = (msg) => {
    console.log("ALERT:", JSON.parse(msg.data));
  };
};