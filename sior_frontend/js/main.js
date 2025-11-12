// -------------------------------------------------------------------
// 1. URLs DAS APIS
// -------------------------------------------------------------------
const apiUrlClientes = 'http://localhost:5095/api/clientes';
const apiUrlCategorias = 'http://localhost:5095/api/categorias';
const apiUrlProdutos = 'http://localhost:5095/api/produtos';
const apiUrlOrcamentos = 'http://localhost:5095/api/orcamentos';

// -------------------------------------------------------------------
// 2. ARMAZENAMENTO DE ESTADO GLOBAL
// (Guardamos os dados de Clientes e Produtos para não recarregar)
// -------------------------------------------------------------------
let todosClientes = [];
let todosProdutos = [];
let itensOrcamentoTemporario = []; // <-- Guarda os itens do NOVO orçamento
let idOrcamentoAberto = 0;
let konvaImages = {}; // Armazena os 'Image' objects do Konva
let dragItemId = null; // Guarda o ID do item sendo arrastado

// -------------------------------------------------------------------
// 3. SELETORES GERAIS (NAVEGAÇÃO E SEÇÕES)
// -------------------------------------------------------------------
const navLinks = {
	clientes: document.getElementById('navClientes'),
	categorias: document.getElementById('navCategorias'),
	produtos: document.getElementById('navProdutos'),
	orcamentos: document.getElementById('navOrcamentos'),
	desenho: document.getElementById('navDesenho'), // <-- NOVO
};
const secoes = {
	clientes: document.getElementById('secaoClientes'),
	categorias: document.getElementById('secaoCategorias'),
	produtos: document.getElementById('secaoProdutos'),
	orcamentos: document.getElementById('secaoOrcamentos'), // <-- NOVO
	novoOrcamento: document.getElementById('secaoNovoOrcamento'),
	desenho: document.getElementById('secaoDesenho'), // <-- NOVO
};
const todasSecoes = document.querySelectorAll('main > section');

// -------------------------------------------------------------------
// 4. LÓGICA DE NAVEGAÇÃO
// -------------------------------------------------------------------

function mostrarSecao(idSecao) {
    // 1. Esconde todas as seções
    todasSecoes.forEach(secao => secao.classList.add('hidden'));

    // 2. Mostra a seção clicada
    if (secoes[idSecao]) { // Segurança para evitar erros
        secoes[idSecao].classList.remove('hidden');
    }

    // 3. ATUALIZA A NAVEGAÇÃO (A MÁGICA ESTÁ AQUI)
    // Remove 'active' de todos os links
    Object.values(navLinks).forEach(link => {
        link.classList.remove('active');
    });

    // Adiciona 'active' apenas no link correspondente
    if (navLinks[idSecao]) { // Segurança para links como 'novoOrcamento'
        navLinks[idSecao].classList.add('active');
    }
}

navLinks.clientes.addEventListener('click', () => mostrarSecao('clientes'));
navLinks.categorias.addEventListener('click', () => mostrarSecao('categorias'));
navLinks.produtos.addEventListener('click', () => mostrarSecao('produtos'));
navLinks.orcamentos.addEventListener('click', () => { mostrarSecao('orcamentos');
	carregarOrcamentos();}); // Recarrega a lista ao clicar
navLinks.desenho.addEventListener('click', () => mostrarSecao('desenho'));

// -------------------------------------------------------------------
// 5. LÓGICA DE CLIENTES (Sem alteração)
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

