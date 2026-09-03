import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scriptMatch=html.match(/<script id="calculator-script">([\s\S]*?)<\/script>/);
assert.ok(scriptMatch,'calculator script not found');
const script=scriptMatch[1];

function calculator(){
  const values={price1:1.34,price2:2.68,chance:50,lossStreak:3,fillerPrice:.27,growth:2.2,rounds:7,maxLoss:10,fee:0,rate:7.7,capitalLimit:278.24,affordableLosses:10,planChance:50};
  const outputs=['rows','reset','affordForm','applyPlan','plannerError','plannerResult','calculatedPrice','calculatedTarget','calculatedBreakdown','stopLossNote','winProfit','winProfitEuro','winRoi','currentTotalProfit','currentTotalRoi','netTarget','multiplier','continueLoss','continueOneIn','continueOdds','finalStreak','fullStreakOdds','bankroll','bankrollEuro'];
  const elements=Object.fromEntries([...Object.entries(values),...outputs.map(id=>[id,''])].map(([id,value])=>[id,{
    value:String(value),textContent:'',innerHTML:'',listeners:{},hidden:false,
    classList:{add(){},remove(){}},
    addEventListener(type,handler){this.listeners[type]=handler}
  }]));
  const buttons=[0,1,2,3,4,5].map(losses=>({
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

test('a loss máxima padrão é 10 e três fillers deixam sete tentativas',()=>{
  assert.match(html,/Início da streak/);
  assert.match(html,/Começa sem fillers ou escolhe entre 1 e 5 losses de fillers\./);
  assert.doesNotMatch(html,/>Losses anteriores</);
  assert.match(html,/A linha laranja marca a stop loss recomendada a 50% do capital\./);
  assert.match(html,/Perder até à loss máxima/);
  assert.doesNotMatch(html,/a partir de agora/);
  assert.match(html,/data-losses="0"/);
  assert.match(html,/data-losses="1"/);
  assert.match(html,/data-losses="2"/);
  assert.match(html,/data-losses="3"/);
  assert.match(html,/data-losses="4"/);
  assert.match(html,/data-losses="5"/);
  assert.match(html,/id="fillerPrice"[^>]*value="0\.27"/);
  assert.doesNotMatch(html,/id="priorLoss"/);
  assert.match(html,/id="maxLoss"[^>]*value="10"/);
  assert.doesNotMatch(html,/id="rounds"/);
  const {elements}=calculator();
  assert.equal([...elements.rows.innerHTML.matchAll(/class="filler-row"/g)].length,3);
  assert.match(elements.rows.innerHTML,/^<tr class="filler-row"><td data-label="Loss"><b>1<\/b><span class="filler-badge">Filler<\/span><\/td><td data-label="Preço usado">0,27<\/td><td data-label="Valor recebido">0,00<\/td>/);
  assert.match(elements.rows.innerHTML,/class="filler-row"><td data-label="Loss"><b>3<\/b><span class="filler-badge">Filler<\/span>.*?data-label="Lucro após perdas" class="negative">−0,81<\/td>.*?data-label="Total investido">0,81<\/td>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>4<\/b>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>4<\/b>.*?data-label="Chegar aqui">12,50%<\/td><td data-label="Perder até aqui" class="negative">6,25%/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>5<\/b>.*?data-label="Chegar aqui">6,25%<\/td><td data-label="Perder até aqui" class="negative">3,125%/);
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>10<\/b>/);
  assert.doesNotMatch(elements.rows.innerHTML,/data-label="Loss"><b>11<\/b>/);
  assert.equal(elements.continueLoss.textContent,'0,0977%');
  assert.equal(elements.continueOneIn.textContent,'1 em 1024');
  assert.equal(elements.continueOdds.textContent,'Inclui 3 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'3 fillers + 7 tentativas');
});

test('duas losses de start começam na loss 3 e continuam até à loss 10',()=>{
  const {elements,buttons}=calculator();
  buttons[2].click();
  assert.equal(elements.lossStreak.value,'2');
  assert.equal(Number(elements.maxLoss.value),10);
  assert.equal(buttons[0].attributes['aria-pressed'],'false');
  assert.equal(buttons[1].attributes['aria-pressed'],'false');
  assert.equal(buttons[2].attributes['aria-pressed'],'true');
  assert.equal(buttons[3].attributes['aria-pressed'],'false');
  assert.equal(buttons[4].attributes['aria-pressed'],'false');
  assert.equal(buttons[5].attributes['aria-pressed'],'false');
  assert.equal([...elements.rows.innerHTML.matchAll(/class="filler-row"/g)].length,2);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>3<\/b>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>3<\/b>.*?data-label="Chegar aqui">25,00%<\/td><td data-label="Perder até aqui" class="negative">12,5%/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>3<\/b>.*?data-label="Lucro após perdas" class="positive">\+0,80<\/td>.*?data-label="Total investido">1,88<\/td>/);
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>10<\/b>/);
  assert.equal(elements.continueOdds.textContent,'Inclui 2 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'2 fillers + 8 tentativas');
});

test('uma loss de filler ocupa a loss 1 e a progressão começa na loss 2',()=>{
  const {elements,buttons}=calculator();
  buttons[1].click();
  assert.equal(elements.lossStreak.value,'1');
  assert.equal(elements.maxLoss.min,'2');
  assert.equal(buttons[0].attributes['aria-pressed'],'false');
  assert.equal(buttons[1].attributes['aria-pressed'],'true');
  assert.equal(buttons[2].attributes['aria-pressed'],'false');
  assert.equal(buttons[3].attributes['aria-pressed'],'false');
  assert.equal(buttons[4].attributes['aria-pressed'],'false');
  assert.equal(buttons[5].attributes['aria-pressed'],'false');
  assert.equal([...elements.rows.innerHTML.matchAll(/class="filler-row"/g)].length,1);
  assert.match(elements.rows.innerHTML,/^<tr class="filler-row"><td data-label="Loss"><b>1<\/b><span class="filler-badge">Filler<\/span>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>2<\/b>.*?data-label="Chegar aqui">50,00%<\/td><td data-label="Perder até aqui" class="negative">25%/);
  assert.equal(elements.continueOdds.textContent,'Inclui 1 loss com filler');
  assert.equal(elements.fullStreakOdds.textContent,'1 filler + 9 tentativas');
});

test('sem fillers começa na loss 1 e calcula toda a streak',()=>{
  const {elements,buttons}=calculator();
  buttons[0].click();
  assert.equal(elements.lossStreak.value,'0');
  assert.equal(elements.maxLoss.min,'1');
  assert.equal(buttons[0].attributes['aria-pressed'],'true');
  assert.equal(buttons[1].attributes['aria-pressed'],'false');
  assert.equal(buttons[2].attributes['aria-pressed'],'false');
  assert.equal(buttons[3].attributes['aria-pressed'],'false');
  assert.equal(buttons[4].attributes['aria-pressed'],'false');
  assert.equal(buttons[5].attributes['aria-pressed'],'false');
  assert.doesNotMatch(elements.rows.innerHTML,/class="filler-row"/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>1<\/b>.*?data-label="Chegar aqui">100,00%<\/td><td data-label="Perder até aqui" class="negative">50%/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>1<\/b>.*?data-label="Lucro após perdas" class="positive">\+1,34<\/td>.*?data-label="Total investido">1,34<\/td>/);
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>10<\/b>/);
  assert.equal(elements.continueLoss.textContent,'0,0977%');
  assert.equal(elements.continueOneIn.textContent,'1 em 1024');
  assert.equal(elements.continueOdds.textContent,'Sem losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'10 tentativas sem fillers');
});

test('cinco fillers ocupam as primeiras cinco losses e a progressão começa na loss 6',()=>{
  const {elements,buttons}=calculator();
  buttons[5].click();
  assert.equal(elements.lossStreak.value,'5');
  assert.equal(elements.maxLoss.min,'6');
  assert.equal(buttons[3].attributes['aria-pressed'],'false');
  assert.equal(buttons[4].attributes['aria-pressed'],'false');
  assert.equal(buttons[5].attributes['aria-pressed'],'true');
  assert.equal([...elements.rows.innerHTML.matchAll(/class="filler-row/g)].length,5);
  assert.match(elements.rows.innerHTML,/class="filler-row"><td data-label="Loss"><b>5<\/b><span class="filler-badge">Filler<\/span>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>6<\/b>/);
  assert.equal(elements.continueOdds.textContent,'Inclui 5 losses com fillers');
  assert.equal(elements.fullStreakOdds.textContent,'5 fillers + 5 tentativas');
});

test('o preço de cada filler entra no lucro, capital e tabela',()=>{
  const {elements}=calculator();
  elements.fillerPrice.value='.50';
  elements.fillerPrice.listeners.input();
  assert.equal(elements.currentTotalProfit.textContent,'−0,16 tokens');
  assert.equal(elements.currentTotalRoi.textContent,'−5,63% total');
  assert.equal(elements.bankroll.textContent,'278,93 tokens');
  assert.match(elements.rows.innerHTML,/^<tr class="filler-row">.*?data-label="Preço usado">0,50<\/td>.*?data-label="Lucro após perdas" class="negative">−0,50<\/td>.*?data-label="Total investido">0,50<\/td>/);
  assert.match(elements.rows.innerHTML,/class="filler-row">.*?<b>3<\/b>.*?data-label="Lucro após perdas" class="negative">−1,50<\/td>.*?data-label="Total investido">1,50<\/td>/);
  assert.match(elements.rows.innerHTML,/<tr><td data-label="Loss"><b>4<\/b>.*?data-label="Lucro após perdas" class="negative">−0,16<\/td>.*?data-label="Total investido">2,84<\/td>/);
});

test('repor valores restaura a loss máxima para 10',()=>{
  const {elements}=calculator();
  elements.maxLoss.value='18';
  elements.maxLoss.listeners.input();
  elements.reset.listeners.click();
  assert.equal(Number(elements.maxLoss.value),10);
  assert.equal(elements.finalStreak.textContent,'10 losses');
  assert.match(elements.rows.innerHTML,/data-label="Loss"><b>10<\/b>/);
  assert.doesNotMatch(elements.rows.innerHTML,/data-label="Loss"><b>11<\/b>/);
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

test('o planeador calcula o maior preço inicial dentro do capital',()=>{
  const {elements}=calculator();
  elements.affordForm.listeners.submit({preventDefault(){}});
  assert.equal(elements.plannerError.hidden,true);
  assert.equal(elements.plannerResult.hidden,false);
  assert.equal(elements.calculatedPrice.textContent,'1,34 tokens');
  assert.equal(elements.calculatedTarget.textContent,'Item alvo a 50%: 2,68 tokens');
  assert.match(elements.calculatedBreakdown.textContent,/Capital usado: 278,24 de 278,24 tokens/);
  assert.match(elements.calculatedBreakdown.textContent,/3 fillers \+ 7 tentativas/);
  assert.match(elements.calculatedBreakdown.textContent,/perder a streak: 0,0977%/);
});

test('aplicar o plano atualiza preços, chance e loss máxima',()=>{
  const {elements}=calculator();
  elements.capitalLimit.value='100';
  elements.affordableLosses.value='8';
  elements.planChance.value='40';
  elements.affordForm.listeners.submit({preventDefault(){}});
  elements.applyPlan.listeners.click();
  assert.equal(elements.chance.value,'40');
  assert.equal(elements.maxLoss.value,'8');
  assert.equal(Number(elements.price2.value),Math.round((Number(elements.price1.value)/.4+Number.EPSILON)*100)/100);
  assert.equal(elements.finalStreak.textContent,'8 losses');
  assert.ok(Number(elements.bankroll.textContent.replace(',','.').split(' ')[0])<=100);
});

test('o planeador valida uma streak maior do que os fillers',()=>{
  const {elements}=calculator();
  elements.affordableLosses.value='3';
  elements.affordForm.listeners.submit({preventDefault(){}});
  assert.equal(elements.plannerResult.hidden,true);
  assert.equal(elements.plannerError.hidden,false);
  assert.equal(elements.plannerError.textContent,'Com 3 fillers, escolhe pelo menos 4 losses.');
});

test('a progressão marca em laranja a última loss antes de metade do capital',()=>{
  const {elements}=calculator();
  assert.match(elements.rows.innerHTML,/<tr class="stop-loss-row"><td data-label="Loss"><b>9<\/b><span class="stop-loss-badge">Stop loss recomendada<\/span>/);
  assert.match(elements.stopLossNote.textContent,/parar após a loss 9, com 126,31 tokens usados/);
  assert.match(elements.stopLossNote.textContent,/metade \(139,12\)/);
  assert.equal([...elements.rows.innerHTML.matchAll(/stop-loss-row/g)].length,1);
});

test('alterar o capital move imediatamente a stop loss recomendada',()=>{
  const {elements}=calculator();
  elements.capitalLimit.value='100';
  elements.capitalLimit.listeners.input();
  assert.match(elements.rows.innerHTML,/<tr class="stop-loss-row"><td data-label="Loss"><b>7<\/b><span class="stop-loss-badge">Stop loss recomendada<\/span>/);
  assert.match(elements.stopLossNote.textContent,/parar após a loss 7, com 25,86 tokens usados/);
  assert.match(elements.stopLossNote.textContent,/metade \(50,00\)/);
});
