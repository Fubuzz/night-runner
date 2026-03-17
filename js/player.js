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
        this.jumpSpeed = -550; // Initial jump velocity
        this.gravity = 1600; // Gravity when rising
        this.fallGravity = 2400; // Faster fall gravity (feels snappier)
        this.maxFallSpeed = 800;
        this.character = character;
        this.squash = 1;
        this.invincible = false;
        this.invincibleTime = 0;
        this.glowPulse = 0;
        this.isJumping = false;
        this.jumpHeldTime = 0;
        this.maxJumpHoldTime = 0.2; // Can hold jump for 0.2 seconds
        this.jumpCutMultiplier = 0.5; // When released early, cut jump speed
        this.health = 3;
        this.maxHealth = 3;
        this.coyoteTime = 0.1; // Grace period after leaving ground
        this.coyoteCounter = 0;
        this.jumpBufferTime = 0.1; // Can press jump slightly before landing
        this.jumpBufferCounter = 0;
    }

    jump() {
        // Can jump if grounded OR within coyote time
        if (this.grounded || this.coyoteCounter > 0) {
            this.vy = this.jumpSpeed;
            this.grounded = false;
            this.squash = 0.7;
            this.isJumping = true;
            this.jumpHeldTime = 0;
            this.coyoteCounter = 0; // Use up coyote time
            this.jumpBufferCounter = 0; // Clear jump buffer
            audioManager.playJump();
            return true;
        } else {
            // Buffer the jump input
            this.jumpBufferCounter = this.jumpBufferTime;
            return false;
        }
    }
    
    updateJump(dt, holding) {
        // If holding jump and still rising and within hold time
        if (this.isJumping && holding && this.vy < 0 && this.jumpHeldTime < this.maxJumpHoldTime) {
            this.jumpHeldTime += dt;
            // Use normal gravity while holding
            this.vy += this.gravity * dt;
        } else {
            // Not holding anymore or past max hold time
            if (this.vy < 0) {
                // Still going up but not holding - apply stronger gravity (short jump)
                this.vy += this.fallGravity * dt;
            } else {
                // Falling - use fall gravity
                this.vy += this.fallGravity * dt;
            }
            this.isJumping = false;
        }
    }
    
    releaseJump() {
        // When player releases jump early, cut the upward velocity
        if (this.isJumping && this.vy < 0) {
            this.vy *= this.jumpCutMultiplier;
        }
        this.isJumping = false;
    }

    update(dt) {
        // Update position (auto-run)
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Cap fall speed
        if (this.vy > this.maxFallSpeed) {
            this.vy = this.maxFallSpeed;
        }
        
        // Update coyote time (grace period after leaving ground)
        if (this.grounded) {
            this.coyoteCounter = this.coyoteTime;
        } else {
            this.coyoteCounter -= dt;
        }
        
        // Update jump buffer
        if (this.jumpBufferCounter > 0) {
            this.jumpBufferCounter -= dt;
            // Auto-jump if we land during buffer time
            if (this.grounded) {
                this.jump();
            }
        }

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
        if (!this.invincible && this.health > 0) {
            this.health--;
            this.invincible = true;
            this.invincibleTime = 1.5;
            return true;
        }
        return false;
    }
    
    isDead() {
        return this.health <= 0;
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
