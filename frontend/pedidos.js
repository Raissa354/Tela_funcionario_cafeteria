

const formulario = document.getElementById('formPedido');
const mensagem = document.getElementById('mensagem');
const listaPedidos = document.getElementById('listaPedidos');
const listaProdutos = document.getElementById('listaProdutos');

const token = sessionStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

let produtosCarregados = [];

// Formatar valores em reais
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Carregar produtos
async function iniciarProdutos() {
    try {
        const resposta = await fetch('/api/produtos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao buscar produtos.');
        }

        produtosCarregados = await resposta.json();
        listaProdutos.innerHTML = '';

        if (produtosCarregados.length === 0) {
            listaProdutos.textContent = 'Nenhum produto disponível.';
            return;
        }

        produtosCarregados.forEach(produto => {
            const linha = document.createElement('div');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'produto-checkbox';
            checkbox.value = produto.id;
            checkbox.id = `produto-${produto.id}`;

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent =
                `${produto.nome} - ${formatarMoeda(produto.preco)}`;

            const quantidade = document.createElement('input');
            quantidade.type = 'number';
            quantidade.min = '1';
            quantidade.value = '1';
            quantidade.className = 'produto-quantidade';
            quantidade.disabled = true;

            checkbox.addEventListener('change', () => {
                quantidade.disabled = !checkbox.checked;
                calcularTotal();
            });

            quantidade.addEventListener('input', calcularTotal);

            linha.appendChild(checkbox);
            linha.appendChild(label);
            linha.appendChild(document.createTextNode(' Quantidade: '));
            linha.appendChild(quantidade);

            listaProdutos.appendChild(linha);
        });

        const total = document.createElement('p');
        total.id = 'valorTotal';
        total.textContent = 'Valor total: R$ 0,00';
        listaProdutos.appendChild(total);

    } catch (erro) {
        console.log(erro);
        listaProdutos.textContent = 'Não foi possível carregar os produtos.';
    }
}

// Calcular o valor total
function calcularTotal() {
    let total = 0;

    const linhas = listaProdutos.querySelectorAll('div');

    linhas.forEach(linha => {
        const checkbox = linha.querySelector('.produto-checkbox');
        const quantidade = linha.querySelector('.produto-quantidade');

        if (checkbox && checkbox.checked) {
            const produto = produtosCarregados.find(
                p => String(p.id) === checkbox.value
            );

            if (produto) {
                total += Number(produto.preco) *
                    Math.max(1, Number(quantidade.value) || 1);
            }
        }
    });

    const campoTotal = document.getElementById('valorTotal');

    if (campoTotal) {
        campoTotal.textContent =
            `Valor total: ${formatarMoeda(total)}`;
    }
}

// Registrar pedido
formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

        const botaoRegistrar = formulario.querySelector('button[type="submit"]');

    botaoRegistrar.disabled = true;
    botaoRegistrar.textContent = 'Registrando pedido...';


    const itens = [];

    const linhas = listaProdutos.querySelectorAll('div');

    linhas.forEach(linha => {
        const checkbox = linha.querySelector('.produto-checkbox');
        const quantidade = linha.querySelector('.produto-quantidade');

        if (checkbox && checkbox.checked) {
            itens.push({
                produto_id: Number(checkbox.value),
                quantidade: Number(quantidade.value)
            });
        }
    });

    if (itens.length === 0) {
        mensagem.textContent = 'Selecione pelo menos um produto.';
        return;
    }

    const dadosPedido = {
        nome_cliente: document.getElementById('cliente').value,
        endereco: document.getElementById('endereco').value,
        bloco: document.getElementById('bloco').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        observacoes: document.getElementById('observacoes').value,
        itens
    };

    try {
        const resposta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosPedido)
        });

        const dados = await resposta.json();

        mensagem.textContent = dados.mensagem;

        if (resposta.ok) {
            mensagem.textContent =
                `${dados.mensagem} Total: ${formatarMoeda(dados.valor_total)}`;

            formulario.reset();

            await iniciarProdutos();
            await carregarPedidos();
        }

        } catch (erro) {
        console.log(erro);
        mensagem.textContent = 'Erro ao conectar com o servidor.';
    } finally {
        botaoRegistrar.disabled = false;
        botaoRegistrar.textContent = 'Registrar pedido';
    }
});

