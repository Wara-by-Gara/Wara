const RE = 6371.00877;
const GRID = 5.0;
const SLAT1 = 30.0;
const SLAT2 = 60.0;
const OLON = 126.0;
const OLAT = 38.0;
const XO = 43;
const YO = 136;

const DEGRAD = Math.PI / 180.0;

const re = RE / GRID;
const slat1 = SLAT1 * DEGRAD;
const slat2 = SLAT2 * DEGRAD;
const olon = OLON * DEGRAD;
const olat = OLAT * DEGRAD;

const sn =
  Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
  Math.tan(Math.PI * 0.25 + slat1 * 0.5);
const snLog = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

const sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
const sfPow = (Math.pow(sf, snLog) * Math.cos(slat1)) / snLog;

const ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
const roPow = (re * sfPow) / Math.pow(ro, snLog);

export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  const raPow = (re * sfPow) / Math.pow(ra, snLog);

  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= snLog;

  const nx = Math.floor(raPow * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(roPow - raPow * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}
