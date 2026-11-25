require('dotenv').config();

const express = require('express');
const cors = require('cors');
const conexao = require('./database');

const app = express();

const path = require('path');

app.use(express.static(path.join(__dirname, '../frontend')));
// Configurações
app.use(cors());
app.use(express.json());

// Rota de login
app.use('/login', require('./routes/login'));

// Rota de pedidos
app.use('/api/pedidos', require('./routes/pedidos'));

app.use('/api/produtos', require('./routes/produtos'));

// Teste da página inicial
app.get('/', (req, res) => {
    res.send('Sistema da Cafeteria funcionando!');
});

// Teste da conexão com o banco
app.get('/teste-banco', (req, res) => {
    conexao.query('SELECT 1', (erro) => {
        if (erro) {
            return res.status(500).send('Erro ao acessar o banco de dados.');
        }

        res.send('Banco de dados conectado com sucesso!');
    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor da cafeteria rodando na porta 3000!');
});