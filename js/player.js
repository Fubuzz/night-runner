// Player Character
class Player {
    constructor(x, y, character) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.vx = 300; // Auto-run speed
        this.vy = 0;
        this.grounded = false;
        this.jumpPower = -600;
        this.highJumpPower = -900; // Higher jump when holding
        this.gravity = 1800;
        this.maxFallSpeed = 800;
        this.character = character;
        this.squash = 1;
        this.invincible = false;
        this.invincibleTime = 0;
        this.glowPulse = 0;
        this.jumping = false;
        this.jumpTime = 0;
        this.maxJumpTime = 0.3;
    }

    jump(holding = false) {
        if (this.grounded) {
            this.vy = this.jumpPower;
            this.grounded = false;
            this.squash = 0.7;
            this.jumping = true;
            this.jumpTime = 0;
            audioManager.playJump();
        }
    }
    
    updateJump(dt, holding) {
        // Variable jump height - hold for higher jump
        if (this.jumping && holding && this.jumpTime < this.maxJumpTime) {
            this.vy = this.highJumpPower;
            this.jumpTime += dt;
        } else {
            this.jumping = false;
        }
    }
    
    releaseJump() {
        this.jumping = false;
    }

    update(dt) {
        // Apply gravity
        if (!this.grounded) {
            this.vy += this.gravity * dt;
            if (this.vy > this.maxFallSpeed) {
                this.vy = this.maxFallSpeed;
            }
        }

        // Update position (auto-run)
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Squash animation
        if (this.squash < 1) {
            this.squash += dt * 5;
            if (this.squash > 1) this.squash = 1;
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTime -= dt;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Glow pulse
        this.glowPulse += dt * 3;
    }

    draw(ctx, particleSystem) {
        ctx.save();
        
        // Draw trail particles
        if (Math.random() < 0.3) {
            particleSystem.emitTrail(this.x, this.y + this.height / 2, {
                color: this.character.color,
                minSize: 2,
                maxSize: 4
            });
        }

        // Draw glow
        const glowSize = 20 + Math.sin(this.glowPulse) * 5;
        const gradient = ctx.createRadialGradient(
            this.x, this.y + this.height / 2, 0,
            this.x, this.y + this.height / 2, glowSize
        );
        gradient.addColorStop(0, this.character.color + 'aa');
        gradient.addColorStop(0.5, this.character.color + '44');
        gradient.addColorStop(1, this.character.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.height / 2, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Invincibility flicker
        if (this.invincible && Math.floor(this.invincibleTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw character (squashed)
        const scaleY = this.squash;
        const scaleX = 2 - this.squash; // inverse squash on width
        
        ctx.translate(this.x, this.y + this.height / 2);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-this.x, -(this.y + this.height / 2));

        // Draw body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw colored outline
        ctx.strokeStyle = this.character.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    hit() {
        if (!this.invincible) {
            this.invincible = true;
            this.invincibleTime = 1.5;
            return true;
        }
        return false;
    }
}

// Character definitions
const CHARACTERS = [
    {
        id: 'neon-runner',
        name: 'Neon Runner',
        color: '#00ffff',
        unlockCost: 0,
        description: 'The original runner'
    },
    {
        id: 'cyber-ninja',
        name: 'Cyber Ninja',
        color: '#ff10f0',
        unlockCost: 100,
        description: 'Leaves a trail'
    },
    {
        id: 'star-chaser',
        name: 'Star Chaser',
        color: '#ffee00',
        unlockCost: 250,
        description: 'Magnet effect'
    },
    {
        id: 'shadow-dash',
        name: 'Shadow Dash',
        color: '#ff0000',
        unlockCost: 500,
        description: 'Speed boost'
    },
    {
        id: 'galaxy-glider',
        name: 'Galaxy Glider',
        color: '#00ff00',
        unlockCost: 750,
        description: 'Double jump'
    }
];
