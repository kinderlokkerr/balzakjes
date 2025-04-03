// Tomb of the Mask - Final Version
let player;
const gridSize = 21; // Oneven getal voor proper maze
let tileSize;
let coins = [];
let enemies = [];
let walls = [];
let level = 1;
let score = 0;
let gameState = "playing";
let playerImg;
let maze = [];

// Kleuren
const colors = {
    bg: [30, 30, 40],
    wall: [70, 70, 90],
    coin: [255, 255, 100],
    enemy: [255, 50, 50],
    player: [255, 215, 0],
    text: [255, 255, 255]
};

function preload() {
    playerImg = loadImage('player.png');
}

function setup() {
    createCanvas(600, 600);
    tileSize = width / gridSize;
    resetGame();
    frameRate(60);
}

function resetGame() {
    // Initialize maze grid (1 = wall, 0 = path)
    maze = Array(gridSize).fill().map(() => Array(gridSize).fill(1));

    // Generate maze starting from center
    generateMaze(1, 1);

    // Convert maze to walls (behoud buitenmuren)
    walls = [];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (maze[y][x] === 1 || x === 0 || y === 0 || x === gridSize-1 || y === gridSize-1) {
                walls.push({x, y});
            }
        }
    }

    // Player start position
    player = {
        x: 1,
        y: 1,
        moveDir: {x: 0, y: 0},
        lastMove: 0,
        moveDelay: 150
    };

    generateCoins();
    generateEnemies();
    gameState = "playing";
}

