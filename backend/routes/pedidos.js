
const express = require('express');
const router = express.Router();
const conexao = require('../database');
const jwt = require('jsonwebtoken');

// Verificar se o funcionário está autenticado
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

// Listar pedidos

// Listar pedidos com seus produtos
router.get('/', verificarToken, async (req, res) => {
    try {
        const [pedidos] = await conexao.promise().query(
            'SELECT * FROM pedidos ORDER BY data_pedido DESC'
        );

        for (const pedido of pedidos) {
            const [itens] = await conexao.promise().query(
                `SELECT
                    produtos.nome AS nome_produto,
                    itens_pedido.quantidade,
                    itens_pedido.preco_unitario
                FROM itens_pedido
                INNER JOIN produtos
                    ON itens_pedido.produto_id = produtos.id
                WHERE itens_pedido.pedido_id = ?`,
                [pedido.id]
            );

            pedido.itens = itens;
        }

        res.json(pedidos);

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao carregar pedidos.'
        });
    }
});


// Cadastrar pedido de entrega
router.post('/', verificarToken, async (req, res) => {
    const {
        nome_cliente,
        endereco,
        bloco,
        email,
        telefone,
        observacoes,
        itens
    } = req.body;

    if (!nome_cliente || !endereco || !email || !telefone) {
        return res.status(400).json({
            mensagem: 'Preencha os dados obrigatórios do cliente.'
        });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({
            mensagem: 'Selecione pelo menos um produto.'
        });
    }

    const conexaoPedido = await conexao.promise().getConnection();

    try {
        await conexaoPedido.beginTransaction();

        let valorTotal = 0;
        const itensValidados = [];

        for (const item of itens) {
            const produtoId = Number(item.produto_id);
            const quantidade = Number(item.quantidade);

            if (!Number.isInteger(produtoId) ||
                !Number.isInteger(quantidade) ||
                quantidade < 1) {
                throw new Error('Produto ou quantidade inválida.');
            }

            const [produtos] = await conexaoPedido.query(
                'SELECT id, preco FROM produtos WHERE id = ? AND disponivel = 1',
                [produtoId]
            );

            if (produtos.length === 0) {
                throw new Error('Um dos produtos não está disponível.');
            }

            const preco = Number(produtos[0].preco);

            valorTotal += preco * quantidade;

            itensValidados.push({
                produto_id: produtoId,
                quantidade,
                preco_unitario: preco
            });
        }

        const [resultado] = await conexaoPedido.query(
            `INSERT INTO pedidos
            (nome_cliente, endereco, bloco, email, telefone,
             observacoes, valor_total)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nome_cliente,
                endereco,
                bloco || null,
                email,
                telefone,
                observacoes || null,
                valorTotal
            ]
        );

        const pedidoId = resultado.insertId;

        for (const item of itensValidados) {
            await conexaoPedido.query(
                `INSERT INTO itens_pedido
                (pedido_id, produto_id, quantidade, preco_unitario)
                VALUES (?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.produto_id,
                    item.quantidade,
                    item.preco_unitario
                ]
            );
        }

        await conexaoPedido.commit();

        res.status(201).json({
            mensagem: 'Pedido cadastrado com sucesso!',
            pedido_id: pedidoId,
            valor_total: valorTotal
        });

    } catch (erro) {
        await conexaoPedido.rollback();

        console.log(erro);

        res.status(500).json({
            mensagem: erro.message || 'Erro ao cadastrar pedido.'
        });

    } finally {
        conexaoPedido.release();
    }
});
// Excluir pedido
router.delete('/:id', verificarToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            mensagem: 'ID inválido.'
        });
    }

    const conexaoPedido = await conexao.promise().getConnection();

    try {
        await conexaoPedido.beginTransaction();

        await conexaoPedido.query(
            'DELETE FROM itens_pedido WHERE pedido_id = ?',
            [id]
        );

        const [resultado] = await conexaoPedido.query(
            'DELETE FROM pedidos WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            await conexaoPedido.rollback();

            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        await conexaoPedido.commit();

        res.json({
            mensagem: 'Pedido excluído com sucesso.'
        });

    } catch (erro) {
        await conexaoPedido.rollback();

        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao excluir pedido.'
        });

    } finally {
        conexaoPedido.release();
    }
});

// Atualizar status do pedido
router.put('/:id/status', verificarToken, async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    const statusPermitidos = [
        'Pendente',
        'Em preparo',
        'Saiu para entrega',
        'Entregue'
    ];

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            mensagem: 'ID do pedido inválido.'
        });
    }

    if (!statusPermitidos.includes(status)) {
        return res.status(400).json({
            mensagem: 'Status inválido.'
        });
    }

    try {
        const [resultado] = await conexao.promise().query(
            'UPDATE pedidos SET status = ? WHERE id = ?',
            [status, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        res.json({
            mensagem: 'Status atualizado com sucesso!'
        });

    } catch (erro) {
        console.log(erro);

        res.status(500).json({
            mensagem: 'Erro ao atualizar status.'
        });
    }
});
module.exports = router;
