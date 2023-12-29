
var util = {
    checkOverLoadParam(types) {
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const arg = arguments[i]
            if (typeof arg != type) {
                return false
            }
        }
        return true
    }
}

var CAD = {
    m2p(ppi = 96) {
        return ppi / 25.4;
    },
    formatNum(n) {
        return parseInt(n * 100) / 100
    },
    setAttributes(target, attributes = {}) {
        for (const key in attributes) {
            target.setAttribute(key, attributes[key])
        }
    },
    copyParam(target, param) {
        target.param = param
        target.points = param.filter(p => p.type === 'point')
        if (target.type == 'circle') {
            const [p1, r] = param
            target.p1 = p1
            target.radius = r
        } else {
            const [p1, p2, r] = param
            target.p1 = p1
            target.p2 = p2
            target.r = r
        }
    },
    getXYFromLine(l1) {
        const { p1, p2 } = l1
        return [p1.x, p1.y, p2.x, p2.y]
    },
    getIntersectionOfLines(l1, l2) {

        const [x1, y1, x2, y2] = this.getXYFromLine(l1)
        const [x3, y3, x4, y4] = this.getXYFromLine(l2)

        let m1 = (y2 - y1) / (x2 - x1);
        let m2 = (y4 - y3) / (x4 - x3);

        let b1 = y1 - m1 * x1;
        let b2 = y3 - m2 * x3;

        if (m1 === m2) {
            return null;
        }

        let x = (b2 - b1) / (m1 - m2);
        let y = m1 * x + b1;
        return Point(x, y);
    },
    getMirrorPoint(p, p1, p2) {
        const { x, y } = p;
        const A = p2.y - p1.y;
        const B = p1.x - p2.x;
        const C = p2.x * p1.y - p1.x * p2.y;
        const x0 = (B * (B * x - A * y) - A * C) / (A * A + B * B);
        const y0 = (A * (-B * x + A * y) - B * C) / (A * A + B * B);
        return Point(2 * x0 - x, 2 * y0 - y);
    },
    getMirrorParam(param, p1, p2) {
        var that = this
        var result = [];
        param.forEach((p) => {
            if (p.type == "point") {
                result.push(that.getMirrorPoint(p, p1, p2));
            } else {
                result.push(p);
            }
        });
        return result;
    },
    getRotatePoint(p1, p2, angle) {
        const radians = (angle * Math.PI) / 180;
        const cosTheta = Math.cos(radians);
        const sinTheta = Math.sin(radians);
        const x = cosTheta * (p1.x - p2.x) - sinTheta * (p1.y - p2.y) + p2.x;
        const y = sinTheta * (p1.x - p2.x) + cosTheta * (p1.y - p2.y) + p2.y;

        return Point(x, y);
    },
    getRotateParam(param, p2, angle) {
        var that = this
        var result = [];
        param.forEach((p) => {
            if (p.type == "point") {
                result.push(that.getRotatePoint(p, p2, angle));
            } else {
                result.push(p);
            }
        });
        return result;
    },
    getAngle(x1, y1, x2, y2) {
        const slope = (y2 - y1) / (x2 - x1);
        const radians = Math.atan(slope);
        const degrees = radians * (180 / Math.PI);
        return degrees;
    },
    getAxialUnitVector(p1, p2) {
        const { x: x1, y: y1 } = p1
        const { x: x2, y: y2 } = p2
        const AB = { x: x2 - x1, y: y2 - y1 };
        const lengthAB = Math.sqrt(AB.x * AB.x + AB.y * AB.y);

        // 防止除以零
        if (lengthAB === 0) {
            throw new Error("两点不能相同");
        }

        const unitVector = { x: AB.x / lengthAB, y: AB.y / lengthAB, length: lengthAB };
        return unitVector;
    },
    getNormalUnitVector(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy)
        const x = -dy / length
        const y = dx / length
        return { x, y, length }
    },
    getParallelPoint(p, pv, d1) {
        const x = p.x + pv.x * d1
        const y = p.y + pv.y * d1
        return Point(x, y)
    },
    getDimensionPoint(x1, y1, x2, y2, xp, yp, distance = 0) {

        // 计算向量 AB 和其垂直向量 N
        const AB = { x: x2 - x1, y: y2 - y1 };
        const N = { x: -AB.y, y: AB.x };

        // 将 N 转换为单位向量
        const lengthN = Math.sqrt(N.x * N.x + N.y * N.y);
        const Nunit = { x: N.x / lengthN, y: N.y / lengthN };

        // 根据距离计算参考点 C 的坐标
        const xc = x1 + distance * Nunit.x;
        const yc = y1 + distance * Nunit.y;

        // 计算向量 CP 和 AB 的点积
        const CP = { x: xp - xc, y: yp - yc };
        const abLengthSquared = AB.x * AB.x + AB.y * AB.y;
        const dotProduct = CP.x * AB.x + CP.y * AB.y;
        const t = dotProduct / abLengthSquared;

        // 计算投影点 Q 的坐标
        const xq = xc + t * AB.x;
        const yq = yc + t * AB.y;

        return Point(xq, yq);
    },
    getDistanceToLine(x1, y1, x2, y2, xp, yp) {
        const AB = { x: x2 - x1, y: y2 - y1 };
        const AP = { x: xp - x1, y: yp - y1 };
        const N = { x: -AB.y, y: AB.x };

        const dotProduct = AP.x * N.x + AP.y * N.y;
        const lengthN = Math.sqrt(N.x * N.x + N.y * N.y);

        const distance = Math.abs(dotProduct) / lengthN;
        return distance;
    },
    getPointOnLine(x1, y1, x2, y2, d) {
        const AB = { x: x2 - x1, y: y2 - y1 };
        const lengthAB = Math.sqrt(AB.x * AB.x + AB.y * AB.y);
        const U = { x: AB.x / lengthAB, y: AB.y / lengthAB };

        const xp = x1 + d * U.x;
        const yp = y1 + d * U.y;

        return Point(xp, yp);
    },
    getCircleCenters(x1, y1, x2, y2, r) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dX = x2 - x1;
        const dY = y2 - y1;
        const dist = Math.sqrt(dX * dX + dY * dY);

        if (dist > 2 * r) {
            return []; // 没有这样的圆
        }

        const h = Math.sqrt(r * r - (dist / 2) * (dist / 2));
        let slope;

        if (dX === 0) { // AB线垂直
            return Point(midX + h, midY);
        } else if (dY === 0) { // AB线水平
            return Point(midX, midY + h);
        } else {
            slope = -dX / dY; // AB线的垂线斜率
            const dx = h / Math.sqrt(1 + slope * slope);
            const dy = slope * dx;
            return Point(midX + dx, midY + dy);
        }
    }
}
function Scale(num) {
    return num / CAD.scale
}
function Svg(type, attributes = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    CAD.setAttributes(el, attributes)
    el.type = type
    return el;
}
const Points = {}
const Point = (x, y) => {
    var p = {
        type: "point",
        class: "point",
        x,
        y,
        clone(x = 0, y = 0) {
            return Point(this.x + x, this.y + y);
        },
        offset(x, y) {
            this.x = this.x + x;
            this.y = this.y + y;
            return this;
        },
        move(v, d) {
            // 单位向量和距离
            this.x = this.x + v.x * d
            this.y = this.y + v.y * d
            return this
        },
        add(p) {
            this.offset(p.x, p.y);
            return this;
        },
        subtract(p) {
            this.offset(-p.x, -p.y);
            return this;
        },
        multi(n) {
            this.x = this.x * n
            this.y = this.y * n
            return this
        },
        to(x, y) {
            return Line(this, this.clone(x, y));
        },
        arc(x, y, r) {
            return Arc(this, this.clone(x, y), r);
        },
        circle(r) {
            return Circle(this, r);
        },
        show(r) {
            Circle(this, Scale(r || 1)).attr({ stroke: 'red' });
            return this
        },
        as(id) {
            if (window[id]) {
                console.log(`Point error:[${id}]已经存在！`, Window[id])
            }
            window[id] = this
            return this
        }
    };
    return p;
};

