/** @type {HTMLCanvasElement} */
//! port over player class
//! add player image sprite

//! to investigate view port + culling

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
