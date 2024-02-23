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

/**
 * COMMUNICATION PART
 */
// create the ws with localhost:3002
var Wsocket = new WebSocket("ws://localhost:3002");
var gameID = -1;
var playerA = undefined;
var myTurn = false;
var playable = true;
var hasStarted = false;

Wsocket.onmessage = function(event) { 
    let message = JSON.parse(event.data);

    console.log("Recieved onmessage event from socket:");
    console.log(message);
    console.log("--");

    //Doing some game ID checks first
    if (gameID == -1) {
        gameID = message.GAME_ID;
        console.log("Set game id to " + gameID);
    } else {
        if (!gameID == message.GAME_ID) {
            console.log("game ID's are out of sync! Server said " + message.GAME_ID + ", we are " + gameID + ". Doing nothing.");
            return;
        }
    }

    //Processing the message
    switch (message.MESSAGE_TYPE) {
        case messageTypes.NONE: 
            console.log("Messagetype was unclear. Doing nothing");
            break;

        case messageTypes.WAITING_FOR_OTHER_PLAYER:
            console.log("We are waiting for another player");
            playerA = message.PLAYER_A;
            hasStarted = false;
            initializeGrid();
            resetCheckerboardColors();

            onWeMakeMove(1, 2, 3, 4);

            break;

        case messageTypes.GAME_START:
            console.log("Starting game. We are playerA? " + playerA);
            if (!hasStarted) {
                playerA = message.PLAYER_A;
                playable = true;
                hasStarted = true;
                myTurn = playerA;
                startGame();
            }
            break;

        case messageTypes.PLAYER_ABORT:
            console.log("Other player aborted.");
            window.alert("The other player aborted the session. Please restart the game to play again.");
            playable = false;
            break;

        case messageTypes.PLAYER_MOVE:
            console.log("The other player made a move! Lets process that.");

            if (message.SCHAAK == "true") {
                window.alert("The enemy has schaak on you!");
            }

            onEnemyMakesMove(message.FROM_X, message.FROM_Y, message.TO_X, message.TO_Y);
            break;

        case messageTypes.PLAYER_VICTORIOUS:
            console.log("The other player is victorious...");
            window.alert("You lost the game.");
            playable = false;
            break;

        case messageTypes.PLAYER_TURN:
            console.log("A new turn is triggered. Lets process that!");

            if (message.PLAYER_A == playerA) {
                myTurn = true;
            } else {
                myTurn = false;
            }

            break;
    } 

    // if (message.type == "PLAYER TYPE") {
    //     Wsocket.send("Checking");
    //     console.log("We are there!");
    //     window.alert("Waiting for one more player to start the game");
    // }
}

Wsocket.onopen = function() {
    Wsocket.send("0-Opened a new WebSocket");
};

/** The game functions */
function onWeMakeMove(from, to) {
    if (playable) {
        processMove(from, to);
        schaak = checkForSchaakOnEnemy();
        myTurn = false;
        let message = "1" 
            + "-" + gameID
            + "-" + playerA
            + "-" + from.x
            + "-" + from.y
            + "-" + to.x
            + "-" + to.y
            + "-" + schaak;
        Wsocket.send(message);
    }
}

function onEnemyMakesMove(fromX, fromY, toX, toY) {
    myTurn = true;

    //Invert becuase the enemy sees everything upside down with respect to us
    fromY = 9 - fromY;
    toY = 9 - toY;

    processMove(grid[fromX][fromY], grid[toX][toY]);
}

function processMove(from, to) {
    if (!to.piece == pieces.EMPTYFIELD) {
        smackSquare(from, to);
    }
    checkForPawnQueenExchange(from, to);
    moveSquare(from, to);

    resetCheckerboardColors();
    updateCheckerboardSprites();
    //updateCheckerboardSprites();
}

/**
 * CHESS PART
 */
/**Possible chesspieces */
const pieces = {
    A_PION: 'Friendly pion',
    A_PAARD: 'Friendly paard',
    A_LOPER: 'Friendly loper',
    A_TOREN: 'Friendly toren',
    A_DAME: 'Friendly dame',
    A_KONING: 'Friendly koning',

    B_PION: 'Enemy pion',
    B_PAARD: 'Enemy paard',
    B_LOPER: 'Enemy loper',
    B_TOREN: 'Enemy toren',
    B_DAME: 'Enemy dame',
    B_KONING: 'Enemy koning',

    EMPTYFIELD: 'Leeg veld'
}

var grid = [];
var divs = [];
var myTurn = true;
var squareSelected = null;
var possibleSquares = [];