function generateMaze(x, y) {
    maze[y][x] = 0;

    const dirs = shuffleArray([
        {x: 0, y: -2}, // Up
        {x: 2, y: 0},  // Right
        {x: 0, y: 2},  // Down
        {x: -2, y: 0}   // Left
    ]);

    for (let dir of dirs) {
        const nx = x + dir.x;
        const ny = y + dir.y;

        if (nx > 0 && nx < gridSize-1 && ny > 0 && ny < gridSize-1 && maze[ny][nx] === 1) {
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
    const pathCells = [];

    for (let y = 1; y < gridSize-1; y++) {
        for (let x = 1; x < gridSize-1; x++) {
            if (maze[y][x] === 0 && !(x === player.x && y === player.y)) {
                pathCells.push({x, y});
            }
        }
    }

    const coinCount = min(level * 5, floor(pathCells.length * 0.3));
    for (let i = 0; i < coinCount; i++) {
        const index = floor(random(pathCells.length));
        const pos = pathCells.splice(index, 1)[0];
        coins.push({x: pos.x, y: pos.y, value: 10});
    }
}

function generateEnemies() {
    enemies = [];
    const pathCells = [];

    for (let y = 1; y < gridSize-1; y++) {
        for (let x = 1; x < gridSize-1; x++) {
            if (maze[y][x] === 0 && dist(x, y, player.x, player.y) > 5) {
                pathCells.push({x, y});
            }
        }
    }

    const enemyCount = min(level, 5);
    for (let i = 0; i < enemyCount; i++) {
        const index = floor(random(pathCells.length));
        const pos = pathCells.splice(index, 1)[0];
        enemies.push({
            x: pos.x,
            y: pos.y,
            speed: 0.2 + level * 0.05,
            dir: floor(random(4)),
            lastMove: 0,
            moveDelay: 800 - (level * 50)
        });
    }
}

function draw() {
    background(colors.bg);

    // Draw walls
    fill(colors.wall);
    noStroke();
    walls.forEach(w => rect(w.x * tileSize, w.y * tileSize, tileSize, tileSize));

    // Draw coins
    fill(colors.coin);
    coins.forEach(c => ellipse(
        c.x * tileSize + tileSize/2,
        c.y * tileSize + tileSize/2,
        tileSize/2
    ));

    // Draw enemies (kleiner gemaakt)
    fill(colors.enemy);
    enemies.forEach(e => ellipse(
        e.x * tileSize + tileSize/2,
        e.y * tileSize + tileSize/2,
        tileSize * 0.6 // Verkleind van 0.8 naar 0.6
    ));

    // Draw player
    drawPlayer();

    if (gameState === "playing") {
        updatePlayer();
        updateEnemies();
        checkCollisions();
    }

    drawUI();
    if (gameState === "gameover") drawGameOver();
    if (gameState === "won") drawWinScreen();
}

function drawPlayer() {
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
}

function updatePlayer() {
    if (millis() - player.lastMove > player.moveDelay) {
        const newX = player.x + player.moveDir.x;
        const newY = player.y + player.moveDir.y;

        if (!walls.some(w => w.x === newX && w.y === newY)) {
            player.x = newX;
            player.y = newY;
            player.lastMove = millis();
        }
    }
}

function updateEnemies() {
    const now = millis();
    enemies.forEach(enemy => {
        if (now - enemy.lastMove > enemy.moveDelay) {
            const directions = [
                {x: 0, y: -1}, // Up
                {x: 1, y: 0},  // Right
                {x: 0, y: 1},  // Down
                {x: -1, y: 0}   // Left
            ];

            // Probeer huidige richting
            let newDir = directions[enemy.dir];
            let newX = enemy.x + newDir.x;
            let newY = enemy.y + newDir.y;

            // Als geblokkeerd, zoek een nieuwe richting
            if (walls.some(w => w.x === newX && w.y === newY)) {
                const possibleDirs = [];
                for (let dir of directions) {
                    const testX = enemy.x + dir.x;
                    const testY = enemy.y + dir.y;
                    if (!walls.some(w => w.x === testX && w.y === testY)) {
                        possibleDirs.push(dir);
                    }
                }

                if (possibleDirs.length > 0) {
                    newDir = possibleDirs[floor(random(possibleDirs.length))];
                    enemy.dir = directions.findIndex(d => d.x === newDir.x && d.y === newDir.y);
                    newX = enemy.x + newDir.x;
                    newY = enemy.y + newDir.y;
                } else {
                    return; // Kan niet bewegen
                }
            }

            // Controleer of nieuwe positie geldig is
            if (!walls.some(w => w.x === newX && w.y === newY)) {
                enemy.x = newX;
                enemy.y = newY;
                enemy.lastMove = now;
            }
        }
    });
}

function checkCollisions() {
    // Check coins
    for (let i = coins.length - 1; i >= 0; i--) {
        if (dist(player.x, player.y, coins[i].x, coins[i].y) < 0.5) {
            score += coins[i].value;
            coins.splice(i, 1);
        }
    }

    // Check enemies
    for (let enemy of enemies) {
        if (dist(player.x, player.y, enemy.x, enemy.y) < 0.7) {
            gameState = "gameover";
        }
    }

    // Check level completion
    if (coins.length === 0) {
        level++;
        if (level > 5) {
            gameState = "won";
        } else {
            resetGame();
        }
    }
}

function drawUI() {
    fill(colors.text);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);
    textAlign(RIGHT, TOP);
    text(`Level: ${level}/5`, width - 10, 10);
}

function drawGameOver() {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 20);
    textSize(16);
    text("Press R to restart", width/2, height/2 + 20);
}

function drawWinScreen() {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    fill(50, 255, 50);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("YOU WON!", width/2, height/2 - 20);
    textSize(16);
    text(`Final Score: ${score}`, width/2, height/2 + 20);
    text("Press R to restart", width/2, height/2 + 50);
}

function keyPressed() {
    if (gameState !== "playing") {
        if (key === 'r' || key === 'R') {
            level = 1;
            score = 0;
            resetGame();
        }
        return;
    }

    if (keyCode === UP_ARROW) player.moveDir = {x: 0, y: -1};
    else if (keyCode === RIGHT_ARROW) player.moveDir = {x: 1, y: 0};
    else if (keyCode === DOWN_ARROW) player.moveDir = {x: 0, y: 1};
    else if (keyCode === LEFT_ARROW) player.moveDir = {x: -1, y: 0};
    else if (key === 'r' || key === 'R') {
        level = 1;
        score = 0;
        resetGame();
    }
    return false;
}