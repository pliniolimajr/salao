# Banco de dados do Studio Modesto

As migrações desta pasta são a fonte de verdade do banco. Não altere tabelas diretamente em produção sem registrar a mesma alteração em uma nova migração.

## Aplicação inicial

1. Crie ou selecione o projeto no Supabase.
2. Abra o **SQL Editor**, crie uma nova consulta e execute todo o conteúdo de `migrations/202609240001_initial_schema.sql` uma única vez.
3. Ative o provedor Google em **Authentication > Providers**.
4. Cadastre as URLs local, de homologação e de produção em **Authentication > URL Configuration**.
5. Copie `.env.example` para `.env.local` e preencha somente a URL e a chave anônima.

O arquivo inicial já contém tabelas, índices, funções públicas controladas, políticas RLS, prevenção de conflito de horários e a inclusão da agenda no Supabase Realtime. Não execute versões anteriores do schema antes dele.

## Primeiro acesso administrativo

Todo novo login é criado inativo e sem privilégio administrativo. Depois que a proprietária fizer o primeiro login, execute no SQL Editor:

```sql
update public.profiles
set role = 'ADMIN', active = true
where email = 'email-da-proprietaria@exemplo.com';
```

Não coloque a chave `service_role` em arquivos `VITE_*` ou em qualquer código do navegador.

Depois da promoção do primeiro administrador, saia e entre novamente no portal para atualizar a sessão e o perfil carregado.

## Regras já protegidas no banco

- Agendamentos não podem se sobrepor para o mesmo profissional.
- O horário público funciona de segunda a sábado, das 09h às 18h, no fuso de Salvador.
- Duração e preço são obtidos do serviço no banco, não do navegador.
- Clientes, agenda, financeiro e estoque são acessíveis apenas por perfis ativos.
- A consulta pública de fidelidade retorna somente nome, pontos e estado VIP.
- Comissões e dados internos dos profissionais não são expostos na consulta pública.

Antes da publicação, o endpoint público de agendamento ainda deve receber limitação de tentativas e proteção antispam em uma Edge Function.
