transporter.module.create('lk_ext/animation', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('animation', {}, {category: ['animation']}, {comment: 'Taking a crack at some of those cartoon animation techniques that Self\'s UI1 uses.\nhttp://selflanguage.org/documentation/published/animation.html'});

});


thisModule.addSlots(animation, function(add) {

  add.data('timePerStep', 40);

  add.creator('abstract', {});

  add.creator('simultaneous', Object.create(animation['abstract']));

  add.creator('sequential', Object.create(animation['abstract']));

  add.creator('timeSegment', Object.create(animation['abstract']));

  add.creator('instantaneous', Object.create(animation['abstract']));

  add.creator('stepper', {});

  add.creator('nothingDoer', Object.create(animation.stepper));

  add.creator('accelerator', Object.create(animation.stepper));

  add.creator('pathMover', Object.create(animation.stepper));

  add.creator('speedStepper', Object.create(animation.stepper));

  add.creator('wiggler', Object.create(animation.stepper));

  add.creator('path', {});

  add.creator('straightPath', Object.create(animation.path));

  add.creator('arcPath', Object.create(animation.path));

  add.method('newWiggler', function (morph, centerFnOrPt, duration) {
    var centerPt = (typeof centerFnOrPt === 'function') ? centerFnOrPt() : centerFnOrPt || morph.getPosition();

    var wigglerizer = this.sequential.create("wiggler");
    wigglerizer.timeSegments().push(this.timeSegment  .create("wiggling",   duration || 200, this.wiggler.create(centerFnOrPt || morph.getPosition())));
    wigglerizer.timeSegments().push(this.instantaneous.create("reset loc",  function(morph) {
      morph.setPosition((typeof centerFnOrPt === 'function') ? centerFnOrPt() : centerFnOrPt || centerPt);
    }));

    return this.simultaneous.create("wiggler", [wigglerizer]);
  });

  add.method('newMovement', function (morph, kindOfPath, destinationFnOrPt, speed, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd) {
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

  add.method('newFader', function (morph, endingAlpha) {
    return this.newSpeedStepper(morph, endingAlpha, {
      getValue: function(m   ) { return m.getOpacity( ); },
      setValue: function(m, a) {        m.setOpacity(a); }
    }, 1000, 400);
  });

  add.method('newResizer', function (morph, endingSize) {
    return this.newSpeedStepper(morph, endingSize, {
      getValue: function(m   ) { return m.getExtent( ); },
      setValue: function(m, v) {        m.setExtent(v); }
    }, 100, 40);
  });

  add.method('newScaler', function (morph, endingScale) {
    return this.newSpeedStepper(morph, endingScale, {
      getValue: function(m   ) { return m.getScale( ); },
      setValue: function(m, v) {        m.setScale(v); }
    }, 200, 80);
  });

  add.method('newVerticalScaler', function (morph, endingScale) {
    return this.newSpeedStepper(morph, endingScale, {
      getValue: function(m   ) { return m.scalePoint.y; },
      setValue: function(m, v) {        m.setScalePoint(pt(m.scalePoint.x, v)); }
    }, 200, 80);
  });

  add.method('newSpeedStepper', function (morph, endingValue, valueAccessor, mainDuration, accelOrDecelDuration) {
    // Don't bother if the morph is off-screen - it just feels like nothing's happening.
    if (! morph.isOnScreen()) {
      return this.instantaneous.create("set final value", function(m) {valueAccessor.setValue(m, endingValue);});
    }

    var startingValue = valueAccessor.getValue(morph);

    var s = this.speederizer(accelOrDecelDuration, mainDuration, true);
    var speedStepper = this.speedStepper.create(startingValue, endingValue, s.speedHolder(), valueAccessor);
    var r = this.sequential.create("speed steps");
    r.timeSegments().push(this.timeSegment  .create("changing",        mainDuration, speedStepper));
    r.timeSegments().push(this.instantaneous.create("set final value", function(m) {valueAccessor.setValue(m, endingValue);}));
    return this.simultaneous.create("speed stepper", [s, r]);
  });

});


thisModule.addSlots(animation['abstract'], function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('initialize', function (name) {
    this._name = name;
    this._preferredTimePerStep = animation.timePerStep;
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


thisModule.addSlots(animation.simultaneous, function(add) {

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


thisModule.addSlots(animation.sequential, function(add) {

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


thisModule.addSlots(animation.timeSegment, function(add) {

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


thisModule.addSlots(animation.instantaneous, function(add) {

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


thisModule.addSlots(animation.stepper, function(add) {

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


thisModule.addSlots(animation.nothingDoer, function(add) {

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    return false;
  });

});


thisModule.addSlots(animation.accelerator, function(add) {

  add.method('initialize', function (acceleration, speedHolder) {
    this._acceleration = acceleration;
    this._speedHolder = speedHolder;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    var speedChangeThisStep = this._acceleration * timeElapsedForThisStep;
    this._speedHolder.speed += speedChangeThisStep;
  });

});


thisModule.addSlots(animation.pathMover, function(add) {

  add.method('initialize', function (path, speedHolder) {
    this._path = path;
    this._speedHolder = speedHolder;
    this._progress = 0;
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    var curPos = morph.getPosition();
    var newDstPos = this._path.destination();
    if (this._oldDestination && ! this._oldDestination.eqPt(newDstPos)) {
      this._path = animation.straightPath.create(animation.straightPath.backtrackToFictionalStartingPoint(curPos, this._progress, newDstPos), this._path._destinationFnOrPt);
    }

    var speed = this._speedHolder.speed;
    var progressThisStep = speed * timeElapsedForThisStep;
    var newPos = this._path.move(progressThisStep, curPos);
    this._oldDestination = newDstPos;
    morph.setPositionAndDoMotionBlurIfNecessary(newPos, timeElapsedForThisStep);
    this._progress += progressThisStep;
  });

});


thisModule.addSlots(animation.speedStepper, function(add) {

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


thisModule.addSlots(animation.wiggler, function(add) {

  add.method('initialize', function (centerFnOrPt) {
    this._isMovingTowardExtreme1 = false;
    this._centerFnOrPt = centerFnOrPt;
    this._wiggleSize = 3;
    this._distanceToMovePerStep = this._wiggleSize * 1.5;
  });

  add.method('calculatePoints', function () {
    this._centerPt = (typeof this._centerFnOrPt === 'function') ? this._centerFnOrPt() : this._centerFnOrPt;
    this._extreme1 = this._centerPt.addXY(-(this._wiggleSize), 0);
    this._extreme2 = this._centerPt.addXY(  this._wiggleSize , 0);
  });

  add.method('doOneStep', function (morph, timeElapsedForThisStep) {
    if (!this._centerPt) { this.calculatePoints(); }
    var curPos = morph.getPosition();
    var dstPos = this._isMovingTowardExtreme1 ? this._extreme1 : this._extreme2;
    if (curPos.subPt(dstPos).rSquared() < 0.01) {
      this._isMovingTowardExtreme1 = ! this._isMovingTowardExtreme1;
      dstPos = this._isMovingTowardExtreme1 ? this._extreme1 : this._extreme2;
    }
    morph.setPosition(curPos.addPt(dstPos.subPt(curPos).scaleToLength(this._distanceToMovePerStep)));
  });

});


thisModule.addSlots(animation.path, function(add) {

  add.method('create', function () {
    var a = Object.create(this);
    a.initialize.apply(a, arguments);
    return a;
  }, {category: ['creating']});

  add.method('destination', function () { return typeof(this._destinationFnOrPt) === 'function' ? this._destinationFnOrPt() : this._destinationFnOrPt; });

});


thisModule.addSlots(animation.straightPath, function(add) {

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


thisModule.addSlots(animation.arcPath, function(add) {

  add.method('initialize', function (from, to) {
    // Find the center of a circle that hits both points.
    this._destinationFnOrPt = to;
    var dstPos = this.destination();
    
    var vector = dstPos.subPt(from);
    var normal = vector.perpendicularVector().scaleToLength(vector.r() * 4); // can fiddle with the length until it looks good
    this._center = from.midPt(dstPos).addPt(normal);
    var fromVector =   from.subPt(this._center);
    var   toVector = dstPos.subPt(this._center);
    this._radius = fromVector.r();
    this._destinationAngle = toVector.theta();
    this._totalAngle = this._destinationAngle - fromVector.theta();
  });

  add.method('move', function (progressThisStep, curPos) {
    var to = this.destination();
    var vector = to.subPt(curPos);
    if (vector.r() < 0.1) {return curPos;}

    var angleToMove = progressThisStep * this._totalAngle;
    var curAngle = curPos.subPt(this._center).theta();
    var angleDifference = this._destinationAngle - curAngle;
    if (angleDifference < 0.001) {return curPos;}
    var newAngle = curAngle + angleToMove;
    var newAngleDifference = this._destinationAngle - newAngle;
    if (newAngleDifference.sign() !== angleDifference.sign()) {newAngle = this._destinationAngle;} // don't go past it
    var newPos = this._center.pointOnCircle(this._radius, newAngle);
    // console.log("progressThisStep: " + progressThisStep + ", angleToMove: " + angleToMove + ", curAngle: " + curAngle + ", newAngle: " + newAngle + ", newPos: " + newPos + ", curPos: " + curPos);
    return newPos;
  });

});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('isOnScreen', function () {
    var w = this.world();
    return w && (w === this || w.bounds().containsPoint(this.owner.worldPoint(this.getPosition())));
  }, {category: ['testing']});

  add.method('startZoomingOuttaHere', function () {
    var w = this.world();
    if (w) {
      return this.startZoomingTo(pt(w.getExtent().x + 300, -300), true, false, function() {this.remove();}.bind(this));
    } else {
      return null;
    }
  }, {category: ['zooming around']});

  add.method('startZoomingTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    return this.startAnimating(animation.newMovement(this, animation.arcPath, loc, 3, shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), functionToCallWhenDone);
  }, {category: ['zooming around']});

  add.method('startZoomingInAStraightLineTo', function (loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, functionToCallWhenDone) {
    return this.startAnimating(animation.newMovement(this, animation.straightPath, loc, 2, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), functionToCallWhenDone);
  }, {category: ['zooming around']});

  add.method('zoomAwayAfter', function (ms) {
    var originalOwner    = this.owner;
    var originalPosition = this.getPosition();
    this.zoomOuttaHereTimer = window.setTimeout(function() {
      if (this.owner === originalOwner && originalPosition.equals(this.getPosition())) {
        this.startZoomingOuttaHere();
      }
    }.bind(this), ms || 5000);
  });

  add.method('positionToCenterIn', function (m) {
    return m.getExtent().scaleBy(0.5).subPt(this.getExtent().scaleBy(0.5));
  });

  add.method('showTemporarilyInCenterOfWorld', function (w) {
    this.showInWorldAt(w, this.positionToCenterIn(w), function() {this.zoomAwayAfter(5000);}.bind(this));
  });

  add.method('showInWorldAt', function (w, p, callWhenDone) {
    this.ensureIsInWorld(w, p, true, false, true, callWhenDone);
  });

  add.method('startAnimating', function (animator, functionToCallWhenDone) {
    animator.stopAnimating();
    animator.whenDoneCall(functionToCallWhenDone);
    animator.startAnimating(this);
    return animator;
  }, {category: ['zooming around']});

  add.method('wiggle', function (duration) {
    return this.startAnimating(animation.newWiggler(this, null, duration));
  }, {category: ['wiggling']});

  add.method('setPositionAndDoMotionBlurIfNecessary', function (newPos, blurTime) {
    var world = this.world();
    if (world) {
      var extent = this.getExtent();
      var oldPos = this.getPosition();
      var difference = newPos.subPt(oldPos);
      var ratio = Math.max(Math.abs(difference.x) / extent.x, Math.abs(difference.y) / extent.y);
      if (ratio > 0.5) {
        var bounds = this.bounds();
        var allVertices = bounds.vertices().concat(bounds.translatedBy(difference).vertices());
        var convexVertices = quickhull.getConvexHull(allVertices).map(function(a) {return a.pointA;});
        var motionBlurMorph = Morph.makePolygon(convexVertices, 0, Color.black, this.getFill());
        motionBlurMorph.aaa_doesNotNeedACreatorSlot = true; // aaa HACK to fix performance bug
        // could try adjusting the opacity based on the distance, but I tried that and
        // couldn't figure out how to make it look non-weird
        motionBlurMorph.setFillOpacity(0.3); 
        world.addMorphBack(motionBlurMorph);
        setTimeout(function() {motionBlurMorph.remove();}, blurTime);
      }
    }
    this.setPosition(newPos);
    if (this.justDidAnimatedPositionChange) { this.justDidAnimatedPositionChange(); }
  }, {category: ['motion blur']});

  add.method('ensureIsInWorld', function (w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    var owner = this.owner;
    if (owner !== w) {
      var initialLoc = (!owner || this.world() !== w) ? this.getExtent().negated() : owner.worldPoint(this.getPosition());
      w.addMorphAt(this, initialLoc);
      this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
    } else {
      if (shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
        this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
      } else {
        functionToCallWhenDone();
      }
    }
  }, {category: ['adding and removing']});

  add.method('ensureIsNotInWorld', function () {
    if (this.world()) {this.startZoomingOuttaHere();}
  }, {category: ['adding and removing']});

  add.method('animatedAddMorphAt', function (m, p, callWhenDone) {
    var w = this.world();
    if (w) {
      w.addMorphFront(m); // make sure it's in front
      m.ensureIsInWorld(w, this.worldPoint(p), true, true, false, function() {
        this.addMorphAt(m, p);
        if (callWhenDone) { callWhenDone(); }
      }.bind(this));
    } else {
      this.addMorphAt(m, p);
      if (callWhenDone) { callWhenDone(); }
    }
  }, {category: ['adding and removing']});

  add.method('createDismissButton', function () {
    var size = 22 * (Config.fatFingers ? 2 : 1);
    var b = new WindowControlMorph(new Rectangle(0, 0, size, size), 3, Color.primary.orange);
    b.relayToModel(this, {Trigger: "=ensureIsNotInWorld"});
    b.setHelpText('Dismiss me');
    return b;
  }, {category: ['adding and removing']});

  add.method('smoothlyFadeTo', function (desiredAlpha, functionToCallWhenDone) {
    this.startAnimating(animation.newFader(this, desiredAlpha), functionToCallWhenDone);
  }, {category: ['resizing']});

  add.method('smoothlyResizeTo', function (desiredSize, functionToCallWhenDone) {
    this.startAnimating(animation.newResizer(this, desiredSize), functionToCallWhenDone);
  }, {category: ['resizing']});

  add.method('smoothlyScaleTo', function (desiredScale, functionToCallWhenDone) {
    this.startAnimating(animation.newScaler(this, desiredScale), functionToCallWhenDone);
  }, {category: ['scaling']});

  add.method('smoothlyScaleVerticallyTo', function (desiredScale, functionToCallWhenDone) {
    this.startAnimating(animation.newVerticalScaler(this, desiredScale), functionToCallWhenDone);
  }, {category: ['scaling']});

  add.method('stayCenteredAndSmoothlyScaleTo', function (desiredScale, centerPos, functionToCallWhenDone) {
    var center = this.innerBounds().center();
    this.moveOriginBy(center);
    this.translateBy(center.negated());

    this.smoothlyScaleTo(desiredScale, function() {
      this.moveOriginBy(center.negated());
      if (functionToCallWhenDone) { functionToCallWhenDone(); }
    }.bind(this));
  }, {category: ['scaling']});

  add.method('staySameSizeAndSmoothlyScaleTo', function (desiredScale, functionToCallWhenDone) {
    var desiredSize = this.getExtent().scaleBy(this.getScale());
    var originalBounds = this.innerBounds();
    var desiredPos = originalBounds.topLeft();
    //console.log("Before scaling, originalBounds is " + originalBounds);
    var accessor = {
      getValue: function(m) {return m.getScale();},
      setValue: function(m, v) {
        m.setScale(v);
        var newBounds = desiredPos.extent(desiredSize.scaleBy(1 / v));
        //console.log("Setting new bounds to " + newBounds);
        m.setBounds(newBounds);
        m.translateBy(desiredPos.negated());
      }
    };
    var animator = animation.newSpeedStepper(this, desiredScale, accessor, 200, 80);
    this.startAnimating(animator, functionToCallWhenDone);
  }, {category: ['scaling']});

});


thisModule.addSlots(WindowMorph.prototype, function(add) {

  add.method('initiateShutdown', function () {
    if (this.isShutdown()) { return; }
    this.targetMorph.shutdown(); // shutdown may be prevented ...
    this.ensureIsNotInWorld(); // used to say this.remove(), changed by Adam so that it does the cool zooming-off-the-screen thing
    this.state = 'shutdown'; // no one will ever know...
    return true;
  }, {category: ['closing']});

});


thisModule.addSlots(SelectionMorph.prototype, function(add) {

  add.method('startZoomingOuttaHere', function ($super) {
    this.selectedMorphs.invoke('startZoomingOuttaHere');
    $super();
  }, {category: ['zooming around']});

});


thisModule.addSlots(Point.prototype, function(add) {

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

});


thisModule.addSlots(Number.prototype, function(add) {

  add.method('doNotGoPast', function (targetValue, originalValue) {
    var originalDifference = targetValue - originalValue;
    var      newDifference = targetValue - this;
    if (newDifference.sign() !== originalDifference.sign()) {return targetValue;}
    return this;
  });

});


});
