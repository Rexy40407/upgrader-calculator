import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));

function calculator(){
  const values={price1:1.34,price2:2.68,chance:50,lossStreak:3,priorLoss:.81,growth:2.2,rounds:12,maxLoss:15,fee:0,rate:7.7};
  const outputs=['rows','reset','winProfit','winProfitEuro','winRoi','currentTotalProfit','currentTotalRoi','netTarget','multiplier','continueLoss','continueOneIn','continueOdds','finalStreak','fullStreakOdds','bankroll','bankrollEuro'];
  const elements=Object.fromEntries([...Object.entries(values),...outputs.map(id=>[id,''])].map(([id,value])=>[id,{
    value:String(value),textContent:'',innerHTML:'',listeners:{},
    classList:{add(){},remove(){}},
    addEventListener(type,handler){this.listeners[type]=handler}
  }]));
  const buttons=[0,2,3].map(losses=>({
    dataset:{losses:String(losses)},listeners:{},attributes:{},
    addEventListener(type,handler){this.listeners[type]=handler},
    setAttribute(name,value){this.attributes[name]=String(value)},
    click(){this.listeners.click?.()}
  }));
  const document={
    getElementById:id=>elements[id],
    querySelectorAll:selector=>selector==='[data-losses]'?buttons:[]
  };
  vm.runInNewContext(script,{document,Intl,Math,Number});
  return {elements,buttons};
}

test('três losses de start começam na loss 4 e contam a probabilidade total',()=>{
  assert.match(html,/Início da streak/);
  assert.match(html,/Começa sem fillers ou escolhe 2 ou 3 losses de fillers\./);
  assert.doesNotMatch(html,/>Losses anteriores</);
  assert.match(html,/Os fillers aparecem primeiro e a progressão normal continua depois\./);
  assert.match(html,/Perder até à loss máxima/);
  assert.doesNotMatch(html,/a partir de agora/);
  assert.match(html,/data-losses="0"/);
  assert.match(html,/data-losses="2"/);
  assert.match(html,/data-losses="3"/);
  assert.match(html,/id="maxLoss"/);
  assert.doesNotMatch(html,/id="rounds"/);
  const {elements}=calculator();
  assert.equal([...elements.rows.innerHTML.matchAll(/class="filler-row"/g)].length,3);
  assert.match(elements.rows.innerHTML,/^<tr class="filler-row"><td data-label="Loss"><b>1<\/b><span class="filler-badge">Filler<\/span>/);
  assert.match(elements.rows.innerHTML,/class="filler-row"><td data-label="Loss"><b>3<\/b><span class="filler-badge">Filler<\/span>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>4<\/b>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>4<\/b>.*?data-label="Chegar aqui">12,50%<\/td><td data-label="Perder até aqui" class="negative">6,25%/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>5<\/b>.*?data-label="Chegar aqui">6,25%<\/td><td data-label="Perder até aqui" class="negative">3,125%/);
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>15<\/b>/);
  assert.equal(elements.continueLoss.textContent,'0,0031%');
  assert.equal(elements.continueOneIn.textContent,'1 em 32768');
  assert.equal(elements.continueOdds.textContent,'Inclui 3 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'3 fillers + 12 tentativas');
});

test('duas losses de start começam na loss 3 e continuam até à loss 15',()=>{
  const {elements,buttons}=calculator();
  buttons[1].click();
  assert.equal(elements.lossStreak.value,'2');
  assert.equal(elements.maxLoss.value,'15');
  assert.equal(buttons[0].attributes['aria-pressed'],'false');
  assert.equal(buttons[1].attributes['aria-pressed'],'true');
  assert.equal(buttons[2].attributes['aria-pressed'],'false');
  assert.equal([...elements.rows.innerHTML.matchAll(/class="filler-row"/g)].length,2);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>3<\/b>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>3<\/b>.*?data-label="Chegar aqui">25,00%<\/td><td data-label="Perder até aqui" class="negative">12,5%/);
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>15<\/b>/);
  assert.equal(elements.continueOdds.textContent,'Inclui 2 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'2 fillers + 13 tentativas');
});

test('sem fillers começa na loss 1 e calcula toda a streak',()=>{
  const {elements,buttons}=calculator();
  buttons[0].click();
  assert.equal(elements.lossStreak.value,'0');
  assert.equal(elements.maxLoss.min,'1');
  assert.equal(buttons[0].attributes['aria-pressed'],'true');
  assert.equal(buttons[1].attributes['aria-pressed'],'false');
  assert.equal(buttons[2].attributes['aria-pressed'],'false');
  assert.doesNotMatch(elements.rows.innerHTML,/class="filler-row"/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>1<\/b>.*?data-label="Chegar aqui">100,00%<\/td><td data-label="Perder até aqui" class="negative">50%/);
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>15<\/b>/);
  assert.equal(elements.continueLoss.textContent,'0,0031%');
  assert.equal(elements.continueOneIn.textContent,'1 em 32768');
  assert.equal(elements.continueOdds.textContent,'Sem losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'15 tentativas sem fillers');
});

test('o limite 12 termina a tabela e o capital na loss 12',()=>{
  const {elements}=calculator();
  elements.maxLoss.value='12';
  elements.maxLoss.listeners.input();
  assert.equal(elements.finalStreak.textContent,'12 losses');
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>12<\/b>/);
  assert.doesNotMatch(elements.rows.innerHTML,/data-label="Loss"><b>13<\/b>/);
  assert.equal(elements.bankroll.textContent,'1347,82 tokens');
  assert.equal(elements.continueLoss.textContent,'0,0244%');
  assert.equal(elements.continueOneIn.textContent,'1 em 4096');
  assert.equal(elements.continueOdds.textContent,'Inclui 3 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'3 fillers + 9 tentativas');
});

test('três fillers até à loss 4 dão uma streak total de uma em 16',()=>{
  const {elements}=calculator();
  elements.maxLoss.value='4';
  elements.maxLoss.listeners.input();
  assert.equal(elements.continueLoss.textContent,'6,25%');
  assert.equal(elements.continueOneIn.textContent,'1 em 16');
  assert.equal(elements.continueOdds.textContent,'Inclui 3 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'3 fillers + 1 tentativa');
});
