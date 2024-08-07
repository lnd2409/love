/**
 * (This module doesn't support being used in a <script> tag)
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */
const BezierEasing=(()=>{var r=4,n=.001,t=1e-7,u=10,e=11,o=1/(e-1),i="function"==typeof Float32Array;function f(r,n){return 1-3*n+3*r}function a(r,n){return 3*n-6*r}function c(r){return 3*r}function v(r,n,t){return((f(n,t)*r+a(n,t))*r+c(n))*r}function s(r,n,t){return 3*f(n,t)*r*r+2*a(n,t)*r+c(n)}function w(r){return r}return function(f,a,c,l){if(!(0<=f&&f<=1&&0<=c&&c<=1))throw new Error("bezier x values must be in [0, 1] range");if(f===a&&c===l)return w;for(var y=i?new Float32Array(e):new Array(e),b=0;b<e;++b)y[b]=v(b*o,f,c);function h(i){for(var a=0,w=1,l=e-1;w!==l&&y[w]<=i;++w)a+=o;var b=a+(i-y[--w])/(y[w+1]-y[w])*o,h=s(b,f,c);return h>=n?function(n,t,u,e){for(var o=0;o<r;++o){var i=s(t,u,e);if(0===i)return t;t-=(v(t,u,e)-n)/i}return t}(i,b,f,c):0===h?b:function(r,n,e,o,i){var f,a,c=0;do{(f=v(a=n+(e-n)/2,o,i)-r)>0?e=a:n=a}while(Math.abs(f)>t&&++c<u);return a}(i,a,a+o,f,c)}return function(r){return 0===r?0:1===r?1:v(h(r),a,l)}}})();

if (typeof OffscreenCanvas === 'undefined') {
  document.querySelector('.hidden-warning').classList.remove('hidden-warning');
}

const random = {
  value() { return Math.random(); },
  range(min, max) {
    return min + this.value() * (max - min);
  },
  floorRange(min, max) {
    return Math.floor(this.range(min, max));
  }
}

const rotationEasing = BezierEasing(0.9, 0.25, 0.1, 0.75);

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = canvas.clientWidth;
let height = canvas.height = canvas.clientHeight;

// Don't break so much on resize
window.addEventListener('resize', () => {
  width = canvas.width = canvas.clientWidth;
  height = canvas.height = canvas.clientHeight;
});

const helloTiles = generateTiles('Xin lỗi màaaa');
const worldTiles = generateTiles('Năn nỉ đừng giận anh nữa', textCtx => {
  textCtx.fillStyle = 'white';
});

frame();

function frame(timestamp = 0) {
  requestAnimationFrame(frame);

  const t = timestamp / 600;

  ctx.clearRect(0, 0, width, height);
  ctx.save();

  let rotationT = t % (Math.PI * 2);
  const extra = rotationT > Math.PI ? Math.PI : 0;
  rotationT =
    rotationEasing((rotationT - extra) / Math.PI) * Math.PI + extra;

  ctx.translate(width / 2, height / 2);
  ctx.rotate(rotationT);
  ctx.translate(-width / 2, -height / 2);

  ctx.fillStyle = 'black';
  ctx.fillRect(
    width / -2,
    height / 2,
    width * 2,
    height * 2
  );

  const helloT = cubicInOut(Math.cos(t - Math.PI) / 2 + 0.5);
  drawTiles(helloTiles, helloT);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI);
  ctx.translate(width / -2, height / -2);
  const worldT = cubicInOut(Math.cos(t) / 2 + 0.5);
  drawTiles(worldTiles, worldT);
  ctx.restore();

  ctx.restore();
}