var myConqueredPieces = [];
var enemyConqueredPieces = [];

/** Square prototype */
function Square(_x, _y, _ab, _div, _piece) {
    this.x = _x;
    this.y = _y;
    this.ab = _ab;
    this.div = _div;

    this.piece = _piece;
}

/** Returns the square base color*/
function abColor(ab) {
    if (ab) {
        return '#01B400';
    } else {
        return '#FFCC01';
    }
}

/** Returns the square hover color*/
function abColorHover(ab) {
    if (ab) {
        return '#70ff70';
    } else {
        return '#ff7070';
    }
}

/**This gets called when the game starts */
function startGame() {
    initializeGrid();
    addBeginSetupToGrid();

    resetCheckerboardColors();
    updateCheckerboardSprites();
    updateSelectedSquareColor();

    console.log("Game has been initialized. Start playing!");

    return "-";
}

/**This creates the grid, fills it with square objects
 * Also colors the grid
 */
function initializeGrid() {
    console.log("Checkerboard.js: initializeGrid()");
    divs = document.getElementsByClassName("grid-square");
    var ab = true;
    for (var x = 1; x <= 8; x++) {
        grid[x] = [];
        for (var y = 1; y <= 8; y++) {
            grid[x][y] = new Square(
                x,
                y,
                ab,
                divs[-1 + x + (8 * (y - 1))],
                pieces.EMPTYFIELD
            );
            /*grid[x][y].div.onmousedown = "innerClick(grid[x][y])";*/
            /*$(grid[x][y].div).hover(function() {
                    $(grid[x][y].div).style.backgroundColor = abColorHover(ab);
                }, function() {
                    $(grid[x][y].div).style.backgroundColor = abColor(ab);
            });*/
            ab = !ab;
        }
        ab = !ab;
    }

    return "-";
}

/**This sets the starting pieces for both players */
function addBeginSetupToGrid() {
    grid[1][1].piece = pieces.B_TOREN;
    grid[2][1].piece = pieces.B_PAARD;
    grid[3][1].piece = pieces.B_LOPER;
    grid[4][1].piece = pieces.B_DAME;
    grid[5][1].piece = pieces.B_KONING;
    grid[6][1].piece = pieces.B_LOPER;
    grid[7][1].piece = pieces.B_PAARD;
    grid[8][1].piece = pieces.B_TOREN;

    grid[1][8].piece = pieces.A_TOREN;
    grid[2][8].piece = pieces.A_PAARD;
    grid[3][8].piece = pieces.A_LOPER;
    grid[4][8].piece = pieces.A_DAME;
    grid[5][8].piece = pieces.A_KONING;
    grid[6][8].piece = pieces.A_LOPER;
    grid[7][8].piece = pieces.A_PAARD;
    grid[8][8].piece = pieces.A_TOREN;

    for (var x = 1; x <= 8; x++) {
        grid[x][2].piece = pieces.B_PION;
        grid[x][7].piece = pieces.A_PION;
    }
}





/**Forces the grid to be in its original colors */
function resetCheckerboardColors() {
    var square;
    for (var x = 1; x <= 8; x++) {
        for (var y = 1; y <= 8; y++) {
            square = grid[x][y];
            square.div.style.backgroundColor = abColor(square.ab);
        }
    }
}

