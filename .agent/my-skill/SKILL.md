SKILL ATIVA — REACT SAFE ARCHITECTURE

Esta skill deve ser aplicada ANTES de qualquer alteração no frontend React.
As regras abaixo são imutáveis.

========================================
REGRAS FUNDAMENTAIS
========================================

1. Hooks (useState, useEffect, useContext, etc):
   - Devem ser chamados sempre no topo do componente.
   - Nunca podem estar dentro de if, loops ou condições.
   - Devem ser executados sempre na mesma ordem em todos os renders.

2. Providers e Contexts:
   - Providers NÃO podem ser montados ou desmontados condicionalmente.
   - Devem existir sempre na árvore principal da aplicação.

3. Fluxo de renderização:
   - Hooks controlam estado.
   - Estado controla JSX.
   - JSX nunca controla a existência de hooks.

4. Autenticação:
   - Utilizar estados explícitos: loading | authenticated | unauthenticated.
   - Nunca usar return antecipado antes da declaração de hooks.

========================================
PROIBIÇÕES ABSOLUTAS
========================================

- Não criar hooks dentro de if.
- Não usar return antes dos hooks.
- Não envolver Providers em condições.
- Não “resolver” erros mascarando sintomas.

========================================
OBRIGAÇÃO
========================================

Se alguma solicitação violar estas regras:
- NÃO implementar.
- Explicar o conflito.
- Propor alternativa estrutural segura.
