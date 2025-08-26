const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let ship = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5
};

let bullets = [];
let enemies = [];
let keys = {};
let gameOver = false;
let score = 0;

document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space" && !gameOver) {
        bullets.push({ x: ship.x + ship.width / 2 - 2.5, y: ship.y, width: 5, height: 10 });
    }
});
document.addEventListener("keyup", (e) => keys[e.code] = false);

function drawShip() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y); 
    ctx.lineTo(ship.x, ship.y + ship.height); 
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height); 
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(ship.x + ship.width / 2, ship.y - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(ship.x + 10, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width - 10, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width - 15, ship.y + ship.height + 10);
    ctx.lineTo(ship.x + 15, ship.y + ship.height + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "orange";
    ctx.fillRect(ship.x - 5, ship.y + ship.height - 10, 8, 12);
    ctx.fillRect(ship.x + ship.width - 3, ship.y + ship.height - 10, 8, 12);
}

function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach((bullet, index) => {
        bullet.y -= 7;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        if (bullet.y < 0) bullets.splice(index, 1);
    });
}

function drawEnemies() {
    ctx.fillStyle = "red";
    enemies.forEach((enemy, eIndex) => {
        enemy.y += 2;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Collision with ship → Game Over
        if (enemy.x < ship.x + ship.width &&
            enemy.x + enemy.width > ship.x &&
            enemy.y < ship.y + ship.height &&
            enemy.y + enemy.height > ship.y) {
            gameOver = true;
        }

        // Bullet collision
        bullets.forEach((bullet, bIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10; // add to score
            }
        });

        // Enemy goes off screen → remove
        if (enemy.y > canvas.height) {
            enemies.splice(eIndex, 1);
        }
    });
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
}

function spawnEnemies() {
    if (Math.random() < 0.02) {
        enemies.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30
        });
    }
}

function restartGame() {
    gameOver = false;
    enemies = [];
    bullets = [];
    score = 0;
    ship.x = canvas.width / 2 - 20;
    ship.y = canvas.height - 60;
    gameLoop();
}

function drawGameOver() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2 - 40);

    let restartBtn = document.createElement("button");
    restartBtn.innerText = "Restart";
    restartBtn.style.position = "absolute";
    restartBtn.style.left = canvas.offsetLeft + canvas.width / 2 - 50 + "px";
    restartBtn.style.top = canvas.offsetTop + canvas.height / 2 + "px";
    restartBtn.style.padding = "10px 20px";
    restartBtn.style.fontSize = "18px";
    document.body.appendChild(restartBtn);

    restartBtn.onclick = () => {
        restartBtn.remove();
        restartGame();
    };
}

function gameLoop() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (keys["ArrowLeft"] && ship.x > 0) ship.x -= ship.speed;
    if (keys["ArrowRight"] && ship.x + ship.width < canvas.width) ship.x += ship.speed;

    drawShip();
    drawBullets();
    drawEnemies();
    drawScore();
    spawnEnemies();

    requestAnimationFrame(gameLoop);
}

gameLoop();

