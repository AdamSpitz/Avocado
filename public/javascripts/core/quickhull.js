transporter.module.create('core/quickhull', function(requires) {}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('quickhull', {}, {category: ['ui', 'convex hulls']}, {comment: 'http://en.literateprograms.org/Quickhull_(Javascript)'});

});


thisModule.addSlots(avocado.quickhull, function(add) {

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
