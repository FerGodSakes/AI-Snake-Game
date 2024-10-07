// Game constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GRID_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;
const FOOD_VALUE = 1;
const COLLISION_PENALTY = 3;

// Game variables
let canvas, ctx;
let player1, player2;
let food;
let gameLoop;
let isPaused = false;
let gameSpeed = 5;
let gameMode = 'humanVsComputer';

// Initialize game
function init() {
    console.log('Initializing game...');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Initialize players based on game mode
    if (gameMode === 'humanVsComputer') {
        player1 = createSnake(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'green', 'right', 'Human');
        player2 = createSnake(3 * CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'red', 'left', 'AI');
    } else {
        player1 = createSnake(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'green', 'right', 'AI Green');
        player2 = createSnake(3 * CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'red', 'left', 'AI Red');
    }

    console.log('Player 1 initial state:', player1);
    console.log('Player 2 initial state:', player2);

    // Set up event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    document.getElementById('speedSlider').addEventListener('input', updateGameSpeed);
    document.getElementById('gameModeSelect').addEventListener('change', changeGameMode);

    console.log('Event listeners set up');

    // Start the game
    startGame();
}

// Create snake object
function createSnake(x, y, color, direction, name) {
    const snake = {
        body: [],
        color: color,
        direction: direction,
        score: 0,
        name: name
    };

    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.body.push({ x: x - i * GRID_SIZE, y: y });
    }

    return snake;
}

// Start game
function startGame() {
    console.log('Starting game...');
    // Reset snake positions and scores
    resetSnake(player1);
    resetSnake(player2);
    player1.score = 0;
    player2.score = 0;

    // Create new food
    createFood();

    // Clear any existing game loop
    clearInterval(gameLoop);

    // Start game loop
    startGameLoop();
}

// Create food at random position
function createFood() {
    food = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE
    };
    console.log('New food created at:', food);
}

// Handle keyboard input
function handleKeyPress(e) {
    console.log('Key pressed:', e.key);
    if (gameMode === 'humanVsComputer') {
        switch (e.key) {
            case 'ArrowUp':
                if (player1.direction !== 'down') player1.direction = 'up';
                break;
            case 'ArrowDown':
                if (player1.direction !== 'up') player1.direction = 'down';
                break;
            case 'ArrowLeft':
                if (player1.direction !== 'right') player1.direction = 'left';
                break;
            case 'ArrowRight':
                if (player1.direction !== 'left') player1.direction = 'right';
                break;
        }
    }
}

// Start game loop
function startGameLoop() {
    console.log('Starting game loop');
    gameLoop = setInterval(update, 1000 / gameSpeed);
}

// Update game state
function update() {
    console.log('Updating game state');
    if (isPaused) return;

    console.log(`Player 1 position: ${JSON.stringify(player1.body[0])}`);
    console.log(`Player 2 position: ${JSON.stringify(player2.body[0])}`);
    console.log(`Food position: ${JSON.stringify(food)}`);

    moveSnake(player1);
    moveSnake(player2);

    if (gameMode === 'humanVsComputer') {
        updateAI(player2);
    } else {
        updateAI(player1);
        updateAI(player2);
    }

    checkCollisions(player1);
    checkCollisions(player2);

    if (player1.score < 0 || player2.score < 0) {
        endGame();
    }

    draw();
}

// Move snake
function moveSnake(snake) {
    console.log(`Moving ${snake.name}`);
    const head = { x: snake.body[0].x, y: snake.body[0].y };

    switch (snake.direction) {
        case 'up': head.y -= GRID_SIZE; break;
        case 'down': head.y += GRID_SIZE; break;
        case 'left': head.x -= GRID_SIZE; break;
        case 'right': head.x += GRID_SIZE; break;
    }

    snake.body.unshift(head);

    // Debug log
    console.log(`Snake head at (${head.x}, ${head.y}), food at (${food.x}, ${food.y})`);

    // More forgiving collision detection
    if (Math.abs(head.x - food.x) < GRID_SIZE && Math.abs(head.y - food.y) < GRID_SIZE) {
        console.log(`${snake.name} is eating food at (${food.x}, ${food.y})`);
        snake.score += FOOD_VALUE;
        console.log(`${snake.name} ate food. New score: ${snake.score}`);
        snake.body.push({}); // Add a new segment to make the snake grow
        createFood(); // Create new food immediately
        gameSpeed = Math.min(gameSpeed + 0.5, 10);
        clearInterval(gameLoop);
        startGameLoop();
        console.log(`${snake.name} grew. New length: ${snake.body.length}`);
    } else {
        snake.body.pop(); // Remove last segment only if food wasn't eaten
    }
}

