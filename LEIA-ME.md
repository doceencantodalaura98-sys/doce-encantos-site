# Doce Encantos — Site de Vendas + Painel Administrativo

Site completo para venda de alfajores, com carrinho de compras, checkout e um
painel administrativo (estilo SAP) para controlar estoque, vendas e caixa.

## Estrutura de arquivos

```
doce-encantos-site/
├── index.html              -> Loja (página de vendas)
├── pedido.html              -> Página para o cliente acompanhar o pedido
├── css/style.css            -> Estilo da loja
├── js/data.js                -> Camada de dados (produtos, pedidos, caixa)
├── js/store.js               -> Lógica do carrinho e checkout
├── assets/logo.png           -> Sua logo
└── admin/                    -> Painel administrativo (área restrita)
    ├── login.html
    ├── dashboard.html
    ├── vendas.html
    ├── estoque.html
    ├── caixa.html
    ├── configuracoes.html
    ├── css/admin.css
    └── js/admin.js
```

## Como abrir o site

**Importante:** não abra os arquivos direto clicando duas vezes (protocolo
`file://`), pois alguns navegadores bloqueiam o armazenamento de dados nesse
modo. Use um servidor local ou publique em uma hospedagem.

### Testar no seu computador
Com Python instalado, abra um terminal na pasta do site e rode:
```
python3 -m http.server 8000
```
Depois acesse `http://localhost:8000` no navegador.

### Publicar de verdade
Você pode hospedar gratuitamente em serviços como Netlify, Vercel ou GitHub
Pages, ou usar uma hospedagem paga (Hostinger, etc.). Basta enviar todos os
arquivos desta pasta mantendo a mesma estrutura.

## Acesso à área restrita (painel administrativo)

Acesse **admin/login.html** (ou clique em "Área restrita" no rodapé da loja).

- **Usuário:** lalbuquerque
- **Senha:** 090211@ana

No painel você encontra:
- **Dashboard:** vendas do dia, pedidos pendentes, saldo em caixa, gráfico dos
  últimos 7 dias e alerta de estoque baixo.
- **Vendas:** lista de todos os pedidos, com busca/filtro por status. É aqui
  que você marca um pedido como "Pago" (o que lança automaticamente a entrada
  no caixa) ou cancela um pedido (devolve o estoque).
- **Estoque:** cadastro de produtos, com foto, preço normal, preço promocional
  e a partir de quantas unidades a promoção vale, quantidade em estoque e
  alerta de estoque mínimo. Ao cadastrar ou editar um produto, clique em
  "Foto do produto" e escolha uma imagem do seu computador/celular — ela é
  redimensionada e comprimida automaticamente, e passa a aparecer no lugar
  do ícone padrão na loja e no carrinho. Sem foto, o produto continua usando
  o ícone padrão normalmente.
- **Caixa:** saldo atual, total de entradas/saídas e lançamentos manuais
  (ex: compra de ingredientes, retirada, etc.).
- **Configurações:** nome da loja, WhatsApp para receber pedidos, chave Pix,
  taxa de entrega e saldo de abertura do caixa.

## Acompanhamento do pedido pelo cliente

Todo pedido recebe um número (ex: `#DE123456`), mostrado na confirmação da
compra. O cliente pode consultar a situação do pedido a qualquer momento em
**pedido.html** (link "Acompanhar pedido" no menu do site), informando o
número do pedido e o telefone usado na compra — o telefone serve como uma
verificação simples para que outra pessoa não veja os dados de alguém só
adivinhando o número do pedido.

O andamento é mostrado em uma linha do tempo com 3 etapas: **Pedido
recebido** → **Pagamento confirmado** → **Entregue** (ou aparece como
**Cancelado**, se for o caso). Essas etapas avançam automaticamente
conforme você atualiza o status do pedido em **Admin > Vendas** (botões
"Marcar pago" e depois "Marcar entregue").

**Atenção, isso é importante:** como este site não tem servidor nem banco de
dados (é só HTML/CSS/JS), cada navegador guarda seus próprios dados,
mesmo que o site esteja publicado no mesmo endereço para todo mundo.
Publicar o site online **não** faz o celular do cliente "conversar" com o
computador da administração.

