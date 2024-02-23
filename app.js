// Import packages
var express = require("express");
var http = require("http");
const websocket = require("ws");
var indexRouter = require("./routes/index");
var Game = require("./game");
var gameStats = require("./public/javascripts/gameStats");
var messages = require("./public/javascripts/messages");
var cookieParser = require("cookie-parser");

//Hard coded import because the modules didnt work
var messageTypes = {
    NONE: "None",
    WAITING_FOR_OTHER_PLAYER: "Waiting for other player",
    PLAYER_TURN: "Player turn",
    PLAYER_MOVE: "Player move",
    PLAYER_ABORT: "Player aborted",
    PLAYER_VICTORIOUS: "Player victorious",
    GAME_START: "Game starting"
};

// Initiate variables
var port = process.argv[2];
var app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

/**
 * Middleware component to track cookies
 * Displaying the user how many times he or she has visited the site
 */
app.use(cookieParser("wahed"));
app.use(function (req, res, next) {
    let cookie = req.cookies.visitCount;
    let count = parseInt(cookie, 10);

    if (Number.isNaN(count)) {
        count = 0;
    }
    
    res.cookie("visitCount", 1 + count, { maxAge: 900000, httpOnly: true });

    next();
});


/**
 * middleware component to log the time, IP address, request-type and request-url of every request by the server
 */
app.use(function(req, res, next) {
    console.log("[LOG] %s\t%s\t%s\t%s", new Date(), req.connection.remoteAddress,
        req.method, req.url);
    next(); // call onto the next middleware component
});


app.get("/play", indexRouter);
//app.get("/", indexRouter);
app.get("/", (req, res) => {
    res.render('splash.ejs', { nowPlaying: gameStats.nowPlaying, totalGamesPlayed: gameStats.totalGamesPlayed, averageGameLength: gameStats.averageGameLength });
});



var server = http.createServer(app);
const wss = new websocket.Server({ server });

// Array for storing the connections (web sockets with their connection ID):
var connections = [];

// Make new game with unique id and increment the amount of games played
var games = [];
var currentGameID = 0;

games[currentGameID] = new Game(currentGameID);




/** This function gets called when we get a new connection */
wss.on("connection", function connection(websocket) {
    // Create new connection variable
    let connection = websocket;
    
    console.log("[SERVER] New player connected");
    connections.push(connection);

    gameStats.nowPlaying = connections.length;
    
    //Add the player to the current game
    let playerType = games[currentGameID].addPlayer(connection);
    console.log("[GAME] Player placed in game %s, as player %s", games[currentGameID], playerType);   


    /**
     * If there is only one player, inform him/her that s/he has to wait for one 
     * more player:
     */
    if (games[currentGameID].hasOneConnectedPlayer()) {
        console.log("[SERVER] Sending message to client: %s", messages.Server_PLAYER_A);

        messages.setWaitingForOtherPlayer(currentGameID, true);
        connection.send(messages.MESSAGE);
    }



    /**
     *  if there was already a player in the current game, we can start the game
     */ 
    if (games[currentGameID].hasTwoConnectedPlayers()) {
        console.log("[GAME] starting game %s...", currentGameID);
        //currentGame.startGame(); //TODO: implement
        // gameStats.nowPlaying++;

        messages.setStartingGame(currentGameID, false);
        games[currentGameID].playerB.send(messages.MESSAGE);

        messages.setStartingGame(currentGameID, true);
        games[currentGameID].playerA.send(messages.MESSAGE);

        // Initialize a new game for the next two players
        currentGameID++;
        games[currentGameID] = new Game(gameStats.totalGamesPlayed++);
    }



    /**
     * Process any incoming messages
     */
    connection.on("message", function incoming(message) {
        console.log("[LOG] " + message);

        parts = message.split("-");
        switch (parts[0]) {
            case "0":
                //This is just a log bit, so we do nothing here
                break;

            case "1":
                //A player made a move
                let id = parts[1];
                let playerA = parts[2];
                let fromX = parts[3];
                let fromY = parts[4];
                let toX = parts[5];
                let toY = parts[6];
                let schaak = parts[7];

                //Attempt to push the moves
                try {
                    let to;
                    if (playerA == "true") {
                        to = games[id].playerB;
                    } else {
                        to = games[id].playerA;
                    }

                    messages.setPlayerMove(id, playerA, fromX, fromY, toX, toY, schaak);
                    to.send(messages.MESSAGE);
                } catch (err) {
                    console.log("Unable to process game variables for game with id " + id + ". Error message: " + err);
                }

                break;
        }

        // messageParts = message.split;
        // if (messageParts[0] == "move") {
        //     let id = messageParts[1];
        //     console.log(id);
        // }

    });
});

wss.on("disconnect", function connection(websocket) {
    console.log("Disconnected one " + websocket);
});

// wss.on("close", function(ws) {
//     let connection = ws;
//     console.log("[CONNECTION] Player with IP %s disconnected", connection.remoteAddress);
//     gameStats.nowPlaying--;
//     var endTime = new Date().getTime();
//     var startTime = games[connection.id].timeStarted;
//     var gameLength = (endTime - startTime) / 1000;
//     gameStats.push(gameLength);
// })

server.listen(port, function() {
    console.log("[CONNECTION] Listening on port %s...", port);
});