// Listar pedidos cadastrados
async function carregarPedidos() {
    try {
        const resposta = await fetch('/api/pedidos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao carregar pedidos.');
        }

        const pedidos = await resposta.json();

        listaPedidos.innerHTML = '';

        if (pedidos.length === 0) {
            listaPedidos.textContent = 'Nenhum pedido cadastrado.';
            return;
        }

        pedidos.forEach(pedido => {
            const item = document.createElement('div');

            const titulo = document.createElement('h3');
            titulo.textContent = `Pedido #${pedido.id}`;

            const detalhes = document.createElement('p');

            detalhes.textContent =
                `Cliente: ${pedido.nome_cliente} | ` +
                `Endereço: ${pedido.endereco || 'Não informado'} | ` +
                `Bloco: ${pedido.bloco || 'Não informado'} | ` +
                `E-mail: ${pedido.email || 'Não informado'} | ` +
                `Telefone: ${pedido.telefone || 'Não informado'} | ` +
                `Status: ${pedido.status} | ` +
                `Total: ${formatarMoeda(pedido.valor_total)}`;

            item.appendChild(titulo);
            item.appendChild(detalhes);

            // Alterar status do pedido
const seletorStatus = document.createElement('select');

const statusDisponiveis = [
    'Pendente',
    'Em preparo',
    'Saiu para entrega',
    'Entregue'
];

statusDisponiveis.forEach(status => {
    const opcao = document.createElement('option');
    opcao.value = status;
    opcao.textContent = status;

    if (pedido.status === status) {
        opcao.selected = true;
    }

    seletorStatus.appendChild(opcao);
});

const botaoStatus = document.createElement('button');
botaoStatus.textContent = 'Atualizar status';

botaoStatus.addEventListener('click', async () => {
    try {
        const respostaStatus = await fetch(
            `/api/pedidos/${pedido.id}/status`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: seletorStatus.value
                })
            }
        );

        const dadosStatus = await respostaStatus.json();

        mensagem.textContent = dadosStatus.mensagem;

        if (respostaStatus.ok) {
            await carregarPedidos();
        }

    } catch (erro) {
        console.log(erro);
        mensagem.textContent = 'Erro ao atualizar status.';
    }
});

item.appendChild(document.createTextNode('Alterar status: '));
item.appendChild(seletorStatus);
item.appendChild(botaoStatus);

            // Mostrar produtos do pedido
            const tituloProdutos = document.createElement('h4');
            tituloProdutos.textContent = 'Produtos:';
            item.appendChild(tituloProdutos);

            if (pedido.itens && pedido.itens.length > 0) {
                pedido.itens.forEach(produto => {
                    const detalheProduto = document.createElement('p');

                    detalheProduto.textContent =
                        `${produto.nome_produto} | Quantidade: ${produto.quantidade} | Preço unitário: ${formatarMoeda(produto.preco_unitario)}`;

                    item.appendChild(detalheProduto);
                });
            } else {
                const semProdutos = document.createElement('p');
                semProdutos.textContent = 'Nenhum produto registrado.';
                item.appendChild(semProdutos);
            }
            // Botão para excluir pedido
            const botaoExcluir = document.createElement('button');
            botaoExcluir.textContent = 'Excluir pedido';

            botaoExcluir.addEventListener('click', async () => {
                const confirmar = confirm(
                    `Deseja excluir o pedido #${pedido.id}?`
                );

                if (!confirmar) {
                    return;
                }

                try {
                    const respostaExcluir = await fetch(
                        `/api/pedidos/${pedido.id}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    const dadosExcluir = await respostaExcluir.json();

                    mensagem.textContent = dadosExcluir.mensagem;

                    if (respostaExcluir.ok) {
                        await carregarPedidos();
                    }

                } catch (erro) {
                    console.log(erro);
                    mensagem.textContent = 'Erro ao excluir pedido.';
                }
            });

            item.appendChild(botaoExcluir);

            listaPedidos.appendChild(item);
        });

    } catch (erro) {
        console.log(erro);
        listaPedidos.textContent = 'Não foi possível carregar os pedidos.';
    }
}

// Sair do sistema
function sair() {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Iniciar a tela
iniciarProdutos();
carregarPedidos();