function initCAD(props) {
    const { el, ppi, dpi, width, height } = props
    const container = document.querySelector(`#${el}`);
    const svg = Svg('svg', { width: width || 800, height: height || 800 })
    const defs = Svg('defs')
    const marker = Svg('marker', {
        id: 'arrow',
        viewBox: '0 0 10 10',
        refX: '15',
        refY: '3',
        markerWidth: '20',
        markerHeight: '10',
        orient: 'auto-start-reverse',
    })
    const path = Svg('path', { d: 'M 0 0 L 15 3 L 0 6 z', stroke: 'gray', fill: 'gray' });
    marker.appendChild(path)
    defs.appendChild(marker)
    svg.appendChild(defs)
    container.appendChild(svg)
    var scale = CAD.m2p(ppi || dpi || 96)
    CAD = {
        ...CAD,
        basePoint: Point(0, 0),
        penPoint: Point(0, 0),
        svg,
        scale,
        dimensionColor: { 'stroke': 'gray', 'stroke-width': 0.5 / scale },

    }
    console.log("cad ok!");
}
function Shape(type, param, attributes) {

    let shape = Svg(type, {
        stroke: "black",
        "stroke-linecap": "round",
        transform: `scale(${CAD.scale},${CAD.scale})`,
        "stroke-width": 1 / CAD.scale,
        ...attributes
    })

    CAD.copyParam(shape, param)

    shape.attr = attr => {
        for (const key in attr) {
            shape.setAttribute(key, attr[key])
        }
        return shape
    }

    shape.dash = param => {
        shape.setAttribute("stroke-dasharray", param || "3 2")
        return shape
    }

    shape.marker = (side) => {

        var markers = {
            "marker-start": 'url(#arrow)',
            "marker-end": 'url(#arrow)'
        }
        if (side == 'start') {
            markers = {
                "marker-start": 'url(#arrow)'
            }
        } else if (side == 'end') {
            markers = {
                "marker-end": 'url(#arrow)'
            }
        }

        CAD.setAttributes(shape, markers)
        return shape
    }
    shape.lineWidth = (width) => {
        shape.attr({ "stroke-width": Scale(width) })
        return shape
    }
    shape.color = (color) => {
        shape.attr({ stroke: color })
        return shape
    }
    shape.rotate = (p1, angle) => {
        Rotate(shape.group || [shape], p1, angle)
        return shape
    }

    shape.mirror = (p1, p2) => {
        Mirror(shape.group || [shape], p1, p2)
        return shape
    }
    shape.as = (id) => {
        if (window[id]) {
            console.log(`Shape error:[${id}]已经存在！`, Window[id])
        }
        window[id] = shape

        return shape
    }
    if (shape.p2 && shape.p2.type === "point") {
        shape.to = (x, y = 0) => {
            var l = Line(shape.p2, shape.p2.clone().offset(x, y))
            l.group = shape.group || [shape]
            l.group.push(l)
            return l
        }
        shape.arc = (x, y, r) => {
            var a = Arc(shape.p2, shape.p2.clone().offset(x, y), r)
            a.group = shape.group || [shape]
            a.group.push(a)
            return a
        }
    }
    CAD.svg.appendChild(shape);
    return shape
}

