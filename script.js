const mainMenu = document.getElementById("mainMenu");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// replaced const -> let so we can create fallback elements if missing
let restartBtn = document.getElementById("restartBtn");
let homeBtn = document.getElementById("homeBtn");
const spaceShooterBtn = document.getElementById("spaceShooterBtn");
const gameContainer = document.getElementById("gameContainer");

// small debug hook for tetris button if present
const tetrisBtn = document.getElementById("tetrisBtn");
if (tetrisBtn) {
  tetrisBtn.addEventListener("click", () => {
    console.log("tetrisBtn clicked - navigating to tetris.html");
    window.location.href = "tetris.html";
  });
}

// ensure DOM elements exist (create simple fallbacks for debugging)
if (!restartBtn) {
  console.warn("restartBtn element NOT found — creating fallback");
  restartBtn = document.createElement('button');
  restartBtn.id = 'restartBtn';
  restartBtn.textContent = 'Restart';
  restartBtn.style.display = 'none';
  // append to gameContainer if present, otherwise to body
  const container = document.getElementById('gameContainer') || document.body;
  container.appendChild(restartBtn);
}
if (!homeBtn) {
  console.warn("homeBtn element NOT found — creating fallback");
  homeBtn = document.createElement('button');
  homeBtn.id = 'homeBtn';
  homeBtn.title = 'Home';
  homeBtn.innerHTML = '🏠';
  homeBtn.style.display = 'none';
  const container = document.getElementById('gameContainer') || document.body;
  container.appendChild(homeBtn);
}

console.log('restartBtn ready:', restartBtn, 'homeBtn ready:', homeBtn);

let ship = { x: 180, y: 520, width: 40, height: 20 };
let bullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let gameOver = false;
let gameRunning = false;
let lastShot = 0;
let keys = {};

// input
document.addEventListener("keydown", (e) => { keys[e.key] = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

// draw
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
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));
}

function drawEnemies() {
  ctx.fillStyle = "lime";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, 30);
}

function drawLives() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  ctx.fillText("Lives: " + lives, canvas.width - 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = "red";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

// utils
function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

// update
function update() {
  console.log("update(): lives =", lives);
  if (keys["ArrowLeft"]) ship.x = Math.max(0, ship.x - 5);
  if (keys["ArrowRight"]) ship.x = Math.min(canvas.width - ship.width, ship.x + 5);

  // shoot
  if (keys[" "] && Date.now() - lastShot > 250) {
    bullets.push({ x: ship.x + ship.width / 2 - 2, y: ship.y - 10, width: 4, height: 10 });
    lastShot = Date.now();
  }

  bullets.forEach(b => b.y -= 8);
  bullets = bullets.filter(b => b.y + b.height > 0);

  // spawn
  if (Math.random() < 0.02) {
    enemies.push({ x: Math.random() * (canvas.width - 40), y: -20, width: 40, height: 20 });
  }

  enemies.forEach(e => e.y += 2);

  // collisions: bullets -> enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (rectsOverlap(en, bullets[j])) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;
        break;
      }
    }
  }

  // enemies hit ship or bottom
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    if (rectsOverlap(en, ship) || en.y > canvas.height - en.height) {
      enemies.splice(i, 1);
      lives -= 1;
      if (lives <= 0) {
        console.log("update(): lives <= 0 — setting gameOver true");
        gameOver = true;
        // removed any immediate gameRunning = false here so the next frame can draw overlays
      }
    }
  }
}

// loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    update();
    drawShip();
    drawBullets();
    drawEnemies();
    drawScore();
    drawLives();
  } else {
    drawGameOver();
    showRestartAndHome();
    // stop animation after showing overlays so the player sees the restart button
    gameRunning = false;
  }

  if (gameRunning) requestAnimationFrame(loop);
}

