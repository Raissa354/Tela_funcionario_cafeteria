
const formulario = document.getElementById('formProduto');
const mensagem = document.getElementById('mensagem');
const listaProdutos = document.getElementById('listaProdutos');

const token = sessionStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

// Cadastrar produto
formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dados = {
        nome: document.getElementById('nome').value,
        categoria: document.getElementById('categoria').value,
        preco: Number(document.getElementById('preco').value)
    };

    try {
        const resposta = await fetch('/api/produtos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        mensagem.textContent = resultado.mensagem;

        if (resposta.ok) {
            formulario.reset();
            await carregarProdutos();
        }

    } catch (erro) {
        console.log(erro);
        mensagem.textContent = 'Erro ao cadastrar produto.';
    }
});

// Listar todos os produtos
async function carregarProdutos() {
    try {
        const resposta = await fetch('/api/produtos/todos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao carregar produtos.');
        }

        const produtos = await resposta.json();

        listaProdutos.innerHTML = '';

        produtos.forEach(produto => {
            const item = document.createElement('div');

            const titulo = document.createElement('h3');
            titulo.textContent = produto.nome;

            const detalhes = document.createElement('p');
            detalhes.textContent =
                `Categoria: ${produto.categoria} | ` +
                `Preço: R$ ${Number(produto.preco).toFixed(2)} | ` +
                `Disponibilidade: ${produto.disponivel ? 'Disponível' : 'Indisponível'}`;

            // Botão editar
            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';

            botaoEditar.addEventListener('click', () => editarProduto(produto));

            // Botão ativar ou desativar
            const botaoDisponibilidade = document.createElement('button');

            botaoDisponibilidade.textContent =
                produto.disponivel ? 'Desativar' : 'Ativar';

            botaoDisponibilidade.addEventListener('click', () => {
                alterarDisponibilidade(produto);
            });

            item.appendChild(titulo);
            item.appendChild(detalhes);
            item.appendChild(botaoEditar);
            item.appendChild(botaoDisponibilidade);

            listaProdutos.appendChild(item);
        });

        if (produtos.length === 0) {
            listaProdutos.textContent = 'Nenhum produto cadastrado.';
        }

    } catch (erro) {
        console.log(erro);
        listaProdutos.textContent = 'Não foi possível carregar os produtos.';
    }
}

// Editar produto
async function editarProduto(produto) {
    const nome = prompt('Nome do produto:', produto.nome);
    if (nome === null) return;

    const categoria = prompt('Categoria:', produto.categoria);
    if (categoria === null) return;

    const precoTexto = prompt('Preço:', produto.preco);
    if (precoTexto === null) return;

    const preco = Number(precoTexto.replace(',', '.'));

    if (!nome.trim() || !categoria.trim() ||
        !Number.isFinite(preco) || preco <= 0) {
        mensagem.textContent = 'Preencha os dados corretamente.';
        return;
    }

    try {
        const resposta = await fetch(`/api/produtos/${produto.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, categoria, preco })
        });

        const resultado = await resposta.json();
        mensagem.textContent = resultado.mensagem;

        if (resposta.ok) {
            await carregarProdutos();
        }

    } catch (erro) {
        console.log(erro);
        mensagem.textContent = 'Erro ao editar produto.';
    }
}

// Ativar ou desativar produto
async function alterarDisponibilidade(produto) {
    const novaDisponibilidade = !Boolean(produto.disponivel);

    try {
        const resposta = await fetch(
            `/api/produtos/${produto.id}/disponibilidade`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    disponivel: novaDisponibilidade
                })
            }
        );

        const resultado = await resposta.json();
        mensagem.textContent = resultado.mensagem;

        if (resposta.ok) {
            await carregarProdutos();
        }

    } catch (erro) {
        console.log(erro);
        mensagem.textContent = 'Erro ao alterar disponibilidade.';
    }
}

// Voltar aos pedidos
function voltar() {
    window.location.href = 'pedidos.html';
}

// Sair do sistema
function sair() {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Iniciar página
carregarProdutos();
