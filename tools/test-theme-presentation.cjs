const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const _D ='), source.indexOf('\nlet CAT_COLORS')), context);
vm.runInContext('const _AA_SMALL = 4.5;', context);
for (const name of ['_rgb','_relLum','_contrast','_toHsl','_hslHex','_shiftToContrast','_inkOn','readableThemeColor','themeFontPreference','resolveThemeFont']) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, name);
  vm.runInContext(source.slice(start, source.indexOf('\n}', start) + 2), context);
}
const themes=vm.runInContext('THEMES',context);
for (const [key,theme] of Object.entries(themes)) {
  const backgrounds=[theme.bg,theme.surface,theme.surface2,theme.card];
  for (const token of ['accent','accent2','success','warn','danger','muted']) {
    const color=context.readableThemeColor(theme[token],backgrounds);
    for (const background of backgrounds) assert(context._contrast(color,background)>=4.5,`${key} ${token} on ${background}`);
    assert.equal(context.readableThemeColor(color,backgrounds),color,'applying the same surfaces is idempotent');
  }
  const accent=context.readableThemeColor(theme.accent,backgrounds);
  const fill=theme.action||accent;
  const ink=context._inkOn(fill,context._inkOn(accent,theme.bg));
  assert(context._contrast(ink,fill)>=4.5,key+' action ink');
}
for (const backgrounds of [['#111112','#1a1a1b','#242425','#1e1e1f'],['#fbfaf7','#ffffff','#f2f0ea','#ffffff']]) {
  for (const raw of ['#000000','#ffffff','#ffff00','#ff00ff','#777777','#1742a4']) {
    const color=context.readableThemeColor(raw,backgrounds);
    for(const bg of backgrounds)assert(context._contrast(color,bg)>=4.5,raw+' custom accent');
  }
}
assert.equal(context.themeFontPreference({}),'theme');
for(const legacy of ['default','vscode','powershell','cmd','kali','ubuntu'])assert.equal(context.themeFontPreference({fontStyle:legacy}),'theme');
for(const manual of ['system','terminal'])assert.equal(context.themeFontPreference({fontStyle:manual}),manual);
assert.equal(context.resolveThemeFont('bears',{}),'system');
assert.equal(context.resolveThemeFont('gengar',{}),'default');
assert.equal(context.resolveThemeFont('powershell',{}),'powershell');
assert.equal(context.resolveThemeFont('bears',{fontStyle:'vscode'}),'system','previous theme font cannot leak into Bears');
for(const preference of ['default','system','terminal'])for(const theme of Object.keys(themes))assert.equal(context.resolveThemeFont(theme,{fontPreference:preference}),preference,'explicit font survives theme changes');
const stored={fontPreference:'default',fontStyle:'default'};const before=JSON.stringify(stored);
for(const theme of Object.keys(themes))context.resolveThemeFont(theme,stored);
assert.equal(JSON.stringify(stored),before,'font resolution never rewrites preferences');
assert.equal(context.themeFontPreference({fontPreference:'invalid',fontStyle:'terminal'}),'terminal');
console.log('Theme presentation checks passed: all 28 palettes read across four surfaces, custom extremes, repeatable adjustments, action ink, theme fonts, legacy settings, explicit overrides, and read-only preference resolution.');
