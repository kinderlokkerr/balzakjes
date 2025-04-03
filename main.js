// Tomb of the Mask

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


    console.log("Player image status:", playerImg);
    if (playerImg) {
        console.log("Image dimensions:", playerImg.width, "x", playerImg.height);
    } else {
        console.error("Player image not loaded");
    }

    tileSize = width / gridSize;
    bgColor = color(30, 30, 40);
    wallColor = color(70, 70, 90);
    coinColor = color(255, 255, 100);
    enemyColor = color(255, 50, 50);

    resetGame();
}

function resetGame() {
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


    for (let i = 0; i < gridSize; i++) {
        walls.push({x: i, y: 0});
        walls.push({x: i, y: gridSize-1});
        walls.push({x: 0, y: i});
        walls.push({x: gridSize-1, y: i});
    }


    for (let i = 0; i < level * 80; i++) {
        let x = floor(random(2, gridSize-2));
        let y = floor(random(2, gridSize-2));


        if (!(abs(x - player.x) <= 1 && abs(y - player.y) <= 1)) {
            walls.push({x: x, y: y});
        }
    }


    for (let i = 0; i < level * 5; i++) {
        let x, y;
        do {
            x = floor(random(1, gridSize-1));
            y = floor(random(1, gridSize-1));
        } while (isWall(x, y) || (x === player.x && y === player.y));

        coins.push({x: x, y: y, value: 10});
    }


    for (let i = 0; i < level; i++) {
        let x, y;
        do {
            x = floor(random(1, gridSize-1));
            y = floor(random(1, gridSize-1));
        } while (isWall(x, y) || (dist(x, y, player.x, player.y) < 5));

        enemies.push({
            x: x,
            y: y,
            speed: 0.01 + level * 0.1,
            dir: floor(random(4))
        });
    }
}

function draw() {
    background(bgColor);


    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            noFill();
            stroke(60);
            rect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }


    fill(wallColor);
    noStroke();
    for (let wall of walls) {
        rect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
    }


    fill(coinColor);
    for (let coin of coins) {
        ellipse(
            coin.x * tileSize + tileSize/2,
            coin.y * tileSize + tileSize/2,
            tileSize/2
        );
    }


    fill(enemyColor);
    for (let enemy of enemies) {
        ellipse(
            enemy.x * tileSize + tileSize/2,
            enemy.y * tileSize + tileSize/2,
            tileSize * 0.8
        );
    }


    if (imageLoaded && playerImg && playerImg.width > 0) {
        try {
            imageMode(CENTER);
            image(
                playerImg,
                player.x * tileSize + tileSize / 2,
                player.y * tileSize + tileSize / 2,
                tileSize * 0.8,
                tileSize * 0.8
            );
        } catch (e) {
            console.error("Error drawing player image:", e);
            drawPlayerFallback();
        }
    } else {
        drawPlayerFallback();
    }


    if (gameState === "playing") {
        updatePlayer();
        updateEnemies();
        checkCollisions();
    }


    drawUI();


    if (gameState === "gameover") {
        drawGameOver();
    } else if (gameState === "won") {
        drawWinScreen();
    }
}

function drawPlayerFallback() {
    console.log("Using fallback player drawing");
    fill(255, 215, 0);
    rect(
        player.x * tileSize + tileSize * 0.1,
        player.y * tileSize + tileSize * 0.1,
        tileSize * 0.8,
        tileSize * 0.8,
        5
    );
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
    for (let enemy of enemies) {
        let newX = enemy.x;
        let newY = enemy.y;

        if (enemy.dir === 0) newY -= enemy.speed; // Up
        else if (enemy.dir === 1) newX += enemy.speed; // Right
        else if (enemy.dir === 2) newY += enemy.speed; // Down
        else if (enemy.dir === 3) newX -= enemy.speed; // Left


        if (!isWall(floor(newX), floor(newY))) {
            enemy.x = newX;
            enemy.y = newY;
        } else {
            enemy.dir = floor(random(4));
        }
    }
}

function checkCollisions() {
    for (let i = coins.length - 1; i >= 0; i--) {
        if (dist(player.x, player.y, coins[i].x, coins[i].y) < 1) {
            score += coins[i].value;
            coins.splice(i, 1);
        }
    }

    for (let enemy of enemies) {
        if (dist(player.x, player.y, enemy.x, enemy.y) < 1) {
            gameState = "gameover";
        }
    }


    if (coins.length === 0) {
        level++;
        generateLevel();

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