// Update AI player
function updateAI(aiSnake) {
    const head = aiSnake.body[0];
    console.log(`AI ${aiSnake.name} current position: (${head.x}, ${head.y}), food at: (${food.x}, ${food.y})`);

    const dx = food.x - head.x;
    const dy = food.y - head.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        aiSnake.direction = dx > 0 ? 'right' : 'left';
    } else {
        aiSnake.direction = dy > 0 ? 'down' : 'up';
    }

    console.log(`AI ${aiSnake.name} chose direction: ${aiSnake.direction}`);

    // Ensure AI movement
    const nextHead = getNextPosition(aiSnake);
    if (!isCollision(nextHead, aiSnake)) {
        aiSnake.body.unshift(nextHead);
        aiSnake.body.pop();
    } else {
        console.log(`AI ${aiSnake.name} avoided collision, choosing new direction`);
        // Implement simple collision avoidance
        const safeDirections = ['up', 'down', 'left', 'right'].filter(dir => {
            const testHead = getNextPosition(aiSnake, dir);
            return !isCollision(testHead, aiSnake);
        });
        if (safeDirections.length > 0) {
            aiSnake.direction = safeDirections[Math.floor(Math.random() * safeDirections.length)];
        }
    }
}

// Helper function to get next position
function getNextPosition(snake, dir = snake.direction) {
    const head = snake.body[0];
    const nextHead = { x: head.x, y: head.y };
    switch (dir) {
        case 'up': nextHead.y -= GRID_SIZE; break;
        case 'down': nextHead.y += GRID_SIZE; break;
        case 'left': nextHead.x -= GRID_SIZE; break;
        case 'right': nextHead.x += GRID_SIZE; break;
    }
    return nextHead;
}

// Check for collisions
function checkCollisions(snake) {
    console.log(`Checking collisions for ${snake.name}`);
    const head = snake.body[0];

    // Wall collision
    if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
        snake.score = Math.max(0, snake.score - COLLISION_PENALTY);
        console.log(`${snake.name} hit wall. New score:`, snake.score);
        resetSnake(snake);
    }

    // Self collision
    for (let i = 1; i < snake.body.length; i++) {
        if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
            snake.score = Math.max(0, snake.score - COLLISION_PENALTY);
            console.log(`${snake.name} hit itself. New score:`, snake.score);
            resetSnake(snake);
            break;
        }
    }

    // Other snake collision
    const otherSnake = snake === player1 ? player2 : player1;
    for (const segment of otherSnake.body) {
        if (head.x === segment.x && head.y === segment.y) {
            snake.score = Math.max(0, snake.score - COLLISION_PENALTY);
            console.log(`${snake.name} hit other snake. New score:`, snake.score);
            resetSnake(snake);
            break;
        }
    }
}

// Reset snake position
function resetSnake(snake) {
    const startX = snake === player1 ? CANVAS_WIDTH / 4 : 3 * CANVAS_WIDTH / 4;
    const startY = CANVAS_HEIGHT / 2;
    snake.body = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.body.push({ x: startX - i * GRID_SIZE, y: startY });
    }
    snake.direction = snake === player1 ? 'right' : 'left';
    console.log(`${snake.name} reset. New position:`, snake.body[0]);
}

// Check if a position collides with a snake
function isCollision(position, snake) {
    if (position.x < 0 || position.x >= CANVAS_WIDTH || position.y < 0 || position.y >= CANVAS_HEIGHT) {
        return true;
    }

    for (const segment of snake.body) {
        if (position.x === segment.x && position.y === segment.y) {
            return true;
        }
    }

    const otherSnake = snake === player1 ? player2 : player1;
    for (const segment of otherSnake.body) {
        if (position.x === segment.x && position.y === segment.y) {
            return true;
        }
    }

    return false;
}

// Draw game state
function draw() {
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw snakes
    drawSnake(player1);
    drawSnake(player2);

    // Draw food
    ctx.fillStyle = 'blue';
    ctx.fillRect(food.x, food.y, GRID_SIZE, GRID_SIZE);

    // Update scores
    if (gameMode === 'computerVsComputer') {
        document.getElementById('player1-score').innerHTML = `<span style="color: green;">AI Green</span>: ${player1.score}`;
        document.getElementById('player2-score').innerHTML = `<span style="color: red;">AI Red</span>: ${player2.score}`;
    } else {
        document.getElementById('player1-score').innerHTML = `${player1.name}: ${player1.score}`;
        document.getElementById('player2-score').innerHTML = `${player2.name}: ${player2.score}`;
    }
}

// Draw snake
function drawSnake(snake) {
    ctx.fillStyle = snake.color;
    for (let i = 0; i < snake.body.length; i++) {
        const segment = snake.body[i];
        if (i === 0) {
            // Draw the head
            ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        } else {
            // Draw the body segments with a slight size reduction for visual effect
            ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    }
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
    console.log('Game paused:', isPaused);
}

// Restart game
function restartGame() {
    console.log('Restarting game...');
    clearInterval(gameLoop);
    startGame();
    document.getElementById('game-over').classList.add('hidden');
}

// Update game speed
function updateGameSpeed() {
    gameSpeed = document.getElementById('speedSlider').value;
    console.log('Game speed updated:', gameSpeed);
    clearInterval(gameLoop);
    startGameLoop();
}

// Change game mode
function changeGameMode() {
    gameMode = document.getElementById('gameModeSelect').value;
    console.log('Game mode changed to:', gameMode);
    restartGame();
}

// End game
function endGame() {
    clearInterval(gameLoop);
    const winner = player1.score > player2.score ? player1.name : player2.name;
    console.log('Game over. Winner:', winner);
    document.getElementById('winner').innerHTML = `${winner} wins!`;
    document.getElementById('game-over').classList.remove('hidden');
}

// Start the game
document.addEventListener('DOMContentLoaded', init);
