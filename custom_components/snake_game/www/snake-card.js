class SnakeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    // Konfigurace - můžete přidat vlastní nastavení pokud chcete
    this.config = config || {};
  }

  // Požadovaná metoda pro Lovelace karty
  getCardSize() {
    return 3;
  }

  connectedCallback() {
    this.initializeGame();
    this.render();
    this.startGame();
    this.setupEventListener();
  }

  disconnectedCallback() {
    this.stopGame();
    this.removeEventListener();
  }

  initializeGame() {
    this.width = 12;
    this.height = 12;
    this.cellSize = 30;
    this.snake = [{x: 6, y: 6}];
    this.food = {x: 3, y: 3};
    this.direction = "RIGHT";
    this.running = true;
    this.score = 0;
    this.speed = 250;
    this.interval = null;
  }

  setupEventListener() {
    this.keyHandler = (e) => {
      const dirs = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (dirs.includes(e.key)) {
        e.preventDefault();
        const newDirection = e.key.replace("Arrow", "").toUpperCase();
        
        if (
          (newDirection === "UP" && this.direction !== "DOWN") ||
          (newDirection === "DOWN" && this.direction !== "UP") ||
          (newDirection === "LEFT" && this.direction !== "RIGHT") ||
          (newDirection === "RIGHT" && this.direction !== "LEFT")
        ) {
          this.direction = newDirection;
        }
      }
    };
    
    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListener() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
    }
  }

  render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 10px 0;
          font-family: var(--ha-font-family, Arial, sans-serif);
        }
        .snake-container {
          text-align: center;
          padding: 10px;
          background: var(--card-background-color, #1c1c1c);
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        }
        canvas {
          border: 2px solid var(--primary-color, #03a9f4);
          border-radius: 4px;
          background: #000;
          display: block;
          margin: 0 auto;
        }
        button {
          margin-top: 10px;
          padding: 8px 16px;
          background-color: var(--primary-color, #03a9f4);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
        }
        button:hover {
          opacity: 0.8;
        }
        .score {
          color: var(--primary-text-color, #ffffff);
          font-size: 16px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .game-over {
          color: #ff4444;
          font-size: 18px;
          margin: 10px 0;
          font-weight: bold;
        }
      </style>
      <ha-card>
        <div class="snake-container">
          <div class="score">Score: <span id="score-value">0</span></div>
          <canvas id="snake-canvas"></canvas>
          <div id="game-over-message" class="game-over" style="display: none;">GAME OVER!</div>
          <button id="restart-btn">Restart Game</button>
        </div>
      </ha-card>
    `;

    this.canvas = this.shadowRoot.getElementById('snake-canvas');
    this.scoreElement = this.shadowRoot.getElementById('score-value');
    this.gameOverMessage = this.shadowRoot.getElementById('game-over-message');
    
    this.canvas.width = this.width * this.cellSize;
    this.canvas.height = this.height * this.cellSize;
    this.ctx = this.canvas.getContext("2d");
    
    this.shadowRoot.getElementById('restart-btn').onclick = () => this.restart();
    this.updateScore();
    this.draw();
  }

  startGame() {
    this.stopGame();
    this.interval = setInterval(() => this.gameLoop(), this.speed);
  }

  stopGame() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  updateScore() {
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score;
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = "#00cc00";
      } else {
        // Body
        ctx.fillStyle = "#00ff00";
      }
      ctx.fillRect(
        segment.x * this.cellSize, 
        segment.y * this.cellSize, 
        this.cellSize - 1, 
        this.cellSize - 1
      );
    });
    
    // Draw food
    ctx.fillStyle = (Date.now() % 500 < 250) ? "#ff0000" : "#ffff00";
    ctx.fillRect(
      this.food.x * this.cellSize, 
      this.food.y * this.cellSize, 
      this.cellSize - 1, 
      this.cellSize - 1
    );
  }

  gameLoop() {
    if (!this.running) return;
    
    const head = { ...this.snake[0] };
    
    switch (this.direction) {
      case "UP": head.y--; break;
      case "DOWN": head.y++; break;
      case "LEFT": head.x--; break;
      case "RIGHT": head.x++; break;
    }
    
    // Check collisions
    if (
      head.x < 0 || 
      head.y < 0 || 
      head.x >= this.width || 
      head.y >= this.height ||
      this.snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      this.gameOver();
      return;
    }
    
    this.snake.unshift(head);
    
    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.generateFood();
      this.score++;
      this.updateScore();
      
      // Increase speed
      this.speed = Math.max(100, 250 - this.score * 15);
      this.startGame();
    } else {
      this.snake.pop();
    }
    
    this.draw();
  }

  generateFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
    } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    this.food = newFood;
  }

  gameOver() {
    this.running = false;
    this.stopGame();
    
    if (this.gameOverMessage) {
      this.gameOverMessage.style.display = 'block';
    }
    
    // Draw game over on canvas
    if (this.ctx) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 20px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 10);
      this.ctx.font = "16px Arial";
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 15);
    }
  }

  restart() {
    this.initializeGame();
    if (this.gameOverMessage) {
      this.gameOverMessage.style.display = 'none';
    }
    this.updateScore();
    this.startGame();
    this.draw();
  }
}

// Registrace custom elementu
if (!customElements.get('snake-card')) {
  customElements.define('snake-card', SnakeCard);
}

// Konfigurace pro Lovelace
console.log('Snake Card loaded successfully!');
