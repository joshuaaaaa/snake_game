class SnakeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.width = 12;
    this.height = 12;
    this.cellSize = 30;
    this.snake = [{x:6, y:6}];
    this.food = {x:3, y:3};
    this.direction = "RIGHT";
    this.running = true;
    this.score = 0;
    this.speed = 250; // základní rychlost
    this.setupEventListener();
  }

  connectedCallback() {
    this.render();
    this.interval = setInterval(() => this.gameLoop(), this.speed);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  setupEventListener() {
    // šipky
    document.addEventListener("keydown", e => {
      const dirs = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"];
      if(dirs.includes(e.key)) this.direction = e.key.replace("Arrow","");
    });

    // restart přes HA službu
    window.addEventListener("snake_game_restart", () => this.restart());
  }

  render() {
    const canvas = document.createElement("canvas");
    canvas.width = this.width * this.cellSize;
    canvas.height = this.height * this.cellSize + 30; // prostor pro skóre
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(canvas);
    this.ctx = canvas.getContext("2d");

    // tlačítko restart
    const btn = document.createElement("button");
    btn.textContent = "Restart";
    btn.style.marginTop = "5px";
    btn.onclick = () => this.restart();
    this.shadowRoot.appendChild(btn);

    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,this.width*this.cellSize,this.height*this.cellSize);

    // Had
    let gradient = ctx.createLinearGradient(0,0,this.width*this.cellSize,0);
    gradient.addColorStop(0, "#0f0");
    gradient.addColorStop(1, "#0aa");
    ctx.fillStyle = gradient;
    this.snake.forEach(s => ctx.fillRect(s.x*this.cellSize, s.y*this.cellSize, this.cellSize, this.cellSize));

    // Jídlo blikající
    ctx.fillStyle = (Date.now() % 500 < 250) ? "#f00" : "#ff0";
    ctx.fillRect(this.food.x*this.cellSize, this.food.y*this.cellSize, this.cellSize, this.cellSize);

    // Skóre
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + this.score, 5, this.height*this.cellSize + 20);
  }

  gameLoop() {
    if(!this.running) return;
    let head = {...this.snake[0]};
    if(this.direction=="Up") head.y--;
    if(this.direction=="Down") head.y++;
    if(this.direction=="Left") head.x--;
    if(this.direction=="Right") head.x++;

    // kolize
    if(head.x<0 || head.y<0 || head.x>=this.width || head.y>=this.height || this.snake.some(s=>s.x==head.x && s.y==head.y)) {
      this.running = false;
      alert("Game Over! Your score: " + this.score);
      return;
    }

    this.snake.unshift(head);

    if(head.x==this.food.x && head.y==this.food.y){
      this.food = {x: Math.floor(Math.random()*this.width), y: Math.floor(Math.random()*this.height)};
      this.score++;
      // zrychlení
      this.speed = Math.max(50, 250 - this.score*10);
      clearInterval(this.interval);
      this.interval = setInterval(() => this.gameLoop(), this.speed);
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  restart() {
    this.snake = [{x:6, y:6}];
    this.food = {x:3, y:3};
    this.direction = "RIGHT";
    this.running = true;
    this.score = 0;
    this.speed = 250;
    clearInterval(this.interval);
    this.interval = setInterval(() => this.gameLoop(), this.speed);
    this.draw();
  }
}

customElements.define('snake-card', SnakeCard);
