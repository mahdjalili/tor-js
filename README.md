# Tor-JS: A Simple Onion Routing Implementation

> **Note**: This project and its documentation were generated using AI assistance.

This project implements a simplified version of onion routing in JavaScript, demonstrating the core concepts of the Tor network. It consists of three main components: a directory server, relay nodes, and a client.

## Components

### 1. Directory Server (`directory.js`)

-   Runs on port 8000
-   Provides a list of available relay nodes
-   Each relay has a unique ID, host, port, and encryption key
-   Currently configured with three local relays for demonstration

### 2. Relay Nodes (`relay.js`)

-   Each relay acts as a node in the onion routing network
-   Decrypts one layer of the onion-encrypted message
-   Forwards the remaining encrypted payload to the next relay
-   Uses AES-256-CBC encryption
-   Command-line arguments:
    -   `--id`: Unique identifier for the relay
    -   `--port`: Port number to listen on
    -   `--key`: 32-byte encryption key

### 3. Client (`client.js`)

-   Connects to the directory server to get the relay list
-   Creates an onion-encrypted message
-   Sends the message through a chain of relays
-   Uses the same AES-256-CBC encryption as the relays

## Setup and Running

1. Start the directory server:

```bash
node directory.js
```

2. Start three relay nodes (in separate terminals):

```bash
node relay.js --id relay1 --port 9001 --key 11111111111111111111111111111111
node relay.js --id relay2 --port 9002 --key 22222222222222222222222222222222
node relay.js --id relay3 --port 9003 --key 33333333333333333333333333333333
```

3. Run the client:

```bash
node client.js
```

## How It Works

1. The client fetches the relay list from the directory server
2. It selects three relays to form a circuit
3. The message is encrypted in layers (like an onion):
    - Each layer is encrypted with a different relay's key
    - The innermost layer contains the actual message
    - Each layer contains routing information for the next hop
4. The message is sent through the relay chain:
    - Each relay decrypts its layer
    - Forwards the remaining encrypted payload to the next relay
    - The final relay (exit node) receives the plaintext message

## Security Notes

This is a simplified implementation for educational purposes. It lacks many security features found in the actual Tor network, such as:

-   Perfect forward secrecy
-   Circuit padding
-   Guard nodes
-   Directory server authentication
-   Relay authentication
-   Traffic analysis protection

## Requirements

-   Node.js (for running the JavaScript files)
-   No additional dependencies (uses built-in Node.js modules)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
