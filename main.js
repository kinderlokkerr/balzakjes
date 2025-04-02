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
let imageLoaded = false;

function preload() {
    playerImg = loadImage(
        'player.png',
        () => {
            console.log("Player image loaded successfully");
            imageLoaded = true;
        },
        () => {
            console.error("Failed to load player image");
            imageLoaded = false;
        }
    );
}

function setup() {
    createCanvas(600, 600);

    // Debug image loading
    console.log("Player image status:", playerImg);
    if (playerImg) {
        console.log("Image dimensions:", playerImg.width, "x", playerImg.height);
    } else {
        console.error("Player image not loaded");
    }

    tileSize = width / gridSize;
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

function generateMaze(x, y) {
    maze[y][x] = 0; // Mark current cell as path

    // Shuffle directions
    let dirs = shuffleArray([...directions]);

    for (let dir of dirs) {
        let nx = x + dir.x;
        let ny = y + dir.y;

        if (nx > 0 && nx < gridSize-1 && ny > 0 && ny < gridSize-1 && maze[ny][nx] === 1) {
            // Carve path
            maze[y + dir.y/2][x + dir.x/2] = 0;
            generateMaze(nx, ny);
        }
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateCoins() {
    coins = [];
    let pathCells = [];

    // Find all path cells
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (maze[y][x] === 0 && !(x === player.x && y === player.y)) {
                pathCells.push({x: x, y: y});
            }
        }
    }

    // Place coins along the path
    let coinCount = min(level * 5, floor(pathCells.length * 0.3));
    for (let i = 0; i < coinCount; i++) {
        let index = floor(random(pathCells.length));
        let pos = pathCells.splice(index, 1)[0];
        coins.push({x: pos.x, y: pos.y, value: 10});
    }
}

function generateEnemies() {
    enemies = [];
    let pathCells = [];

    // Find path cells far from player
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (maze[y][x] === 0 && dist(x, y, player.x, player.y) > 10) {
                pathCells.push({x: x, y: y});
            }
        }
    }

    // Place enemies
    let enemyCount = min(level, floor(pathCells.length * 0.1));
    for (let i = 0; i < enemyCount; i++) {
        let index = floor(random(pathCells.length));
        let pos = pathCells.splice(index, 1)[0];
        enemies.push({
            x: pos.x,
            y: pos.y,
            speed: 0.2 + level * 0.05,
            dir: floor(random(4))
        });
    }
}

function draw() {
    background(bgColor);

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
    if (playerImg && playerImg.width > 0) {
        imageMode(CENTER);
        image(
            playerImg,
            player.x * tileSize + tileSize/2,
            player.y * tileSize + tileSize/2,
            tileSize * 0.8,
            tileSize * 0.8
        );
    } else {
        fill(255, 215, 0);
        rect(
            player.x * tileSize + tileSize * 0.1,
            player.y * tileSize + tileSize * 0.1,
            tileSize * 0.8,
            tileSize * 0.8,
            5
        );
    }

    // Update game state
    if (gameState === "playing") {
        updatePlayer();
        updateEnemies();
        checkCollisions();
    }

    // Draw UI
    drawUI();

    // Game states
    if (gameState === "gameover") drawGameOver();
    if (gameState === "won") drawWinScreen();
}
function drawPlayerFallback() {
    console.log("Using fallback player drawing");
    fill(255, 215, 0); // Gold color
    rect(
        player.x * tileSize + tileSize * 0.1,
        player.y * tileSize + tileSize * 0.1,
        tileSize * 0.8,
        tileSize * 0.8,
        5
    );
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

    // Restart instructions
    textSize(18);
    text("Press R to restart", width/2, height/2 + 60);
}