async function abrirModalDetalhes(id) {
    idOrcamentoAberto = id; // <-- PASSO 2: Guarde o ID do orçamento
    
    try {
        modalContainer.classList.add('is-active'); // (ou .remove('hidden'))
    } catch (error) {
        console.error("Falha ao abrir detalhes:", error);
    }
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
// 6. LÓGICA DE CATEGORIAS (Sem alteração)
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
// 7. LÓGICA DE PRODUTOS (Sem alteração)
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
// 8. LÓGICA DE ORÇAMENTOS (NOVO)
// -------------------------------------------------------------------

// --- Seletores do Módulo Orçamento ---
const btnNovoOrcamento = document.getElementById('btnNovoOrcamento');
const btnCancelarNovoOrcamento = document.getElementById('btnCancelarNovoOrcamento');
const corpoTabelaOrcamentos = document.getElementById('corpoTabelaOrcamentos');

// --- Seletores do Formulário de Novo Orçamento ---
const formNovoOrcamento = document.getElementById('formNovoOrcamento');
const selectCliente = document.getElementById('orcamentoCliente');
const selectProduto = document.getElementById('orcamentoProduto');
const inputQuantidade = document.getElementById('orcamentoQuantidade');
const btnAdicionarItem = document.getElementById('btnAdicionarItem');
const corpoTabelaItensTemp = document.getElementById('corpoTabelaItensTemp');
const spanTotalTemp = document.getElementById('orcamentoTotalTemp');

// --- Seletores do Modal de Detalhes ---
const modalContainer = document.getElementById('modalDetalhes');
const modalCloseBtn = document.getElementById('modalClose');
const modalOrcamentoId = document.getElementById('modalOrcamentoId');
const modalClienteNome = document.getElementById('modalClienteNome');
const modalData = document.getElementById('modalData');
const modalStatus = document.getElementById('modalStatus');
const modalCorpoTabela = document.getElementById('modalCorpoTabela');
const modalValorTotal = document.getElementById('modalValorTotal');

// --- Funções de Carregamento (chamadas no DCL) ---

// Carrega TODOS os clientes e guarda na variável global
async function carregarClientesGlobal() {
	try {
		const response = await fetch(apiUrlClientes);
		todosClientes = await response.json();
		// Popula o dropdown do formulário de orçamento
		selectCliente.innerHTML = '<option value="">Selecione um cliente...</option>';
		todosClientes.forEach(cliente => {
			selectCliente.innerHTML += `<option value="${cliente.clienteID}">${cliente.nome}</option>`;
		});
	} catch (error) { console.error('Falha ao carregar clientes globais:', error); }
}

// Carrega TODOS os produtos e guarda na variável global
async function carregarProdutosGlobal() {
	try {
		const response = await fetch(apiUrlProdutos);
		todosProdutos = await response.json();
		// Popula o dropdown do formulário de orçamento
		selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';
		todosProdutos.forEach(produto => {
			selectProduto.innerHTML += `<option value="${produto.produtoID}">${produto.nome} (R$ ${produto.precoVenda.toFixed(2)})</option>`;
		});
	} catch (error) { console.error('Falha ao carregar produtos globais:', error); }
}

// Carrega a LISTA de orçamentos criados
async function carregarOrcamentos() {
	try {
		const response = await fetch(apiUrlOrcamentos);
		const orcamentos = await response.json();
		corpoTabelaOrcamentos.innerHTML = '';
		orcamentos.forEach(orc => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${orc.orcamentoID}</td>
				<td>${orc.cliente.nome}</td>
				<td>${new Date(orc.dataCriacao).toLocaleDateString()}</td>
				<td>${orc.status}</td>
				<td>R$ ${orc.valorTotal.toFixed(2)}</td>
				<td>
					<button class="btn-editar btn-ver-detalhes" data-id="${orc.orcamentoID}">Ver</button>
					<button class="btn-excluir" data-id="${orc.orcamentoID}">Excluir</button>
				</td>
			`;
			corpoTabelaOrcamentos.appendChild(tr);
		});
	} catch (error) { console.error('Falha ao carregar orçamentos:', error); }
}

// --- Funções do Formulário de Novo Orçamento ---

// Adiciona um item à lista temporária
function adicionarItemTemp() {
	const produtoID = parseInt(selectProduto.value);
	const quantidade = parseFloat(inputQuantidade.value);

	// Validação
	if (!produtoID || !quantidade || quantidade <= 0) {
		alert("Selecione um produto e uma quantidade válida.");
		return;
	}

	// Verifica se o item já está na lista (para evitar duplicados)
	const itemExistente = itensOrcamentoTemporario.find(i => i.produtoID === produtoID);
	if (itemExistente) {
		alert("Este produto já foi adicionado.");
		return;
	}

	// Busca o produto na nossa lista global
	const produto = todosProdutos.find(p => p.produtoID === produtoID);
	if (!produto) {
		alert("Produto não encontrado.");
		return;
	}

	// Adiciona à lista temporária
	itensOrcamentoTemporario.push({
		produtoID: produto.produtoID,
		nome: produto.nome,
		quantidade: quantidade,
		precoUnitario: produto.precoVenda,
		subtotal: produto.precoVenda * quantidade
	});

	// Redesenha a tabela de itens temporários
	renderizarTabelaTemp();
}

// Remove um item da lista temporária
function removerItemTemp(produtoID) {
	itensOrcamentoTemporario = itensOrcamentoTemporario.filter(i => i.produtoID !== produtoID);
	renderizarTabelaTemp();
}

// Redesenha a tabela temporária e o total
function renderizarTabelaTemp() {
	corpoTabelaItensTemp.innerHTML = '';
	let total = 0;

	itensOrcamentoTemporario.forEach(item => {
		total += item.subtotal;
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${item.nome}</td>
			<td>${item.quantidade}</td>
			<td>R$ ${item.precoUnitario.toFixed(2)}</td>
			<td>R$ ${item.subtotal.toFixed(2)}</td>
			<td>
				<button type="button" class="btn-excluir btn-remover-item" data-id="${item.produtoID}">X</button>
			</td>
		`;
		corpoTabelaItensTemp.appendChild(tr);
	});

	spanTotalTemp.textContent = `Total: R$ ${total.toFixed(2)}`;
}

// Limpa o formulário e a lista temporária
function limparFormularioOrcamento() {
	formNovoOrcamento.reset();
	itensOrcamentoTemporario = [];
	renderizarTabelaTemp();
}

// Salva o orçamento no banco (envia o DTO)
async function salvarOrcamento(event) {
	event.preventDefault();

	const clienteID = parseInt(selectCliente.value);
	if (!clienteID) {
		alert("Selecione um cliente.");
		return;
	}
	if (itensOrcamentoTemporario.length === 0) {
		alert("Adicione pelo menos um item ao orçamento.");
		return;
	}

	// Monta o DTO (Data Transfer Object) para a API
	const orcamentoDto = {
		clienteID: clienteID,
		status: "Em Aberto", // Você pode adicionar um campo de status se quiser
		itens: itensOrcamentoTemporario.map(item => ({
			produtoID: item.produtoID,
			quantidade: item.quantidade
		}))
	};

	try {
		const response = await fetch(apiUrlOrcamentos, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orcamentoDto)
		});

		if (!response.ok) {
			throw new Error('Erro ao salvar o orçamento.');
		}

		alert("Orçamento salvo com sucesso!");
		limparFormularioOrcamento();
		mostrarSecao('orcamentos'); // Volta para a lista
		carregarOrcamentos(); // Recarrega a lista principal

	} catch (error) {
		console.error('Falha ao salvar orçamento:', error);
	}
}

