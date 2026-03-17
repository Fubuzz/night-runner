// Level Generator and Obstacles
class Obstacle {
    constructor(x, y, width, height, type = 'building') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw(ctx) {
        // Simple, clean geometric obstacles
        // Solid fill with bright outline
        ctx.fillStyle = '#ff10f0'; // Bright pink/magenta
        ctx.shadowColor = '#ff10f0';
        ctx.shadowBlur = 20;
        
        // Draw simple rectangle
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bright outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Star {
    constructor(x, y, type = 'gold') {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.collected = false;
        this.type = type;
        this.pulse = 0;
        this.points = type === 'gold' ? 10 : type === 'bonus' ? 50 : 100;
    }

    update(dt) {
        this.pulse += dt * 3;
    }

    draw(ctx) {
        if (this.collected) return;

        const scale = 1 + Math.sin(this.pulse) * 0.2;
        const color = this.type === 'gold' ? '#ffee00' : this.type === 'bonus' ? '#ff10f0' : '#00ffff';

        // Glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * scale);
        gradient.addColorStop(0, color + 'ff');
        gradient.addColorStop(0.5, color + '88');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * scale, 0, Math.PI * 2);
        ctx.fill();

        // Star shape
        ctx.fillStyle = color;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.pulse * 0.5);
        ctx.scale(scale, scale);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = Math.cos(angle) * this.radius * 0.5;
            const y = Math.sin(angle) * this.radius * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const angle2 = angle + Math.PI / 5;
            const x2 = Math.cos(angle2) * this.radius * 0.2;
            const y2 = Math.sin(angle2) * this.radius * 0.2;
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.obstacles = [];
        this.stars = [];
        this.length = 3000;
        this.generate();
    }

    generate() {
        const groundY = 500;
        let x = 600; // Start obstacles further away (was 300)

        // Generate obstacles and stars
        while (x < this.length) {
            // Add obstacle
            const height = 50 + Math.random() * 150;
            const width = 40 + Math.random() * 60;
            const obstacle = new Obstacle(x, groundY - height, width, height);
            this.obstacles.push(obstacle);

            // Add stars above/around obstacles
            const numStars = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numStars; i++) {
                const starX = x + Math.random() * width;
                const starY = groundY - height - 50 - Math.random() * 100;
                const type = Math.random() < 0.8 ? 'gold' : 'bonus';
                this.stars.push(new Star(starX, starY, type));
            }

            // Gap between obstacles
            const gap = 150 + Math.random() * 200 + (this.levelNumber * 10);
            x += width + gap;
        }

        // Add finish line star
        this.stars.push(new Star(this.length - 100, groundY - 200, 'perfect'));
    }

    update(dt) {
        this.stars.forEach(star => star.update(dt));
    }

    draw(ctx, cameraX) {
        // Draw ground with glow
        ctx.fillStyle = '#2a1b4e';
        ctx.fillRect(0, 500, ctx.canvas.width, ctx.canvas.height - 500);
        
        // Draw bright ground line with glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 500);
        ctx.lineTo(ctx.canvas.width, 500);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.x - cameraX > -100 && obstacle.x - cameraX < ctx.canvas.width + 100) {
                obstacle.draw(ctx);
            }
        });

        // Draw stars
        this.stars.forEach(star => {
            if (star.x - cameraX > -100 && star.x - cameraX < ctx.canvas.width + 100) {
                star.draw(ctx);
            }
        });

        // Draw finish line
        const finishX = this.length;
        if (finishX - cameraX > -100 && finishX - cameraX < ctx.canvas.width + 100) {
            ctx.strokeStyle = '#ffee00';
            ctx.lineWidth = 5;
            ctx.setLineDash([20, 10]);
            ctx.beginPath();
            ctx.moveTo(finishX, 0);
            ctx.lineTo(finishX, 500);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#ffee00';
            ctx.font = 'bold 24px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('FINISH', finishX, 480);
        }
    }
}
