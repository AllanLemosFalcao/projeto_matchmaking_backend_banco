# Plataforma Matchmaking - Backend

Backend desenvolvido em Node.js com TypeScript, utilizando Prisma ORM e MySQL para gerenciar a conexão entre startups e investidores.

---

## 🚀 Tecnologias Utilizadas

- **Node.js** (Ambiente de execução)
- **TypeScript** (Linguagem de tipagem estática)
- **Express** (Framework web)
- **Prisma ORM** (Mapeamento objeto-relacional)
- **MySQL** (Banco de dados relacional)

---

## 📋 Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)
- [MySQL](https://www.devmedia.com.br/como-instalar-o-mysql/38115) (Rodando localmente na porta `3306`)
- Um gerenciador de banco de dados (como MySQL Workbench ou DBeaver)

---

## ⚙️ Passo a Passo para Configuração e Execução

### 1. Clonar o repositório ou abrir a pasta do projeto
Abra o terminal na pasta raiz do projeto `projeto-matchmaking`.

### 2. Instalar as dependências
Execute o comando abaixo para instalar todas as bibliotecas necessárias listadas no `package.json`:
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto (caso ainda não exista) e adicione a string de conexão com o seu banco de dados MySQL:
```env
DATABASE_URL="mysql://root:@localhost:3306/plataforma_matchmaking"
```
*(Ajuste o usuário `root` e a senha caso tenha configurado uma credencial personalizada no seu MySQL).*

### 4. Criar o Banco de Dados no MySQL
Abra o seu cliente MySQL e crie o banco de dados caso ele ainda não exista:
```sql
CREATE DATABASE plataforma_matchmaking;
```
*(Nota: Se você possuir um arquivo de dump como o `modelo_er_matchmaking.sql`, importe-o para este banco antes de prosseguir).*

### 5. Sincronizar e Gerar o Prisma Client
Execute o comando de introspecção para mapear as tabelas do banco e atualizar o `schema.prisma`:
```bash
npx prisma db pull
```

Em seguida, gere o cliente Prisma para criar as tipagens em TypeScript:
```bash
npx prisma generate
```

### 6. Executar o Servidor em Modo de Desenvolvimento
Com tudo configurado, inicie a aplicação com o comando:
```bash
npm run dev
```

O servidor será iniciado (geralmente na porta padrão configurada no seu código) e estará pronto para receber requisições.

---

## 📂 Scripts Disponíveis no `package.json`

- `npm run dev`: Inicia o servidor em modo de desenvolvimento utilizando `nodemon`.
- `npm run build`: Compila os arquivos TypeScript da pasta `src` para JavaScript na pasta `dist`.
- `npm start`: Executa a aplicação compilada em modo de produção.
- `npx prisma generate`: Atualiza as tipagens do Prisma Client.
- `npx prisma db pull`: Atualiza o `schema.prisma` com base nas alterações feitas diretamente no banco de dados.