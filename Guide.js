
class Guide {
    constructor(mapObj, canvas) {
        this.canvasID = canvas.id;
        this.canvas;
        this.ctx;

        this.cell = 32;
        this.xmax;
        this.ymax;

        this.endPoint = mapObj.end;
        this.startPoint = mapObj.start;
        this.paths = []
        this.neonPathIndex = 0;

        this.walls = mapObj.walls;
        this.stairs = mapObj.stairs
        this.doors = mapObj.doors;

        this.beginLoop = (canvas) => {
            this.canvas = document.getElementById(this.canvasID);
            this.ctx = this.canvas.getContext("2d");
            this.xmax = this.canvas.offsetWidth / this.cell;
            this.ymax = this.canvas.offsetHeight / this.cell;
            this.startSearch();
            
            const fps = 20;
            setInterval(this.update, 1000 / fps);
        }

        this.startSearch = () => {
            if (this.endPoint.length == 0 || this.startPoint.length == 0) {
                return
            }
            this.paths = this.findPath([[this.startPoint]]);
        }

        this.findPath = (paths) => {
            // path finding
            let newPaths = [];
            let pathExists = false;
            for (let p of paths) {
                const head = p[p.length - 1];
                let heads = [
                    [head[0] - 1, head[1]],
                    [head[0] + 1, head[1]],
                    [head[0], head[1] + 1],
                    [head[0], head[1] - 1]
                ];
                // wall collision
                let x, y;
                if (heads[1] != undefined) {
                    x = heads[1][0]
                    y = heads[1][1]
                    for (let w of this.walls) {
                        if (x == w[0] && y == w[1] && x == w[2] && y + 1 == w[3]) {
                            delete heads[1]
                            break
                        }
                    }
                } if (heads[0] != undefined) {
                    x = heads[0][0] + 1;
                    y = heads[0][1]
                    for (let w of this.walls) {
                        if (x == w[0] && y == w[1] && x == w[2] && y + 1 == w[3]) {
                            delete heads[0]
                            break
                        }
                    }
                } if (heads[3] != undefined) {
                    x = heads[3][0]
                    y = heads[3][1] + 1;
                    for (let w of this.walls) {
                        if (x == w[0] && y == w[1] && x + 1 == w[2] && y == w[3]) {
                            delete heads[3]
                            break
                        }
                    }
                } if (heads[2] != undefined) {
                    x = heads[2][0];
                    y = heads[2][1]
                    for (let w of this.walls) {
                        if (x == w[0] && y == w[1] && x + 1 == w[2] && y == w[3]) {
                            delete heads[2]
                            break
                        }
                    }
                }
                heads = heads.filter(h => h != undefined)

                // target collision
                let success = false;
                for (let i = 0; i < heads.length; i++) {
                    if (heads[i][0] == this.endPoint[0] && heads[i][1] == this.endPoint[1]) {
                        success = true;
                        if (pathExists) {
                            if (p.length < newPaths[0].length) {
                                newPaths = [p];
                            }
                        } else {
                            newPaths = [p];
                            pathExists = true;
                        }
                    }
                }
                if (pathExists) {
                    continue
                }

                // collision, bouncing
                for (let i = 0; i < heads.length; i++) {
                    if (
                        heads[i][0] < 0 || heads[i][0] > this.xmax
                        ||
                        heads[i][1] < 0 || heads[i][1] > this.ymax
                    ) {
                        delete heads[i];
                        continue;
                    }

                    let collided = false;
                    for (let p_ of paths) {
                        for (let point of p_) {
                            if (heads[i][0] == point[0] && heads[i][1] == point[1]) {
                                delete heads[i]
                                collided = true
                                break
                            }
                        }
                        if (collided) {
                            break
                        }
                    }
                    if (collided) {
                        continue
                    }
                    collided = false;
                    for (let p_ of newPaths) {
                        for (let point of p_) {
                            if (heads[i][0] == point[0] && heads[i][1] == point[1]) {
                                delete heads[i]
                                collided = true
                                break
                            }
                        }
                        if (collided) {
                            break
                        }
                    }
                    if (collided) {
                        continue
                    }
                }

                heads = heads.filter(h => h != undefined)
                for (let h of heads) {
                    newPaths.push([...p, h])
                }
            }
            // if paths != newPaths: stop recursion
            let areDifferent = false;
            if (paths.length == newPaths.length) {
                for (let i in paths) {
                    if (paths[i].length != newPaths[i].length) {
                        areDifferent = true;
                        break;
                    }
                    for (let j in paths[i]) {
                        for (let k in paths[i][j]) {
                            if (paths[i][j][k] != newPaths[i][j][k]) {
                                areDifferent = true;
                                break
                            }
                        }
                        if (areDifferent) break
                    }
                    if (areDifferent) break
                }
            } else {
                areDifferent = true;
            }

            if (areDifferent) {
                return this.findPath(newPaths);
            }
            return paths;
        }

        this.update = () => {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.xmax * this.cell, this.ymax * this.cell);

            if (this.paths.length) {
                this.drawPoints(this.paths[0]);
                this.drawTargetCircle()
            }

            for (let d of this.doors) {
                this.drawDoor(d[0], d[1], d[2], d[3], d[4], d[5]);
            }
            for (let s of this.stairs) {
                this.drawStair(s[0], s[1]);
            }
            for (let w of this.walls) {
                this.drawWall(w[0], w[1], w[2], w[3]);
            }

            if (this.startPoint.length) {
                this.ctx.fillStyle = "yellow";
                this.ctx.fillRect(this.startPoint[0] * this.cell + this.cell / 4, this.startPoint[1] * this.cell + this.cell / 4, this.cell / 2, this.cell / 2);
            }
            if (this.endPoint.length) {
                this.ctx.fillStyle = "white";
                this.ctx.fillRect(this.endPoint[0] * this.cell + this.cell / 4, this.endPoint[1] * this.cell + this.cell / 4, this.cell / 2, this.cell / 2);
            }
        }

