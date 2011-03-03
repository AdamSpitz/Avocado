transporter.module.create('core/math', function(requires) {

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
    return other && other.constructor && other.constructor === Point && this.eqPt(other);
  });

  add.method('hashCode', function () {
    return this.x.hashCode() + this.y.hashCode();
  });

  add.method('storeString', function () {
    return ['new Point(', this.x, ', ', this.y, ')'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return Point.prototype;
  }, {category: ['transporting']});

  add.method('plus', function (p) { return this.addPt(p); });

  add.method('minus', function (p) { return this.subPt(p); });

  add.method('divideBy', function (n) { return this.scaleBy(1.0 / n); });

  add.method('isZero', function () { return this.x.isZero() && this.y.isZero(); });

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

  add.method('pointOnCircle', function (radius, angle) {
    return this.addPt(pt(Math.cos(angle), Math.sin(angle)).scaleToLength(radius));
  });

});


thisModule.addSlots(Rectangle.prototype, function(add) {

  add.method('area', function () {return this.width * this.height;});

  add.method('vertices', function () {return [this.topLeft(), this.topRight(), this.bottomLeft(), this.bottomRight()];});

  add.method('storeString', function () {
    return ['new Rectangle(', this.x, ', ', this.y, ', ', this.width, ', ', this.height, ')'].join('');
  }, {category: ['transporting']});

  add.method('storeStringNeeds', function () {
    return Rectangle.prototype;
  }, {category: ['transporting']});

});


});
