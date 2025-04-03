// Tomb of the Mask - Met Volledige Muurcontrole
let player;
const gridSize = 20; // Oneven getal voor beter doolhof
let tileSize;
let coins = [];
let enemies = [];
let walls = [];
let level = 1;
let score = 0;
let gameState = "playing";
let playerImg;

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
}

function resetGame() {
    // Initialize maze grid (1 = wall, 0 = path)
    let maze = Array(gridSize).fill().map(() => Array(gridSize).fill(1));

    // Zorg voor een basispad
    createMainPath(maze);

    // Voeg willekeurige muren toe (inclusief buitenrand)
    addRandomWalls(maze);

    // Convert maze to walls
    walls = [];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (maze[y][x] === 1) {
                walls.push({x, y});
            }
        }
    }

    // Player start position (garandeer vrije start)
    player = {
        x: 1,
        y: 1,
        moveDir: {x: 0, y: 0},
        lastMove: 0,
        moveDelay: 100
    };

    generateCoins(maze);
    generateEnemies(maze);
    gameState = "playing";
}

function createMainPath(maze) {
    // Recursive backtracker voor hoofdpad
    let stack = [{x:1, y:1}];
    maze[1][1] = 0;

    const dirs = [{x:0,y:-2},{x:2,y:0},{x:0,y:2},{x:-2,y:0}];

    while (stack.length > 0) {
        let current = stack[stack.length-1];
        let neighbors = [];

        for (let dir of dirs) {
            let nx = current.x + dir.x;
            let ny = current.y + dir.y;

            if (nx > 0 && nx < gridSize-1 && ny > 0 && ny < gridSize-1 && maze[ny][nx] === 1) {
                neighbors.push({x:nx, y:ny, dir:dir});
            }
        }

        if (neighbors.length > 0) {
            let next = random(neighbors);
            maze[current.y + next.dir.y/2][current.x + next.dir.x/2] = 0;
            maze[next.y][next.x] = 0;
            stack.push({x:next.x, y:next.y});
        } else {
            stack.pop();
        }
    }
}

function addRandomWalls(maze) {
    // Voeg willekeurige muren toe (inclusief buitenrand)
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            // 30% kans op muur, behalve waar al paden zijn
            if (maze[y][x] === 1 && random() < 0.3) {
                // Zorg dat we geen geïsoleerde gebieden maken
                let openNeighbors = 0;
                if (x > 0 && maze[y][x-1] === 0) openNeighbors++;
                if (x < gridSize-1 && maze[y][x+1] === 0) openNeighbors++;
                if (y > 0 && maze[y-1][x] === 0) openNeighbors++;
                if (y < gridSize-1 && maze[y+1][x] === 0) openNeighbors++;

                if (openNeighbors < 3) { // Max 2 open buren
                    maze[y][x] = 1;
                }
            }
        }
    }

    // Buitenrand altijd dicht (maar niet alle cellen)
    for (let i = 0; i < gridSize; i++) {
        if (random() < 0.7) maze[0][i] = 1; // Bovenkant
        if (random() < 0.7) maze[gridSize-1][i] = 1; // Onderkant
        if (random() < 0.7) maze[i][0] = 1; // Linkerkant
        if (random() < 0.7) maze[i][gridSize-1] = 1; // Rechterkant
    }
}

function generateCoins(maze) {
    coins = [];
    const pathCells = [];

    // Verzamel alle pad cellen
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (maze[y][x] === 0 && !(x === player.x && y === player.y)) {
                pathCells.push({x, y});
            }
        }
    }

    // Plaats munten
    const coinCount = min(level * 5, floor(pathCells.length * 0.3));
    for (let i = 0; i < coinCount; i++) {
        const index = floor(random(pathCells.length));
        const pos = pathCells.splice(index, 1)[0];
        coins.push({x: pos.x, y: pos.y, value: 10});
    }
}

function generateEnemies(maze) {
    enemies = [];
    const pathCells = [];

    // Verzamel pad cellen ver van speler
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (maze[y][x] === 0 && dist(x, y, player.x, player.y) > 5) {
                pathCells.push({x, y});
            }
        }
    }

    // Plaats vijanden
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
            moveDelay: 500
        });
    }
}