// Exclui um orçamento da lista principal
async function excluirOrcamento(id) {
	if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
	try {
		const response = await fetch(`${apiUrlOrcamentos}/${id}`, { method: 'DELETE' });
		if (!response.ok) throw new Error('Erro ao excluir.');
		carregarOrcamentos(); // Recarrega a lista
	} catch (error) { console.error('Falha ao excluir orçamento:', error); }
}

// --- Funções do Modal de Detalhes ---
async function abrirModalDetalhes(id) {
	try {
		const response = await fetch(`${apiUrlOrcamentos}/${id}`);
		if (!response.ok) throw new Error('Falha ao buscar detalhes.');
		const orcamento = await response.json();

		// Preenche os dados do modal
		modalOrcamentoId.textContent = `#${orcamento.orcamentoID}`;
		modalClienteNome.textContent = orcamento.cliente.nome;
		modalData.textContent = new Date(orcamento.dataCriacao).toLocaleString();
		modalStatus.textContent = orcamento.status;
		modalValorTotal.textContent = `Total: R$ ${orcamento.valorTotal.toFixed(2)}`;

		// Preenche a tabela de itens do modal
		modalCorpoTabela.innerHTML = '';
		orcamento.itens.forEach(item => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${item.produto.nome}</td>
				<td>${item.quantidade}</td>
				<td>R$ ${item.precoUnitarioVenda.toFixed(2)}</td>
				<td>R$ ${(item.quantidade * item.precoUnitarioVenda).toFixed(2)}</td>
			`;
			modalCorpoTabela.appendChild(tr);
		});

		// Mostra o modal
		modalContainer.classList.remove('hidden');

	} catch (error) {
		console.error("Falha ao abrir detalhes:", error);
	}
}

function fecharModalDetalhes() {
	modalContainer.classList.add('hidden');
}

// -------------------------------------------------------------------
// 9. LÓGICA DE DESENHO 2D (Konva.js) (NOVO)
// -------------------------------------------------------------------

// --- Variáveis Globais do Konva ---
let stage; // O "Palco" principal
let backgroundLayer; // Camada para a planta baixa
let objectLayer; // Camada para ícones (PCs, Switches)

// --- Seletores do Módulo de Desenho ---
const inputPlantaBaixa = document.getElementById('inputPlantaBaixa');

function inicializarCanvas() {
    // Só inicializa se o 'stage' não foi criado ainda
    if (stage) return; 

    const container = document.getElementById('container-canvas');
    if (!container) return; // Segurança

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Criar o Palco (Stage)
    stage = new Konva.Stage({
        container: 'container-canvas', 
        width: width,
        height: height,
    });

    // 2. Criar as Camadas (Layers)
    backgroundLayer = new Konva.Layer();
    objectLayer = new Konva.Layer();
    stage.add(backgroundLayer, objectLayer);

    console.log("Canvas Konva inicializado.");

    // --- LÓGICA DE DRAG AND DROP (D&D) ---

    // 3. Ouvir o DRAGOVER no container
    // (Necessário para que o navegador permita o 'drop')
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Permite soltar
    });

    // 4. Ouvir o DROP no container
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        
        // Garante que o item arrastado é da nossa toolbox
        if (dragItemId === null) return;

        // Pega a posição do mouse RELATIVA ao stage
        stage.setPointersPositions(e);
        const pos = stage.getPointerPosition();
        
        // Adiciona o item no canvas
        adicionarItemCanvas(pos.x, pos.y, dragItemId);

        // Limpa o ID do item
        dragItemId = null;
    });
}

function exportarCanvasPNG() {
    if (!stage) {
        alert("O canvas ainda não foi inicializado.");
        return;
    }

    // 1. Usa o método .toDataURL() do Konva para gerar um PNG
    // Isso "achata" todas as camadas (fundo + objetos)
    const dataURL = stage.toDataURL({ 
        pixelRatio: 1 // Pode aumentar para 2 para maior resolução
    });

    // 2. Cria um link (<a>) temporário na memória
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'desenho_rede_sior.png'; // O nome do arquivo

    // 3. Simula o clique no link para iniciar o download
    document.body.appendChild(link); // (Precisa estar no DOM para o Firefox)
    link.click();
    document.body.removeChild(link);
}

// Função para carregar a imagem da planta baixa
function carregarPlantaBaixa(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Cria uma URL local temporária para a imagem
    const imgUrl = URL.createObjectURL(file);

    // Cria um objeto de Imagem do JavaScript
    const imageObj = new Image();
    imageObj.src = imgUrl;

    // Espera a imagem carregar
    imageObj.onload = () => {
        // Limpa qualquer planta antiga
        backgroundLayer.destroyChildren();

        // Cria uma Imagem Konva
        const konvaImage = new Konva.Image({
            x: 0,
            y: 0,
            image: imageObj,
            width: stage.width(), // Faz a imagem caber no canvas
            height: stage.height(),
            name: 'planta-baixa' // Dá um nome para referência
        });

        // Adiciona a imagem à camada de fundo
        backgroundLayer.add(konvaImage);
        
        // Manda a camada de fundo para trás de todas
        backgroundLayer.moveToBottom();
        
        // Redesenha a camada
        backgroundLayer.draw();

        // Limpa o valor do input para permitir carregar a mesma imagem de novo
        event.target.value = null; 
    };

    imageObj.onerror = () => {
        alert("Não foi possível carregar a imagem.");
    }
}

// -------------------------------------------------------------------
// (Nova Seção) 9.5: FUNÇÕES GLOBAIS DE DESENHO
// -------------------------------------------------------------------
function carregarAssetsKonva() {
    // PC
    konvaImages['tool-pc'] = new Image();
    konvaImages['tool-pc'].crossOrigin = "Anonymous"; 
    
    // ADICIONE ?v=1 AQUI
    konvaImages['tool-pc'].src = 'https://img.icons8.com/ios-filled/50/workstation.png?v=1'; 
    konvaImages['tool-pc'].onerror = () => console.error("Falha ao carregar ícone PC");

    // Switch
    konvaImages['tool-switch'] = new Image();
    konvaImages['tool-switch'].crossOrigin = "Anonymous"; 
    
    // ADICIONE ?v=1 AQUI
    konvaImages['tool-switch'].src = 'https://img.icons8.com/ios-filled/50/router.png?v=1'; 
    konvaImages['tool-switch'].onerror = () => console.error("Falha ao carregar ícone Switch");
}

// Função que cria o item no canvas
function adicionarItemCanvas(x, y, id) {
    if (!konvaImages[id]) {
        console.error("Asset não carregado:", id);
        return;
    }

    const konvaImage = new Konva.Image({
        x: x,
        y: y,
        image: konvaImages[id],
        width: 40,
        height: 40,
        draggable: true, // <-- Permite mover o ícone DEPOIS de soltar
        name: 'objeto-rede' // Um nome para identificação
    });

    // Centraliza o ícone no cursor (opcional, mas bom)
    konvaImage.offsetX(konvaImage.width() / 2);
    konvaImage.offsetY(konvaImage.height() / 2);

    // Adiciona à camada de objetos (a camada da frente)
    objectLayer.add(konvaImage);
    objectLayer.draw();
}

// -------------------------------------------------------------------
// 10. EVENT LISTENERS (Gatilhos)
// -------------------------------------------------------------------

// Gatilho 1: Botão "Novo Orçamento"
btnNovoOrcamento.addEventListener('click', () => {
	limparFormularioOrcamento();
	mostrarSecao('novoOrcamento');
});

// Gatilho 2: Botão "Cancelar" do form
btnCancelarNovoOrcamento.addEventListener('click', () => {
	if (confirm("Deseja cancelar? Todos os itens adicionados serão perdidos.")) {
		limparFormularioOrcamento();
		mostrarSecao('orcamentos');
	}
});

// Gatilho 3: Botão "Adicionar Item"
btnAdicionarItem.addEventListener('click', adicionarItemTemp);

// Gatilho 4: Submit do Formulário de Orçamento
formNovoOrcamento.addEventListener('submit', salvarOrcamento);

// Gatilho 5: Tabela de Itens Temporários (para o botão "X" de remover)
corpoTabelaItensTemp.addEventListener('click', (event) => {
	if (event.target.classList.contains('btn-remover-item')) {
		const produtoID = parseInt(event.target.dataset.id);
		removerItemTemp(produtoID);
	}
});

// Gatilho 6: Tabela Principal de Orçamentos (para "Ver" e "Excluir")
corpoTabelaOrcamentos.addEventListener('click', (event) => {
	// Botão Excluir
	if (event.target.classList.contains('btn-excluir')) {
		const id = parseInt(event.target.dataset.id);
		excluirOrcamento(id);
	}
	// Botão Ver Detalhes
	if (event.target.classList.contains('btn-ver-detalhes')) {
		const id = parseInt(event.target.dataset.id);
		abrirModalDetalhes(id);
	}
});

// Gatilho 7: Fechar o Modal
modalCloseBtn.addEventListener('click', fecharModalDetalhes);
modalContainer.addEventListener('click', (event) => {
	// Fecha se clicar fora do conteúdo
	if (event.target === modalContainer) {
		fecharModalDetalhes()
	}
});

// --- Gatilhos do Módulo de Desenho ---
inputPlantaBaixa.addEventListener('change', carregarPlantaBaixa);

// Gatilho especial: Inicializa o canvas QUANDO a aba de Desenho for clicada
navLinks.desenho.addEventListener('click', () => {
    mostrarSecao('desenho');
    // Usamos setTimeout para garantir que o 'div' está visível antes de o Konva medir
    setTimeout(inicializarCanvas, 10); 
});

// -------------------------------------------------------------------
// 11. INICIALIZAÇÃO
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
	// Define a aba "Orçamentos" como padrão
	mostrarSecao('orcamentos');

	// Carrega dados essenciais UMA VEZ
	carregarClientesGlobal();
	carregarProdutosGlobal();

	// Carrega a lista inicial
	carregarClientes();
	carregarProdutos();
	carregarOrcamentos();
	carregarCategorias();

	const btnBaixar = document.getElementById('btnBaixarPDF');
    btnBaixar.addEventListener('click', () => {
        
        // 1. Pega o elemento HTML que queremos converter
        const elemento = document.getElementById('modalContentPDF');

        // 2. Define as opções do PDF
        const opt = {
          margin:       0.5, // Margem em polegadas
          filename:     `orcamento_${idOrcamentoAberto}.pdf`, // Nome do arquivo
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 }, // Aumenta a qualidade da "foto"
		  backgroundColor: '#ffffffff',
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // 3. Roda a mágica!
        html2pdf().from(elemento).set(opt).save();
    });

	carregarAssetsKonva(); // <-- ADICIONA AQUI

    // --- Adiciona Listeners da Toolbox de Desenho ---
    document.getElementById('tool-pc').addEventListener('dragstart', (e) => {
        dragItemId = e.target.id;
    });
    document.getElementById('tool-switch').addEventListener('dragstart', (e) => {
        dragItemId = e.target.id;
    });
	document.getElementById('btnExportarPNG').addEventListener('click', exportarCanvasPNG);
});

// ===== Alternância de Tema (Dark / Light) =====
const btnTema = document.getElementById("toggleTema");

// Carrega preferência anterior (se houver)
const temaSalvo = localStorage.getItem("tema");
if (temaSalvo === "light") {
	document.body.classList.add("light-mode");
	btnTema.textContent = "☀️";
}

// Evento de clique
btnTema.addEventListener("click", () => {
	document.body.classList.toggle("light-mode");

	const modoAtual = document.body.classList.contains("light-mode") ? "light" : "dark";
	localStorage.setItem("tema", modoAtual);

	btnTema.textContent = modoAtual === "light" ? "☀️" : "🌙";
});
