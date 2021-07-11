var IFL = IFL || {};

IFL.Tween = function(game){
  "use strict";
  this.game = game;
  this.game.state.add("tween", new IFL.Tween.GameState(this.game));
}

IFL.Tween.GameState = function(game) {
  "use strict";
  this.game = game;
}

IFL.Tween.GameState.prototype.preload = function () {
  "use strict";
  this.game.load.image('dust', 'assets/dust_puff_0018.png');
  this.game.load.image('moon', 'assets/Earth-from-the-moon_1024x768.jpg');
  //this.game.load.image('btn_back', 'assets/btn_back.png');

  this.game.load.audio('boom', 'assets/audio/boom.mp3');
  this.game.load.audio('onset', 'assets/audio/onset/m.mp3');
  this.game.load.audio('rime', 'assets/audio/rime/oon.mp3');
  this.game.load.audio('word', 'assets/audio/word/moon.mp3');

}

IFL.Tween.GameState.prototype.create = function() {
  "use strict";
  var y0=-150,
    ox=this.game.world.centerX-150,
    rx=this.game.world.centerX+150;

    this.WAIT_FOR_ONSET = 0;
    this.WAIT_FOR_RIME = 1;
    this.WAIT_FOR_JOIN = 2;
    this.WAIT_FOR_DONE = 3;

    this.state = this.WAIT_FOR_ONSET;

    this.y1 = 500;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);


    // Sets background color to white.
    this.game.stage.backgroundColor = '#000000';
    this.game.add.image(0, 0, 'moon');
    //this.game.add.button(0,0, 'btn_back', function(){IFL.games.flock.game.state.start('springs');}, this);
    this.game.input.onUp.add(function(){IFL.games.flock.game.state.start('springs');}, this);


    this.fx = game.add.audio('boom');
    this.oAudio = game.add.audio('onset');
    this.rAudio = game.add.audio('rime');
    this.wAudio = game.add.audio('word');

    function playWPAudio(){
      switch(this.state){
        case this.WAIT_FOR_RIME:
          this.oAudio.play();
        break;
        case this.WAIT_FOR_JOIN:
          this.rAudio.play();
        break;
      }
    }
    this.fx.onStop.add(playWPAudio,this);
    this.oAudio.onStop.add(function(){this.rTween0.start();}, this);
    this.rAudio.onStop.add(function(){this.oTween1.start();this.rTween1.start()}, this);

    var style = { font: "165px DidactGothic", fill: "#ff0044", align: "center" };
    this.onset = this.game.add.text(ox, y0, "m", style);
    this.onset.anchor.set(1.0,0.5);
    this.rime = this.game.add.text(rx, y0, "oon", style);
    this.rime.anchor.set(0.0,0.5);


    this.oEmitter = game.add.emitter(ox, this.y1, 100);
    this.oEmitter.makeParticles('dust');
    this.oEmitter.gravity = 100;

    this.rEmitter = game.add.emitter(rx, this.y1, 100);
    this.rEmitter.makeParticles('dust');
    this.rEmitter.gravity = 100;

    this.oTween0 = this.game.add.tween(this.onset).to( { y: this.y1 }, 2000, Phaser.Easing.Bounce.Out, true);
    this.rTween0 = this.game.add.tween(this.rime).to( { y: this.y1 }, 2000, Phaser.Easing.Bounce.Out);
    this.oTween1 = this.game.add.tween(this.onset).to( {x: this.game.world.centerX}, 1000, Phaser.Easing.Bounce.Out);
    this.rTween1 = this.game.add.tween(this.rime).to( {x: this.game.world.centerX}, 1000, Phaser.Easing.Bounce.Out);
    //oTween0.onComplete.add(function(){rTween0.start();}, this);
    //this.rTween0.onComplete.add(function(){this.oTween1.start();this.rTween1.start()},this);
    this.rTween1.onComplete.add(function(){this.wAudio.play();},this);

}

IFL.Tween.GameState.prototype.update = function() {
    "use strict";
    switch(this.state)
    {
      case this.WAIT_FOR_ONSET:
        if(this.onset.y >= this.y1-10){
          this.state = this.WAIT_FOR_RIME;
          this.oEmitter.x = this.onset.x;
          this.oEmitter.width = this.onset.width;
          this.oEmitter.start(true, 2000, null, 10);
          this.fx.play();
        }
      break;
      case this.WAIT_FOR_RIME:
        if(this.rime.y >= this.y1-10){
          this.state = this.WAIT_FOR_JOIN;
          this.rEmitter.x = this.rime.x;
          this.rEmitter.width = this.rime.width;
          this.rEmitter.start(true, 2000, null, 10);
          this.fx.play();
        }
      break;
    }
}
/*
IFL.Tween.GameState.prototype.render = function() {
  "use strict";
}
*/
