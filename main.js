// Tomb of the Mask Inspired Game
// p5.js code for beginners with some advanced elements

// Tomb of the Mask with Debugging
let player;
let gridSize = 21; // Moet oneven zijn voor goed doolhof
let tileSize;
let coins = [];
let enemies = [];
let walls = [];
let level = 1;
let score = 0;
let gameState = "playing";
let playerImg;
let debugMessage = "Game initializing...";

// Kleuren
const colors = {
    bg: [30, 30, 40],
    wall: [70, 70, 90],
    coin: [255, 255, 100],
    enemy: [255, 50, 50],
    player: [255, 215, 0]
};

function preload() {
    try {
        playerImg = loadImage('player.png',
            () => debugMessage = "Image loaded successfully",
            () => debugMessage = "Error loading image"
        );
    } catch (e) {
        debugMessage = "Preload error: " + e;
    }
}

function setup() {
    createCanvas(600, 600);
    tileSize = width / gridSize;

    // Debug console
    console.log("Setup started");
    console.log("Image status:", playerImg);

    resetGame();
    debugMessage = "Game ready - Use arrow keys";
}

function resetGame() {
    try {
        // Initialize maze
        walls = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (x === 0 || y === 0 || x === gridSize-1 || y === gridSize-1 ||
                    (x % 2 === 0 && y % 2 === 0)) {
                    walls.push({x, y});
                }
            }
        }

        // Simple starting pattern for debugging
        walls = walls.filter(w =>
            !(w.x === 1 && w.y === 1) &&
            !(w.x === 2 && w.y === 1) &&
            !(w.x === 1 && w.y === 2)
        );

        player = {
            x: 1,
            y: 1,
            speed: 1,
            moveDir: {x: 0, y: 0}
        };

        // Eenvoudige testcoins
        coins = [{x: 3, y: 1, value: 10}];
        enemies = [];

        gameState = "playing";
        debugMessage = "Level reset";
    } catch (e) {
        debugMessage = "Reset error: " + e;
    }
}

function draw() {
    try {
        // Eenvoudige achtergrond
        background(colors.bg);

        // Teken muren
        fill(colors.wall);
        walls.forEach(w => rect(w.x * tileSize, w.y * tileSize, tileSize, tileSize));

        // Teken munten
        fill(colors.coin);
        coins.forEach(c => ellipse(
            c.x * tileSize + tileSize/2,
            c.y * tileSize + tileSize/2,
            tileSize/2
        ));

        // Teken speler
        if (playerImg && playerImg.width > 0) {
            imageMode(CENTER);
            image(playerImg,
                player.x * tileSize + tileSize/2,
                player.y * tileSize + tileSize/2,
                tileSize * 0.8,
                tileSize * 0.8
            );
        } else {
            fill(colors.player);
            rect(
                player.x * tileSize + tileSize * 0.1,
                player.y * tileSize + tileSize * 0.1,
                tileSize * 0.8,
                tileSize * 0.8,
                5
            );
        }

        // Debug info
        fill(255);
        textSize(12);
        text(debugMessage, 10, 20);
        text(`Player: ${player.x},${player.y}`, 10, 40);
        text(`State: ${gameState}`, 10, 60);

    } catch (e) {
        debugMessage = "Draw error: " + e;
        console.error("Draw error:", e);
    }
}

function keyPressed() {
    if (keyCode === UP_ARROW) player.moveDir = {x: 0, y: -1};
    else if (keyCode === RIGHT_ARROW) player.moveDir = {x: 1, y: 0};
    else if (keyCode === DOWN_ARROW) player.moveDir = {x: 0, y: 1};
    else if (keyCode === LEFT_ARROW) player.moveDir = {x: -1, y: 0};
    return false;
}

function updatePlayer() {
    if (frameCount % 10 === 0) { // Vertraagde beweging
        const newX = player.x + player.moveDir.x;
        const newY = player.y + player.moveDir.y;

        if (!walls.some(w => w.x === newX && w.y === newY)) {
            player.x = newX;
            player.y = newY;
            debugMessage = `Moving to ${newX},${newY}`;
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

    // Restart instructions
    textSize(18);
    text("Press R to restart", width/2, height/2 + 60);
}