        this.drawLine = (x1, y1, x2, y2, c = "white", w = 1) => {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = w;
            // Define a new Path:
            this.ctx.beginPath();

            // Define a start Point
            this.ctx.moveTo(x1, y1);

            // Define an end Point
            this.ctx.lineTo(x2, y2);

            // Stroke it (Do the Drawing)
            this.ctx.stroke();
        }

        this.drawWall = (x1, y1, x2, y2) => {
            this.drawLine(x1 * this.cell, y1 * this.cell, x2 * this.cell, y2 * this.cell, "cyan", 4);
        }

        this.drawDoor = (x1, y1, x2, y2, fixedSide, openSide) => {
            const doorx = Math.max(x1 * fixedSide, Math.abs(x2 * (fixedSide - 1)));
            const doory = Math.max(y1 * fixedSide, Math.abs(y2 * (fixedSide - 1)));
            const edgex = doorx == x1 ? x2 : x1;
            const edgey = doory == y1 ? y2 : y1;
            const offsetAngle = Math.atan2(doorx - edgex, doory - edgey) + ((doory == edgey) ? 1 : -1) * 0.5 * Math.PI;

            if ((this.neonPathIndex % 8) > 4) {
                this.drawLine(
                    doorx * this.cell,
                    doory * this.cell,
                    edgex * this.cell,
                    edgey * this.cell,
                    "palegreen",
                    3
                );
            } else {
                this.drawLine(
                    doorx * this.cell,
                    doory * this.cell,
                    doorx * this.cell + (Math.cos(((30 - openSide * 60) / 180) * Math.PI + offsetAngle) * this.cell),
                    doory * this.cell + (Math.sin(((30 - openSide * 60) / 180) * Math.PI + offsetAngle) * this.cell),
                    "palegreen",
                    3
                );
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = "white";
                this.ctx.beginPath();
                this.ctx.arc(doorx * this.cell, doory * this.cell, this.cell, offsetAngle - openSide * (1 / 6) * Math.PI, offsetAngle + (1 * (Math.abs(openSide - 1)) / 6) * Math.PI);
                this.ctx.stroke();

            }
        }

        this.drawStair = (x, y) => {
            for (let i = 0; i <= 4; i++) {
                this.drawLine(x * this.cell, y * this.cell + (i * this.cell / 4), (x + 1) * this.cell, y * this.cell + (i * this.cell / 4), "white", 1);
            }
        }

        this.drawTargetCircle = () => {
            const ratio = this.neonPathIndex / this.paths[0].length;
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = "white";
            this.ctx.beginPath();
            this.ctx.arc(this.endPoint[0] * this.cell + this.cell / 2, this.endPoint[1] * this.cell + this.cell / 2, 1.5 * this.cell * ratio, 0, 2 * Math.PI);
            // this.ctx.rect((this.endPoint[0]*this.cell + this.cell / 2) - (this.cell * 2 * ratio) / 2, (this.endPoint[1]*this.cell + this.cell / 2) - (this.cell * 2 * ratio) / 2, this.cell * 2 * ratio, this.cell * 2 * ratio)
            this.ctx.stroke();
        }

        this.drawPoints = (points) => {
            this.neonPathIndex += 0.5
            this.neonPathIndex %= this.paths[0].length;

            this.ctx.fillStyle = "red";
            for (let i in points) {
                const [x, y] = points[i];
                if (i == Math.floor(this.neonPathIndex)) {
                    this.ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell);
                } else {
                    this.ctx.fillRect(x * this.cell + (this.cell / 3), y * this.cell + (this.cell / 3), this.cell / 3, this.cell / 3);
                }
            }
        }
    }
}
