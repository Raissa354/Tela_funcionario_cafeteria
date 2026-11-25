
const formulario = document.getElementById('formLogin');

formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        document.getElementById('mensagem').textContent = dados.mensagem;

        if (resposta.ok) {
            sessionStorage.setItem('token', dados.token);
            window.location.href = 'pedidos.html';
        }

    } catch (erro) {
        document.getElementById('mensagem').textContent =
            'Não foi possível conectar ao servidor.';
    }
});
