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

(function(exports) {

    exports._message = {
        GAME_ID: undefined,
        MESSAGE_TYPE: messageTypes.NONE,
        PLAYER_A: undefined,

        FROM_X: undefined,
        FROM_Y: undefined,
        TO_X: undefined,
        TO_Y: undefined,

        SCHAAK: undefined
    }    
    exports.MESSAGE = JSON.stringify(null);

    /** Set waiting for other player */
    exports.setWaitingForOtherPlayer = function(gameID, playerA) {
        exports._message.GAME_ID = gameID;
        exports._message.MESSAGE_TYPE = messageTypes.WAITING_FOR_OTHER_PLAYER;
        exports._message.PLAYER_A = playerA;        

        exports.MESSAGE = JSON.stringify(exports._message);
    }

    /** Set starting game */
    exports.setStartingGame = function(gameID, playerA) {
        exports._message.GAME_ID = gameID;
        exports._message.MESSAGE_TYPE = messageTypes.GAME_START;
        exports._message.PLAYER_A = playerA;        

        exports.MESSAGE = JSON.stringify(exports._message);
    }

    /** Set the player turn message */
    exports.setPlayerTurn = function(gameID, playerA) {
        exports._message.GAME_ID = gameID;
        exports._message.MESSAGE_TYPE = messageTypes.PLAYER_TURN;
        exports._message.PLAYER_A = playerA;        

        exports.MESSAGE = JSON.stringify(exports._message);
    }

    /** Set the player move message */
    exports.setPlayerMove = function(gameID, playerA, fromX, fromY, toX, toY, schaak) {
        exports._message.GAME_ID = gameID;
        exports._message.MESSAGE_TYPE = messageTypes.PLAYER_MOVE;
        exports._message.PLAYER_A = playerA;  

        exports._message.FROM_X = fromX;
        exports._message.FROM_Y = fromY;
        exports._message.TO_X = toX;
        exports._message.TO_Y = toY;

        exports._message.SCHAAK = schaak;

        exports.MESSAGE = JSON.stringify(exports._message);
    }

    /** Set the player aborted message */
    exports.setPlayerabort = function(gameID, playerA) {
        exports._message.GAME_ID = gameID;
        exports._message.MESSAGE_TYPE = messageTypes.PLAYER_ABORT;
        exports._message.PLAYER_A = playerA;  

        exports.MESSAGE = JSON.stringify(exports._message);
    }

    /** Set the player victorious message */
    exports.setPlayerVictorious = function(gameID, playerA) {
        exports._message.GAME_ID = gameID;
        exports._message.MESSAGE_TYPE = messageTypes.PLAYER_VICTORIOUS;
        exports._message.PLAYER_A = playerA;  

        exports.MESSAGE = JSON.stringify(exports._message);
    }

} (typeof exports === "undefined" ? this.Messages = {} : exports));
//if exports is undefined, we are on the client; else the server