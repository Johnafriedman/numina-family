var IFL = IFL || {};
var flockCenter = {};

IFL.Flock = function(game){
  this.game = game;
  this.game.state.add("flock", new IFL.Flock.GameState(this.game));
}

IFL.Flock.GameState = function(game) {
  this.game = game;
}

IFL.Flock.GameState.prototype.preload = function () {
  "use strict";

  this.game.load.image('grass', 'assets/flock/grass03_0.png');
  this.game.load.image('btn_back', 'assets/btn_back.png');
  this.game.load.spritesheet('bird', 'assets/flock/ss_bird31x22.png', 31, 22);
  this.game.load.spritesheet('tree', 'assets/flock/ss_tree63x63.png', 63, 63);
}

IFL.Flock.GameState.prototype.create = function() {
  "use strict";

  this.numBoids = 20;
  this.Flock = [];
  this.BlackHoles = [];
  this.Flockable = [];
  this.Test = [];
  this.OneSeek = false;
  this.TwoSeek = false;
  this.WormHole;
  var self = this;
  this.isDebugging = false;

  this.game.add.tileSprite(0, 0, 800, 600, 'grass');
  this.game.add.tileSprite(800, 0, 800, 600, 'grass');
  this.game.add.tileSprite(0, 600, 800, 600, 'grass');
  this.game.add.tileSprite(800, 600, 800, 600, 'grass');
  this.game.input.onUp.add(onUp);
  createAvoidanceTest();


  	function createAvoidanceTest()
  	{
  			createAllWormholes();
        createFlockOne();
        game.world.setBounds(0, 0, 1600, 1200);
        game.camera.follow(self.Flock[0].sprite);

  	}

    function onUp(){
      //game.camera.reset();
      game.world.setBounds(0, 0, 800, 600);

      IFL.games.flock.game.state.start('tween');
    }

  	function doNothing()
  	{
  		// foo bar
  	}

  	function createFlockOne()
  	{
      var anim=[[0,1,1,1,2],[1,1,1,2,0],[2,0,1,1,1]];
      for(var i = 0; i < self.numBoids; ++i)
      {
    		var boid = new Ship(game);
    		boid.initalize(i,'bird');
        boid.sprite.animations.add('fly',anim[randInt(3)]);
        boid.sprite.animations.play('fly',5,true);
    		var xpos = self.game.world.centerX-400 + Math.floor(Math.random()*200);
  	 	  var ypos = self.game.world.centerY-300 + Math.floor(Math.random()*200);
    		var pos = new Phaser.Point(xpos,ypos);
    		var vel = new Phaser.Point(30,10)
    		boid.create(pos,vel, 0, self.isDebugging);
    		boid.category = 1;
    		boid.behavior = new BehaviorFlockAvoidWormhole(boid);
    		self.Flock.push(boid);
    		self.Flockable.push(boid);
      }
    }

    function randInt(i){
      return Math.floor(Math.random()*i);
    }
    function createAllWormholes()
    {
      var d=128;
      for(var i = 0; i< 80;i++){
    		var wormhole = new Wormhole(game);
  			wormhole.initalize(i,'tree');
        wormhole.sprite.frame=randInt(4);
        var x = (d+randInt(12*d));
        var y = (d+randInt(8*d));

  			var pos = new Phaser.Point(x,y);
     		var vel = new Phaser.Point(0,0);
  			wormhole.create(pos,vel,0,self.isDebugging,doNothing, self);
  			wormhole.behavior = new BehaviorStatic(wormhole);
  			self.BlackHoles.push(wormhole);
  			self.Flockable.push(wormhole);
      }
    }
  }
  //LOOP
 IFL.Flock.GameState.prototype.update = function() {
  	for (var i = 0; i < this.Flockable.length; i++)
  	{
  		this.Flockable[i].behavior.update(this.Flockable);

  		if(this.isDebugging)
  		{
  		  this.Flockable[i].debugUpdate();
  		}
  	}
  }

 IFL.Flock.GameState.prototype.render = function() {

		if(this.isDebugging)
		{
				for (var i = 0; i < this.Flockable.length; i++)
				{
					this.Flockable[i].debugRender();
				}
		}
  }