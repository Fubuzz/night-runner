// UI Manager
class UIManager {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main menu
        document.getElementById('play-btn').addEventListener('click', () => {
            audioManager.playClick();
            
            // Show tutorial on first play
            if (!localStorage.getItem('nightRunnerTutorialSeen')) {
                this.showTutorial();
            } else {
                this.game.startGame();
            }
        });
        
        // Tutorial
        document.getElementById('start-tutorial-btn').addEventListener('click', () => {
            audioManager.playClick();
            localStorage.setItem('nightRunnerTutorialSeen', 'true');
            this.game.startGame();
        });

        document.getElementById('character-select-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.showCharacterSelect();
        });

        document.getElementById('back-from-characters-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.showMainMenu();
        });

        // Level complete
        document.getElementById('next-level-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.game.nextLevel();
        });

        document.getElementById('replay-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.game.replayLevel();
        });

        // Game over
        document.getElementById('retry-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.game.replayLevel();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.game.returnToMenu();
        });

        // Pause
        document.getElementById('pause-btn').addEventListener('click', () => {
            audioManager.playClick();
            this.game.togglePause();
        });
    }

    showMainMenu() {
        this.hideAll();
        document.getElementById('main-menu').style.display = 'block';
        this.updateMainMenuStats();
    }
    
    showTutorial() {
        this.hideAll();
        document.getElementById('tutorial-overlay').style.display = 'flex';
    }

    showCharacterSelect() {
        this.hideAll();
        document.getElementById('character-select-menu').style.display = 'block';
        this.renderCharacterGrid();
    }

    showGameHUD() {
        this.hideAll();
        document.getElementById('game-hud').style.display = 'block';
        this.updateHUD();
    }

    showLevelComplete(stars, totalStars, unlockedCharacter) {
        this.hideAll();
        document.getElementById('level-complete-menu').style.display = 'block';
        
        // Render stars
        const starsEarned = document.getElementById('stars-earned');
        starsEarned.innerHTML = '';
        const maxStars = 3;
        for (let i = 0; i < maxStars; i++) {
            const star = document.createElement('span');
            star.className = i < Math.min(stars, 3) ? 'star' : 'star empty';
            star.textContent = '⭐';
            star.style.animationDelay = `${i * 0.2}s`;
            starsEarned.appendChild(star);
        }
        
        document.getElementById('level-stars').textContent = stars;
        document.getElementById('level-total-stars').textContent = totalStars;
        
        // Show unlock notification if applicable
        const unlockNotif = document.getElementById('unlock-notification');
        if (unlockedCharacter) {
            unlockNotif.style.display = 'block';
            unlockNotif.querySelector('p').textContent = `🎉 ${unlockedCharacter.name} Unlocked!`;
        } else {
            unlockNotif.style.display = 'none';
        }
        
        // Show/hide next level button
        const nextBtn = document.getElementById('next-level-btn');
        if (this.game.currentLevel < 30) {
            nextBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'none';
        }
    }

    showGameOver(stars) {
        this.hideAll();
        document.getElementById('game-over-menu').style.display = 'block';
        document.getElementById('gameover-stars').textContent = stars;
    }

    hideAll() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('character-select-menu').style.display = 'none';
        document.getElementById('level-complete-menu').style.display = 'none';
        document.getElementById('game-over-menu').style.display = 'none';
        document.getElementById('game-hud').style.display = 'none';
        document.getElementById('tutorial-overlay').style.display = 'none';
    }

    updateMainMenuStats() {
        const totalStars = this.game.saveData.totalStars;
        const currentLevel = this.game.saveData.currentLevel;
        
        document.getElementById('total-stars').textContent = totalStars;
        document.getElementById('current-level-display').textContent = currentLevel;
    }

    updateHUD() {
        document.getElementById('hud-stars').textContent = this.game.levelStars;
        document.getElementById('hud-level').textContent = this.game.currentLevel;
        
        // Update health display
        if (this.game.player) {
            const hearts = '❤️'.repeat(this.game.player.health) + '🖤'.repeat(this.game.player.maxHealth - this.game.player.health);
            document.getElementById('hud-health').textContent = hearts;
        }
    }

    renderCharacterGrid() {
        const grid = document.getElementById('character-grid');
        grid.innerHTML = '';
        
        CHARACTERS.forEach((char, index) => {
            const card = document.createElement('div');
            const unlocked = this.game.saveData.unlockedCharacters.includes(char.id);
            const selected = this.game.saveData.selectedCharacter === char.id;
            
            card.className = 'character-card';
            if (unlocked) {
                card.classList.add('unlocked');
                if (selected) card.classList.add('selected');
            } else {
                card.classList.add('locked');
            }
            
            const name = document.createElement('div');
            name.className = 'character-name';
            name.textContent = char.name;
            name.style.color = char.color;
            card.appendChild(name);
            
            if (!unlocked) {
                const req = document.createElement('div');
                req.className = 'character-requirement';
                req.textContent = `🔒 ${char.unlockCost} stars`;
                card.appendChild(req);
            } else {
                const desc = document.createElement('div');
                desc.className = 'character-requirement';
                desc.textContent = char.description;
                card.appendChild(desc);
            }
            
            if (unlocked) {
                card.addEventListener('click', () => {
                    audioManager.playClick();
                    this.game.selectCharacter(char.id);
                    this.renderCharacterGrid();
                });
            }
            
            grid.appendChild(card);
        });
    }
}
