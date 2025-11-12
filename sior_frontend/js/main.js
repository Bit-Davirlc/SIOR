// sior_frontend/js/main.js

// -------------------------------------------------------------------
// 1. URLs DAS APIS
// -------------------------------------------------------------------
const apiUrlClientes = 'https://localhost:5095/api/clientes';
const apiUrlCategorias = 'https://localhost:5095/api/categorias';
const apiUrlProdutos = 'https://localhost:5095/api/produtos';

// -------------------------------------------------------------------
// 2. SELETORES GERAIS (NAVEGAÇÃO E SEÇÕES)
// -------------------------------------------------------------------
const navClientes = document.getElementById('navClientes');
const navCategorias = document.getElementById('navCategorias');
const navProdutos = document.getElementById('navProdutos');

const secaoClientes = document.getElementById('secaoClientes');
const secaoCategorias = document.getElementById('secaoCategorias');
const secaoProdutos = document.getElementById('secaoProdutos');
const todasSecoes = document.querySelectorAll('main > section');

// -------------------------------------------------------------------
// 3. LÓGICA DE NAVEGAÇÃO
// -------------------------------------------------------------------
function mostrarSecao(idSecao) {
    // Esconde todas as seções
    todasSecoes.forEach(secao => secao.classList.add('hidden'));
    // Mostra a seção desejada
    document.getElementById(idSecao).classList.remove('hidden');
}

navClientes.addEventListener('click', () => mostrarSecao('secaoClientes'));
navCategorias.addEventListener('click', () => mostrarSecao('secaoCategorias'));
navProdutos.addEventListener('click', () => mostrarSecao('secaoProdutos'));

// -------------------------------------------------------------------
// 4. LÓGICA DE CLIENTES (O que já tínhamos)
// -------------------------------------------------------------------
const formCliente = document.getElementById('formCliente');
const corpoTabelaClientes = document.getElementById('corpoTabelaClientes');
const clienteIdInput = document.getElementById('clienteId');
const nomeClienteInput = document.getElementById('nome');
const documentoClienteInput = document.getElementById('documento');
const emailClienteInput = document.getElementById('email');
const telefoneClienteInput = document.getElementById('telefone');

async function carregarClientes() {
    try {
        const response = await fetch(apiUrlClientes);
        const clientes = await response.json();
        corpoTabelaClientes.innerHTML = '';
        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.documento || ''}</td>
                <td>${cliente.email || ''}</td>
                <td>${cliente.telefone || ''}</td>
                <td>
                    <button class="btn-editar" data-id="${cliente.clienteID}">Editar</button>
                    <button class="btn-excluir" data-id="${cliente.clienteID}">Excluir</button>
                </td>
            `;
            corpoTabelaClientes.appendChild(tr);
        });
    } catch (error) { console.error('Falha ao carregar clientes:', error); }
}

async function salvarCliente(event) {
    event.preventDefault();
    const idCliente = clienteIdInput.value;
    const cliente = {
        clienteID: idCliente ? parseInt(idCliente) : 0,
        nome: nomeClienteInput.value,
        documento: documentoClienteInput.value,
        email: emailClienteInput.value,
        telefone: telefoneClienteInput.value
    };
    const metodo = idCliente ? 'PUT' : 'POST';
    const url = idCliente ? `${apiUrlClientes}/${idCliente}` : apiUrlClientes;

    try {
        const response = await fetch(url, {
            method: metodo, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });
        if (!response.ok) throw new Error('Erro ao salvar cliente');
        formCliente.reset();
        clienteIdInput.value = '';
        carregarClientes();
    } catch (error) { console.error('Falha ao salvar cliente:', error); }
}

async function carregarFormularioEdicaoCliente(id) {
    try {
        const response = await fetch(`${apiUrlClientes}/${id}`);
        const cliente = await response.json();
        clienteIdInput.value = cliente.clienteID;
        nomeClienteInput.value = cliente.nome;
        documentoClienteInput.value = cliente.documento;
        emailClienteInput.value = cliente.email;
        telefoneClienteInput.value = cliente.telefone;
    } catch (error) { console.error('Falha ao carregar formulário (Cliente):', error); }
}

async function excluirCliente(id) {
    if (!confirm('Tem certeza?')) return;
    try {
        await fetch(`${apiUrlClientes}/${id}`, { method: 'DELETE' });
        carregarClientes();
    } catch (error) { console.error('Falha ao excluir cliente:', error); }
}

formCliente.addEventListener('submit', salvarCliente);
corpoTabelaClientes.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-excluir')) {
        excluirCliente(event.target.dataset.id);
    }
    if (event.target.classList.contains('btn-editar')) {
        carregarFormularioEdicaoCliente(event.target.dataset.id);
    }
});

// -------------------------------------------------------------------
// 5. LÓGICA DE CATEGORIAS (Nova)
// -------------------------------------------------------------------
const formCategoria = document.getElementById('formCategoria');
const corpoTabelaCategorias = document.getElementById('corpoTabelaCategorias');
const categoriaIdInput = document.getElementById('categoriaId');
const categoriaNomeInput = document.getElementById('categoriaNome');

async function carregarCategorias() {
    try {
        const response = await fetch(apiUrlCategorias);
        const categorias = await response.json();
        corpoTabelaCategorias.innerHTML = '';
        categorias.forEach(categoria => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${categoria.categoriaID}</td>
                <td>${categoria.nome}</td>
                <td>
                    <button class="btn-editar" data-id="${categoria.categoriaID}">Editar</button>
                    <button class="btn-excluir" data-id="${categoria.categoriaID}">Excluir</button>
                </td>
            `;
            corpoTabelaCategorias.appendChild(tr);
        });
        
        // **IMPORTANTE**: Atualiza o dropdown de produtos
        popularDropdownCategorias(categorias); 

    } catch (error) { console.error('Falha ao carregar categorias:', error); }
}

