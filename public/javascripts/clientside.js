// var messages = require("/public/javascripts/messages");

// create the ws with localhost:3002
var Wsocket = new WebSocket("ws://localhost:3002");

Wsocket.onmessage = function(event) { 

    let message = JSON.parse(event.data);

    if (message.type == {"type":"WAIT PLAYER"}) {
        Wsocket.send("Checking");
        console.log("We are there!");
        window.alert("Waiting for one more player to start the game");
    }
}

Wsocket.onopen = function() {
    Wsocket.send("[CLIENT] Opened a new WebSocket");
};