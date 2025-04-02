// Tomb of the Mask Inspired Game
// p5.js code for beginners with some advanced elements

let player;
let gridSize = 20;
let tileSize;
let coins = [];
let enemies = [];
let walls = [];
let level = 1;
let score = 0;
let gameState = "playing"; // can be "playing", "won", "gameover"
let playerImg;
let bgColor;
let wallColor;
let coinColor;
let enemyColor;

function preload () {
    PlayerImage= loadImage('/MacintoshHD/users/finnmeddens/player.png');
}


function setup() {
    createCanvas(600, 600);
    tileSize = width / gridSize;
   // playerColor = color(255, 215, 0); // Gold
    bgColor = color(30, 30, 40); // Dark blue-gray
    wallColor = color(70, 70, 90); // Gray-blue
    coinColor = color(255, 255, 100); // Light yellow
    enemyColor = color(255, 50, 50); // Red

    resetGame();
}


function resetGame() {
    // Create player at center
    player = {
        x: Math.floor(gridSize / 2),
        y: Math.floor(gridSize / 2),
        speed: 10,
        moveDir: {x: 0, y: 0},
        lastMove: 0,
        moveDelay: 25 // milliseconds between moves
    };

    // Generate level
    generateLevel();

    // Reset game state
    gameState = "playing";
}

function generateLevel() {
    // Clear previous level
    walls = [];
    coins = [];
    enemies = [];

    // Create border walls
    for (let i = 0; i < gridSize; i++) {
        walls.push({x: i, y: 0});
        walls.push({x: i, y: gridSize-1});
        walls.push({x: 0, y: i});
        walls.push({x: gridSize-1, y: i});
    }

    // Add random walls
    for (let i = 0; i < level * 50; i++) {
        let x = floor(random(2, gridSize-2));
        let y = floor(random(2, gridSize-2));

        // Don't place walls on player or next to player
        if (!(abs(x - player.x) <= 1 && abs(y - player.y) <= 1)) {
            walls.push({x: x, y: y});
        }
    }

    // Add coins
    for (let i = 0; i < level * 5; i++) {
        let x, y;
        do {
            x = floor(random(1, gridSize-1));
            y = floor(random(1, gridSize-1));
        } while (isWall(x, y) || (x === player.x && y === player.y));

        coins.push({x: x, y: y, value: 10});
    }

    // Add enemies
    for (let i = 0; i < level; i++) {
        let x, y;
        do {
            x = floor(random(1, gridSize-1));
            y = floor(random(1, gridSize-1));
        } while (isWall(x, y) || (dist(x, y, player.x, player.y) < 5));

        enemies.push({
            x: x,
            y: y,
            speed: 0.25 + level * 0.1,
            dir: floor(random(4)) // 0: up, 1: right, 2: down, 3: left
        });
    }
}

function draw() {
    background(bgColor);

    // Draw grid
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            // Draw subtle grid lines
            noFill();
            stroke(60);
            rect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    // Draw walls
    fill(wallColor);
    noStroke();
    for (let wall of walls) {
        rect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
    }

    // Draw coins
    fill(coinColor);
    for (let coin of coins) {
        ellipse(
            coin.x * tileSize + tileSize/2,
            coin.y * tileSize + tileSize/2,
            tileSize/2
        );
    }

    // Draw enemies
    fill(enemyColor);
    for (let enemy of enemies) {
        ellipse(
            enemy.x * tileSize + tileSize/2,
            enemy.y * tileSize + tileSize/2,
            tileSize * 0.8
        );
    }

    // Draw player
    fill(playerColor);
    if (playerImg) {
        imageMode(CENTER);
        image(
            playerImg,
            player.x * tileSize + tileSize / 2,
            player.y * tileSize + tileSize / 2,
            tileSize * 0.8,
            tileSize * 0.8
        );
    }

    // Update and move entities
    if (gameState === "playing") {
        updatePlayer();
        updateEnemies();
        checkCollisions();
    }

    // Draw UI
    drawUI();

    // Game over or win screens
    if (gameState === "gameover") {
        drawGameOver();
    } else if (gameState === "won") {
        drawWinScreen();
    }
}

