/** @type {HTMLCanvasElement} */
//! TO DO LIST
//* core game build
//? add viewport + fix bg image
//? add condition that after first bell is caught, gameover sequence triggered
//? show score
//? add sprites
//? add bird to double bonus
//* optimisation
//? create background image
//? add delta time
//? save max score
//? add pre-rendering for main character
//? ==> https://www.html5rocks.com/en/tutorials/canvas/performance/
//? ==> https://developer.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
//? refactor code --> clear all //? stuff.
//! tune this (BELL)

//* ***DATA*** *//
const canvas = document.getElementById("game-layer");
const ctx = canvas.getContext("2d");
const GAME_WIDTH = 600;
const GAME_HEIGHT = 450;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const bgCanvas = document.getElementById("background-layer");
const bgCtx = bgCanvas.getContext("2d");
bgCanvas.width = GAME_WIDTH;
bgCanvas.height = GAME_HEIGHT;

//* snow layer
const snowCanvas = document.getElementById("snow-layer");
const snowCtx = snowCanvas.getContext("2d");
snowCanvas.width = GAME_WIDTH;
snowCanvas.height = GAME_HEIGHT;

let hue = 0;

const snow = {
  snowArray: [],
  size: 3,
  amt: 15,
};

const gravityPull = 3;
const difficulty = 3;
const framesPerSnow = 200;
const bellSize = 10;
const numBellCols = 7;
const bellArray = [];

const numBells = 10; //* change number of bells
const bellSpacing = canvas.height / 5;
const playerJump = bellSpacing * 2;
const playerJumpVelocity = -8;
const minBellHeight = playerJump - bellSize;

const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

const colWidth = Math.floor((canvas.width * 0.9) / numBellCols);
const SCREEN_X_MID = Math.floor(canvas.width / 2);

let playerActivated = false;

let mouseClick = false;
let gameFrame = 0;
let lowestBell = {}; //! is this useless?

let playerHeight = 0;
let crossedHeight = false;
let score = 0;
let cameraPositionY = 0;

//! Thought - shift the bells down on the redraw to give illusion that player has scaled upwards.
//! BELLS ONLY FALL UP TO A CERTAIN Y, then they are static => based on position.

//* ***CLASSES*** *//
//* Generate Bell
class Bell {
  constructor(posX, posY) {
    this.x = posX;
    this.y = posY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.color = "yellow";
    this.size = bellSize;
    this.collided = false;
  }
  update() {
    //! falling bell generates if player has not touched any bells.
    //! bells will stop when player collides
    // if (score === 0) {
    this.velocityY = 0.5;
    this.x += this.velocityX;
    this.y += this.velocityY;

    this.velocityX *= 0.9;
    this.velocityY *= 0.9;
    // }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

//* Generate Player
//? use a jumping method inside
class Player {
  constructor() {
    this.width = 20;
    this.height = 20;
    this.mass = 10; //?
    this.x = canvas.width / 2;
    this.y = canvas.height - this.height; //! testing
    this.velocityX = 3;
    this.velocityY = -8; //? what is a good boost rate?
    this.jumping = false;
    this.collided = false; //? useless?
    this.parallax = this.y; //? useless?
  }
  update(secondsPassed) {
    if (!playerActivated) {
      return;
    } // prevent left right movement till screen is clicked.

    if (mouseClick && this.jumping === false) {
      // this.y += 50 * secondsPassed;  //! change to seconds
      this.y += -playerJump;

      mouseClick = false; //! testing
      this.jumping = true;
      this.parallax = GAME_HEIGHT - this.y; //? useless?
    }

    if (this.collided) {
      this.velocityY += -10; //! TUNE
      this.y += -50;
      this.collided = false;
    }

    //? trying this method to "calibrate mouse move to x move". wrap this in condition?
    let dx = Math.floor(mouse.x - this.x);
    //* scale down dx
    if (dx > this.velocityX) {
      dx /= this.velocityX;
      dx = Math.round(dx);
    }

    this.x += dx;

    // console.log("dx", dx);
    // console.log("playerx", this.x);

    // this.y += movingSpeed * secondsPassed;
    this.y += gravityPull * 2;
    this.velocityY *= 0.9;

    //*prevent player from leaving canvas
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }

    if (this.y >= canvas.height - this.height) {
      this.y = canvas.height - this.height;
      this.velocityY = 0; //? learn this properly
      this.jumping = false;
    }
  }
  draw() {
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // if (this.jumping === true) {
    // bgCtx.drawImage(img, 0, this.parallax, 800, 600)}; //! COULD THIS BE IT?? Move background relative to player based on Y conditions
    // }
  }
  addScore() {
    score += 100;
    console.log("Player score", score);
  }
}

class Snow {
  constructor() {
    this.x = Math.floor(Math.random() * snowCanvas.width);
    this.y = Math.floor(Math.random() - 10) + 5;
    this.size = Math.floor(Math.random() * snow.size) + 1;
    this.velocityX = Math.random() * 3 - 1.5;
    this.velocityY = Math.random() * gravityPull + 0.5;
    this.color = `hsl(${hue}, 100%, 50%)`;
  }
  update() {
    this.x += Math.random() * 1 - 0.5; //* 2D vector creation
    this.y += this.velocityY;
  }
  draw() {
    snowCtx.fillStyle = this.color;
    snowCtx.beginPath(); //* like a paint path
    snowCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    snowCtx.fill();
    // bgCtx.drawImage(img, 0, this.y, 800, 600); //! Endless scroller?
  }
}

const generateSnow = () => {
  for (let i = 0; i < snow.amt; i++) {
    snow.snowArray.push(new Snow());
  }
};

const snowRender = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    arr[i].update();
    arr[i].draw();
  }
};

