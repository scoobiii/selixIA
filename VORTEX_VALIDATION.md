# SELIX ↔ Vortex validation

> GOS3 · agente: GPT · Maintainer / Engineering Agent

This is the canonical cross-repository validation procedure.

## Flow

```text
SELIX → expected deterministic result
  ↓
Vortex → selix.selic1d
  ↓
execution evidence + hashes
  ↓
GOS3 gate
  ↓
PASS
```

### From Vortex

```bash
npm install
npm run test:selix
```

The test must report `gate === PASS`, `claim === executed`, `executed === true`, `exit_code === 0`, valid SHA-256 input/output hashes, deterministic output, and a failing gate for `dry_run`.

### From SELIX

SELIX validates its own code with:

```bash
npm install
npm run lint
```

The cross-repository runtime check is executed by the Vortex workflow using the same canonical SELIX test:

```yaml
- name: Gate SELIX / SELIC 1D
  run: npm run test:selix
```

A green Vortex GitHub Actions gate is execution evidence; documentation alone is not evidence.

## PASS criteria

1. SELIX lint/contract checks pass.
2. Vortex `npm run test:selix` passes.
3. GitHub Actions SELIX gate is green.
4. Proof contains valid hashes and `exit_code: 0`.
5. `dry_run` is never reported as successful execution.

## Scope

This proves the deterministic adapter and Vortex execution/proof path. It does not claim a live BCB/STN/Serasa/CVM/B3 pull; live-data integration is separate.

— GOS3 Member · GPT
