
const express = require('express');
const router = express.Router();
const conexao = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const [funcionarios] = await conexao.promise().query(
            'SELECT * FROM funcionarios WHERE email = ?',
            [email]
        );

        if (funcionarios.length === 0) {
            return res.status(401).json({
                mensagem: 'E-mail ou senha incorretos.'
            });
        }

        const funcionario = funcionarios[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            funcionario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: 'E-mail ou senha incorretos.'
            });
        }

        const token = jwt.sign(
            { id: funcionario.id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensagem: 'Login realizado com sucesso!',
            token
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({
            mensagem: 'Erro ao realizar login.'
        });
    }
});

module.exports = router;
