/*
 * directory.js
 * -------------
 * A simple HTTP server that provides a hard-coded list of relay nodes.
 * Run: node directory.js
 */

const http = require("http");

// For our demo, we use three relays with pre-shared 32-byte keys.
// (For AES-256, the key must be 32 bytes long.)
const relays = [
    { id: "relay1", host: "127.0.0.1", port: 9001, key: "11111111111111111111111111111111" },
    { id: "relay2", host: "127.0.0.1", port: 9002, key: "22222222222222222222222222222222" },
    { id: "relay3", host: "127.0.0.1", port: 9003, key: "33333333333333333333333333333333" },
];

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(relays));
});

server.listen(8000, () => {
    console.log("Directory server running on port 8000");
});
