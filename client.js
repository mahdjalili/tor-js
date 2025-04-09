/*
 * client.js
 * ---------
 * A simple client that builds an onion-encrypted message and sends it along the relay chain.
 *
 * Run: node client.js
 */

const http = require("http");
const net = require("net");
const crypto = require("crypto");

// Utility: Encrypt a plaintext string using AES-256-CBC.
// The output is "iv:ciphertext", both encoded in base64.
function encryptLayer(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return iv.toString("base64") + ":" + encrypted;
}

// Fetch relay list from the directory server.
function getRelayList(directoryUrl) {
    return new Promise((resolve, reject) => {
        http.get(directoryUrl, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const relays = JSON.parse(data);
                    resolve(relays);
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

// Build onion encryption from a relay chain.
// relayChain is an array of relay objects (in the order of the circuit).
function onionEncrypt(message, relayChain) {
    // Start with the innermost payload (the plaintext message).
    let payload = message;
    // Build layers from the exit node backward.
    for (let i = relayChain.length - 1; i >= 0; i--) {
        let nextHop = null;
        if (i < relayChain.length - 1) {
            // The next hop (for relay i) is the relay immediately after it.
            nextHop = { host: relayChain[i + 1].host, port: relayChain[i + 1].port };
        }
        // Create a JSON object with the nextHop info and the current payload.
        const layer = JSON.stringify({
            nextHop: nextHop,
            payload: payload,
        });
        // Encrypt this layer with the relay's key.
        payload = encryptLayer(layer, relayChain[i].key);
    }
    return payload;
}

(async () => {
    try {
        console.log("Fetching relay list from directory...");
        const relays = await getRelayList("http://127.0.0.1:8000");
        if (relays.length < 3) {
            console.error("Need at least 3 relays in the directory.");
            process.exit(1);
        }
        // For this demo, use the first 3 relays.
        const relayChain = [relays[0], relays[1], relays[2]];
        console.log("Using relay chain:", relayChain.map((r) => r.id).join(" -> "));

        const message = "Hello from the client!";
        const onionMessage = onionEncrypt(message, relayChain);

        // Send the onionMessage to the first relay.
        const firstRelay = relayChain[0];
        const clientSocket = new net.Socket();
        clientSocket.connect(firstRelay.port, firstRelay.host, () => {
            console.log(`Connected to first relay at ${firstRelay.host}:${firstRelay.port}`);
            clientSocket.write(onionMessage);
            clientSocket.end();
        });
    } catch (error) {
        console.error("Error in client:", error.message);
    }
})();
