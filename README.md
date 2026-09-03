# Upgrader Calculator

Calculadora estática para simular upgrades, lucro acumulado e probabilidades de uma loss streak.

## Utilização

Abra `index.html` num navegador ou visite o site publicado no GitHub Pages.

Os cálculos são atualizados automaticamente ao alterar os preços, a probabilidade e as opções da progressão.

Depois dos fillers, cada nível da progressão começa com a chance principal e, se esta falhar, repete o mesmo preço com a **chance após loss**. Enquanto o preço usado for inferior a 100 tokens, acrescenta ainda uma terceira tentativa de 10% antes de aumentar o preço. A partir de 100 tokens, mantém apenas as tentativas principal e reduzida. As tentativas de 30% aparecem a azul e as de 10% a roxo; capital, lucro acumulado e probabilidade consideram cada tentativa individualmente.

O painel **Calcular preço inicial** recebe um capital máximo, o total de losses e a chance da simulação. Calcula, ao cêntimo de token, o maior preço inicial cuja progressão completa não ultrapassa o capital indicado. O resultado pode ser aplicado aos campos principais com um clique e considera os fillers, o preço por filler e o aumento atualmente selecionados.

Na tabela, uma linha laranja assinala a **stop loss recomendada**: a última loss cujo total acumulado ainda não ultrapassa 50% do capital indicado no planeador.

## Acesso

O site verifica a sessão partilhada com `/nexo-login/` antes de mostrar a calculadora. Visitantes sem sessão válida são enviados para o formulário de login e regressam automaticamente após entrar.

Esta proteção controla a navegação normal, mas não torna os ficheiros privados: o GitHub Pages é um alojamento estático e público.