Na prática isso significa: o pedido criado no celular do cliente fica
salvo só naquele celular. Quando você (administração) marca esse pedido
como "Pago" ou "Entregue" no seu computador, essa atualização acontece só
no navegador do seu computador — ela **não chega automaticamente** até o
celular do cliente. Ou seja, hoje, a página de acompanhamento só mostra o
status atualizado se for consultada no mesmo navegador/dispositivo em que
as mudanças de status foram feitas.

Isso não invalida a função — o pedido, o número, os itens e o valor
aparecem certinho pra quem consultar de qualquer lugar, então serve bem
como comprovante de pedido — mas o status ("Pago"/"Entregue") só vai
refletir a realidade em tempo real se ambos os lados usarem o mesmo
navegador, ou se você optar por evoluir o site para um banco de dados
compartilhado de verdade (posso te ajudar com isso depois, usando algum
serviço gratuito como Firebase, por exemplo). Sem isso, o WhatsApp
continua sendo o canal confiável para o cliente saber da confirmação do
pedido em tempo real.

## Regra de preço do Alfajor (já configurada)

- 1 unidade: R$ 7,00
- 2 unidades ou mais: R$ 6,00 cada

Você pode alterar esses valores, ou cadastrar novos produtos com suas
próprias regras de preço, em **Estoque > Novo produto**.

## Como funciona o pedido, do início ao fim

1. Cliente escolhe a quantidade e adiciona ao carrinho (o preço já muda
   automaticamente ao atingir 2 unidades).
2. Cliente abre o carrinho e clica em "Finalizar pedido".
3. Preenche nome, WhatsApp, escolhe retirada ou entrega (com endereço) e a
   forma de pagamento (Pix, Dinheiro ou Cartão).
4. Confirma o pedido — nesse momento o estoque já é reservado/baixado e o
   pedido aparece no painel como "Pendente".
5. Na tela de confirmação, o cliente pode clicar em "Enviar pelo WhatsApp"
   (se você tiver configurado seu número em Configurações), o que abre uma
   mensagem pronta com o resumo do pedido para enviar direto pra você.
6. Você confirma o pagamento no painel (Vendas > Marcar pago), o que lança a
   entrada automaticamente no caixa.

## Muito importante: entenda como os dados são guardados

Este é um site 100% front-end (HTML, CSS e JavaScript), **sem servidor nem
banco de dados**. Todos os dados — produtos, pedidos e caixa — ficam salvos
no **armazenamento local do navegador** (localStorage) de quem está com o
site aberto.

Isso tem consequências práticas importantes:

- **Os dados NÃO são compartilhados automaticamente** entre o celular do
  cliente e o computador/celular da administração. O pedido feito pelo
  cliente fica salvo apenas no navegador dele — é por isso que o botão de
  WhatsApp existe: ele é o jeito prático de o pedido realmente chegar até
  você em tempo real.
- Para o **painel administrativo** funcionar de forma consistente (estoque,
  vendas, caixa), sempre acesse pelo **mesmo navegador e mesmo
  dispositivo** que você usa para administrar a loja.
- Se limpar os dados de navegação (cache/cookies) daquele navegador, ou usar
  o modo anônimo, os dados administrativos somem.
- Faça backups periódicos: no painel (ou pelo DevTools do navegador) é
  possível exportar o conteúdo do localStorage se precisar migrar de
  computador.

**Se no futuro você quiser que os pedidos cheguem automaticamente em um só
lugar (ex: de qualquer celular de cliente direto para o seu painel, em tempo
real, com múltiplos usuários administrando ao mesmo tempo), será necessário
adicionar um backend real com banco de dados** — o que está fora do escopo
de um site puramente front-end como este. Se quiser, posso te ajudar a
evoluir para essa versão depois.

## Nota de segurança

Como o login do painel é verificado inteiramente no navegador (JavaScript),
o usuário e a senha ficam visíveis para quem souber olhar o código-fonte do
site. Isso é adequado para uma primeira versão de baixo risco, mas **não é
uma segurança real de produção**. Evite divulgar o link do painel
publicamente e, se a operação crescer, vale migrar para um sistema com
login validado por um servidor.
