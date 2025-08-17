const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

let ship = { x: 180, y: 550, width: 40, height: 20 };
let score = 0;
let bullets = [];
let enemies = [];
let gameOver = false;

let keys = {};

// Listen for key presses
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Draw the player ship
function drawShip() {
  ctx.save();
  ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);

  // Main body
  ctx.beginPath();
  ctx.moveTo(0, -20); // Nose
  ctx.lineTo(15, 20); // Right wing tip
  ctx.lineTo(-15, 20); // Left wing tip
  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();

  // Cockpit
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, Math.PI * 2);
  ctx.fillStyle = "cyan";
  ctx.fill();

  // Side engines
  ctx.fillStyle = "orange";
  ctx.fillRect(-15, 15, 5, 8);
  ctx.fillRect(10, 15, 5, 8);

  // Thrusters :
  ctx.beginPath();
  ctx.moveTo(-10, 23);
  ctx.lineTo(0, 30 + Math.random() * 5); // Random flicker
  ctx.lineTo(10, 23);
  ctx.fillStyle = "yellow";
  ctx.fill();

  ctx.restore();
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = "red";
  bullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 10));
}

// Draw enemies
function drawEnemies() {
  ctx.fillStyle = "lime";
  enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.width, e.height));
}

// Check collision between two rectangles
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Update game state
function update() {
  // Move ship
  if (keys["ArrowLeft"] && ship.x > 0) ship.x -= 5;
  if (keys["ArrowRight"] && ship.x < canvas.width - ship.width) ship.x += 5;

  // Shoot bullet
  if (keys[" "]) {
    if (
      bullets.length === 0 ||
      Date.now() - bullets[bullets.length - 1].time > 300
    ) {
      bullets.push({
        x: ship.x + ship.width / 2 - 2,
        y: ship.y,
        time: Date.now(),
      });
    }
  }

  // Move bullets
  bullets.forEach((b) => (b.y -= 8));
  bullets = bullets.filter((b) => b.y > 0);

  // Spawn enemies
  if (Math.random() < 0.02) {
    enemies.push({ x: Math.random() * 360, y: 0, width: 40, height: 20 });
  }

  // Move enemies
  enemies.forEach((e) => (e.y += 2));
  enemies = enemies.filter((e) => e.y < canvas.height);

  // Bullet hits enemy
for (let i = bullets.length - 1; i >= 0; i--) {
  for (let j = enemies.length - 1; j >= 0; j--) {
    if (
      bullets[i].x < enemies[j].x + enemies[j].width &&
      bullets[i].x + 4 > enemies[j].x &&
      bullets[i].y < enemies[j].y + enemies[j].height &&
      bullets[i].y + 10 > enemies[j].y
    ) {
      bullets.splice(i, 1);
      enemies.splice(j, 1);
      score += 5;
      break;
    }
  }
}

  // Enemy hits ship → GAME OVER
  for (let i = 0; i < enemies.length; i++) {
    if (checkCollision(ship, enemies[i])) {
      gameOver = true;
      break;
    }
  }
}

//Scoreboard :
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// Display "Game Over"
function drawGameOver() {
  ctx.fillStyle = "red";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

// Game loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    update();
    drawShip();
    drawBullets();
    drawEnemies();
    requestAnimationFrame(loop);
  } else {
    drawGameOver();
    restartBtn.style.display = "block";
  }
}

// Restart logic
restartBtn.addEventListener("click", () => {
  ship = { x: 180, y: 550, width: 40, height: 20 };
  bullets = [];
  enemies = [];
  gameOver = false;
  restartBtn.style.display = "none";
  loop();
});

loop();
