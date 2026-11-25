console.log('Arquivo criarFuncionario iniciado!');
require('dotenv').config();

const bcrypt = require('bcrypt');
const conexao = require('./database');

async function criarFuncionario() {
    const nome = 'Funcionário';
    const email = 'funcionario@cafeteria.com';

    // Troque pelo e-mail e pela senha que você escolher.
    const senha = 'cafe!';

    
    try {
        const hash = await bcrypt.hash(senha, 10);

        await conexao.promise().query(
            'INSERT INTO funcionarios (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, hash]
        );

        console.log('Funcionário cadastrado com sucesso!');

    } catch (erro) {
        console.log('Erro ao cadastrar funcionário:', erro.message);

    } finally {
        conexao.end();
    }
}

criarFuncionario();