async function salvarCategoria(event) {
    event.preventDefault();
    const idCategoria = categoriaIdInput.value;
    const categoria = {
        categoriaID: idCategoria ? parseInt(idCategoria) : 0,
        nome: categoriaNomeInput.value
    };
    const metodo = idCategoria ? 'PUT' : 'POST';
    const url = idCategoria ? `${apiUrlCategorias}/${idCategoria}` : apiUrlCategorias;

    try {
        const response = await fetch(url, {
            method: metodo, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoria)
        });
        if (!response.ok) throw new Error('Erro ao salvar categoria');
        formCategoria.reset();
        categoriaIdInput.value = '';
        carregarCategorias(); // Recarrega categorias (e o dropdown)
    } catch (error) { console.error('Falha ao salvar categoria:', error); }
}

async function carregarFormularioEdicaoCategoria(id) {
    try {
        const response = await fetch(`${apiUrlCategorias}/${id}`);
        const categoria = await response.json();
        categoriaIdInput.value = categoria.categoriaID;
        categoriaNomeInput.value = categoria.nome;
    } catch (error) { console.error('Falha ao carregar formulário (Categoria):', error); }
}

async function excluirCategoria(id) {
    if (!confirm('Tem certeza? (Isso pode dar erro se houver produtos vinculados)')) return;
    try {
        await fetch(`${apiUrlCategorias}/${id}`, { method: 'DELETE' });
        carregarCategorias(); // Recarrega
    } catch (error) { console.error('Falha ao excluir categoria:', error); }
}

formCategoria.addEventListener('submit', salvarCategoria);
corpoTabelaCategorias.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-excluir')) {
        excluirCategoria(event.target.dataset.id);
    }
    if (event.target.classList.contains('btn-editar')) {
        carregarFormularioEdicaoCategoria(event.target.dataset.id);
    }
});

// -------------------------------------------------------------------
// 6. LÓGICA DE PRODUTOS (Nova e mais complexa)
// -------------------------------------------------------------------
const formProduto = document.getElementById('formProduto');
const corpoTabelaProdutos = document.getElementById('corpoTabelaProdutos');
const produtoIdInput = document.getElementById('produtoId');
const produtoNomeInput = document.getElementById('produtoNome');
const produtoDescricaoInput = document.getElementById('produtoDescricao');
const produtoPrecoInput = document.getElementById('produtoPreco');
const produtoUnidadeInput = document.getElementById('produtoUnidade');
const produtoCategoriaSelect = document.getElementById('produtoCategoria');

