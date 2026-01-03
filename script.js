const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const birdElement = document.getElementById('bird-entity');

const pipeImg = new Image();
pipeImg.src = 'slab.png';

const bgMusic = new Audio('gbmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;

const dieSound = new Audio('out.mp3');

let bird, pipes, score;
let highScore = localStorage.getItem('flappyHighScore') || 0; 
let isGameOver = false;
let isGameRunning = false;
let frameCount = 0;

let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

let GRAVITY = 0.4;
let FLAP_STRENGTH = -8;
let PIPE_SPEED = 3;
let PIPE_SPAWN_RATE = 120; 

const scoreText = document.getElementById('score-text');
const highScoreText = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');
const startInstruction = document.getElementById('start-instruction');
const gameTitle = document.getElementById('game-title');

highScoreText.innerText = highScore;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(canvas.height > 800) {
        GRAVITY = 0.5;
        FLAP_STRENGTH = -9;
    } else {
        GRAVITY = 0.4;
        FLAP_STRENGTH = -7;
    }
}
window.addEventListener('resize', resize);
resize();

function init() {
    bird = {
        x: canvas.width / 4,
        y: canvas.height / 2,
        width: 50, 
        height: 40,
        velocity: 0,
        rotation: 0
    };
    
    pipes = [];
    score = 0;
    frameCount = 0;
    isGameOver = false;
    
    scoreText.innerText = score;
    restartBtn.classList.add('hidden');
    gameTitle.classList.add('hidden');
    birdElement.style.display = 'block';
    
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Interaction needed for audio"));
    
    loop(0);
}

function loop(timestamp) {
    if (isGameOver) return;
    const deltaTime = timestamp - lastTime;
    if (deltaTime >= frameInterval) {
        lastTime = timestamp - (deltaTime % frameInterval);
        update();
        draw();
    }
    requestAnimationFrame(loop);
}

function update() {
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.1)));

    if (frameCount % PIPE_SPAWN_RATE === 0) {
        const gap = 170; 
        const minPipeHeight = 50;
        const maxPipeHeight = canvas.height - gap - minPipeHeight;
        const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight);

        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            gap: gap,
            passed: false
        });
    }

    for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        pipe.x -= PIPE_SPEED;

        if (
            bird.x < pipe.x + 80 && 
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > pipe.topHeight + pipe.gap)
        ) {
            gameOver();
        }

        if (pipe.x + 80 < bird.x && !pipe.passed) {
            score++;
            scoreText.innerText = score;
            pipe.passed = true;
        }

        if (pipe.x + 80 < 0) {
            pipes.shift();
            i--;
        }
    }

    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver();
    }

    frameCount++;
}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        ctx.save(); 
        ctx.translate(p.x, p.topHeight);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImg, 0, 0, 80, p.topHeight);
        ctx.restore();
        const bottomY = p.topHeight + p.gap;
        ctx.drawImage(pipeImg, p.x, bottomY, 80, canvas.height - bottomY);
    }

    birdElement.style.left = bird.x + 'px';
    birdElement.style.top = bird.y + 'px';
    birdElement.style.transform = `rotate(${bird.rotation}rad)`;
}

function flap() {
    if (!isGameRunning) {
        isGameRunning = true;
        startInstruction.classList.add('hidden');
        init();
        bird.velocity = FLAP_STRENGTH;
    } else if (!isGameOver) {
        bird.velocity = FLAP_STRENGTH;
    }
}

function gameOver() {
    isGameOver = true;
    isGameRunning = false;
    bgMusic.pause();
    dieSound.play();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        highScoreText.innerText = highScore;
    }

    gameTitle.innerText = "Game Over";
    gameTitle.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    startInstruction.innerText = "";
}

function resetGame() {
    gameTitle.classList.add('hidden');
    restartBtn.classList.add('hidden');
    startInstruction.innerText = "Click to Start";
    startInstruction.classList.remove('hidden');
    birdElement.style.display = 'none'; 
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') flap();
});
window.addEventListener('mousedown', flap);
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
}, {passive: false});