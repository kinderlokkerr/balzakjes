// Tomb of the Mask - Verbeterde Versie
let player;
let gridSize = 20;
let tileSize;
let coins = [];
let enemies = [];
let walls = [];
let level = 1;
let score = 0;
let gameState = "playing";
let playerImg;
let bgColor, wallColor, coinColor, enemyColor;

function preload() {
    playerImg = loadImage('player.png');
}

function setup() {
    createCanvas(600, 600);
    tileSize = width / gridSize;
    bgColor = color(30, 30, 40);
    wallColor = color(70, 70, 90);
    coinColor = color(255, 255, 100);
    enemyColor = color(255, 50, 50);
    resetGame();
}

function resetGame() {
    // Player start positie
    player = {
        x: Math.floor(gridSize / 2),
        y: Math.floor(gridSize / 2),
        speed: 5,
        moveDir: {x: 0, y: 0},
        lastMove: 0,
        moveDelay: 50
    };

    generateLevel();
    gameState = "playing";
}

function generateLevel() {
    walls = [];
    coins = [];
    enemies = [];

    // Buitenmuren
    for (let i = 0; i < gridSize; i++) {
        walls.push({x: i, y: 0});
        walls.push({x: i, y: gridSize-1});
        walls.push({x: 0, y: i});
        walls.push({x: gridSize-1, y: i});
    }

    // Willekeurige binnenmuren
    for (let i = 0; i < level * 80; i++) {
        let x = floor(random(2, gridSize-2));
        let y = floor(random(2, gridSize-2));

        if (!(abs(x - player.x) <= 1 && abs(y - player.y) <= 1)) {
            walls.push({x: x, y: y});
        }
    }

    // Munten
    for (let i = 0; i < level * 5; i++) {
        let x, y;
        do {
            x = floor(random(1, gridSize-1));
            y = floor(random(1, gridSize-1));
        } while (isWall(x, y) || (x === player.x && y === player.y));

        coins.push({x: x, y: y, value: 10});
    }

    // Vijanden - verbeterde plaatsing
    for (let i = 0; i < level; i++) {
        let x, y;
        let attempts = 0;
        do {
            x = floor(random(1, gridSize-1));
            y = floor(random(1, gridSize-1));
            attempts++;
            // Stop na 100 pogingen om oneindige lus te voorkomen
            if (attempts > 100) break;
        } while (isWall(x, y) || (dist(x, y, player.x, player.y) < 5));

        enemies.push({
            x: x,
            y: y,
            speed: 0.1 + level * 0.05, // Langzamere start
            dir: floor(random(4)),
            lastMove: 0,
            moveDelay: 250 // Vertraging tussen bewegingen
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

