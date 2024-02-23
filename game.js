const WebSocket = require("ws");

var game = function (gameID) {
    this.playerA = null;
    this.playerB = null;
    this.id = gameID;
    this.gameState = "0 JOINED";
    this.timeStarted = null; // in milliseconds
    this.playerAturn = true;
};

// The states of the game:
game.prototype.states = {};
game.prototype.states["0 JOINED"] = 0;
game.prototype.states["1 JOINED"] = 1;
game.prototype.states["2 JOINED"] = 2;
game.prototype.states["A's turn"] = 3;
game.prototype.states["B's turn"] = 4;
game.prototype.states["A won"] = 5; //A won
game.prototype.states["B won"] = 6; //B won
game.prototype.states["A Aborted"] = 7; //A aborted game
game.prototype.states["B Aborted"] = 8; //B aborted game

game.prototype.getGameState = function() {
    return this.gameState;
}

game.prototype.setState = function (state) {
    console.assert(typeof state == "string", "%s: Expecting a string, got a %s", arguments.callee.name, typeof state);
    this.gameState = state;
    console.log("[GAME STATE] set to %s", this.gameState);
};

// Return true if game has two connected players
game.prototype.hasTwoConnectedPlayers = function () {
    return (this.gameState == "2 JOINED");
};

game.prototype.hasOneConnectedPlayer = function () {
    return (this.gameState == "1 JOINED");
};

game.prototype.isPlayerA = function(ws) {
    return (this.playerA == ws);
}

/**
 * Add a new player to this game, if there aren't already two
 * The thing we add as a 'player' is a WebSocket connection
 */
game.prototype.addPlayer = function (p) {

    if (!(p instanceof WebSocket)) {
        return new Error("Expecting an instance of WebSocket, got %s", typeof p);
    }

    if (this.hasTwoConnectedPlayers()) {
        return new Error("Invalid call to addPlayer, current state is %s", this.gameState);
    }

    // Set game state to new game state
    if (this.getGameState() == "0 JOINED"){
        this.setState("1 JOINED");
    }
    else {
        this.setState("2 JOINED");
    }

    // Save the connection in this object
    if (this.playerA == null) {
        this.playerA = p;
        return "A";
    } else {
        this.playerB = p;
        return "B";
    }
};

game.prototype.startGame = function() {
    this.setTimeStarted();
}

game.prototype.setTimeStarted = function() {
    this.timeStarted = new Date().getTime();
}

module.exports = game;