function updatePlayer() {
    // Continuous movement when key is held
    if (millis() - player.lastMove > player.moveDelay) {
        let newX = player.x + player.moveDir.x;
        let newY = player.y + player.moveDir.y;

        if (!isWall(newX, newY)) {
            player.x = newX;
            player.y = newY;
            player.lastMove = millis();
        } else {
            // Stop when hitting a wall
            player.moveDir = {x: 0, y: 0};
        }
    }
}

function updateEnemies() {
    for (let enemy of enemies) {
        // Simple AI: move in current direction until hitting a wall, then change direction
        let newX = enemy.x;
        let newY = enemy.y;

        // Calculate movement based on direction
        if (enemy.dir === 0) newY -= enemy.speed; // Up
        else if (enemy.dir === 1) newX += enemy.speed; // Right
        else if (enemy.dir === 2) newY += enemy.speed; // Down
        else if (enemy.dir === 3) newX -= enemy.speed; // Left

        // Check if new position is valid (not a wall)
        if (!isWall(floor(newX), floor(newY))) {
            enemy.x = newX;
            enemy.y = newY;
        } else {
            // Change direction when hitting a wall
            enemy.dir = floor(random(4));
        }
    }
}

function checkCollisions() {
    // Check coin collection
    for (let i = coins.length - 1; i >= 0; i--) {
        if (dist(player.x, player.y, coins[i].x, coins[i].y) < 1) {
            score += coins[i].value;
            coins.splice(i, 1);
        }
    }

    // Check enemy collisions
    for (let enemy of enemies) {
        if (dist(player.x, player.y, enemy.x, enemy.y) < 1) {
            gameState = "gameover";
        }
    }

    // Check if level is complete (all coins collected)
    if (coins.length === 0) {
        level++;
        generateLevel();

        // Win condition
        if (level > 5) {
            gameState = "won";
        }
    }
}

function isWall(x, y) {
    for (let wall of walls) {
        if (wall.x === floor(x) && wall.y === floor(y)) {
            return true;
        }
    }
    return false;
}

function keyPressed() {
    // Set movement direction based on arrow keys
    if (keyCode === UP_ARROW) {
        player.moveDir = {x: 0, y: -1};
    } else if (keyCode === RIGHT_ARROW) {
        player.moveDir = {x: 1, y: 0};
    } else if (keyCode === DOWN_ARROW) {
        player.moveDir = {x: 0, y: 1};
    } else if (keyCode === LEFT_ARROW) {
        player.moveDir = {x: -1, y: 0};
    } else if (key === 'r' || key === 'R') {
        // Reset game
        level = 1;
        score = 0;
        resetGame();
    }

    // Prevent default behavior
    return false;
}

function drawUI() {
    // Score display
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);

    // Level display
    textAlign(RIGHT, TOP);
    text(`Level: ${level}/5`, width - 10, 10);

    // Instructions
    textSize(14);
    textAlign(LEFT, BOTTOM);
    text("Arrow keys to move", 10, height - 10);
}

function drawGameOver() {
    // Dark overlay
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    // Game over text
    fill(255, 50, 50);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 40);

    // Score
    fill(255);
    textSize(24);
    text(`Final Score: ${score}`, width/2, height/2 + 20);

    // Restart instructions
    textSize(18);
    text("Press R to restart", width/2, height/2 + 60);
}

function drawWinScreen() {
    // Dark overlay
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    // Win text
    fill(50, 255, 50);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("YOU WON!", width/2, height/2 - 40);

    // Score
    fill(255);
    textSize(24);
    text(`Final Score: ${score}`, width/2, height/2 + 20);

    // Restart instructions bluh  bluh
    textSize(18);
    text("Press R to restart", width/2, height/2 + 60);
}