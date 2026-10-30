# Arquitetura — Kurio NFT Marketplace

## Visão geral

Aplicação React/TypeScript em camadas, executada no navegador com uma API REST simulada pelo MSW. Não há servidor de produção, conexão blockchain, carteira externa ou gateway de pagamento.

```text
presentation (React, Router, Query)
             ↓
application (use cases e validações)
             ↓
domain (entidades e contratos)
             ↑
infrastructure (Axios, MSW, persistência, Socket.IO)
```

### Responsabilidades

- `domain/`: entidades NFT, conta, carrinho e pedido; interfaces de repositório; erros tipados.
- `application/`: casos de uso independentes de React e DTOs da conta/compra.
- `infrastructure/`: Axios, repositórios REST, cliente Socket.IO, fixtures, handlers MSW e armazenamento local da base simulada.
- `presentation/`: páginas, componentes, layouts, proteção visual de rotas e providers de sessão/tempo real.
- `app/`: bootstrap e configuração de build/runtime.
- `shared/`: tipos e utilitários comuns, sem regras de negócio de tela.

Os dados simulados não são retornados por componentes nem por hooks de tela. O Axios acessa `/api`; os handlers MSW atuam como a API demonstrativa e compartilham o mesmo estado persistido em `localStorage`.

## Contratos REST simulados

Todas as rotas usam JSON; erros seguem `{ "message": string, "code": string }`. Quantidades são inteiras. Preços ETH são strings decimais; cotações usam `BigInt` com escala de 18 casas.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/nfts?q&category&network&min&max&sort&page` | Público | Busca, filtros, ordenação e paginação |
| `GET` | `/api/nfts/:id` | Público | Detalhe |
| `GET` | `/api/auth/session` | Público | Recupera sessão |
| `POST` | `/api/auth/register` | Público | Cadastro; `409` para conflito |
| `POST` | `/api/auth/login` | Público | Login com credenciais fictícias |
| `POST` | `/api/auth/logout` | Sessão | Logout |
| `GET` / `PUT` | `/api/favorites`, `/api/favorites/:id` | Sessão | Consulta/toggle de favorito |
| `GET` | `/api/cart` | Público | Carrinho do visitante ou usuário corrente |
| `PUT` / `DELETE` | `/api/cart/items/:id` | Público | Define quantidade (`0` remove) |
| `POST` | `/api/quote` | Público | Valida cupom, disponibilidade e totais |
| `POST` | `/api/orders` | Sessão | Cria/recupera pedido; exige header `Idempotency-Key` |
| `GET` | `/api/orders/:id` | Dono do pedido | Recupera status e snapshot |
| `GET` / `PUT` | `/api/profile` | Sessão | Consulta/atualiza perfil |
| `PUT` | `/api/profile/password` | Sessão | Altera senha sem persistir valor claro |
| `GET` / `POST` / `PUT` | `/api/wallets`, `/api/wallets/:id` | Sessão | Lista, cadastra e atualiza carteiras |
| `PUT` | `/api/mock/scenario` | Demonstração | Seleciona o cenário do MSW |
| `POST` | `/api/mock/reset` | Demonstração | Restaura fixtures e sessão |

O handler de pedido valida usuário, carteira, itens do carrinho, estoque e cotação mais recente antes de criar a compra. Reutilizar uma chave com o mesmo conteúdo recupera o pedido; reutilizá-la com conteúdo diferente retorna conflito. `timeout-after-order` persiste o pedido antes de simular erro de rede, exercitando a recuperação idempotente.

## Sessão, carrinho e persistência

- A sessão simulada guarda somente o identificador do usuário na base local; a consulta de sessão popula o cache TanStack Query.
- As contas de demonstração e os cadastros guardam uma representação hash das senhas, não o texto informado. O hash é apenas demonstrativo e não é adequado para autenticação real.
- O carrinho visitante fica na chave `guest`; no login, seus itens são combinados com o carrinho da conta e limitados pelo estoque.
- O logout invalida o cache privado. Chaves de perfil, carteiras, favoritos e pedidos incluem a identidade do usuário ou são limpas na troca de conta.
- A base local contém NFTs, contas, sessão, carrinhos, favoritos, carteiras, cenários e pedidos. Limpar os dados do site também restaura o estado inicial na próxima carga.
- A persistência é global à origem e ao perfil do navegador, não representa isolamento multiusuário de um servidor real.

## Cache, erros e sincronização

- Catálogo: chave `['nfts', search]`, incluindo todos os parâmetros serializados pela URL; consultas aceitam `AbortSignal`.
- Detalhe: `['nft', id]`; perfil, carteiras e favoritos são particionados por usuário.
- Queries ficam frescas por 20 segundos; queries transitórias podem ter uma tentativa adicional. Erros `4xx` e mutations não são repetidos automaticamente.
- Favoritos usam atualização otimista com rollback se o handler falhar.
- Quantidades, cupom, cotação e pedido atualizam/invalidate as queries afetadas. Erros do Axios são apresentados na interface; `401` invalida a sessão e limpa dados privados em cache.
- Checkout obtém nova cotação antes de criar pedido e compara subtotal, desconto, taxa, total e versão. Uma cotação diferente interrompe a compra e exige revisão/novo aceite.

## Socket.IO e MSW

O cliente usa `socket.io-client` pelo transporte Engine.IO polling no caminho `/socket.io`, evitando depender de uma conexão WebSocket real no ambiente simulado. Os handlers MSW implementam o handshake, os polls, os heartbeats e os eventos Socket.IO usados pela aplicação. O transporte é intencionalmente local/simulado e cobre apenas o namespace padrão, eventos de texto e os comandos `subscribe` e `mock.triggerPriceChange`.

| Evento | Payload relevante | Efeito |
|---|---|---|
| `nft.updated` | `eventId`, `resourceId`, `version`, `nft` | Atualiza cache do catálogo/detalhe, invalida carrinho e anuncia mudança |
| `order.updated` | `eventId`, `resourceId`, `version`, `status` | Consulta o pedido REST e apresenta pendente, confirmado ou recusado |

O cliente ignora versões repetidas/antigas. A conexão de catálogo invalida os recursos ativos após reconectar; a página de pedido assina o recurso e também consulta REST periodicamente enquanto pendente. O servidor só processa uma transição de pedido pendente; estados terminais não regridem.

## Interface, acessibilidade e limitações

Os estilos Tailwind estão disponíveis e os componentes de interface seguem o padrão visual shadcn/ui (tokens e componentes locais, sem dependência de um tema remoto). A composição usa fundo escuro, tons de cobre, cards e tipografia monoespaçada em desktop e mobile. Os arquivos fornecidos em `assets/` são capturas de tela do layout, não uma família de artes avulsas; os dados de catálogo reutilizam esses arquivos como imagens demonstrativas. Não foram fornecidos arquivos de fonte, então a tipografia usa `Courier New` como fallback.

Inputs têm labels, controles têm nomes acessíveis, foco por teclado permanece visível e skeletons respeitam `prefers-reduced-motion`. A navegação mobile tem acesso persistente às rotas principais e os filtros expõem controles próprios.

O produto é um frontend de demonstração, não uma solução de produção: estado MSW/localStorage não deve ser compartilhado entre usuários reais; senhas fictícias não usam KDF de produção; a conexão de carteira não assina transações; taxa e conversão não representam cotação financeira; relatórios Lighthouse e deployment público dependem de execução/configuração externa.