// Função Chave: Popula o <select> no formulário de produtos
function popularDropdownCategorias(categorias) {
    produtoCategoriaSelect.innerHTML = '<option value="">Selecione...</option>'; // Limpa
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.categoriaID;
        option.textContent = categoria.nome;
        produtoCategoriaSelect.appendChild(option);
    });
}

async function carregarProdutos() {
    try {
        const response = await fetch(apiUrlProdutos);
        const produtos = await response.json();
        corpoTabelaProdutos.innerHTML = '';
        produtos.forEach(produto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.nome}</td>
                <td>R$ ${produto.precoVenda.toFixed(2)}</td>
                <td>${produto.unidadeMedida}</td>
                <td>${produto.categoria.nome}</td> 
                <td>
                    <button class="btn-editar" data-id="${produto.produtoID}">Editar</button>
                    <button class="btn-excluir" data-id="${produto.produtoID}">Excluir</button>
                </td>
            `;
            corpoTabelaProdutos.appendChild(tr);
        });
    } catch (error) { console.error('Falha ao carregar produtos:', error); }
}

async function salvarProduto(event) {
    event.preventDefault();
    const idProduto = produtoIdInput.value;
    const produto = {
        produtoID: idProduto ? parseInt(idProduto) : 0,
        nome: produtoNomeInput.value,
        descricao: produtoDescricaoInput.value,
        precoVenda: parseFloat(produtoPrecoInput.value),
        unidadeMedida: produtoUnidadeInput.value,
        // Pega o ID da categoria do <select>
        categoriaID: parseInt(produtoCategoriaSelect.value) 
    };

    // Validação simples
    if (!produto.categoriaID) {
        alert('Por favor, selecione uma categoria.');
        return;
    }

    const metodo = idProduto ? 'PUT' : 'POST';
    const url = idProduto ? `${apiUrlProdutos}/${idProduto}` : apiUrlProdutos;

    try {
        const response = await fetch(url, {
            method: metodo, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });
        if (!response.ok) throw new Error('Erro ao salvar produto');
        formProduto.reset();
        produtoIdInput.value = '';
        carregarProdutos();
    } catch (error) { console.error('Falha ao salvar produto:', error); }
}

async function carregarFormularioEdicaoProduto(id) {
    try {
        const response = await fetch(`${apiUrlProdutos}/${id}`);
        const produto = await response.json();
        produtoIdInput.value = produto.produtoID;
        produtoNomeInput.value = produto.nome;
        produtoDescricaoInput.value = produto.descricao;
        produtoPrecoInput.value = produto.precoVenda;
        produtoUnidadeInput.value = produto.unidadeMedida;
        // Define o <select> para a categoria correta
        produtoCategoriaSelect.value = produto.categoriaID; 
    } catch (error) { console.error('Falha ao carregar formulário (Produto):', error); }
}

async function excluirProduto(id) {
    if (!confirm('Tem certeza?')) return;
    try {
        await fetch(`${apiUrlProdutos}/${id}`, { method: 'DELETE' });
        carregarProdutos();
    } catch (error) { console.error('Falha ao excluir produto:', error); }
}

formProduto.addEventListener('submit', salvarProduto);
corpoTabelaProdutos.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-excluir')) {
        excluirProduto(event.target.dataset.id);
    }
    if (event.target.classList.contains('btn-editar')) {
        carregarFormularioEdicaoProduto(event.target.dataset.id);
    }
});

// -------------------------------------------------------------------
// 7. INICIALIZAÇÃO (Carrega tudo quando a página abre)
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Define a aba "Clientes" como padrão
    mostrarSecao('secaoClientes');
    
    // Carrega os dados de todos os módulos
    carregarClientes();
    carregarCategorias(); // (Isso já vai popular o dropdown)
    carregarProdutos();
});