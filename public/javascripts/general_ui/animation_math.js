avocado.transporter.module.create('general_ui/animation_math', function(requires) {

requires('core/math');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('animation', {}, {category: ['animation']}, {comment: 'Taking a crack at some of those cartoon animation techniques that Self\'s UI1 uses.\nhttp://selflanguage.org/documentation/published/animation.html'});

});


thisModule.addSlots(Point.prototype, function(add) {

  add.method('planeThatAlsoPassesThrough', function (otherPt) {
    return avocado.geometry.planes.twoD;
  });

  add.method('doNotGoPast', function (targetValue, originalValue) {
    var originalDifference = targetValue.minus(originalValue);
    var      newDifference = targetValue.minus(this);
    if (newDifference.sign() !== originalDifference.sign()) {return targetValue;}
    var xIsDifferent = newDifference.x.sign() !== originalDifference.x.sign();
    var yIsDifferent = newDifference.y.sign() !== originalDifference.y.sign();
    if (xIsDifferent && yIsDifferent) { return targetValue; }
    if (xIsDifferent) { return this.withX(targetValue.x); }
    if (yIsDifferent) { return this.withY(targetValue.y); }
    return this;
  });

  add.method('circleThatAlsoPassesThrough', function (otherPt) {
    if (otherPt.is3D) { return this.withZ(0).circleThatAlsoPassesThrough(otherPt); }
    
    var plane = this.planeThatAlsoPassesThrough(otherPt);
    var vector = otherPt.subPt(this);
    var normal = vector.perpendicularVector().scaleToLength(vector.r() * 4); // can fiddle with the length until it looks good
    var center = this.midPt(otherPt).addPt(normal);
    return Object.newChildOf(avocado.geometry.circle, center, this.subPt(center).r(), plane);
  }, {category: ['geometry']});

});


