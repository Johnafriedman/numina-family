var IFL = IFL || {};

IFL.Springs = function (game){
  this.game = game;
  this.game.state.add("springs", new IFL.Springs.GameState(this.game));
}

IFL.Springs.GameState = function(game) {
  this.game = game;
}

IFL.Springs.GameState.prototype.startDrag = function() {

    //  You can't have a sprite being moved by physics AND input, so we disable the physics while being dragged
    this.sprite1.body.moves = false;
}

IFL.Springs.GameState.prototype.stopDrag = function() {

    //  And re-enable it upon release
    this.sprite1.body.moves = true;

}

IFL.Springs.GameState.prototype.preload = function () {
  "use strict";
  this.game.load.image('ball', 'assets/ball.png');
  // this.game.load.image('sky', 'assets/background.jpg');
  this.game.load.image('btn_back', 'assets/btn_back.png');
  // load filter
  // this.game.load.script('filter', 'js/vendor/plasma.js');

}

IFL.Springs.GameState.prototype.create = function() {
  "use strict";

  //this.game.add.image(0, 0, 'sky');
  // create filter
  this.background = this.game.add.sprite(0, 0);
  this.background.width = 800;
  this.background.height = 600;

  // this.filter = this.game.add.filter('Plasma', 800, 600);

  //  You have the following values to play with (defaults shown below):

  // filter.size = 0.03;
  // filter.redShift = 0.5;
  // filter.greenShift = 0.5;
  // filter.blueShift = 0.9;

  // this.background.filters = [this.filter];

  this.game.add.button(0,0, 'btn_back', onUp, this);
  
  function onUp(){
    //IFL.games.flock.game.state.start('flock');
    window.location.assign("./index.html");
  }

  //	Enable p2 physics

  this.game.physics.startSystem(Phaser.Physics.P2JS);

  //  Add 2 sprites which we'll join with a spring
  this.sprite1 = this.game.add.sprite(400, 300, 'ball');
  this.sprite2 = this.game.add.sprite(400, 400, 'ball');
  this.sprite3 = this.game.add.sprite(400, 500, 'ball');
  this.sprite4 = this.game.add.sprite(400, 600, 'ball');

  this.game.physics.p2.enable([this.sprite1, this.sprite2, this.sprite3, this.sprite4]);

  this.sprite1.body.collideWorldBounds = true;
  this.sprite2.body.collideWorldBounds = true;
  this.sprite3.body.collideWorldBounds = true;
  this.sprite4.body.collideWorldBounds = true;
  
  this.sprite1.inputEnabled = true;
  this.sprite1.input.enableDrag();
  this.sprite1.body.static = true;
  this.sprite1.body.moves = false;

  //  Create our spring
  //  The parameters are: createSpring(sprite1, sprite2, restLength, stiffness, damping, worldA, worldB, localA, localB)
  //  See the docs for more details
  this.spring = this.game.physics.p2.createSpring(this.sprite1, this.sprite2, 20, 10, 1);
  this.spring1 = this.game.physics.p2.createSpring(this.sprite2, this.sprite3, 20, 10, 1);
  this.spring2 = this.game.physics.p2.createSpring(this.sprite3, this.sprite4, 20, 10, 1);
  

  this.sprite1.events.onDragStart.add(this.startDrag, this);
  this.sprite1.events.onDragStop.add(this.stopDrag, this);


  
}

 IFL.Springs.GameState.prototype.update = function() {
  if(!this.sprite1.body.moves){
    this.sprite1.body.x = this.game.input.activePointer.x;
    this.sprite1.body.y = this.game.input.activePointer.y;
  }

  // update filter
  // this.filter.update();

  //  Uncomment for coolness :)
  // this.filter.blueShift -= 0.001;

}
