
const express = require('express');
const router = express.Router();
const conexao = require('../database');
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const autorizacao = req.headers.authorization;

    if (!autorizacao) {
        return res.status(401).json({
            mensagem: 'Acesso não autorizado.'
        });
    }

    const token = autorizacao.split(' ')[1];

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (erro) {
        return res.status(401).json({
            mensagem: 'Token inválido ou expirado.'
        });
    }
}

// Listar produtos disponíveis
router.get('/', verificarToken, async (req, res) => {
    try {
        const [produtos] = await conexao.promise().query(
            'SELECT * FROM produtos WHERE disponivel = 1 ORDER BY nome'
        );

        res.json(produtos);

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao carregar produtos.'
        });
    }
});
// Cadastrar novo produto
router.post('/', verificarToken, async (req, res) => {
    const { nome, categoria, preco } = req.body;

    if (!nome || !categoria || preco === undefined ||
        !Number.isFinite(Number(preco)) || Number(preco) <= 0) {
        return res.status(400).json({
            mensagem: 'Preencha nome, categoria e um preço válido.'
        });
    }

    try {
        const [resultado] = await conexao.promise().query(
            `INSERT INTO produtos (nome, categoria, preco, disponivel)
             VALUES (?, ?, ?, 1)`,
            [nome.trim(), categoria.trim(), Number(preco)]
        );

        res.status(201).json({
            mensagem: 'Produto cadastrado com sucesso!',
            produto_id: resultado.insertId
        });

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao cadastrar produto.'
        });
    }
});

// Editar produto
router.put('/:id', verificarToken, async (req, res) => {
    const id = Number(req.params.id);
    const { nome, categoria, preco } = req.body;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            mensagem: 'ID do produto inválido.'
        });
    }

    if (!nome || !categoria || preco === undefined ||
        !Number.isFinite(Number(preco)) || Number(preco) <= 0) {
        return res.status(400).json({
            mensagem: 'Preencha nome, categoria e um preço válido.'
        });
    }

    try {
        const [resultado] = await conexao.promise().query(
            `UPDATE produtos
             SET nome = ?, categoria = ?, preco = ?
             WHERE id = ?`,
            [nome.trim(), categoria.trim(), Number(preco), id]
        );

        if (resultado.affectedRows === 0) {
            const [produtos] = await conexao.promise().query(
                'SELECT id FROM produtos WHERE id = ?',
                [id]
            );

            if (produtos.length === 0) {
                return res.status(404).json({
                    mensagem: 'Produto não encontrado.'
                });
            }
        }

        res.json({
            mensagem: 'Produto atualizado com sucesso!'
        });

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao atualizar produto.'
        });
    }
});

// Alterar disponibilidade do produto
router.put('/:id/disponibilidade', verificarToken, async (req, res) => {
    const id = Number(req.params.id);
    const { disponivel } = req.body;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            mensagem: 'ID do produto inválido.'
        });
    }

    if (typeof disponivel !== 'boolean') {
        return res.status(400).json({
            mensagem: 'Disponibilidade inválida.'
        });
    }

    try {
        const [resultado] = await conexao.promise().query(
            'UPDATE produtos SET disponivel = ? WHERE id = ?',
            [disponivel ? 1 : 0, id]
        );

        if (resultado.affectedRows === 0) {
            const [produtos] = await conexao.promise().query(
                'SELECT id FROM produtos WHERE id = ?',
                [id]
            );

            if (produtos.length === 0) {
                return res.status(404).json({
                    mensagem: 'Produto não encontrado.'
                });
            }
        }

        res.json({
            mensagem: disponivel
                ? 'Produto ativado com sucesso!'
                : 'Produto desativado com sucesso!'
        });

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao alterar disponibilidade.'
        });
    }
});
// Listar todos os produtos, disponíveis e indisponíveis
router.get('/todos', verificarToken, async (req, res) => {
    try {
        const [produtos] = await conexao.promise().query(
            'SELECT * FROM produtos ORDER BY nome'
        );

        res.json(produtos);

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao carregar todos os produtos.'
        });
    }
});
module.exports = router;
