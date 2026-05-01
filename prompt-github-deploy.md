Preciso subir o projeto no GitHub e depois fazer deploy na Vercel. Execute em sequência:

1. Verifique se o git já está iniciado no projeto:
   git status
   Se não estiver, rode: git init

2. Verifique se existe .gitignore com .env.local listado:
   - Se não existir, crie um .gitignore com:
     .env.local
     .env
     node_modules/
     .next/
   - IMPORTANTE: nunca commitar o .env.local com as credenciais

3. Faça o commit inicial:
   git add .
   git commit -m "feat: Busca Livre - MVP completo"

4. Verifique se o GitHub CLI está instalado:
   gh --version
   Se não estiver, instale: winget install GitHub.cli
   Após instalar, faça login: gh auth login
   (escolha GitHub.com → HTTPS → autenticar pelo browser)

5. Crie o repositório no GitHub e suba o código:
   gh repo create busca-livre --public --source=. --remote=origin --push

6. Confirme que o push funcionou e me informe:
   - A URL do repositório no GitHub (ex: https://github.com/seu-usuario/busca-livre)
   - Que o .env.local NÃO foi enviado para o GitHub
