// Minimal Tetris implementation
(() => {
  const canvas = document.getElementById('tetris');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('tScore');
  const levelEl = document.getElementById('tLevel');
  const restartBtn = document.getElementById('restartT');

  const COLS = 10, ROWS = 20, BLOCK = 30;
  canvas.width = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;

  const COLORS = ['#000', '#00f', '#0f0', '#f00', '#ff0', '#0ff', '#f0f', '#ffa500'];
  const SHAPES = [
    [[1,1,1,1]], // I
    [[2,2],[2,2]], // O
    [[0,3,0],[3,3,3]], // T
    [[0,4,4],[4,4,0]], // S
    [[5,5,0],[0,5,5]], // Z
    [[6,0,0],[6,6,6]], // J
    [[0,0,7],[7,7,7]]  // L
  ];

  function makeMatrix(cols, rows){ const m=[]; for(let y=0;y<rows;y++){ m.push(new Array(cols).fill(0)); } return m; }
  let arena = makeMatrix(COLS, ROWS);

  function drawMatrix(matrix, offset){
    for(let y=0;y<matrix.length;y++){
      for(let x=0;x<matrix[y].length;x++){
        const val = matrix[y][x];
        if(val){
          ctx.fillStyle = COLORS[val];
          ctx.fillRect((x+offset.x)*BLOCK, (y+offset.y)*BLOCK, BLOCK-1, BLOCK-1);
        }
      }
    }
  }

  function collide(arena, player){
    const m = player.matrix;
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x] && (arena[y+player.pos.y] && arena[y+player.pos.y][x+player.pos.x]) !== 0){
          return true;
        }
      }
    }
    return false;
  }

  function merge(arena, player){
    const m = player.matrix;
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x]) arena[y+player.pos.y][x+player.pos.x] = m[y][x];
      }
    }
  }

  // replace rotate + playerRotate with robust versions that work for non‑square matrices
  function rotate(matrix, dir) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const res = Array.from({ length: cols }, () => new Array(rows).fill(0));

    if (dir > 0) { // clockwise
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          res[x][rows - 1 - y] = matrix[y][x];
        }
      }
    } else { // counter-clockwise
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          res[cols - 1 - x][y] = matrix[y][x];
        }
      }
    }
    return res;
  }

  function playerRotate(dir) {
    const startX = player.pos.x;
    const newMatrix = rotate(player.matrix, dir);
    player.matrix = newMatrix;

    let offset = 1;
    // simple wall-kick: try shifting left/right until it fits, revert if impossible
    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(offset) > newMatrix[0].length) {
        // revert rotation if no valid offset found
        player.matrix = rotate(newMatrix, -dir);
        player.pos.x = startX;
        return;
      }
    }
  }

  function playerReset(){
    const id = Math.floor(Math.random()*SHAPES.length);
    player.matrix = JSON.parse(JSON.stringify(SHAPES[id]));
    player.pos.y = 0;
    player.pos.x = Math.floor((COLS - player.matrix[0].length)/2);
    if(collide(arena, player)){
      // game over
      arena = makeMatrix(COLS, ROWS);
      player.score = 0;
      player.level = 1;
      player.dropInterval = 1000;
      updateScore();
    }
  }

  function sweep(){
    let rowCount = 0;
    outer: for(let y=arena.length-1;y>=0;y--){
      for(let x=0;x<arena[y].length;x++){
        if(arena[y][x] === 0) continue outer;
      }
      const row = arena.splice(y,1)[0].fill(0);
      arena.unshift(row);
      y++; rowCount++;
    }
    if(rowCount){
      player.score += rowCount * 100 * player.level;
      player.lines += rowCount;
      if(player.lines >= player.level * 5){ player.level++; player.dropInterval = Math.max(100, player.dropInterval - 100); }
      updateScore();
    }
  }

  function playerDrop(){
    player.pos.y++;
    if(collide(arena, player)){
      player.pos.y--;
      merge(arena, player);
      sweep();
      playerReset();
    }
    dropCounter = 0;
  }

  function playerMove(dir){
    player.pos.x += dir;
    if(collide(arena, player)) player.pos.x -= dir;
  }

  function hardDrop(){
    while(!collide(arena, player)){
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    sweep();
    playerReset();
    dropCounter = 0;
  }

  function updateScore(){
    scoreEl.textContent = player.score;
    levelEl.textContent = player.level;
  }

  function draw(){
    // clear the canvas each frame to remove trails
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // board
    drawMatrix(arena, {x:0,y:0});
    // active piece
    drawMatrix(player.matrix, player.pos);
  }

  // game state
  let dropCounter = 0;
  let lastTime = 0;
  const player = { pos: {x:0,y:0}, matrix: null, score:0, level:1, lines:0, dropInterval:1000 };

  function update(time=0){
    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;
    if(dropCounter > player.dropInterval){
      playerDrop();
    }
    draw();
    if(!isPaused) requestAnimationFrame(update);
  }

  let isPaused = false;

  document.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft') playerMove(-1);
    if(e.key === 'ArrowRight') playerMove(1);
    if(e.key === 'ArrowDown') { playerDrop(); }
    if(e.key === 'ArrowUp') playerRotate(1);
    if(e.code === 'Space') { e.preventDefault(); hardDrop(); }
    if(e.key === 'p') { isPaused = !isPaused; if(!isPaused) { lastTime = performance.now(); requestAnimationFrame(update); } }
  });

  restartBtn.addEventListener('click', () => {
    arena = makeMatrix(COLS, ROWS);
    player.score = 0; player.level = 1; player.lines = 0; player.dropInterval = 1000;
    playerReset();
    updateScore();
    isPaused = false;
    lastTime = performance.now();
    requestAnimationFrame(update);
  });

  // Home button: pause and return to main menu (index.html)
  const homeBtn = document.getElementById('homeBtnT');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      // pause the tetris loop
      isPaused = true;
      // navigate back to your main menu page
      // use 'index.html' (same folder) so the Main Menu is shown
      window.location.href = 'index.html';
    });
  }

  // init
  player.score = 0;
  player.level = 1;
  player.lines = 0;
  player.dropInterval = 1000;
  playerReset();
  updateScore();
  requestAnimationFrame(update);
})();