function Line(p1, p2) {
    let svg = Shape("line", [p1, p2]);

    svg.set = param => {
        const [p1, p2] = param
        CAD.copyParam(svg, param)
        CAD.setAttributes(svg, { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
        svg.length = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y))
        return svg
    };
    svg.set([p1, p2]);
    svg.axisMove = (d) => {

        const v = CAD.getAxialUnitVector(svg.p1, svg.p2)
        var np1 = p1.clone(d * v.x, d * v.y)
        var np2 = p2.clone(d * v.x, d * v.y)
        svg.set([np1, np2])
        return svg
    }
    svg.dim = (d, ps1) => {
        Dim(svg.points, d, ps1)
        return svg
    }
    svg.intersect = l => CAD.getIntersectionOfLines(svg, l)

    svg.new = Line;

    return svg;
}

function Arc(p1, p2, r) {
    let svg = Shape("path", [p1, p2, r]);
    svg.type = "arc";
    svg.set = (param) => {
        CAD.copyParam(svg, param)
        let d = `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
        svg.attr({ d, fill: 'transparent' })

    };
    svg.set([p1, p2, r]);
    svg.dim = (x, y) => {
        var p = CAD.getCircleCenters(svg.p1.x, svg.p1.y, svg.p2.x, svg.p2.y, svg.r)
        CircleDimension(p, svg.r, x, y)
        return svg
    }
    svg.new = Arc;

    return svg;
}

function Circle(p1, r) {
    let svg = Shape("circle", [p1, r]);
    svg.set = (param) => {
        const [p1, r] = param
        CAD.copyParam(svg, param)
        CAD.setAttributes(svg, { cx: p1.x, cy: p1.y, r, fill: 'transparent' })
    };
    svg.set([p1, r]);
    svg.new = Circle;
    svg.dim = (x, y) => {
        CircleDimension(svg.p1, svg.radius, x, y)
        return svg
    }
    return svg;
};

function Mirror(shapes, p1, p2) {
    shapes.forEach((shape) => {
        var param = CAD.getMirrorParam(shape.param, p1, p2);
        shape.new(...param);
    });
};

function Rotate(shapes, p1, angle) {
    shapes.forEach((shape) => {
        var param = CAD.getRotateParam(shape.param, p1, angle);
        shape.set(param);
    });
}

function Mark(p1, p2, content) {
    Line(p1, p2).marker('start').to(p2.clone(10))
    Text(p2.clone(5, -3), content)
}

function CircleDimension(p1, r, x, y) {
    var l = Line(p1, p1.clone(x, y)).attr(CAD.dimensionColor)
        .axisMove(r)
        .marker('start')
        .to(10).attr(CAD.dimensionColor)
    Text(l.p1.clone(3, -2), `Φ ${r * 2}`)
}

function MultiDimension(lines, d, ps1) {
    lines.forEach(line => {
        Dim(line.points, d, ps1)
    });
}

function Dim(ps1, d = -5, ps2 = ps1) {
    const [p1, p2] = ps1
    const [tp1, tp2] = ps2

    const color = CAD.dimensionColor

    const mp = (d) => {
        const rp1 = CAD.getDimensionPoint(tp1.x, tp1.y, tp2.x, tp2.y, p1.x, p1.y, d)
        const rp2 = CAD.getDimensionPoint(tp1.x, tp1.y, tp2.x, tp2.y, p2.x, p2.y, d)
        return [rp1, rp2]
    }

    const [dp1, dp2] = mp(d)
    const nvParam = dp1.x > dp2.x ? [dp1, dp2] : [dp2, dp1]
    const nv = CAD.getNormalUnitVector(...nvParam)
    var l = Line(dp1, dp2).attr(color).marker()
    Line(p1, dp1).axisMove(2).attr(color)
    Line(p2, dp2).axisMove(2).attr(color)
    var angle = CAD.getAngle(dp1.x, dp1.y, dp2.x, dp2.y)
    Text(dp1.clone().add(dp2).multi(0.5).move(nv, 2), CAD.formatNum(l.length))
        .rotate1(angle)
}

function Text(p1, content) {
    const svg = Shape('text', [p1])
    svg.attr({ x: p1.x, y: p1.y })
    svg.p1 = p1
    svg.innerHTML = content
    svg.style = `font-size:${9 / CAD.scale}px;stroke:gray;fill:gray;`
    svg.attr({ 'stroke-width': 0.01 })
    svg.rotate1 = (angle) => {
        svg.setAttribute('transform', `scale(${CAD.scale},${CAD.scale}) rotate(${angle} ${svg.p1.x} ${svg.p1.y})`)
    }
    CAD.svg.appendChild(svg)
    return svg
}
