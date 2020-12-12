function BehaviorStatic (boid) {
  Behavior.call(this, boid); // call super constructor.
}


// subclass extends superclass
BehaviorStatic.prototype = Object.create(Behavior.prototype);
BehaviorStatic.prototype.constructor = BehaviorStatic;


BehaviorStatic.prototype = {

	update:function(){
	}
}