function generateTiles(text, styleFn, tilesX = 15, tilesY = 7) {
  const textCanvas = new OffscreenCanvas(300, 75);
  const textCtx = textCanvas.getContext('2d');

  const textWidth = textCtx.canvas.width;
  const textHeight = textCtx.canvas.height;

  const tileWidth = textWidth / tilesX;
  const tileHeight = textHeight / tilesY;

  const verticalLines = [[0, 0]];
  for (let i = 1; i < tilesX; i++) {
    const topX = tileWidth * i + random.range(-0.5, 0.5) * tileWidth * 0.8;
    const bottomX =
          tileWidth * i + random.range(-0.5, 0.5) * tileWidth * 0.8;
    verticalLines.push([topX, bottomX]);
  }
  verticalLines.push([textWidth, textWidth]);

  const horizontalLines = [[0, 0]];
  for (let i = 1; i < tilesY; i++) {
    const leftY =
          tileHeight * i + random.range(-0.5, 0.5) * tileHeight * 0.8;
    const rightY =
          tileHeight * i + random.range(-0.5, 0.5) * tileHeight * 0.8;
    horizontalLines.push([leftY, rightY]);
  }
  horizontalLines.push([textHeight, textHeight]);

  // Given points (x1, y1) and (x2, y2), returns a and b where y = ax + b
  const solveLine = (x1, y1, x2, y2) => {
    const detA = x1 - x2;
    const a = (y1 - y2) / detA;
    const b = y1 - a * x1;

    return [a, b];
  };

  const findIntersection = (verticalLine, horizontalLine) => {
    const [a, b] = solveLine(
      verticalLine[0],
      0,
      verticalLine[1],
      textHeight
    );
    const [c, d] = solveLine(
      0,
      horizontalLine[0],
      textWidth,
      horizontalLine[1]
    );

    if (!isFinite(a)) {
      const x = verticalLine[0];
      const y = c * x + d;
      return [x, y];
    }

    if (!isFinite(c)) {
      return [0, b];
    }

    const x = (d - b) / (a - c);
    const y = a * x + b;
    return [x, y];
  };

  const tiles = [];
  const maxDelay = verticalLines.length + horizontalLines.length - 4;
  verticalLines.slice(0, -1).forEach((verticalLine, i) => {
    const nextVerticalLine = verticalLines[i + 1];

    horizontalLines.slice(0, -1).forEach((horizontalLine, j) => {
      const nextHorizontalLine = horizontalLines[j + 1];

      const topLeft = findIntersection(verticalLine, horizontalLine);
      const topRight = findIntersection(nextVerticalLine, horizontalLine);
      const bottomLeft = findIntersection(verticalLine, nextHorizontalLine);
      const bottomRight = findIntersection(
        nextVerticalLine,
        nextHorizontalLine
      );

      // This is to make the tile overlap slightly, fixing a strange issue
      topLeft[0] -= 0.5;
      topLeft[1] -= 0.5;
      topRight[0] += 0.5;
      topRight[1] -= 0.5;
      bottomLeft[0] -= 0.5;
      bottomLeft[1] += 0.5;
      bottomRight[0] += 0.5;
      bottomRight[1] += 0.5;

      let delay = maxDelay - i - j;

      if (delay !== 0) {
        delay += random.range(-0.25, 0.25);
      }

      tiles.push({
        coords: [topLeft, topRight, bottomLeft, bottomRight],
        delay,
        translate: [random.range(-40, 40), random.range(140, 160) + j * 10],
        rotate: random.range(-Math.PI / 2, Math.PI / 2)
      });
    });
  });

  textCtx.fillStyle = 'black';
  textCtx.font = '100px sans-serif';
  textCtx.textAlign = 'center';
  textCtx.textBaseline = 'middle';

  if (typeof styleFn === 'function') {
    styleFn(textCtx);
  }

  tiles.forEach(({ coords }, i) => {
    const [topLeft, topRight, bottomLeft, bottomRight] = coords;

    textCtx.clearRect(0, 0, textWidth, textHeight);
    textCtx.save();

    textCtx.beginPath();
    textCtx.moveTo(...topLeft);
    textCtx.lineTo(...topRight);
    textCtx.lineTo(...bottomRight);
    textCtx.lineTo(...bottomLeft);
    textCtx.clip();

    textCtx.fillText(text, textWidth / 2, textHeight / 2, textWidth);

    tiles[i].bitmap = textCtx.canvas.transferToImageBitmap();

    textCtx.restore();
  });

  return {
    tiles,
    tileWidth,
    tileHeight,
    textWidth,
    textHeight
  };
}

function drawTiles(tilesObj, t) {
  const { tiles, tileWidth, tileHeight, textWidth, textHeight } = tilesObj;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height / 2);
  ctx.lineTo(0, height / 2);
  ctx.clip();

  const offsetY = 250;
  const centerX = (width - textWidth) / 2;
  const centerY = (height - textHeight - offsetY) / 2;
  ctx.translate(centerX, centerY);

  // 0 <= t < 1
  // Adjusted t range
  const tRange = 0.6;

  const maxDelay = Math.max(...tiles.map(({ delay }) => delay));

  tiles.forEach(({ bitmap, coords, delay, rotate, translate }) => {
    const [topLeft] = coords;

    const offset = ((1 - tRange) * delay) / maxDelay;
    // adjustedT can actually be more than 1 but that's okay
    const adjustedT = Math.max(0, t / tRange - offset);

    ctx.save();

    const origin = [
      topLeft[0] + tileWidth / 2,
      topLeft[1] + tileHeight / 2
    ];
    // ctx.translate(origin[0], origin[1]);
    ctx.translate(
      topLeft[0] + translate[0] * adjustedT,
      topLeft[1] + translate[1] * adjustedT
    );
    ctx.rotate(rotate * adjustedT);
    ctx.translate(-origin[0], -origin[1]);
    ctx.drawImage(bitmap, 0, 0, textWidth, textHeight);
    ctx.restore();
  });

  ctx.restore();
}



// The following modules copied in because they don't support <script> tags :(

// https://github.com/mattdesl/eases/blob/master/cubic-in-out.js
function cubicInOut(t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0
}
