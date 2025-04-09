/*
 * relay.js
 * --------
 * A relay node that decrypts an onion-encrypted message and forwards it.
 *
 * Usage (for relay1, for example):
 *   node relay.js --id relay1 --port 9001 --key 11111111111111111111111111111111
 *
 * Repeat for each relay using the corresponding id, port, and key.
 */

const net = require("net");
const crypto = require("crypto");

// Simple command-line argument parser.
const args = process.argv.slice(2);
let config = {};
for (let i = 0; i < args.length; i += 2) {
    const keyArg = args[i].replace("--", "");
    const valueArg = args[i + 1];
    config[keyArg] = valueArg;
}

if (!config.port || !config.key || !config.id) {
    console.error("Usage: node relay.js --id <relayId> --port <port> --key <encryptionKey>");
    process.exit(1);
}

const PORT = parseInt(config.port);
const KEY = config.key;

// --- Encryption/Decryption Utilities ---
// These functions use AES-256-CBC. They prefix the ciphertext with the IV,
// separated by a colon. (This is a toy approach.)
function decryptLayer(encryptedText, key) {
    try {
        const parts = encryptedText.split(":");
        const iv = Buffer.from(parts[0], "base64");
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted, "base64", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        throw new Error("Decryption failed: " + error.message);
    }
}

function encryptLayer(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return iv.toString("base64") + ":" + encrypted;
}

// --- Relay Server ---
const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        const message = data.toString();
        console.log(`${config.id} received data:`, message);
        try {
            // Decrypt the outer layer using this relay's key.
            const decrypted = decryptLayer(message, KEY);
            console.log(`${config.id} decrypted message:`, decrypted);
            const parsed = JSON.parse(decrypted);

            if (parsed.nextHop) {
                console.log(`${config.id} forwarding to ${parsed.nextHop.host}:${parsed.nextHop.port}`);
                // Forward the inner payload to the next hop.
                const forwardSocket = new net.Socket();
                forwardSocket.connect(parsed.nextHop.port, parsed.nextHop.host, () => {
                    forwardSocket.write(parsed.payload);
                    forwardSocket.end();
                });
            } else {
                // This is the exit (final) node.
                console.log(`${config.id} final payload: ${parsed.payload}`);
            }
        } catch (err) {
            console.error(`${config.id} error processing data:`, err.message);
        }
    });
});

server.listen(PORT, () => {
    console.log(`${config.id} listening on port ${PORT}`);
});
