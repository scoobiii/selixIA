# SELIX sobre Vortex — validação

> **GOS3 · agente: GPT · papel: Maintainer / Engineering Agent**
>
> Objetivo: permitir que um usuário ou agente entenda exatamente como validar a execução do SELIX através do Vortex.

## O que está sendo validado

O fluxo de referência é:

```text
SELIX
  -> Vortex invocation
  -> action: selix.selic1d
  -> execução
  -> execution proof
  -> GOS3/CI gate
```

O resultado de cálculo deve ser determinístico para os mesmos inputs. O proof de execução deve ser verificável; `simulated`, `mocked` ou `not_executed` não contam como sucesso.

## Validação rápida

A implementação de referência e seu teste estão no repositório Vortex, PR #26.

No Vortex, execute o teste de proof definido em:

```text
src/agents/selix/tests/selic1d.test.ts
```

O CI `gos3-compliance` também executa o gate `SELIX / SELIC 1D`.

## Resultado esperado

Para o fixture determinístico:

| Campo | Esperado |
|---|---:|
| SELIC atual | 14.25% |
| SELIX 1D | 9.25% |
| diferencial | 5.00 p.p. |
| IPCA proxy | 4.50% |
| juro real atual | 9.75% |
| juro real 1D | 4.75% |

O proof deve conter `executed: true`, `gate: PASS`, `claim: executed`, `exit_code: 0`, `input_hash` SHA-256 e `output_hash` SHA-256.

## Validação de agente

Um agente deve conferir, no mínimo:

1. `action == selix.selic1d`;
2. `executed == true`;
3. `gate == PASS`;
4. `claim == executed`;
5. `exit_code == 0`;
6. `input_hash` e `output_hash` presentes e com 64 caracteres;
7. mesmo input produz o mesmo resultado e os mesmos hashes;
8. `dry_run` produz `executed == false`, `claim == not_executed` e não passa o gate.

## Importante: dois repositórios

Este arquivo documenta o contrato de integração no **SELIX**. A implementação executável do adapter/proof permanece no **Vortex**. Assim, o usuário pode começar pelo SELIX, seguir a referência para o Vortex e validar o resultado no CI do Vortex.

A validação não afirma que dados externos foram consultados: o teste de integração é determinístico. Dados reais (BCB/STN/Serasa/CVM/B3) devem ser tratados como uma etapa separada, preservando o proof.

## Evidência

Uma validação aceita somente quando houver evidência de execução. O princípio do Vortex é: execução real -> telemetria -> hash/proof -> gate. Nunca transformar aceitação ou simulação em `success`.
