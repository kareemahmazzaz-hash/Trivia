// Choose how devices talk to each other:
//
// "lan"      - Run `node server.js` on one computer, connect every device
//               (TV, host, players) to that computer's WiFi address.
//               No internet or accounts needed. Good for house parties.
//
// "firebase" - No server to run. Deploy the /public folder anywhere
//               (e.g. GitHub Pages) and everyone connects over the internet.
//               Requires a free Firebase project - see README.md.
//
// Set the SAME value here on every device before game night.
const TRANSPORT = "lan";
