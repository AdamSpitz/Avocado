Object.extend(Number.prototype, {
  plus: function(n) { return this + n; },
  minus: function(n) { return this - n; },
  scaleBy: function(n) { return this * n; },
  divideBy: function(n) { return this / n; },
  equals: function(n) { return this === n; },
  isZero: function() { return this === 0; },

  closerToZeroBy: function(n) {
    if (this < 0) {
      return (this > -n) ? 0 : this + n;
    } else {
      return (this <  n) ? 0 : this - n;
    }
  },

  sign: function() {
    if (this === 0) { return  0; }
    if (this  <  0) { return -1; }
    return 1;
  }
});

Object.extend(Point.prototype, {
  plus: function(p) { return this.addPt(p); },
  minus: function(p) { return this.subPt(p); },
  divideBy: function(n) { return this.scaleBy(1.0 / n); },
  isZero: function() { return this.x.isZero() && this.y.isZero(); },

  round: function() { return new Point(Math.round(this.x), Math.round(this.y)); },

  closerToZeroBy: function(p) {
    return new Point(this.x.closerToZeroBy(p.x), this.y.closerToZeroBy(p.y));
  },

  unitVector: function() {
    var r = this.r();
    if (r === 0) {return null;}
    return this.scaleBy(1.0 / r);
  },

  scaleToLength: function(n) {
    return this.unitVector().scaleBy(n);
  },

  perpendicularVector: function() {
    return new Point(-this.y, this.x);
  },

  abs: function() {
    return new Point(Math.abs(this.x), Math.abs(this.y));
  },

  minMaxPt: function(pMin, pMax) {
    return new Point(Math.max(Math.min(this.x,pMin.x), pMax.x), Math.max(Math.min(this.y,pMin.y), pMax.y));
  },

  destructively_addXY: function(dx, dy) {this.x += dx; this.y += dy; return this;},
  destructively_addPt: function(p) {return this.destructively_addXY(p.x, p.y);},
  destructively_scaleBy: function(scale) {this.x *= scale; this.y *= scale; return this;},
  destructively_minPt: function(p) {this.x = Math.min(this.x,p.x); this.y = Math.min(this.y,p.y); return this;},
  destructively_maxPt: function(p) {this.x = Math.max(this.x,p.x); this.y = Math.max(this.y,p.y); return this;},
  destructively_closerToZeroBy: function(p) {this.x = this.x.closerToZeroBy(p.x); this.y = this.y.closerToZeroBy(p.y); return this;},

  // Optimization: don't create a new Point object in the process of calculating this.
  r: function() {
    return Math.sqrt(this.rSquared());
  },

  rSquared: function() {
    var x = this.x;
    var y = this.y;
    return x*x + y*y;
  },

  pointOnCircle: function(radius, angle) {
    return this.addPt(pt(Math.cos(angle), Math.sin(angle)).scaleToLength(radius));
  }
});

Object.extend(Rectangle.prototype, {
  area: function() {return this.width * this.height;},

  vertices: function() {return [this.topLeft(), this.topRight(), this.bottomLeft(), this.bottomRight()];}
});


Object.extend(lively.scene.Rectangle.prototype, {
  area: function() { return this.bounds().area(); }
});