// controls (fixed single handler, with guards)
if (spaceShooterBtn) {
  spaceShooterBtn.addEventListener("click", () => {
    const menu = document.getElementById("mainMenu") || mainMenu;
    const container = document.getElementById("gameContainer") || gameContainer;
    const cvs = document.getElementById("gameCanvas") || canvas;
    const context = cvs && cvs.getContext ? cvs.getContext("2d") : ctx;

    if (!menu || !container || !cvs || !context) {
      console.error('Missing mainMenu / gameContainer / canvas / context');
      return;
    }

    // If gameContainer is nested inside the menu (or another hidden ancestor),
    // move it to body so it won't be collapsed when mainMenu is hidden.
    if (menu.contains(container)) {
      document.body.appendChild(container);
    }

    // Ensure no ancestor of the container/canvas has display:none
    let el = container;
    while (el && el !== document.body) {
      if (getComputedStyle(el).display === 'none') {
        el.style.display = 'block';
        if (!el.style.width) el.style.width = '400px';
        if (!el.style.height) el.style.height = '600px';
      }
      el = el.parentElement;
    }

    // Hide menu, show container and prepare canvas
    menu.style.display = 'none';
    container.style.display = 'block';
    setupCanvasForDPR(cvs, context, 400, 600);

    // reset state and start loop
    ship = { x: 180, y: 520, width: 40, height: 20 };
    bullets = [];
    enemies = [];
    score = 0;
    lives = 3;
    lastShot = 0;
    keys = {};
    gameOver = false;
    if (restartBtn) restartBtn.style.display = 'none';
    if (homeBtn) homeBtn.style.display = 'none';
    lastTime = performance.now();
    gameRunning = true; 
    requestAnimationFrame(loop);
  });
}

restartBtn.addEventListener("click", () => {
  ship = { x: 180, y: 520, width: 40, height: 20 };
  bullets = []; enemies = []; score = 0; lives = 3; gameOver = false;
  restartBtn.style.display = "none";
  homeBtn.style.display = "none";
  gameRunning = true;
  requestAnimationFrame(loop);
});

homeBtn.addEventListener("click", () => {
  gameRunning = false;
  gameOver = false;
  restartBtn.style.display = "none";
  homeBtn.style.display = "none";
  document.getElementById("gameContainer").style.display = "none";
  mainMenu.style.display = "flex";
});

// showRestartAndHome helper (ensure it always forces visible styling)
function showRestartAndHome() {
  console.log("showRestartAndHome() called");
  if (!restartBtn) { console.error("no restartBtn"); return; }
  // ensure button is attached to body so it's not hidden by container stacking
  if (restartBtn.parentElement !== document.body) {
    document.body.appendChild(restartBtn);
  }

  restartBtn.style.display = "block";
  restartBtn.style.position = "fixed";            // FIXED so it floats above everything
  restartBtn.style.left = "50%";
  restartBtn.style.transform = "translateX(-50%)";
  restartBtn.style.bottom = "20px";
  restartBtn.style.zIndex = "2147483647";        // very high z-index
  restartBtn.style.padding = "8px 12px";
  restartBtn.style.background = "#222";
  restartBtn.style.color = "#fff";
  restartBtn.style.border = "1px solid #fff";
  restartBtn.style.cursor = "pointer";

  if (!homeBtn) { console.error("no homeBtn"); return; }
  if (homeBtn.parentElement !== document.body) {
    document.body.appendChild(homeBtn);
  }
  homeBtn.style.display = "block";
  homeBtn.style.position = "fixed";
  homeBtn.style.left = "20px";
  homeBtn.style.top = "20px";
  homeBtn.style.zIndex = "2147483647";
  homeBtn.style.background = "transparent";
  homeBtn.style.border = "none";
  homeBtn.style.color = "#fff";
}

// start a frame so the canvas border is visible even before playing
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = "rgba(200,200,200,0.25)";
ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

function setupCanvasForDPR(cvs, ctx, cssW = 400, cssH = 600) {
  // ensure element is visible at CSS size
  cvs.style.display = 'block';
  cvs.style.width = cssW + 'px';
  cvs.style.height = cssH + 'px';
  cvs.style.position = 'relative';
  cvs.style.zIndex = '1';
  // set backing store size for sharp rendering
  const dpr = window.devicePixelRatio || 1;
  cvs.width = Math.max(1, Math.floor(cssW * dpr));
  cvs.height = Math.max(1, Math.floor(cssH * dpr));
  // scale drawing operations to CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // clear to ensure no previous transparent content remains
  ctx.clearRect(0, 0, cvs.width, cvs.height);
}