/**This forces all pieces to be drawn */
function updateCheckerboardSprites() {
    divs = document.getElementsByClassName("grid-square");
    let count = divs.length;
    for (let i = 0; i < count; i++) {
        divs[i].innerHTML = "";
    }

    for (var x = 1; x <= 8; x++) {
        for (var y = 1; y <= 8; y++) {
            var text = "";
            if (grid[x][y].piece == pieces.EMPTYFIELD) {
                text = "";
            } else {
                var piece = grid[x][y].piece;
                switch (piece) {
                    // cases of our own player's pieces (A pieces):
                    case pieces.A_PION:
                    (playerA)? grid[x][y].div.innerHTML = '<div class = "img"><img src="./images/PAWN WHITE.PNG" /></div>' 
                                : grid[x][y].div.innerHTML = '<div class = "img"><img src="./images/PAWN BLACK.PNG" /></div>' 
                    break;
                    case pieces.A_PAARD:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/KNIGHT WHITE.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/KNIGHT BLACK.PNG" />';
                    break;
                    case pieces.A_TOREN:
                        console.log("Setting grid " + x + "," + y + " to rook");
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/TOWERWHITE.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/TOWERBLACK.PNG" />';
                    case pieces.A_LOPER:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/BISHOP WHITE.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/BISHOP BLACK.PNG" />';
                    break;
                    case pieces.A_DAME:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/QUEEN WHITE.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/QUEEN BLACK.PNG" />';
                    break;
                    case pieces.A_KONING:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/KING WHITE.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/KING BLACK.PNG" />';
                    break;
                    
                    // here we take cases of B pieces (the opponent's pieces)
                    case pieces.B_PION:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/PAWN BLACK.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/PAWN WHITE.PNG" />';
                    break;
                    case pieces.B_PAARD:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/KNIGHT BLACK.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/KNIGHT WHITE.PNG" />';
                    break;
                    case pieces.B_TOREN:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/TOWERBLACK.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/TOWERWHITE.PNG" />';
                    case pieces.B_LOPER:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/BISHOP BLACK.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/BISHOP WHITE.PNG" />';
                    break;
                    case pieces.B_DAME:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/QUEEN BLACK.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/QUEEN WHITE.PNG" />';
                    break;
                    case pieces.B_KONING:
                    (playerA)? grid[x][y].div.innerHTML = '<img class="img" src="./images/KING BLACK.PNG" />' 
                                : grid[x][y].div.innerHTML = '<img class="img" src="./images/KING WHITE.PNG" />';
                    break;
                    case pieces.EMPTYFIELD:
                        grid[x][y].div.innerHTML = '<img class="img" src="./images/EMPTY SQUARE.PNG" />';
                    break;
                }
            }
            //divs[-1 + x + (8 * (y - 1))].innerHTML = text;
        }
    }
}

/**Updates the background color of all possible squares we can move to */
function updatePossibleSquaresColors() {
    for (var i = 0; i <= possibleSquares.length - 1; i++) {
        possibleSquares[i].div.style.backgroundColor = '#97a7a7';
        
    }
}

/**Updates the background color of the selected square */
function updateSelectedSquareColor() {
    if (squareSelected !== null) {
        squareSelected.div.style.backgroundColor = '#ff6565';
    }
}





/**Click event added by html.
 * This also checks with the server if making a move is permitted
 */
function onClickGrid(x, y) {
    /**If the server allows it
     * --> It's your turn
     * --> Within the time limit etc etc etc
     */

    console.log("Clicked " + x + ", " + y + " containing " + grid[x][y].piece);

    if (myTurn) {
        onClickGridLocal(x, y);
    }

    /** If it is not your turn */
    else {
        console.log("Not my turn!");
    }
}

/** Click function */
function onClickGridLocal(x, y) {
    var squareClicked = grid[x][y];

    // If we have a square selected
    if (squareSelected !== null) {
        // Moving to a square
        if (possibleSquares.includes(squareClicked)) {        
            onWeMakeMove(squareSelected, squareClicked);
        }

        // Deselecting the piece and resetting the possible squares
        squareSelected = null;
        possibleSquares = [];

        updateCheckerboardSprites();
    }

    // If we do not have a square selected
    else if (squareSelected === null) {
        if (isFriendlyAndNotEmpty(squareClicked)) {
            // Selecting your own piece
            squareSelected = squareClicked;
            possibleSquares = [];
            possibleSquares = possibleSquares.concat(getPossibleSquares(squareSelected));
            updatePossibleSquaresColors(possibleSquares);
        }
    }

    // Update all background colors
    resetCheckerboardColors();
    updatePossibleSquaresColors();
    updateSelectedSquareColor();
}





/**Returns all possible squares where we can move our piece to */
function getPossibleSquares(square) {    
    if (square.piece == pieces.EMPTYFIELD) {
        var emptyArray = [];
        return emptyArray;
    }

    var piece = square.piece;
    let possible = [];

    switch (square.piece) {
        case pieces.A_DAME:
            possible = possible.concat(getPossibleSquaresDiagonalTopLeft(square, 8));
            possible = possible.concat(getPossibleSquaresDiagonalTopRight(square, 8));
            possible = possible.concat(getPossibleSquaresHorizontal(square, 8));
            possible = possible.concat(getPossibleSquaresVertical(square, 8));
            break;

        case pieces.A_KONING:
            possible = possible.concat(getPossibleSquaresDiagonalTopLeft(square, 1));
            possible = possible.concat(getPossibleSquaresDiagonalTopRight(square, 1));
            possible = possible.concat(getPossibleSquaresHorizontal(square, 1));
            possible = possible.concat(getPossibleSquaresVertical(square, 1));
            break;

        case pieces.A_LOPER:
            possible = possible.concat(getPossibleSquaresDiagonalTopLeft(square, 8));
            possible = possible.concat(getPossibleSquaresDiagonalTopRight(square, 8));
            break;

        case pieces.A_PAARD:
            possible = possible.concat(getPossibleSquaresHorse(square));
            break;

        case pieces.A_PION:
            possible = possible.concat(getPossibleSquaresPawn(square));
            break;
        
        case pieces.A_TOREN: 
            possible = possible.concat(getPossibleSquaresHorizontal(square, 8));
            possible = possible.concat(getPossibleSquaresVertical(square, 8));
            break;
    }
    
    return possible;
}

