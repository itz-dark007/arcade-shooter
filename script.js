const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

let ship = { x: 180, y: 550, width: 40, height: 20 };
let score = 0;
let bullets = [];
let enemies = [];
let gameOver = false;

let keys = {};


document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});


function drawShip() {
  ctx.save();
  ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);

  
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(15, 20);
  ctx.lineTo(-15, 20);
  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();

  
  ctx.beginPath();
  ctx.arc(0, -10, 5, 0, Math.PI * 2);
  ctx.fillStyle = "cyan";
  ctx.fill();

  
  ctx.fillStyle = "orange";
  ctx.fillRect(-15, 15, 5, 8);
  ctx.fillRect(10, 15, 5, 8);

  
  ctx.beginPath();
  ctx.moveTo(-10, 23);
  ctx.lineTo(0, 30 + Math.random() * 5); // Random flicker
  ctx.lineTo(10, 23);
  ctx.fillStyle = "yellow";
  ctx.fill();

  ctx.restore();
}


function drawBullets() {
  ctx.fillStyle = "red";
  bullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 10));
}


function drawEnemies() {
  ctx.fillStyle = "lime";
  enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.width, e.height));
}


function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update() {
  
  if (keys["ArrowLeft"] && ship.x > 0) ship.x -= 5;
  if (keys["ArrowRight"] && ship.x < canvas.width - ship.width) ship.x += 5;

  
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

  
  bullets.forEach((b) => (b.y -= 8));
  bullets = bullets.filter((b) => b.y > 0);

  
  if (Math.random() < 0.02) {
    enemies.push({ x: Math.random() * 360, y: 0, width: 40, height: 20 });
  }

  
  enemies.forEach((e) => (e.y += 2));
  enemies = enemies.filter((e) => e.y < canvas.height);

  
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

  
  for (let i = 0; i < enemies.length; i++) {
    if (checkCollision(ship, enemies[i])) {
      gameOver = true;
      break;
    }
  }
}


function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}


function drawGameOver() {
  ctx.fillStyle = "red";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}


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


restartBtn.addEventListener("click", () => {
  ship = { x: 180, y: 550, width: 40, height: 20 };
  bullets = [];
  enemies = [];
  gameOver = false;
  restartBtn.style.display = "none";
  loop();
});

loop();

