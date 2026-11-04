import {test, expect} from '@playwright/test';

async function choose(page, name) {
  await page.locator('[data-mode="'+name+'"]').click();
  await expect(page.locator('[data-mode="'+name+'"]')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#faceFront svg')).toHaveCount(1);
}

test.beforeEach(async({page})=>{
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('LIVE');
});

test('renders ornamented hour, minute and second hands on every clock face',async({page})=>{
  for(const [mode,label] of [['phase','LUNAR DAY'],['linear','LUNAR DAY'],['utc','UTC DAY']]){
    await choose(page,mode);
    for(const name of ['hour','minute','second']){
      await expect(page.locator('#faceFront [data-'+name+'-hand]')).toHaveCount(1);
      await expect(page.locator('#faceFront [data-'+name+'-hand]')).toHaveAttribute('transform',/rotate\(/);
    }
    await expect(page.locator('#dayLabel')).toHaveText(label);
    await expect(page.locator('#time')).toHaveText(/^\d\d:\d\d:\d\d$/);
  }
  await expect(page.locator('#modehelp')).toContainText('standard');
});

test('swipe left and right on clock to flip through all three modes',async({page})=>{
  const face=page.locator('#swipeSurface');
  await face.scrollIntoViewIfNeeded();
  async function swipe(direction){
    const box=await face.boundingBox();
    if(!box)throw Error('clock face not rendered');
    const start=direction==='left'?0.78:0.22;
    const end=direction==='left'?0.2:0.8;
    const y=box.y+box.height*0.52;
    await page.mouse.move(box.x+box.width*start,y);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width*end,y,{steps:9});
    await page.mouse.up();
  }
  await expect(page.locator('[data-mode="phase"]')).toHaveAttribute('aria-selected','true');
  await swipe('left');
  await expect(page.locator('[data-mode="linear"]')).toHaveAttribute('aria-selected','true');
  await swipe('left');
  await expect(page.locator('[data-mode="utc"]')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#time')).toHaveText(/^\d\d:\d\d:\d\d$/);
  await swipe('right');
  await expect(page.locator('[data-mode="linear"]')).toHaveAttribute('aria-selected','true');
  await face.screenshot({path:test.info().outputPath('clock.png')});
});

test('UTC face shows UTC time, not browser local time, and page never overflows horizontally',async({page})=>{
  await choose(page,'utc');
  const output=await page.locator('#time').textContent();
  const hour=Number(output.slice(0,2));
  const utcHour=await page.evaluate(()=>new Date().getUTCHours());
  assertNearHour(hour,utcHour);
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:window.innerWidth}));
  expect(width.scroll).toBeLessThanOrEqual(width.view+2);
});
function assertNearHour(actual,expected) {
  expect([expected,(expected+23)%24,(expected+1)%24]).toContain(actual);
}

test('tabs remain keyboard navigable, no motion required for reduced-motion users',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-mode="phase"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-mode="linear"]')).toHaveAttribute('aria-selected','true');
  await page.locator('#swipeSurface').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-mode="utc"]')).toHaveAttribute('aria-selected','true');
  expect(await page.locator('#flipRotor').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).isIdentity)).toBe(true);
});
