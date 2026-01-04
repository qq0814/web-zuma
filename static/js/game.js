// 游戏主类 - 修复版（速度减慢）
class ZumaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 游戏状态
        this.gameId = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.gameOver = false;

        // 游戏元素
        this.balls = [];
        this.chain = [];
        this.shooter = {x: this.width/2, y: this.height-50, angle: Math.PI/2};
        this.currentBall = null;
        this.nextBall = null;

        // 游戏参数 - 降低初始速度
        this.colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22'];
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.timer = 0;
        this.chainSpeed = 0.5; // 降低初始速度
        this.chainPosition = 0;

        // 时间控制
        this.lastTime = 0;
        this.deltaTime = 0;

        // 轨道路径（贝塞尔曲线）
        this.path = this.createPath();

        // 游戏控制
        this.animationId = null;

        // 绑定事件
        this.bindEvents();

        // 初始化
        this.init();
    }

    // 初始化游戏
    init() {
        // 显示玩家姓名输入模态框
        document.getElementById('name-modal').style.display = 'flex';

        // 创建初始球链
        this.createChain();

        // 设置下一个球
        this.nextBall = this.createBall();
        this.updateNextBallDisplay();

        // 加载当前球
        this.loadCurrentBall();
    }

    // 创建轨道路径
    createPath() {
        return {
            start: {x: 50, y: 100},
            cp1: {x: 200, y: 50},
            cp2: {x: 400, y: 150},
            end: {x: 750, y: 100},
            cp3: {x: 600, y: 300},
            cp4: {x: 300, y: 250},
            final: {x: 100, y: 500}
        };
    }

    // 根据t值计算路径上的点
    getPathPoint(t) {
        let point;
        if (t < 0.5) {
            let t2 = t * 2;
            point = {
                x: Math.pow(1-t2, 3) * this.path.start.x +
                    3 * Math.pow(1-t2, 2) * t2 * this.path.cp1.x +
                    3 * (1-t2) * Math.pow(t2, 2) * this.path.cp2.x +
                    Math.pow(t2, 3) * this.path.end.x,
                y: Math.pow(1-t2, 3) * this.path.start.y +
                    3 * Math.pow(1-t2, 2) * t2 * this.path.cp1.y +
                    3 * (1-t2) * Math.pow(t2, 2) * this.path.cp2.y +
                    Math.pow(t2, 3) * this.path.end.y
            };
        } else {
            let t2 = (t - 0.5) * 2;
            point = {
                x: Math.pow(1-t2, 3) * this.path.end.x +
                    3 * Math.pow(1-t2, 2) * t2 * this.path.cp3.x +
                    3 * (1-t2) * Math.pow(t2, 2) * this.path.cp4.x +
                    Math.pow(t2, 3) * this.path.final.x,
                y: Math.pow(1-t2, 3) * this.path.end.y +
                    3 * Math.pow(1-t2, 2) * t2 * this.path.cp3.y +
                    3 * (1-t2) * Math.pow(t2, 2) * this.path.cp4.y +
                    Math.pow(t2, 3) * this.path.final.y
            };
        }
        return point;
    }

    // 创建球链
    createChain() {
        this.chain = [];
        let numBalls = 15 + this.level * 3;

        for (let i = 0; i < numBalls; i++) {
            let position = i * 0.05;
            let color = this.colors[Math.floor(Math.random() * this.colors.length)];

            this.chain.push({
                position: position,
                color: color,
                radius: 15
            });
        }
    }

    // 创建单个球
    createBall() {
        return {
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            radius: 15
        };
    }

    // 加载当前球
    loadCurrentBall() {
        this.currentBall = this.nextBall;
        this.nextBall = this.createBall();
        this.updateNextBallDisplay();
    }

    // 更新下一个球显示
    updateNextBallDisplay() {
        const nextBallDisplay = document.getElementById('next-ball');
        nextBallDisplay.style.backgroundColor = this.nextBall.color;

        // 添加内部高光效果
        nextBallDisplay.innerHTML = '';
        const highlight = document.createElement('div');
        highlight.style.width = '60%';
        highlight.style.height = '60%';
        highlight.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        highlight.style.borderRadius = '50%';
        highlight.style.margin = '20% auto';
        nextBallDisplay.appendChild(highlight);
    }

    // 绑定事件
    bindEvents() {
        // 鼠标移动控制发射器角度
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isPlaying || this.isPaused || this.gameOver) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.shooter.angle = Math.atan2(
                mouseY - this.shooter.y,
                mouseX - this.shooter.x
            );
        });

        // 鼠标点击发射球
        this.canvas.addEventListener('click', (e) => {
            if (!this.isPlaying || this.isPaused || this.gameOver || !this.currentBall) return;

            this.shootBall();
        });

        // 开始游戏按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            if (!this.isPlaying) {
                this.startGame();
            }
        });

        // 暂停游戏按钮
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        // 重新开始按钮
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        // 游戏结束模态框按钮
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
            this.hideGameOverModal();
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideGameOverModal();
        });

        // 玩家姓名输入
        document.getElementById('start-game-btn').addEventListener('click', () => {
            const playerName = document.getElementById('player-name-input').value || '玩家1';
            document.getElementById('player-name').textContent = playerName;
            document.getElementById('name-modal').style.display = 'none';

            // 开始游戏
            this.startGame();
        });

        // 按回车开始游戏
        document.getElementById('player-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('start-game-btn').click();
            }
        });
    }

    // 开始游戏
    async startGame() {
        if (this.isPlaying) return;

        const playerName = document.getElementById('player-name').textContent;

        try {
            const response = await fetch('/api/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ player_name: playerName })
            });

            const data = await response.json();

            if (data.success !== false) {
                this.gameId = data.game_id;
                this.score = data.state.score;
                this.level = data.state.level;
                this.lives = data.state.lives;

                this.isPlaying = true;
                this.isPaused = false;
                this.gameOver = false;

                // 更新显示
                this.updateDisplay();

                // 开始游戏循环
                this.startGameLoop();

                // 更新按钮文本
                document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> 游戏中...';
                document.getElementById('start-btn').disabled = true;

                // 显示游戏消息
                this.showMessage('游戏开始！', '#2ecc71');
            }
        } catch (error) {
            console.error('开始游戏失败:', error);
            // 如果API失败，使用本地游戏状态
            this.gameId = Math.floor(Math.random() * 9000) + 1000;
            this.isPlaying = true;
            this.isPaused = false;
            this.gameOver = false;
            this.startGameLoop();
        }
    }

    // 开始游戏循环
    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const gameLoop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            this.deltaTime = timestamp - this.lastTime;

            if (!this.isPaused && this.isPlaying && !this.gameOver) {
                this.update(this.deltaTime);
                this.draw();

                // 更新计时器
                this.timer += this.deltaTime;
                this.updateTimer();
            }

            this.lastTime = timestamp;
            this.animationId = requestAnimationFrame(gameLoop);
        };

        this.animationId = requestAnimationFrame(gameLoop);
    }

    // 更新游戏状态
    update(deltaTime) {
        // 使用deltaTime平滑移动，除以1000将毫秒转换为秒
        const deltaSeconds = deltaTime / 1000;

        // 移动球链 - 大幅降低速度
        this.chainPosition += this.chainSpeed * deltaSeconds * 0.2;

        // 检查球链是否到达终点
        if (this.chainPosition > 0.95) {
            this.loseLife();
            this.chainPosition = 0;
        }

        // 更新飞行中的球
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // 移动球 - 使用deltaTime控制速度
            ball.x += ball.vx * deltaSeconds * 50;
            ball.y += ball.vy * deltaSeconds * 50;

            // 检查球是否击中球链
            const hit = this.checkBallHitChain(ball);
            if (hit) {
                this.balls.splice(i, 1);
                this.insertBallIntoChain(hit.index, ball);
                this.checkMatches(hit.index);
                this.loadCurrentBall();
            }

            // 检查球是否飞出边界
            if (ball.x < -ball.radius || ball.x > this.width + ball.radius ||
                ball.y < -ball.radius || ball.y > this.height + ball.radius) {
                this.balls.splice(i, 1);
                this.loadCurrentBall();
            }
        }
    }

    // 绘制游戏
    draw() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 绘制背景
        this.drawBackground();

        // 绘制轨道路径
        this.drawPath();

        // 绘制球链
        this.drawChain();

        // 绘制飞行中的球
        this.drawBalls();

        // 绘制发射器
        this.drawShooter();

        // 绘制当前球
        this.drawCurrentBall();
    }

    // 绘制背景
    drawBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a3a1a');
        gradient.addColorStop(1, '#2d5a2d');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 绘制轨道路径
    drawPath() {
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        // 绘制第一段贝塞尔曲线
        this.ctx.beginPath();
        this.ctx.moveTo(this.path.start.x, this.path.start.y);
        this.ctx.bezierCurveTo(
            this.path.cp1.x, this.path.cp1.y,
            this.path.cp2.x, this.path.cp2.y,
            this.path.end.x, this.path.end.y
        );
        this.ctx.stroke();

        // 绘制第二段贝塞尔曲线
        this.ctx.beginPath();
        this.ctx.moveTo(this.path.end.x, this.path.end.y);
        this.ctx.bezierCurveTo(
            this.path.cp3.x, this.path.cp3.y,
            this.path.cp4.x, this.path.cp4.y,
            this.path.final.x, this.path.final.y
        );
        this.ctx.stroke();

        // 绘制起点和终点标记
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(this.path.final.x, this.path.final.y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        this.ctx.arc(this.path.start.x, this.path.start.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 绘制球链
    drawChain() {
        for (let i = 0; i < this.chain.length; i++) {
            const ball = this.chain[i];
            const position = (ball.position + this.chainPosition) % 1;
            const point = this.getPathPoint(position);
            this.drawBall(point.x, point.y, ball.radius, ball.color);
        }
    }

    // 绘制飞行中的球
    drawBalls() {
        for (const ball of this.balls) {
            this.drawBall(ball.x, ball.y, ball.radius, ball.color);
        }
    }

    // 绘制单个球
    drawBall(x, y, radius, color) {
        // 绘制球阴影
        this.ctx.beginPath();
        this.ctx.arc(x + 3, y + 3, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();

        // 绘制球体
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // 绘制球高光
        const gradient = this.ctx.createRadialGradient(
            x - radius/3, y - radius/3, 1,
            x - radius/3, y - radius/3, radius/2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(x - radius/3, y - radius/3, radius/2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 绘制球边框
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // 绘制发射器
    drawShooter() {
        const {x, y, angle} = this.shooter;
        const length = 40;

        // 绘制发射器底座
        this.ctx.fillStyle = '#34495e';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制发射器方向指示器
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        this.ctx.stroke();
    }

    // 绘制当前球（在发射器上）
    drawCurrentBall() {
        if (!this.currentBall) return;
        const {x, y} = this.shooter;
        this.drawBall(x, y, this.currentBall.radius, this.currentBall.color);
    }

    // 发射球
    shootBall() {
        if (!this.currentBall) return;

        const speed = 6; // 降低发射速度
        const ball = {
            x: this.shooter.x,
            y: this.shooter.y,
            vx: Math.cos(this.shooter.angle) * speed,
            vy: Math.sin(this.shooter.angle) * speed,
            radius: this.currentBall.radius,
            color: this.currentBall.color
        };

        this.balls.push(ball);
        this.currentBall = null;
    }

    // 检查球是否击中球链
    checkBallHitChain(ball) {
        for (let i = 0; i < this.chain.length; i++) {
            const chainBall = this.chain[i];
            const position = (chainBall.position + this.chainPosition) % 1;
            const point = this.getPathPoint(position);

            const dx = ball.x - point.x;
            const dy = ball.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + chainBall.radius) {
                return {index: i, point: point};
            }
        }
        return null;
    }

    // 将球插入球链
    insertBallIntoChain(index, ball) {
        const newBall = {
            position: this.chain[index].position,
            color: ball.color,
            radius: ball.radius
        };

        this.chain.splice(index, 0, newBall);

        // 调整后面球的位置
        for (let i = index + 1; i < this.chain.length; i++) {
            this.chain[i].position += 0.05;
        }
    }

    // 检查匹配并消除
    checkMatches(index) {
        const color = this.chain[index].color;
        let start = index;
        let end = index;

        // 向前查找相同颜色的球
        while (start > 0 && this.chain[start - 1].color === color) {
            start--;
        }

        // 向后查找相同颜色的球
        while (end < this.chain.length - 1 && this.chain[end + 1].color === color) {
            end++;
        }

        // 计算匹配数量
        const matchCount = end - start + 1;

        // 如果匹配数量大于等于3，消除这些球
        if (matchCount >= 3) {
            // 从球链中移除匹配的球
            this.chain.splice(start, matchCount);

            // 计算得分
            const points = matchCount * 10 * this.level;
            this.addScore(points);

            // 显示得分效果
            this.showMessage(`消除${matchCount}个球！+${points}分`, '#f1c40f');

            // 检查是否需要增加生命
            if (matchCount >= 5) {
                this.lives = Math.min(this.lives + 1, 5);
                this.showMessage('额外生命！', '#2ecc71');
                this.updateDisplay();
            }

            // 检查球链是否为空
            if (this.chain.length === 0) {
                this.levelUp();
            }
        }
    }

    // 添加分数
    async addScore(points) {
        this.score += points;

        // 每1000分升一级
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.chainSpeed = 0.5 + (this.level - 1) * 0.1; // 降低升级速度增量
            this.showMessage(`升级到第${this.level}关！`, '#9b59b6');
        }

        // 更新显示
        this.updateDisplay();
    }

    // 升级
    levelUp() {
        this.level++;
        this.chainSpeed = 0.5 + (this.level - 1) * 0.1; // 降低升级速度增量
        this.chainPosition = 0;

        // 创建新的球链
        this.createChain();

        this.showMessage(`恭喜通过第${this.level-1}关！`, '#9b59b6');
        this.updateDisplay();
    }

    // 失去生命
    async loseLife() {
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver = true;
            this.isPlaying = false;
            this.showGameOverModal();
        } else {
            this.showMessage(`失去一条生命！剩余${this.lives}条`, '#e74c3c');
        }

        // 重置球链位置
        this.chainPosition = 0;

        // 更新显示
        this.updateDisplay();
    }

    // 切换暂停状态
    togglePause() {
        if (!this.isPlaying || this.gameOver) return;

        this.isPaused = !this.isPaused;

        const pauseBtn = document.getElementById('pause-btn');
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
            this.showMessage('游戏已暂停', '#3498db');
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
            this.showMessage('游戏继续', '#2ecc71');
        }
    }

    // 重新开始游戏
    restartGame() {
        // 重置游戏状态
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.timer = 0;
        this.chainSpeed = 0.5; // 降低初始速度
        this.chainPosition = 0;
        this.balls = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.gameOver = false;

        // 创建新的球链
        this.createChain();

        // 重置当前球
        this.loadCurrentBall();

        // 更新显示
        this.updateDisplay();

        // 更新按钮
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> 开始游戏';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').innerHTML = '<i class="fas fa-pause"></i> 暂停';

        // 显示消息
        this.showMessage('准备开始新游戏！', '#3498db');

        // 重绘画布
        this.draw();
    }

    // 更新显示
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;

        // 更新最高分
        const highScore = localStorage.getItem('zumaHighScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('zumaHighScore', this.score);
            document.getElementById('high-score').textContent = this.score;
        } else {
            document.getElementById('high-score').textContent = highScore;
        }
    }

    // 更新计时器
    updateTimer() {
        const minutes = Math.floor(this.timer / 60000);
        const seconds = Math.floor((this.timer % 60000) / 1000);

        document.getElementById('timer').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 显示游戏消息
    showMessage(message, color = '#e74c3c') {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.style.color = color;

        setTimeout(() => {
            if (messageElement.textContent === message) {
                messageElement.textContent = '';
            }
        }, 3000);
    }

    // 显示游戏结束模态框
    showGameOverModal() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('game-over-modal').style.display = 'flex';

        document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> 开始游戏';
        document.getElementById('start-btn').disabled = false;
    }

    // 隐藏游戏结束模态框
    hideGameOverModal() {
        document.getElementById('game-over-modal').style.display = 'none';
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 设置最高分
    const highScore = localStorage.getItem('zumaHighScore') || 0;
    document.getElementById('high-score').textContent = highScore;

    // 初始化游戏
    window.game = new ZumaGame();
});