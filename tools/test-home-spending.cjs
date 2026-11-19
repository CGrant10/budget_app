const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
const context = vm.createContext({});
for (const name of ['homeSpendingView','goalSavedAmount','goalTargetAmount']) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, name);
  vm.runInContext(source.slice(start, source.indexOf('\n}', start) + 2), context);
}
const weekly={limit:200,left:145}, forecast={status:'ready',allowance:400};
assert.equal(context.homeSpendingView('day',25,weekly,forecast).amount,25);
assert.equal(context.homeSpendingView('week',25,weekly,forecast).amount,145,'week uses the remaining amount, not the full limit');
assert.equal(context.homeSpendingView('payday',25,weekly,forecast).amount,400,'payday retains the bill-aware forecast allowance');
for (const unavailable of [null,{status:'review'}]) {
  const view=context.homeSpendingView('payday',25,weekly,unavailable);
  assert.equal(view.period,'week');assert.equal(view.amount,145,'unavailable schedules cannot show an invented payday estimate');
}
assert.equal(context.homeSpendingView('invalid',25,weekly,forecast).period,'week');
assert.equal(context.homeSpendingView('day',-20,weekly,forecast).amount,0);
assert.equal(context.homeSpendingView('day',25,{left:10},forecast).amount,10,'today cannot exceed the amount left this week');
assert.equal(JSON.stringify(weekly),JSON.stringify({limit:200,left:145}),'switching views does not rewrite the plan');
assert.equal(context.goalSavedAmount({saved:1450}),1450,'legacy saved progress is retained');
assert.equal(context.goalSavedAmount({current:0,saved:1450}),0,'an explicit newer zero remains authoritative');
assert.equal(context.goalSavedAmount({current:'1450'}),1450,'numeric strings are added as numbers');
assert.equal(context.goalSavedAmount({current:'1450'})+100,1550);
for (const bad of [undefined,'invalid',Infinity,-50]) assert.equal(context.goalSavedAmount({current:bad}),0);
assert.equal(context.goalTargetAmount({target:'4000'}),4000);
for (const bad of [undefined,'invalid',Infinity,-50]) assert.equal(context.goalTargetAmount({target:bad}),0);
console.log('Home/goal checks passed: period values, unavailable schedules, non-mutating selection, legacy goal amounts, explicit zero, numeric strings, and invalid values.');
