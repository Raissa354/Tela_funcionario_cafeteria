
const mysql = require('mysql2');

const conexao = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafeteria',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

conexao.getConnection((erro, connection) => {
    if (erro) {
        console.log('Erro ao conectar ao MySQL:', erro.message);
        return;
    }

    console.log('Conectado ao banco de dados cafeteria!');
    connection.release();
});

module.exports = conexao;
