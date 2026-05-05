export function generateConfetti(config, canvasId = "vanillaConfettiCanvas") {
    const canvas = document.querySelector(`#${canvasId}`);

    if (canvas === null) {
        return console.error(`Canvas with id "${canvasId}" not found.`);
    }

    const ctx = canvas.getContext("2d");
    const particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function drawParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        ctx.scale(1, Math.cos((p.rotation * Math.PI) / 180));
        ctx.fillStyle = p.color;

        if (p.shape === 0) {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(-p.size / 2, p.size / 2);
            ctx.lineTo(p.size / 2, p.size / 2);
            ctx.lineTo(p.size / 4, -p.size / 2);
            ctx.lineTo(-p.size / 4, -p.size / 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    (function init() {
        for (let i = 0; i < config.quantity; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * (config.maxSize - config.minSize) + config.minSize,
                color: config.colorsArray[Math.floor(Math.random() * config.colorsArray.length)],
                velocityX: Math.random() * 2 - 1,
                velocityY: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                shape: Math.floor(Math.random() * 3),
                depth: Math.random() * 3
            });
        }
    })();

    (function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let p of particles) {
            p.velocityY += config.velocity;
            p.x += Math.sin(p.y / 30) * 0.5; // Oscillation latérale
            p.rotation += p.rotationSpeed;
            p.x += p.velocityX;
            p.y += p.velocityY;

            if (p.y > canvas.height) {
                if (config.infiniteLoop === true) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                    p.velocityY = Math.random() * 3 + 2;
                } else {
                    particles.splice(particles.indexOf(p), 1);
                }
            }

            ctx.globalAlpha = (1 - p.depth / 3) * config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity);

            drawParticle(p);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(update);
    })();
}