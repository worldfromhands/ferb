/**
 * Capturas do EHXIS Trophy Room (a nova Home).
 * Clica no botão EHXIS pra sair do Loader e depois tira:
 *  - loader.png (tela do estádio)
 *  - hero.png (HUD circular)
 *  - bento.png (sala de troféus)
 *  - trofeu-kyan.png (página de detalhe)
 */
const { chromium } = require('playwright-core');
const fs   = require('fs');
const path = require('path');

const OUT = 'C:/Users/Kyan/OneDrive/Desktop/EHXIS-trophy-prints';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Loader
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '1-loader.png') });
  console.log('  1-loader.png ok');

  // 2. Clica no EHXIS pra entrar
  await page.click('button[aria-label="entrar na ehxis"]').catch(() => {});
  await page.waitForTimeout(2500); // espera transição (1600ms) + fade

  // 3. Hero (HUD circular)
  await page.screenshot({ path: path.join(OUT, '2-hero.png') });
  console.log('  2-hero.png ok');

  // 4. Bento — scroll pra seção dos troféus
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight + 300, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '3-bento.png') });
  console.log('  3-bento.png ok');

  // 5. About + footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '4-about-footer.png') });
  console.log('  4-about-footer.png ok');

  // 6. Página de detalhe do troféu KYAN
  await page.goto('http://localhost:5173/trofeu/kyan', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '5-trofeu-kyan.png'), fullPage: true });
  console.log('  5-trofeu-kyan.png ok');

  await browser.close();
  console.log('FIM —', OUT);
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