thisModule.addSlots(Number.prototype, function(add) {

  add.method('doNotGoPast', function (targetValue, originalValue) {
    var originalDifference = targetValue - originalValue;
    if (originalDifference === 0) { return targetValue; }
    var      newDifference = targetValue - this;
    if (newDifference.sign() !== originalDifference.sign()) {return targetValue;}
    return this;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.data('timePerStep', 40);

  add.creator('abstract', {});

});


thisModule.addSlots(avocado.animation['abstract'], function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('initialize', function (name) {
    this._name = name;
    this._preferredTimePerStep = avocado.animation.timePerStep;
  });

  add.method('whenDoneCall', function (f) { this._functionToCallWhenDone = f; return this; });

  add.method('done', function () {
    this.stopAnimating();
    var f = this._functionToCallWhenDone;
    if (f) { f(); }
  });

  add.method('scheduleNextStep', function (morph, currentTime, timeElapsedForThisStep) {
    this._mostRecentStepTimestamp = currentTime;
    // aaa - could adjust _preferredTimePerStep based on timeElapsedForThisStep, make the system adapt dynamically
    this._timeout = setTimeout(function() { this.doNextStep(morph); }.bind(this), this._preferredTimePerStep);
  });

  add.method('doNextStep', function (morph) {
    var previousTime = this._mostRecentStepTimestamp;
    var currentTime = new Date().getTime();
    var timeElapsedForThisStep = currentTime - previousTime;
    this.doOneStep(morph, timeElapsedForThisStep);
    if (! this.isStopped()) { this.scheduleNextStep(morph, currentTime); }
  });

  add.method('startAnimating', function (morph) {
    this.scheduleNextStep(morph, new Date().getTime());
  });

  add.method('stopAnimating', function () {
    if (this._timeout) {
      clearTimeout(this._timeout);
      delete this._timeout;
    }
  });

  add.method('isStopped', function () {
    return ! this._timeout;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('simultaneous', Object.create(avocado.animation['abstract']));

});


thisModule.addSlots(avocado.animation.simultaneous, function(add) {

  add.method('initialize', function ($super, name, simultaneousProcesses) {
    $super(name);
    this._simultaneousProcesses = simultaneousProcesses || [];
  });

  add.method('simultaneousProcesses', function () { return this._simultaneousProcesses; });

  add.method('totalDuration', function () {
    return this._simultaneousProcesses.max(function(each) { return each.totalDuration(); });
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    var anyAreNotDoneYet = false;
    for (var i = 0, n = this._simultaneousProcesses.length; i < n; ++i) {
      if (this._simultaneousProcesses[i].doOneStep(morph, timeElapsedForThisStep)) {
        anyAreNotDoneYet = true;
      }
    }
    if (! anyAreNotDoneYet) { this.done(); }
    return anyAreNotDoneYet;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('sequential', Object.create(avocado.animation['abstract']));

});


thisModule.addSlots(avocado.animation.sequential, function(add) {

  add.method('initialize', function ($super, name, timeSegments) {
    $super(name);
    this._timeSegments = timeSegments || [];
    this._currentSegmentIndex = 0;
  });

  add.method('timeSegments', function () {
    return this._timeSegments;
  });

  add.method('currentSegment', function () {
    return this._timeSegments[this._currentSegmentIndex];
  });

  add.method('totalDuration', function () {
    return this._timeSegments.inject(0, function(sum, each) { return sum + each.totalDuration(); });
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    while (true) {
      var s = this.currentSegment();
      if (!s) { this.done(); return false; }
      var isNotDoneYet = s.doOneStep(morph, timeElapsedForThisStep);
      if (isNotDoneYet) { return true; } else { this._currentSegmentIndex += 1; }
    }
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('timeSegment', Object.create(avocado.animation['abstract']));

});


thisModule.addSlots(avocado.animation.timeSegment, function(add) {

  add.method('initialize', function ($super, name, duration, movement) {
    $super(name);
    this._totalDuration = duration;
    this._timeLeft = duration;
    this._movement = movement;
  });

  add.method('totalDuration', function () {
    return this._totalDuration;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    if (this._timeLeft <= 0) { this.done(); return false; }
    this._movement.doOneStep(morph, timeElapsedForThisStep);
    this._timeLeft -= timeElapsedForThisStep;
    return true;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('instantaneous', Object.create(avocado.animation['abstract']));

});


thisModule.addSlots(avocado.animation.instantaneous, function(add) {

  add.method('initialize', function ($super, name, functionToRun) {
    $super(name);
    this._functionToRun = functionToRun;
  });

  add.method('totalDuration', function () {
    return 0;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    // console.log("About to run instantaneous action " + this._name);
    this._functionToRun(morph, timeElapsedForThisStep);
    this.done();
    return false;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('stepper', {});

});


thisModule.addSlots(avocado.animation.stepper, function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('initialize', function () {});

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    throw new Error("Children must implement doOneStep");
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('nothingDoer', Object.create(avocado.animation.stepper));

});


thisModule.addSlots(avocado.animation.nothingDoer, function(add) {

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    return false;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('accelerator', Object.create(avocado.animation.stepper));

});


thisModule.addSlots(avocado.animation.accelerator, function(add) {

  add.method('initialize', function (acceleration, speedHolder) {
    this._acceleration = acceleration;
    this._speedHolder = speedHolder;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    var speedChangeThisStep = this._acceleration * timeElapsedForThisStep;
    this._speedHolder.speed += speedChangeThisStep;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('pathMover', Object.create(avocado.animation.stepper));

});


thisModule.addSlots(avocado.animation.pathMover, function(add) {

  add.method('initialize', function (path, speedHolder) {
    this._path = path;
    this._speedHolder = speedHolder;
    this._progress = 0;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    var curPos = morph.getPosition();
    var newDstPos = this._path.destination();
    if (this._oldDestination && ! this._oldDestination.eqPt(newDstPos)) {
      this._path = avocado.animation.straightPath.create(avocado.animation.straightPath.backtrackToFictionalStartingPoint(curPos, this._progress, newDstPos), this._path._destinationFnOrPt);
    }

    var speed = this._speedHolder.speed;
    var progressThisStep = speed * timeElapsedForThisStep;
    var newPos = this._path.move(progressThisStep, curPos);
    this._oldDestination = newDstPos;
    morph.setPositionAndDoMotionBlurIfNecessary(newPos, timeElapsedForThisStep);
    this._progress += progressThisStep;
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('speedStepper', Object.create(avocado.animation.stepper));

});


thisModule.addSlots(avocado.animation.speedStepper, function(add) {

  add.method('initialize', function (from, to, speedHolder, valueAccessor) {
    this._endingValue = to;
    this._totalDifference = to.minus(from);
    this._speedHolder = speedHolder;
    this._valueAccessor = valueAccessor;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    var speed = this._speedHolder.speed;
    var progressThisStep = Math.max(0, speed * timeElapsedForThisStep);
    var currentValue = this._valueAccessor.getValue(morph);
    if (currentValue.equals(this._endingValue)) {return;}
    var amountToChange = this._totalDifference.scaleBy(progressThisStep);
    var newValue = currentValue.plus(amountToChange);
    newValue = newValue.doNotGoPast(this._endingValue, currentValue);
    this._valueAccessor.setValue(morph, newValue);
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('wiggler', Object.create(avocado.animation.stepper));

});


thisModule.addSlots(avocado.animation.wiggler, function(add) {

  add.method('initialize', function (centerFnOrPt, wiggleSize) {
    this._isMovingTowardExtreme1 = false;
    this._centerFnOrPt = centerFnOrPt;
  });

  add.method('calculatePoints', function (morph) {
    var wiggleSize = morph.getScale() * morph.getExtent().x / 50;
    this._distanceToMovePerStep = wiggleSize * 1.5;
    
    this._centerPt = (typeof this._centerFnOrPt === 'function') ? this._centerFnOrPt() : this._centerFnOrPt;
    this._extreme1 = this._centerPt.addXY(-wiggleSize, 0);
    this._extreme2 = this._centerPt.addXY( wiggleSize, 0);
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    if (!this._centerPt) { this.calculatePoints(morph); }
    var curPos = morph.getPosition();
    var dstPos = this._isMovingTowardExtreme1 ? this._extreme1 : this._extreme2;
    if (curPos.subPt(dstPos).rSquared() < 0.01) {
      this._isMovingTowardExtreme1 = ! this._isMovingTowardExtreme1;
      dstPos = this._isMovingTowardExtreme1 ? this._extreme1 : this._extreme2;
    }
    morph.setPosition(curPos.addPt(dstPos.subPt(curPos).scaleToLength(this._distanceToMovePerStep)));
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('path', {});

});


thisModule.addSlots(avocado.animation.path, function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('destination', function () { var p = this._destinationFnOrPt; return typeof(p) === 'function' ? p() : p; });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('straightPath', Object.create(avocado.animation.path));

});


thisModule.addSlots(avocado.animation.straightPath, function(add) {

  add.method('initialize', function (from, to) {
    this._destinationFnOrPt = to;
    var dstPos = this.destination();
    
    this._totalDistance = dstPos.subPt(from).r();
  });

  add.method('move', function (progressThisStep, curPos) {
    var dstPos = this.destination();
    var vector = dstPos.subPt(curPos);
    var difference = vector.r();
    if (difference < 0.1) {return curPos;}

    var distanceToMove = Math.min(difference, progressThisStep * this._totalDistance);
    var vectorToMove = vector.normalized().scaleBy(distanceToMove);
    // console.log("progressThisStep: " + progressThisStep + ", distanceToMove: " + distanceToMove + ", vectorToMove: " + vectorToMove + ", curPos: " + curPos);
    return curPos.addPt(vectorToMove);
  });

  add.method('backtrackToFictionalStartingPoint', function (curPos, progress, dstPos) {
    var vector = dstPos.subPt(curPos);
    var overallVector = vector.scaleBy(1 / (1 - progress));
    return dstPos.subPt(overallVector);
  });

});


thisModule.addSlots(avocado.animation, function(add) {

  add.creator('arcPath', Object.create(avocado.animation.path));

  add.method('newWiggler', function (morph, centerFnOrPt, duration) {
    var centerPt = (typeof centerFnOrPt === 'function') ? centerFnOrPt() : centerFnOrPt || morph.getPosition();

    var wigglerizer = this.sequential.create("wiggler");
    wigglerizer.timeSegments().push(this.timeSegment  .create("wiggling",   duration || 200, this.wiggler.create(centerFnOrPt || morph.getPosition())));
    wigglerizer.timeSegments().push(this.instantaneous.create("reset loc",  function(morph) {
      morph.setPosition((typeof centerFnOrPt === 'function') ? centerFnOrPt() : centerFnOrPt || centerPt);
    }));

    return wigglerizer;
  });

  add.method('newMovement', function (morph, kindOfPath, destinationFnOrPt, speed, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd) {
    
    
    // I should really try replacing a bunch of this ad-hoc code with something more solid, like:
    // http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
    
    
    
    var currentPt = morph.getPosition();
    var destinationPt = (typeof destinationFnOrPt === 'function') ? destinationFnOrPt() : destinationFnOrPt;
    var vector = destinationPt.subPt(currentPt);
    var distance = vector.r();

    if (distance >= 0.1) {
      var wholeThing = this.sequential.create("whole movement");

      var arcStartPt = currentPt;

      if (shouldAnticipateAtStart && morph.isOnScreen()) { // if it's off-screen, there's no point and it's annoying
        var a = this.anticipator(currentPt, vector, 120, 120);
        wholeThing.timeSegments().push(a);
        arcStartPt = a.path.destination();
      }

      var topSpeed = speed * (shouldDecelerateAtEnd ? 3/4 : 1); // OK, it's not exactly a speed, but it's sorta similar; fix this, maybe.
      var mainMovingDuration = distance / topSpeed;
      var accelOrDecelDuration = mainMovingDuration * (shouldDecelerateAtEnd ? 5/12 : 8/9);
      var speederizer = this.speederizer(accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd);

      var path = kindOfPath.create(arcStartPt, destinationFnOrPt);
      var moverizer = this.moverizer(path, speederizer);

      wholeThing.timeSegments().push(moverizer);

      if (shouldWiggleAtEnd) {
        wholeThing.timeSegments().push(this.newWiggler(morph, destinationFnOrPt));
      }

      return wholeThing;

    } else {
      return this.instantaneous.create("set final loc", function(morph, timeElapsedForThisStep) {morph.setPositionAndDoMotionBlurIfNecessary(destinationPt, timeElapsedForThisStep);});
    }

  });

  add.method('anticipator', function (currentPt, actualTravelVector, anticipationDuration, waitingDuration) {
    var a = this.sequential.create("anticipator");
    a.path = this.straightPath.create(currentPt, currentPt.addPt(actualTravelVector.scaleBy(-0.05)));
    var speedHolder = {speed: 1.0 / anticipationDuration};
    var pathMover = this.pathMover.create(a.path, speedHolder);

    a.timeSegments().push(this.timeSegment.create("anticipating",    anticipationDuration, pathMover));
    a.timeSegments().push(this.timeSegment.create("waiting to move",      waitingDuration, this.nothingDoer.create()));
    return a;
  });

  add.method('speederizer', function (accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd) {
    // accelerating or decelerating is like travelling at half speed; use that as a shortcut in the math
    var halfSpeedDuration = shouldDecelerateAtEnd ? accelOrDecelDuration + accelOrDecelDuration : accelOrDecelDuration;
    var fullSpeedDuration = mainMovingDuration - halfSpeedDuration;
    var imaginaryTotalDurationIfWeWereGoingFullSpeedTheWholeTime = fullSpeedDuration + (0.5 * halfSpeedDuration);
    var    fullSpeed = 1.0 / imaginaryTotalDurationIfWeWereGoingFullSpeedTheWholeTime;
    var acceleration = fullSpeed / accelOrDecelDuration;

    var speedHolder = {speed: 0};

    var s = this.sequential.create("speederizer");
    s.speedHolder = function() {return speedHolder;};
    s.timeSegments().push(this.timeSegment.create("accelerating",    accelOrDecelDuration, this.accelerator.create(acceleration, speedHolder)));
    s.timeSegments().push(this.timeSegment.create("cruising along",     fullSpeedDuration, this.nothingDoer.create()));
    if (shouldDecelerateAtEnd) {
      s.timeSegments().push(this.timeSegment.create("decelerating",  accelOrDecelDuration, this.accelerator.create(-acceleration, speedHolder)));
    }
    return s;
  });

  add.method('moverizer', function (path, speederizer) {
    var m = this.sequential.create("mover steps");
    m.path = path;
    var pathMover = this.pathMover.create(m.path, speederizer.speedHolder());
    m.timeSegments().push(this.timeSegment  .create( "main arc",      speederizer.totalDuration(), pathMover));
    m.timeSegments().push(this.instantaneous.create( "set final loc", function(morph, timeElapsedForThisStep) {morph.setPositionAndDoMotionBlurIfNecessary(path.destination(), timeElapsedForThisStep);}));
    return this.simultaneous.create("moverizer", [speederizer, m]);
  });

  add.method('newSpeedStepper', function (morph, endingValue, valueAccessor, mainDuration) {
    // Don't bother if the morph is off-screen - it just feels like nothing's happening.
    if (! morph.isOnScreen()) {
      return this.instantaneous.create("set final value", function(m) {valueAccessor.setValue(m, endingValue);});
    }

    var startingValue = valueAccessor.getValue(morph);

    var accelOrDecelDuration = mainDuration * 0.4;
    var s = this.speederizer(accelOrDecelDuration, mainDuration, true);
    var speedStepper = this.speedStepper.create(startingValue, endingValue, s.speedHolder(), valueAccessor);
    var r = this.sequential.create("speed steps");
    r.timeSegments().push(this.timeSegment  .create("changing",        mainDuration, speedStepper));
    r.timeSegments().push(this.instantaneous.create("set final value", function(m) {valueAccessor.setValue(m, endingValue);}));
    return this.simultaneous.create("speed stepper", [s, r]);
  });

});


thisModule.addSlots(avocado.animation.arcPath, function(add) {

  add.method('initialize', function (from, to) {
    this._destinationFnOrPt = to;
    var dstPos = this.destination();
    
    this._circleThatPassesThroughBothPoints = from.circleThatAlsoPassesThrough(dstPos);

    this._destinationAngle = this._circleThatPassesThroughBothPoints.angleAtPoint(dstPos);
    this._sourceAngle      = this._circleThatPassesThroughBothPoints.angleAtPoint(from  );
    this._totalAngle       = this._destinationAngle - this._sourceAngle;
  });

  add.method('move', function (progressThisStep, curPos) {
    var to = this.destination();
    var vector = to.subPt(curPos);
    if (vector.r() < 0.1) {return curPos;}

    var angleToMove = progressThisStep * this._totalAngle;
    var curAngle = this._circleThatPassesThroughBothPoints.angleAtPoint(curPos);
    var angleDifference = this._destinationAngle - curAngle;
    if (angleDifference < 0.001) {return curPos;}
    var newAngle = curAngle + angleToMove;
    var newAngleDifference = this._destinationAngle - newAngle;
    if (newAngleDifference.sign() !== angleDifference.sign()) {newAngle = this._destinationAngle;} // don't go past it
    var newPos = this._circleThatPassesThroughBothPoints.pointAtAngle(newAngle);
    // console.log("progressThisStep: " + progressThisStep + ", angleToMove: " + angleToMove + ", curAngle: " + curAngle + ", newAngle: " + newAngle + ", newPos: " + newPos + ", curPos: " + curPos);
    return newPos;
  });

});


});