//* ***MAIN PROGRAMME*** *//

//* Generate bell *//
//? refactor this to Simon's suggestion if there's time --> next bell takes a random pos from the array of possibilities
// [ - - - X - - -] 5
// [ - X - - - - -] 4
// [ - - - X - - -] 3
// [ - - - - - X -] 2
// [ - - X - - - -] 1
const bellXpos = [
  SCREEN_X_MID - colWidth * 3,
  SCREEN_X_MID - colWidth * 2,
  SCREEN_X_MID - colWidth * 1,
  SCREEN_X_MID,
  SCREEN_X_MID + colWidth * 1,
  SCREEN_X_MID + colWidth * 2,
  SCREEN_X_MID + colWidth * 3,
];

let prevX = 0;
let currX = Math.floor(bellXpos.length / 2); //3, start at centre

const randBellX = () => {
  prevX = currX;
  while (
    currX === prevX || //prevents a random bell from having same X as a previous bell
    currX - prevX <= -difficulty || //prevents a bell from being too far from a current bell
    currX - prevX >= difficulty
  ) {
    currX = Math.floor(Math.random() * bellXpos.length);
  }
  return currX;
};

const generateBell = (posY) => {
  let prevY = posY;
  while (bellArray.length < numBells) {
    let newX = randBellX();
    let bell = new Bell(bellXpos[newX], prevY);
    prevY -= bellSpacing;
    lowestBell = bell;
    bellArray.push(bell);
  }
  console.log("***BELLS CREATED***", bellArray);
};

const bellRender = (arr) => {
  const bellTranslation = bellSpacing;

  for (let i = 0; i < arr.length; i++) {
    if (crossedHeight || arr[1].y < canvas.height / 3) {
      //! tune this (BELL)
      // if (crossedHeight) {
      arr[i].y = arr[i].y + bellTranslation;
      console.log("we're going places!");
    }
    arr[i].update();
    arr[i].draw();
    hasCollided(player, arr[i]);
    if (arr[i].collided === true || arr[i].y > canvas.height - 100) {
      arr.splice(i, 1); // remove bell from array to manage total #objects
    }
  }
  const minBells = Math.floor(numBells / 2);
  if (arr.length <= minBells) {
    generateBell(arr[0].y - bellSpacing * minBells);
  }

  crossedHeight = false; // reset trigger for bell translation
};

//* Collision Detection Function *//
const hasCollided = (player, bell) => {
  const collisionDistance = player.width + bell.size;

  const distance = Math.sqrt(
    Math.pow(player.x - bell.x, 2) + Math.pow(player.y - bell.y, 2)
  );

  if (distance < collisionDistance) {
    player.collided = true;
    bell.collided = true;
    player.y = playerJump;
    player.velocityY = playerJumpVelocity;
    player.addScore();
    return true;
  }
};

//* ***EVENT LISTENERS*** *//
canvas.addEventListener("mousemove", (event) => {
  mouse.x = event.x;
  mouse.y = event.y;
});

//? fix this code
canvas.addEventListener("mousedown", (event) => {
  playerActivated = true;
  mouseClick = true;
  player.jumping = false;
  player.velocityY = playerJumpVelocity;
  // player.y += -30;
  console.log(event + "detected");

  //? find a way to remove mousedown after click so that player must use bells to jump
  //? https://www.geeksforgeeks.org/javascript-removeeventlistener-method-with-examples/
});

// const stopGameLoop = () => {
//   window.cancelAnimationFrame(requestAnimationFrameId);
// };

//* *** INITIALIZE GAME  *** *//
const player = new Player();
generateSnow();
generateBell(player.y - canvas.height / 2);

//*Handle Dynamic Frames using timeStamp (research Delta Time)
let secondsPassed,
  oldTimeStamp,
  timeStamp,
  highestHeight = 0;

let movingSpeed = 50;

//* *** GAME LOOP *** *//
const gameLoop = (timeStamp) => {
  //* time calculation
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  secondsPassed = Math.min(secondsPassed, 0.1);
  oldTimeStamp = timeStamp;

  // requestAnimationFrameId = window.requestAnimationFrame(gameLoop);
  //* reset variables for next frame phase
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  playerHeight = Math.floor((canvas.height - player.y) / 100);

  if (playerHeight > highestHeight) {
    highestHeight = playerHeight;
    // console.log("playerHeight", playerHeight, "highestHeight", highestHeight);
    crossedHeight = true;
    if (highestHeight >= 2 && highestHeight % 2 === 0) {
      //! tune this
      crossedHeight = false;
      console.log("CROSSED HEIGHT!");
    }
  }

  //* bell code
  bellRender(bellArray);

  //* player code
  player.update(secondsPassed);
  player.draw();
  // lowestBell = bellArray[0];
  // hasCollided(player, lowestBell); //! think about which bell it is later

  //* snow code
  snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
  snowCtx.fillStyle = "rgba(40,48,56,0.25)";
  snowRender(snow.snowArray);
  if (gameFrame % framesPerSnow === 0) {
    generateSnow(); //only generate snow every 200 frames
    console.log("***BELLS CREATED***", bellArray);
  }

  //* Incrementors + resets
  hue += 2; // change snow colour
  gameFrame++;

  requestAnimationFrame(gameLoop); // recursive game loop

  //! TEST AREA
  console.log("player X pos and velocity", player.x, player.velocityX);
  // console.log("player Y pos and velocity", player.y, player.velocityY);
};

gameLoop(timeStamp);
