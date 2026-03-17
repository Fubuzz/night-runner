// Particle System
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 500 * dt; // gravity
        this.life -= dt;
        this.alpha = this.life / this.maxLife;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        const {
            color = '#00ffff',
            minSpeed = 100,
            maxSpeed = 300,
            minSize = 2,
            maxSize = 6,
            life = 0.5,
            spread = Math.PI * 2
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = (spread / count) * i + (Math.random() - 0.5) * 0.5;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 200; // bias upward
            const size = minSize + Math.random() * (maxSize - minSize);
            
            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }

    emitBurst(x, y, options = {}) {
        this.emit(x, y, 20, options);
    }

    emitTrail(x, y, options = {}) {
        this.emit(x, y, 3, {
            ...options,
            minSpeed: 0,
            maxSpeed: 50,
            life: 0.3
        });
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}
