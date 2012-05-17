avocado.transporter.module.create('core/math', function(requires) {

}, function(thisModule) {


thisModule.addSlots(Number.prototype, function(add) {

  add.method('plus', function (n) { return this + n; });

  add.method('minus', function (n) { return this - n; });

  add.method('scaleBy', function (n) { return this * n; });

  add.method('divideBy', function (n) { return this / n; });

  add.method('equals', function (n) { return this === n; });

  add.method('isZero', function () { return this === 0; });

  add.method('closerToZeroBy', function (n) {
    if (this < 0) {
      return (this > -n) ? 0 : this + n;
    } else {
      return (this <  n) ? 0 : this - n;
    }
  });

  add.method('sign', function () {
    if (this === 0) { return  0; }
    if (this  <  0) { return -1; }
    return 1;
  });

});


thisModule.addSlots(Point.prototype, function(add) {

  add.method('r', function () {
    // Optimization: don't create a new Point object in the process of calculating this.
    return Math.sqrt(this.rSquared());
  });

  add.method('equals', function (other) {
    return other && other.constructor && this.constructor === other.constructor && this.eqPt(other);
  });

  add.method('hashCode', function () {
    return this.x.hashCode() + this.y.hashCode();
  });

  add.method('approximatelyEqualsPt', function (other, maxDifference) {
    return Math.abs(this.x - other.x) < maxDifference && Math.abs(this.y - other.y) < maxDifference;
  });

  add.method('toString', function () {
    // Overriding the one in LK, because I want Points to be able to contain things other than numbers.
    return ["pt(", this.x, ", ", this.y, ")"].join('');
	});

  add.method('storeString', function () {
    return ['new Point(', this.x, ', ', this.y, ')'].join('');
  }, {category: ['transporting']});

  add.method('plus', function (p) { return this.addPt(p); });

  add.method('minus', function (p) { return this.subPt(p); });

  add.method('divideBy', function (n) { return this.scaleBy(1.0 / n); });

  add.method('isZero', function () { return this.x === 0 && this.y === 0; });

  add.method('round', function () { return new Point(Math.round(this.x), Math.round(this.y)); });

  add.method('closerToZeroBy', function (p) {
    return new Point(this.x.closerToZeroBy(p.x), this.y.closerToZeroBy(p.y));
  });

  add.method('unitVector', function () {
    var r = this.r();
    if (r === 0) {return null;}
    return this.scaleBy(1.0 / r);
  });

  add.method('scaleToLength', function (n) {
    return this.unitVector().scaleBy(n);
  });

  add.method('perpendicularVector', function () {
    return new Point(-this.y, this.x);
  });

  add.method('abs', function () {
    return new Point(Math.abs(this.x), Math.abs(this.y));
  });

  add.method('minMaxPt', function (pMin, pMax) {
    return new Point(Math.max(Math.min(this.x,pMin.x), pMax.x), Math.max(Math.min(this.y,pMin.y), pMax.y));
  });

  add.method('destructively_addXY', function (dx, dy) {this.x += dx; this.y += dy; return this;});

  add.method('destructively_addPt', function (p) {return this.destructively_addXY(p.x, p.y);});

  add.method('destructively_scaleBy', function (scale) {this.x *= scale; this.y *= scale; return this;});

  add.method('destructively_minPt', function (p) {this.x = Math.min(this.x,p.x); this.y = Math.min(this.y,p.y); return this;});

  add.method('destructively_maxPt', function (p) {this.x = Math.max(this.x,p.x); this.y = Math.max(this.y,p.y); return this;});

  add.method('destructively_closerToZeroBy', function (p) {this.x = this.x.closerToZeroBy(p.x); this.y = this.y.closerToZeroBy(p.y); return this;});

  add.method('rSquared', function () {
    var x = this.x;
    var y = this.y;
    return x*x + y*y;
  });

});


thisModule.addSlots(Rectangle.prototype, function(add) {

  add.method('area', function () {return this.width * this.height;});

  add.method('vertices', function () {return [this.topLeft(), this.topRight(), this.bottomLeft(), this.bottomRight()];});

  add.method('originCorner', function () { return this.topLeft(); });

  add.method('storeString', function () {
    return ['new Rectangle(', this.x, ', ', this.y, ', ', this.width, ', ', this.height, ')'].join('');
  }, {category: ['transporting']});

});


thisModule.addSlots(avocado, function(add) {

  add.creator('geometry', {}, {category: ['geometry']});

});


thisModule.addSlots(avocado.geometry, function(add) {

  add.creator('planes', {});

  add.creator('circle', {});

  add.creator('quickhull', {}, {}, {comment: 'http://en.literateprograms.org/Quickhull_(Javascript)'});

});


thisModule.addSlots(avocado.geometry.planes, function(add) {

  add.creator('twoD', {});

  add.creator('threeD', {});

});


thisModule.addSlots(avocado.geometry.planes.threeD, function(add) {

  add.method('createFromThreePoints', function (pointA, pointB, pointC) {
    var normal = pointB.subPt(pointA).crossProduct(pointC.subPt(pointA));
    if (normal.x === 0 && normal.y === 0 && normal.z === 0) { return null; }
    return Object.newChildOf(this, normal, pointA);
  }, {category: ['creating']});

  add.method('initialize', function (normalVector, referencePoint) {
    this._normalVector = normalVector.scaleToLength(1);
    this._referencePoint = referencePoint;
  }, {category: ['creating']});

  add.method('normalVector', function () {
    return this._normalVector;
  }, {category: ['accessing']});

  add.method('referencePoint', function () {
    return this._referencePoint;
  }, {category: ['accessing']});

});


thisModule.addSlots(avocado.geometry.circle, function(add) {

  add.method('initialize', function (center, radius, plane) {
    this._center = center;
    this._radius = radius;
    this._plane  = plane || avocado.geometry.planes.twoD;
  }, {category: ['creating']});

  add.method('center', function () { return this._center; }, {category: ['accessing']});

  add.method('radius', function () { return this._radius; }, {category: ['accessing']});

  add.method('pointAtAngle', function (angle) {
    var vector;
    if (this._plane === avocado.geometry.planes.twoD) {
      vector = pt(Math.cos(angle), Math.sin(angle));
    } else {
      var vectorToReferencePoint = this._plane.referencePoint().subPt(this.center()).scaleToLength(1);
      var aaa = this._plane.normalVector().crossProduct(vectorToReferencePoint).scaleBy(Math.sin(angle));
      vector = vectorToReferencePoint.scaleBy(Math.cos(angle)).addPt(aaa);
    }
    return this.center().addPt(vector.scaleToLength(this.radius()));
  });

  add.method('angleAtPoint', function (p) {
    var vector = p.subPt(this.center());
    if (this._plane === avocado.geometry.planes.twoD) {
      return vector.theta();
    } else {
      if (p.eqPt(this._plane.referencePoint())) { return 0; } // aaa is this right? and why is it necessary? I'm confused.  -- Adam
      var vectorToReferencePoint = this._plane.referencePoint().subPt(this.center());
      var angle = Math.acos(vector.dotProduct(vectorToReferencePoint) / (vector.r() * vectorToReferencePoint.r()));
      return angle;
    }
  });

});


thisModule.addSlots(avocado.geometry.quickhull, function(add) {

  add.method('getDistance', function (cpt, bl) {
    var Vy = bl.pointB.x - bl.pointA.x;
    var Vx = bl.pointA.y - bl.pointB.y;
    return Vx * (cpt.x - bl.pointA.x) + Vy * (cpt.y - bl.pointA.y);
  });

  add.method('findMostDistantPointFromBaseLine', function (baseLine, points) {
    var maxD = 0;
    var maxPt = null;
    var newPoints = [];
    for (var i = 0, n = points.length; i < n; ++i) {
        var p = points[i];
        var d = this.getDistance(p, baseLine);
        if (d > 0) {
          newPoints.push(p);
          if (d > maxD) {
            maxD = d;
            maxPt = p;
          }
        }
    } 
    return {maxPoint: maxPt, newPoints: newPoints};
  });

  add.method('buildConvexHull', function (baseLine, points, iterator) {
    var t = this.findMostDistantPointFromBaseLine(baseLine, points);
    if (t.maxPoint) { // if there is still a point "outside" the base line
      this.buildConvexHull( this.createLine(baseLine.pointA,  t.maxPoint), t.newPoints, iterator );
      this.buildConvexHull( this.createLine(t.maxPoint,  baseLine.pointB), t.newPoints, iterator );
    } else {  // if there is no more point "outside" the base line, the current base line is part of the convex hull
      iterator(baseLine);
    }
  });

  add.method('createLine', function (pointA, pointB) {
    return {pointA: pointA, pointB: pointB};
  });

  add.method('getConvexHull', function (points) {
    // find first baseline
    var maxPt, minPt;
    points.each(function(p) {
      if (!maxPt || p.x > maxPt.x) { maxPt = p; }
      if (!minPt || p.x < minPt.x) { minPt = p; }
    });
    var convexHullBaseLines = [];
    this.buildConvexHull(this.createLine(minPt, maxPt), points, function(p) { convexHullBaseLines.push(p); });
    this.buildConvexHull(this.createLine(maxPt, minPt), points, function(p) { convexHullBaseLines.push(p); });
    return convexHullBaseLines;
  });

});


});
