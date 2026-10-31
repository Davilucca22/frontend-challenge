# Auditoria Lighthouse

Medições executadas em 31/10/2026 sobre o build de produção servido por `vite preview`, com MSW ativo, nas rotas `/` e `/nft/emerald-ape-042`. Foram feitas três medições por rota e perfil; os valores abaixo são as medianas dos relatórios JSON.

## Ambiente

- Windows 10 (build 19045), Node.js 22.14.0 e npm 10.9.2.
- Lighthouse 12.1.0 e Lighthouse CI 0.14.0, via Chromium 156.0.8078.4.
- Perfil desktop do Lighthouse CI e emulação mobile (`emulatedFormFactor: mobile`).
- Artefatos HTML e JSON estão em `reports/lighthouse/` e `reports/lighthouse/mobile/`.
- Reproduza com `npm run build`, `npm run preview`, `npm run audit` e `npm run audit:mobile`. Se o Lighthouse não localizar o Chromium, configure `CHROME_PATH` com o executável local.

## Resultados

Notas de categoria são percentuais. LCP e TBT estão em milissegundos; CLS não tem unidade.

| Perfil | Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | Início | 99 | 100 | 96 | 92 | 788 | 0,000 | 0 |
| Desktop | Detalhe do NFT | 100 | 96 | 96 | 92 | 740 | 0,032 | 0 |
| Mobile | Início | 92 | 98 | 96 | 92 | 3.059 | 0,024 | 36 |
| Mobile | Detalhe do NFT | 91 | 95 | 96 | 92 | 3.128 | 0,024 | 29 |

As quatro páginas atingiram as metas do enunciado: performance ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95 e SEO ≥ 90. Os relatórios individuais preservam a distribuição das três medições e podem variar ligeiramente entre máquinas.