/**Returns the squares where a pawn can move towards forward and diagonal*/
function getPossibleSquaresPawn(square) {
    let x = square.x;
    let y = square.y;
    let possible = [];

    if (y >= 2) {
        //  Vertical
        if (!isEnemy(grid[x][y - 1]) && !isFriendly(grid[x][y - 1])) {
            possible.push(grid[x][y - 1]);
        }
        if (y == 7) {
            possible.push(grid[x][y - 2]);
        }

        //  Horizontal
        if (x >= 2 && isEnemyAndNotEmpty(grid[x - 1][y - 1])) {
            possible.push(grid[x - 1][y - 1]);
        }
        if (x <= 7 && isEnemyAndNotEmpty(grid[x + 1][y - 1])) {
            possible.push(grid[x + 1][y - 1]);
        }
        }

    return possible;
}

/**Returns all possible squares in a horizontal sweep */
function getPossibleSquaresHorizontal(square, maxRange) {
    var possible = [];
    var other;

    /*Left*/
    for (var x = square.x - 1; x >= (square.x - 1) - maxRange; x--) {
        if (x < 1) { break; }
        other = grid[x][square.y];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    /*Right*/
    for (var x = square.x + 1; x <= (square.x + 1) + maxRange; x ++) {
        if (x > 8) { break; }
        other = grid[x][square.y];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    return possible;
}

/**Returns all possible squares in a horizontal sweep */
function getPossibleSquaresVertical(square, maxRange) {
    var possible = [];
    var other;

    /*Up*/
    for (var y = square.y - 1; y >= (square.y - 1) - maxRange; y--) {
        if (y < 1) { break; }
        other = grid[square.x][y];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    /*Down*/
    for (var y = square.y + 1; y <= (square.y + 1) + maxRange; y ++) {
        if (y > 8) { break; }
        other = grid[square.x][y];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    return possible;
}

/**Returns all possible squares in a diagonal topright sweep */
function getPossibleSquaresDiagonalTopLeft(square, maxRange) {
    var possible = [];

    var x0 = square.x;
    var y0 = square.y;

    var xnew = 0;
    var ynew = 0;

    /*Down*/
    for (var i = 1; i < maxRange; i++) {
        xnew = x0 - i;
        ynew = y0 - i;
        if (xnew < 1 ||  ynew < 1) { break; }

        other = grid[xnew][ynew];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    /*Down*/
    for (var i = 1; i < maxRange; i++) {
        xnew = x0 + i;
        ynew = y0 + i;
        if (xnew > 8 ||  ynew > 8) { break; }

        other = grid[xnew][ynew];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    return possible
}

/**Returns all possible squares in a diagonal topleft sweep */
function getPossibleSquaresDiagonalTopRight(square, maxRange) {
    var possible = [];

    var x0 = square.x;
    var y0 = square.y;

    var xnew = 0;
    var ynew = 0;

    /*Down*/
    for (var i = 1; i < maxRange; i++) {
        xnew = x0 + i;
        ynew = y0 - i;
        if (xnew > 8 ||  ynew < 1) { break; }

        other = grid[xnew][ynew];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    /*Down*/
    for (var i = 1; i < maxRange; i++) {
        xnew = x0 - i;
        ynew = y0 + i;
        if (xnew < 1 ||  ynew > 8) { break; }

        other = grid[xnew][ynew];
        if (other.piece == pieces.EMPTYFIELD) {
            possible.push(other);
        } else if (isEnemyAndNotEmpty(other)) {
            possible.push(other);
            break;
        } else {
            break;
        }
    }

    return possible
}

/**Returns all possible squares for a horse */
function getPossibleSquaresHorse(square) {
    var possible = [];
    var possiblePoints = [];

    var x0 = square.x;
    var y0 = square.y;

    possiblePoints.push(new Point(x0 + 1, y0 + 2));
    possiblePoints.push(new Point(x0 + 1, y0 - 2));
    possiblePoints.push(new Point(x0 - 1, y0 + 2));
    possiblePoints.push(new Point(x0 - 1, y0 - 2));
    possiblePoints.push(new Point(x0 + 2, y0 + 1));
    possiblePoints.push(new Point(x0 + 2, y0 - 1));
    possiblePoints.push(new Point(x0 - 2, y0 + 1));
    possiblePoints.push(new Point(x0 - 2, y0 - 1));

    for (var i = 0; i < possiblePoints.length; i++) {
        if (possiblePoints[i].x < 1
        ||  possiblePoints[i].x > 8
        ||  possiblePoints[i].y < 1
        ||  possiblePoints[i].y > 8) {
            //
        } else {
            var otherSquare = grid[possiblePoints[i].x][possiblePoints[i].y];
            if (otherSquare.piece == pieces.EMPTYFIELD || isEnemyAndNotEmpty(otherSquare)) {
                possible.push(otherSquare);
            }
        }        
    }

    return possible;
}





/**Returns true if a square contains a friendly piece or is empty
 * Returns false if a square contains an enemy piece */
function isFriendlyAndNotEmpty(square) {
    var piece = square.piece;

    if (piece == pieces.A_KONING 
    ||  piece == pieces.A_DAME
    ||  piece == pieces.A_LOPER
    ||  piece == pieces.A_PAARD
    ||  piece == pieces.A_PION
    ||  piece == pieces.A_TOREN) {
        return true;
    } else {
        return false;
    }
}

/** Returns true if the square contains a friendly piece */
function isFriendly(square) {
    let piece = square.piece;

    if (piece == pieces.A_KONING 
    ||  piece == pieces.A_DAME
    ||  piece == pieces.A_LOPER
    ||  piece == pieces.A_PAARD
    ||  piece == pieces.A_PION
    ||  piece == pieces.A_TOREN) {
        return true;
    } else {
        return false;
    }
}

/** Returns true if the square is empty or contains an enemy chess piece*/
function isEnemyAndNotEmpty(square) {
    var piece = square.piece;

    if (piece == pieces.A_KONING 
    ||  piece == pieces.A_DAME
    ||  piece == pieces.A_LOPER
    ||  piece == pieces.A_PAARD
    ||  piece == pieces.A_PION
    ||  piece == pieces.A_TOREN
    ||  piece == pieces.EMPTYFIELD) {
        return false;
    } else {
        return true;
    }
}

/** Returns true if the other square is enemy */
function isEnemy(square) {
    var piece = square.piece;

    if (piece == pieces.B_KONING 
    ||  piece == pieces.B_DAME
    ||  piece == pieces.B_LOPER
    ||  piece == pieces.B_PAARD
    ||  piece == pieces.B_PION
    ||  piece == pieces.B_TOREN) {
        return true;
    } else {
        return false;
    }
}

/**Point constructor, used for horse*/
function Point(_x, _y) {
    this.x = _x;
    this.y = _y;
}





/** Moves pieces
 *  Does nothing else
 */
function moveSquare(from, to) {
    to.piece = from.piece;
    from.piece = pieces.EMPTYFIELD;
}

/** Strikes a piece
 *  Pushes conquered pieces if needed
 */
function smackSquare(hitting, target) {
    if (isFriendly(target)) {
        enemyConqueredPieces.push(target.piece);
    }

    if (isEnemy(target)) {
        myConqueredPieces.push(target.piece);
    }
    
    updateCheckerboardSprites();
}

/** Does the checking for when a pawn reaches the other side */
function checkForPawnQueenExchange(hitting, target) {
    if (hitting.piece == pieces.A_PION) {
        if (isFriendly(hitting) && hitting.y == 2) {
            target.piece = pieces.A_DAME;
        } else if (isEnemy(hitting) && hitting.y == 7) {
            target.piece = pieces.B_DAME;
        }
    }
}

/** Checks if we have schaak on the opponent */
function checkForSchaakOnEnemy() {
    let ourMovingSquares = [];
    let enemyKing;

    let square;
    for (let x = 1; x <= 8; x++) {
        for (let y = 1; y <= 8; y++) {
            square = grid[x][y];
            if (isFriendly(square)) {
                ourMovingSquares = ourMovingSquares.concat(getPossibleSquares(square));
            }

            if (square.piece == pieces.B_KONING) {
                enemyKing = square;
            }
        }
    }
    
    for (let i = 0; i < ourMovingSquares.length; i++) {
        if (ourMovingSquares[i].piece == pieces.B_KONING) {
            return true;
        }
    }

    return false;
}