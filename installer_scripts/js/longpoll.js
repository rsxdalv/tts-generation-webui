const http = require("http");
const fs = require("fs");
const path = require("path");

// Store clients waiting for a message
let clients = [];

function sendToWebConsoleClient(client, message) {
  return new Promise((resolve, reject) => {
    client.writeHead(200, { "Content-Type": "application/json" });
    client.end(JSON.stringify({ message }), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const messages = [];
// Function to send a message to a specific client
function sendToWebConsole(message) {
  messages.push(message);
  // Promise.all(clients.map((client) => sendToWebConsoleClient(client, message)));
  // clients = [];
}
exports.sendToWebConsole = sendToWebConsole;

// Function to end the connection
function endConnection(client, cb) {
  client.writeHead(200, { "Content-Type": "text/plain" });
  client.end("Connection ended", cb);
  // clients = clients.filter((c) => c !== client);
}
exports.endConnection = endConnection;

http
  .createServer(function (req, res) {
    if (req.url === "/poll") {
      // Add client to the list
      // clients.push(res);
      res.writeHead(200, { "Content-Type": "text/json" });
      res.end(JSON.stringify({ messages }));

      // Set a timeout to end the connection if no message is received within a certain time
      // setTimeout(() => {
      //   endConnection(res);
      // }, 30000); // 30 seconds timeout
    } else if (req.url === "/" || req.url === "/index.html") {
      // Serve the HTML page
      const filePath = path.join(__dirname, "index.html");
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Server Error");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  })
  .listen(8081);
