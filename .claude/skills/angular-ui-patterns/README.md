# Pádraos de IU angulares

Modernos blocos de interface para a construção de aplicações Angulares robustas otimizadas para agentes de IA e LLMs.

## Visão geral

Esta disponibilidade abre os padrões essenciais de UI para:

- **Estados de carga - Árvores de decisão esqueleto vs spinner
- ** Tratamento de erros** - Hierarquia e recuperação de limites de erros
- ** Divulgação progressiva** - Usando `@defer`@@ para renderização preguiçosa
- ** Data Display** - Manuseando estados vazios, carregando e erro
- **Padriões de forma** - estados de submissão e feedback de validação
- ** Dialog/Modal Padrões** - Gerenciamento adaptado do ciclo de vida do diário

## Principais

1. ** Nunca mostra UI velha** Mostrar apenas o transporte quando não existe dados
2. ** Superfície todos os erros** - Nunca falhar silenciosamente
3. ** Atualizações otimistas** - Atualizar UI antes que o servidor confirma
4. ** Divulgação progressiva** - Uso `@defer` para carregar conteúdo não crítico
5. **Graceful degradation** - Fallback for failed features

## Estrutura

O arquivo @ @ CODE0@@ inclui:

1. ** Regras de Ouro** - Pádras não negociáveis a seguir
2. ** Árvores de decisão** - Quanto usar esqueleto vs spinner
3. ** Exemplos de Código** - Implementação correta vs incorreta
4. ** Anti-padrões** - Erros comuns a evitar

## Referência Rápida

```html
<!-- Angular template pattern for data states -->
@if (error()) {
<app-error-state [error]="error()" (retry)="load()" />
} @else if (loading() && !data()) {
<app-skeleton-state />
} @else if (!data()?.length) {
<app-empty-state message="No items found" />
} @else {
<app-data-display [data]="data()" />
}
```

## Versão

Versão atual: 1.0.0 (fevereiro de 2026)

## Referências

- [Angular @defer](https://angular.dev/guide/defer)
- [Angular Templates](https://angular.dev/guide/templates)