function draw() {
    background(bgColor);

    // Teken grid
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            noFill();
            stroke(60);
            rect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    // Teken muren
    fill(wallColor);
    noStroke();
    for (let wall of walls) {
        rect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
    }

    // Teken munten
    fill(coinColor);
    for (let coin of coins) {
        ellipse(
            coin.x * tileSize + tileSize/2,
            coin.y * tileSize + tileSize/2,
            tileSize/2
        );
    }

    // Teken vijanden (kleiner gemaakt)
    fill(enemyColor);
    for (let enemy of enemies) {
        ellipse(
            enemy.x * tileSize + tileSize/2,
            enemy.y * tileSize + tileSize/2,
            tileSize * 0.6 // Verkleind van 0.8 naar 0.6
        );
    }

    // Teken speler
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

    // Update spelstatus
    if (gameState === "playing") {
        updatePlayer();
        updateEnemies();
        checkCollisions();
    }

    drawUI();

    if (gameState === "gameover") drawGameOver();
    if (gameState === "won") drawWinScreen();
}

function updatePlayer() {
    if (millis() - player.lastMove > player.moveDelay) {
        let newX = player.x + player.moveDir.x;
        let newY = player.y + player.moveDir.y;

        if (!isWall(newX, newY)) {
            player.x = newX;
            player.y = newY;
            player.lastMove = millis();
        } else {
            player.moveDir = {x: 0, y: 0};
        }
    }
}

function updateEnemies() {
    const now = millis();
    const directions = [
        {x: 0, y: -1}, // Omhoog
        {x: 1, y: 0},  // Rechts
        {x: 0, y: 1},  // Omlaag
        {x: -1, y: 0}  // Links
    ];

    for (let enemy of enemies) {
        if (now - enemy.lastMove > enemy.moveDelay) {
            // Probeer huidige richting eerst
            let newDir = directions[enemy.dir];
            let newX = enemy.x + newDir.x;
            let newY = enemy.y + newDir.y;

            // Als geblokkeerd, zoek een nieuwe richting
            if (isWall(newX, newY)) {
                const possibleDirs = [];
                for (let i = 0; i < directions.length; i++) {
                    const testX = enemy.x + directions[i].x;
                    const testY = enemy.y + directions[i].y;
                    if (!isWall(testX, testY)) {
                        possibleDirs.push(i);
                    }
                }

                if (possibleDirs.length > 0) {
                    const randomIndex = floor(random(possibleDirs.length));
                    enemy.dir = possibleDirs[randomIndex];
                    newDir = directions[enemy.dir];
                    newX = enemy.x + newDir.x;
                    newY = enemy.y + newDir.y;
                } else {
                    continue; // Kan niet bewegen
                }
            }

            // Controleer of nieuwe positie geldig is
            if (!isWall(newX, newY)) {
                enemy.x = newX;
                enemy.y = newY;
                enemy.lastMove = now;
            }
        }
    }
}

function checkCollisions() {
    // Check munten
    for (let i = coins.length - 1; i >= 0; i--) {
        if (dist(player.x, player.y, coins[i].x, coins[i].y) < 0.7) {
            score += coins[i].value;
            coins.splice(i, 1);
        }
    }

    // Check vijanden (aangepaste collision distance)
    for (let enemy of enemies) {
        if (dist(player.x, player.y, enemy.x, enemy.y) < 0.7) {
            gameState = "gameover";
        }
    }

    // Check level voltooiing
    if (coins.length === 0) {
        level++;
        if (level > 5) {
            gameState = "won";
        } else {
            generateLevel();
        }
    }
}

function isWall(x, y) {
    // Snellere implementatie met array.some
    return walls.some(wall => wall.x === floor(x) && wall.y === floor(y));
}

function keyPressed() {
    if (keyCode === UP_ARROW) {
        player.moveDir = {x: 0, y: -1};
    } else if (keyCode === RIGHT_ARROW) {
        player.moveDir = {x: 1, y: 0};
    } else if (keyCode === DOWN_ARROW) {
        player.moveDir = {x: 0, y: 1};
    } else if (keyCode === LEFT_ARROW) {
        player.moveDir = {x: -1, y: 0};
    } else if (key === 'r' || key === 'R') {

        level = 1;
        score = 0;
        resetGame();
    }

    return false;
}

function drawUI() {

    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);


    textAlign(RIGHT, TOP);
    text(`Level: ${level}/5`, width - 10, 10);


    textSize(14);
    textAlign(LEFT, BOTTOM);
    text("Arrow keys to move", 10, height - 10);
}

function drawGameOver() {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);


    fill(255, 50, 50);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 40);


    fill(255);
    textSize(24);
    text(`Final Score: ${score}`, width/2, height/2 + 20);


    textSize(18);
    text("Press R to restart", width/2, height/2 + 60);
}

function drawWinScreen() {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    fill(50, 255, 50);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("YOU WON!", width/2, height/2 - 40);

    fill(255);
    textSize(24);
    text(`Final Score: ${score}`, width/2, height/2 + 20);

    textSize(18);
    text("Press R to restart", width/2, height/2 + 60);
}
