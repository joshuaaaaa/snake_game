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
    this.setupEventListener();
  }

  connectedCallback() {
    this.render();
    this.interval = setInterval(() => this.gameLoop(), 250);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  setupEventListener() {
    document.addEventListener("keydown", e => {
      const dirs = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"];
      if(dirs.includes(e.key)) this.direction = e.key.replace("Arrow","");
    });

    window.addEventListener("snake_game_restart", () => this.restart());
  }

  render() {
    const canvas = document.createElement("canvas");
    canvas.width = this.width * this.cellSize;
    canvas.height = this.height * this.cellSize;
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(canvas);
    this.ctx = canvas.getContext("2d");
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,this.width*this.cellSize,this.height*this.cellSize);

    ctx.fillStyle = "#0f0";
    this.snake.forEach(s => ctx.fillRect(s.x*this.cellSize, s.y*this.cellSize, this.cellSize, this.cellSize));

    ctx.fillStyle = "#f00";
    ctx.fillRect(this.food.x*this.cellSize, this.food.y*this.cellSize, this.cellSize, this.cellSize);
  }

  gameLoop() {
    if(!this.running) return;
    let head = {...this.snake[0]};
    if(this.direction=="Up") head.y--;
    if(this.direction=="Down") head.y++;
    if(this.direction=="Left") head.x--;
    if(this.direction=="Right") head.x++;

    if(head.x<0 || head.y<0 || head.x>=this.width || head.y>=this.height || this.snake.some(s=>s.x==head.x && s.y==head.y)) {
      this.running = false;
      alert("Game Over!");
      return;
    }

    this.snake.unshift(head);
    if(head.x==this.food.x && head.y==this.food.y){
      this.food = {x: Math.floor(Math.random()*this.width), y: Math.floor(Math.random()*this.height)};
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
    this.draw();
  }
}

customElements.define('snake-card', SnakeCard);
