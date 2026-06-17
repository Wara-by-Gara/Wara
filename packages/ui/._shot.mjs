import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 920, height: 1100 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL('./gallery.html').href);
await p.waitForTimeout(600);
await p.screenshot({ path: 'gallery.png', fullPage: true });
await b.close();
console.log('ok');
