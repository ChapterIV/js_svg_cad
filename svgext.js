
function sideHole(l1, l2, center, r) {
    const av = CAD.getAxialUnitVector(...l1.points)
    const nv = CAD.getNormalUnitVector(l1.p1, l1.p2)
    console.log('nv: ', nv);

    const dist = CAD.getDistanceToLine(l1.p1.x, l1.p1.y, l1.p2.x, l1.p2.y, l2.p1.x, l2.p1.y)
    console.log('nv:', nv)
    console.log('dist: ', dist);
    center.to(nv.x * dist, nv.y * dist).move(av,r)
    center.to(nv.x * dist, nv.y * dist).move(av,-r)
}