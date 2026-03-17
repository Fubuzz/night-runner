// Main Game Class
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particleSystem = new ParticleSystem();
        this.ui = new UIManager(this);
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, levelComplete, gameOver
        this.currentLevel = 1;
        this.level = null;
        this.player = null;
        this.cameraX = 0;
        this.levelStars = 0;
        this.levelComplete = false;
        this.gameOver = false;
        
        // Save data
        this.saveData = this.loadSaveData();
        
        // Screen shake
        this.shakeAmount = 0;
        this.shakeTime = 0;
        
        // Initialize
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupControls();
        this.ui.showMainMenu();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupControls() {
        // Touch controls
        this.holding = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'playing') {
                audioManager.init();
                this.holding = true;
                this.player.jump(true);
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.holding = false;
            if (this.player) {
                this.player.releaseJump();
            }
        });

        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state === 'playing') {
                audioManager.init();
                this.holding = true;
                this.player.jump(true);
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.holding = false;
            if (this.player) {
                this.player.releaseJump();
            }
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'playing' && !e.repeat) {
                e.preventDefault();
                audioManager.init();
                this.holding = true;
                this.player.jump(true);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.holding = false;
                if (this.player) {
                    this.player.releaseJump();
                }
            }
        });

        // Prevent scrolling on mobile
        document.body.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    startGame() {
        audioManager.init();
        this.currentLevel = this.saveData.currentLevel;
        this.initLevel();
        this.state = 'playing';
        this.ui.showGameHUD();
    }

    initLevel() {
        this.level = new Level(this.currentLevel);
        const selectedChar = CHARACTERS.find(c => c.id === this.saveData.selectedCharacter);
        this.player = new Player(200, 300, selectedChar);
        this.cameraX = 0;
        this.levelStars = 0;
        this.levelComplete = false;
        this.gameOver = false;
        this.particleSystem.clear();
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // Update player
        this.player.update(dt);
        this.player.updateJump(dt, this.holding);

        // Update level
        this.level.update(dt);

        // Update particles
        this.particleSystem.update(dt);

        // Ground collision
        const groundY = 500;
        if (this.player.y + this.player.height >= groundY) {
            this.player.y = groundY - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;
            if (this.player.squash === 1) {
                this.player.squash = 0.8;
            }
        } else {
            this.player.grounded = false;
        }

        // Camera follow
        const targetCameraX = this.player.x - 200;
        this.cameraX += (targetCameraX - this.cameraX) * 0.1;

        // Collision with obstacles
        const playerBounds = this.player.getBounds();
        this.level.obstacles.forEach(obstacle => {
            if (this.checkCollision(playerBounds, obstacle.getBounds())) {
                if (this.player.hit()) {
                    this.handleHit();
                }
            }
        });

        // Collect stars
        this.level.stars.forEach(star => {
            if (!star.collected && this.checkCollision(playerBounds, star.getBounds())) {
                star.collected = true;
                this.levelStars += star.points;
                audioManager.playCollect(star.type === 'gold' ? 1 : star.type === 'bonus' ? 1.2 : 1.5);
                this.particleSystem.emitBurst(star.x, star.y, {
                    color: star.type === 'gold' ? '#ffee00' : star.type === 'bonus' ? '#ff10f0' : '#00ffff',
                    count: 15
                });
                this.ui.updateHUD();
            }
        });

        // Check level complete
        if (this.player.x >= this.level.length && !this.levelComplete) {
            this.completeLevel();
        }

        // Check if fell off screen (game over)
        if (this.player.y > this.canvas.height + 100 && !this.gameOver) {
            this.handleGameOver();
        }

        // Update screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeAmount = 0;
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a0b2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera and screen shake
        this.ctx.save();
        
        if (this.shakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount;
            const shakeY = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(shakeX, shakeY);
        }
        
        this.ctx.translate(-this.cameraX, 0);

        // Draw parallax background (cityscape)
        this.drawBackground();

        // Draw level
        if (this.level) {
            this.level.draw(this.ctx, this.cameraX);
        }

        // Draw player
        if (this.player) {
            this.player.draw(this.ctx, this.particleSystem);
        }

        // Draw particles
        this.particleSystem.draw(this.ctx);

        this.ctx.restore();
    }

    drawBackground() {
        const parallax = this.cameraX * 0.3;
        
        // Draw city silhouettes
        this.ctx.fillStyle = 'rgba(26, 11, 46, 0.8)';
        
        for (let i = 0; i < 10; i++) {
            const x = i * 300 - parallax;
            const height = 200 + Math.sin(i) * 100;
            this.ctx.fillRect(x, 500 - height, 250, height);
            
            // Neon windows
            this.ctx.fillStyle = Math.random() < 0.3 ? '#00ffff' : '#ff10f0';
            for (let j = 0; j < 5; j++) {
                for (let k = 0; k < 3; k++) {
                    if (Math.random() < 0.7) {
                        this.ctx.fillRect(x + 20 + k * 70, 500 - height + 20 + j * 30, 40, 20);
                    }
                }
            }
            this.ctx.fillStyle = 'rgba(26, 11, 46, 0.8)';
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    handleHit() {
        audioManager.playHit();
        this.screenShake(20, 0.3);
        this.particleSystem.emitBurst(this.player.x, this.player.y + this.player.height / 2, {
            color: '#ff0000',
            count: 20
        });
    }

    completeLevel() {
        this.levelComplete = true;
        this.state = 'levelComplete';
        audioManager.playComplete();
        
        // Calculate star rating
        const starRating = Math.min(3, Math.floor(this.levelStars / 50));
        
        // Update save data
        this.saveData.totalStars += this.levelStars;
        if (this.currentLevel === this.saveData.currentLevel && this.currentLevel < 30) {
            this.saveData.currentLevel++;
        }
        
        // Check for character unlocks
        let unlockedCharacter = null;
        CHARACTERS.forEach(char => {
            if (!this.saveData.unlockedCharacters.includes(char.id) && 
                this.saveData.totalStars >= char.unlockCost) {
                this.saveData.unlockedCharacters.push(char.id);
                unlockedCharacter = char;
            }
        });
        
        this.saveSaveData();
        
        setTimeout(() => {
            this.ui.showLevelComplete(this.levelStars, this.saveData.totalStars, unlockedCharacter);
        }, 1000);
    }

    handleGameOver() {
        this.gameOver = true;
        this.state = 'gameOver';
        setTimeout(() => {
            this.ui.showGameOver(this.levelStars);
        }, 1000);
    }

    nextLevel() {
        if (this.currentLevel < 30) {
            this.currentLevel++;
            this.initLevel();
            this.state = 'playing';
            this.ui.showGameHUD();
        } else {
            this.returnToMenu();
        }
    }

    replayLevel() {
        this.initLevel();
        this.state = 'playing';
        this.ui.showGameHUD();
    }

    returnToMenu() {
        this.state = 'menu';
        this.ui.showMainMenu();
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
        } else if (this.state === 'paused') {
            this.state = 'playing';
        }
    }

    selectCharacter(characterId) {
        this.saveData.selectedCharacter = characterId;
        this.saveSaveData();
    }

    screenShake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeTime = duration;
    }

    loadSaveData() {
        const defaultData = {
            currentLevel: 1,
            totalStars: 0,
            unlockedCharacters: ['neon-runner'],
            selectedCharacter: 'neon-runner'
        };
        
        try {
            const saved = localStorage.getItem('nightRunnerSave');
            if (saved) {
                return { ...defaultData, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load save data');
        }
        
        return defaultData;
    }

    saveSaveData() {
        try {
            localStorage.setItem('nightRunnerSave', JSON.stringify(this.saveData));
        } catch (e) {
            console.warn('Could not save data');
        }
    }

    gameLoop() {
        const currentTime = performance.now();
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});
