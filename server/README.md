# API dos moradores

## Instalação

Execute este comando na pasta principal do projeto, onde está o `package.json`.

```bash
npm install
```

## Execução separada

```bash
npm run start:moradores
```

A API fica disponível em `http://localhost:3002`.

Principais rotas:

- `POST /api/moradores/cadastro`
- `POST /api/moradores/login`
- `GET /api/moradores/me/encomendas`
- `GET /api/moradores/me/notificacoes`
- `GET /api/moradores/me/reservas`
- `POST /api/moradores/me/reservas`

As encomendas registradas pela portaria chegam em `/api/portaria/encomendas`, geram notificação no aplicativo e enviam e-mail quando o SMTP estiver configurado.

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e opcionalmente `SMTP_FROM` para envio real. Sem essas variáveis, o servidor registra o e-mail em modo simulado.
