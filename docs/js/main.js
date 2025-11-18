// -------------------------------------------------------------------
// 1. URLs DAS APIS
// -------------------------------------------------------------------
const apiUrlClientes = 'http://localhost:5095/api/clientes';
const apiUrlCategorias = 'http://localhost:5095/api/categorias';
const apiUrlProdutos = 'http://localhost:5095/api/produtos';
const apiUrlOrcamentos = 'http://localhost:5095/api/orcamentos';

// -------------------------------------------------------------------
// 2. ARMAZENAMENTO DE ESTADO GLOBAL
// -------------------------------------------------------------------
let todosClientes = [];
let todosProdutos = [];
let itensOrcamentoTemporario = [];
let idOrcamentoAberto = 0;
let orcamentoAbertoAtual = null;
let konvaImages = {};
let stage = null;
let backgroundLayer = null;
let objectLayer = null;
let tr = null;
let dragItemId = null;
let mascaraTelefoneObj = null;

// -------------------------------------------------------------------
// 3. SELETORES GERAIS (NAVEGAÇÃO E SEÇÕES)
// -------------------------------------------------------------------

const navLinks = {
	clientes: document.getElementById('navClientes'),
	categorias: document.getElementById('navCategorias'),
	produtos: document.getElementById('navProdutos'),
	orcamentos: document.getElementById('navOrcamentos'),
	desenho: document.getElementById('navDesenho'),
};
const secoes = {
	clientes: document.getElementById('secaoClientes'),
	categorias: document.getElementById('secaoCategorias'),
	produtos: document.getElementById('secaoProdutos'),
	orcamentos: document.getElementById('secaoOrcamentos'),
	novoOrcamento: document.getElementById('secaoNovoOrcamento'),
	desenho: document.getElementById('secaoDesenho'),
};
const todasSecoes = document.querySelectorAll('main > section');

// -------------------------------------------------------------------
// 4. LÓGICA DE NAVEGAÇÃO
// -------------------------------------------------------------------

function mostrarSecao(idSecao) {
	todasSecoes.forEach(secao => secao.classList.add('hidden'));

	if (secoes[idSecao]) {
		secoes[idSecao].classList.remove('hidden');
	}

	Object.values(navLinks).forEach(link => {
		link.classList.remove('active');
	});

	if (navLinks[idSecao]) 
		navLinks[idSecao].classList.add('active');
}

navLinks.clientes.addEventListener('click', () => mostrarSecao('clientes'));
navLinks.categorias.addEventListener('click', () => mostrarSecao('categorias'));
navLinks.produtos.addEventListener('click', () => mostrarSecao('produtos'));
navLinks.orcamentos.addEventListener('click', () => { mostrarSecao('orcamentos');
	carregarOrcamentos();});
navLinks.desenho.addEventListener('click', () => mostrarSecao('desenho'));

// -------------------------------------------------------------------
// 5. LÓGICA DE CLIENTES
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
		carregarClientesGlobal();
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
	Swal.fire({
		title: 'Tem certeza?',
		text: "Você não poderá reverter esta ação!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Sim, excluir!',
		cancelButtonText: 'Cancelar'
		}).then(async (result) => {

			if (result.isConfirmed) {
				try {
					const response = await fetch(`${apiUrlClientes}/${id}`, { method: 'DELETE' });

					if (!response.ok) {
						showToastError('Erro ao excluir o cliente.');
						throw new Error('Erro ao excluir.'); 
					}

					showToastSuccess('Cliente excluído com sucesso!');
					carregarClientes();

				} catch (error) {
					console.error('Falha ao excluir cliente:', error);
				}
			}
		});
}

async function abrirModalDetalhes(id) {
	idOrcamentoAberto = id;

	try {
		const response = await fetch(`${apiUrlOrcamentos}/${id}`);
		if (!response.ok) throw new Error('Falha ao buscar detalhes.');
		const orcamento = await response.json();

		orcamentoAbertoAtual = orcamento; 

		modalOrcamentoId.textContent = `#${orcamento.orcamentoID}`;
		modalClienteNome.textContent = orcamento.cliente.nome;
		modalData.textContent = new Date(orcamento.dataCriacao).toLocaleString();
		modalStatus.textContent = orcamento.status;
		modalValorTotal.textContent = `Total: R$ ${orcamento.valorTotal.toFixed(2)}`;

		modalCorpoTabela.innerHTML = '';
		orcamento.itens.forEach(item => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
	<td data-descricao="${item.produto.descricao || ''}">${item.produto.nome}</td>
		<td>${item.quantidade}</td>
		<td>R$ ${item.precoUnitarioVenda.toFixed(2)}</td>
		<td>R$ ${(item.quantidade * item.precoUnitarioVenda).toFixed(2)}</td>
		`;
		modalCorpoTabela.appendChild(tr);
		});

		modalContainer.classList.remove('hidden');

		} catch (error) {
			console.error("Falha ao abrir detalhes:", error);
			orcamentoAbertoAtual = null;
			idOrcamentoAberto = 0;
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
// 6. LÓGICA DE CATEGORIAS
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
		carregarCategorias();
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
	Swal.fire({
		title: 'Tem certeza? (Isso pode dar erro se houver produtos vinculados)',
		text: "Você não poderá reverter esta ação!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Sim, excluir!',
		cancelButtonText: 'Cancelar'
		}).then(async (result) => {

			if (result.isConfirmed) {
				try {
					const response = await fetch(`${apiUrlCategorias}/${id}`, { method: 'DELETE' });

					if (!response.ok) {
						showToastError('Erro ao excluir o categoria.');
						throw new Error('Erro ao excluir.'); 
					}

					showToastSuccess('Categoria excluído com sucesso!');
					carregarCategorias();

				} catch (error) {
					console.error('Falha ao excluir categoria:', error);
				}
			}
		});
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
// 7. LÓGICA DE PRODUTOS
// -------------------------------------------------------------------

const formProduto = document.getElementById('formProduto');
const corpoTabelaProdutos = document.getElementById('corpoTabelaProdutos');
const produtoIdInput = document.getElementById('produtoId');
const produtoNomeInput = document.getElementById('produtoNome');
const produtoDescricaoInput = document.getElementById('produtoDescricao');
const produtoPrecoInput = document.getElementById('produtoPreco');
const produtoUnidadeInput = document.getElementById('produtoUnidade');
const produtoCategoriaSelect = document.getElementById('produtoCategoria');

function popularDropdownCategorias(categorias) {
	produtoCategoriaSelect.innerHTML = '<option value="">Selecione...</option>';
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
				<td data-descricao="${produto.descricao || ''}">${produto.nome}</td>
				<td>R$ ${produto.precoVenda.toFixed(2)}</td>
				<td>${produto.unidadeMedida}</td>
				<td>${produto.categoria ? produto.categoria.nome : 'N/A'}</td> 
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
		categoriaID: parseInt(produtoCategoriaSelect.value) 
	};

	if (!produto.categoriaID) {
		showToastError("Selecione uma categoria.");
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
		carregarProdutosGlobal();
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
		produtoCategoriaSelect.value = produto.categoriaID; 
	} catch (error) { console.error('Falha ao carregar formulário (Produto):', error); }
}

async function excluirProduto(id) {
	Swal.fire({
		title: 'Tem certeza?',
		text: "Você não poderá reverter esta ação!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Sim, excluir!',
		cancelButtonText: 'Cancelar'
	}).then(async (result) => {

		if (result.isConfirmed) {
			try {
				const response = await fetch(`${apiUrlProdutos}/${id}`, { method: 'DELETE' });

				if (!response.ok) {
					showToastError('Erro ao excluir o produto.');
					throw new Error('Erro ao excluir.'); 
				}

				showToastSuccess('produto excluído com sucesso!');
				carregarProdutos();

			} catch (error) {
				console.error('Falha ao excluir produto:', error);
			}
		}
	});
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

async function carregarClientesGlobal() {
	try {
		const response = await fetch(apiUrlClientes);
		todosClientes = await response.json();
		selectCliente.innerHTML = '<option value="">Selecione um cliente...</option>';
		todosClientes.forEach(cliente => {
			selectCliente.innerHTML += `<option value="${cliente.clienteID}">${cliente.nome}</option>`;
		});
	} catch (error) { console.error('Falha ao carregar clientes globais:', error); }
}

async function carregarProdutosGlobal() {
	try {
		const response = await fetch(apiUrlProdutos);
		todosProdutos = await response.json();
		selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';
		todosProdutos.forEach(produto => {
			selectProduto.innerHTML += `<option value="${produto.produtoID}">${produto.nome} (R$ ${produto.precoVenda.toFixed(2)})</option>`;
		});
	} catch (error) { console.error('Falha ao carregar produtos globais:', error); }
}

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
					<button class="btn-secundario btn-ver-detalhes" data-id="${orc.orcamentoID}">Ver</button>
					<button class="btn-editar btn-editar-orcamento" data-id="${orc.orcamentoID}">Editar</button>
					<button class="btn-excluir" data-id="${orc.orcamentoID}">Excluir</button>
				</td>
			`;
			corpoTabelaOrcamentos.appendChild(tr);
		});
	} catch (error) { console.error('Falha ao carregar orçamentos:', error); }
}

async function abrirFormularioEdicaoOrcamento(id) {
	try {
		const response = await fetch(`${apiUrlOrcamentos}/${id}`);
		if (!response.ok) throw new Error('Falha ao buscar dados para edição.');
		const orcamento = await response.json();

		limparFormularioOrcamento(); 

		document.getElementById('orcamentoIdEdit').value = orcamento.orcamentoID;
		selectCliente.value = orcamento.cliente.clienteID;

		document.getElementById('tituloFormOrcamento').textContent = `Editar Orçamento #${id}`;
		document.getElementById('btnSalvarOrcamento').textContent = 'Atualizar Orçamento';

		itensOrcamentoTemporario = orcamento.itens.map(item => ({
			produtoID: item.produto.produtoID,
			nome: item.produto.nome,
			quantidade: item.quantidade,
			precoUnitario: item.precoUnitarioVenda,
			subtotal: item.quantidade * item.precoUnitarioVenda
		}));

		renderizarTabelaTemp();
		mostrarSecao('novoOrcamento');

	} catch (error) {
		console.error("Falha ao abrir formulário de edição:", error);
		showToastError("Não foi possível carregar o orçamento para edição.");
	}
}

function adicionarItemTemp() {
	const produtoID = parseInt(selectProduto.value);
	const quantidade = parseFloat(inputQuantidade.value);

	if (!produtoID || !quantidade || quantidade <= 0) {
		showToastError("Selecione um produto e uma quantidade válida.");
		return;
	}

	const itemExistente = itensOrcamentoTemporario.find(i => i.produtoID === produtoID);
	if (itemExistente) {
		showToastError("Este produto já foi adicionado.");
		return;
	}

	const produto = todosProdutos.find(p => p.produtoID === produtoID);
	if (!produto) {
		showToastError("Produto não encontrado.");
		return;
	}

	itensOrcamentoTemporario.push({
		produtoID: produto.produtoID,
		nome: produto.nome,
		quantidade: quantidade,
		precoUnitario: produto.precoVenda,
		subtotal: produto.precoVenda * quantidade
	});

	renderizarTabelaTemp();
}

function removerItemTemp(produtoID) {
	itensOrcamentoTemporario = itensOrcamentoTemporario.filter(i => i.produtoID !== produtoID);
	renderizarTabelaTemp();
}

function renderizarTabelaTemp() {
	corpoTabelaItensTemp.innerHTML = '';
	let total = 0;

	itensOrcamentoTemporario.forEach(item => {
		total += item.subtotal;
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td data-descricao="${item.descricao || ''}">${item.nome}</td>
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

function limparFormularioOrcamento() {
	formNovoOrcamento.reset();
	document.getElementById('orcamentoIdEdit').value = '';
	itensOrcamentoTemporario = [];
	renderizarTabelaTemp();

	document.getElementById('tituloFormOrcamento').textContent = 'Novo Orçamento';
	document.getElementById('btnSalvarOrcamento').textContent = 'Salvar Orçamento';
}

async function salvarOrcamento(event) {
	event.preventDefault();

	const idOrcamento = document.getElementById('orcamentoIdEdit').value; 
	const clienteID = parseInt(selectCliente.value);

	if (!clienteID) {
		showToastError("Selecione um cliente.");
		return;
	}
	if (itensOrcamentoTemporario.length === 0) {
		showToastError("Adicione pelo menos um item ao orçamento.");
		return;
	}

	const orcamentoDto = {
		clienteID: clienteID,
		status: "Em Aberto",
		itens: itensOrcamentoTemporario.map(item => ({
			produtoID: item.produtoID,
			quantidade: item.quantidade
		}))
	};

	const metodo = idOrcamento ? 'PUT' : 'POST';
		const url = idOrcamento ? `${apiUrlOrcamentos}/${idOrcamento}` : apiUrlOrcamentos;

	try {
		const response = await fetch(url, {
			method: metodo, 
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orcamentoDto)
		});

		if (!response.ok) {
			throw new Error(`Erro ao ${idOrcamento ? 'atualizar' : 'salvar'} o orçamento.`); 
		}

		showToastSuccess(`Orçamento ${idOrcamento ? 'atualizado' : 'salvo'} com sucesso!`);

		limparFormularioOrcamento();
		mostrarSecao('orcamentos');
		carregarOrcamentos();

		} catch (error) {
			console.error('Falha ao salvar orçamento:', error);
		}
}

async function excluirOrcamento(id) {
	Swal.fire({
		title: 'Tem certeza?',
		text: "Você não poderá reverter esta ação!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Sim, excluir!',
		cancelButtonText: 'Cancelar'
	}).then(async (result) => {

		if (result.isConfirmed) {
			try {
				const response = await fetch(`${apiUrlOrcamentos}/${id}`, { method: 'DELETE' });

				if (!response.ok) {
					showToastError('Erro ao excluir o orçamento.');
					throw new Error('Erro ao excluir.'); 
				}

				showToastSuccess('Orçamento excluído com sucesso!');
				carregarOrcamentos();

			} catch (error) {
				console.error('Falha ao excluir orçamento:', error);
			}
		}
	});
}

async function aprovarOrcamento(id) {
	const statusDto = { status: "Aprovado" };

	const url = `${apiUrlOrcamentos}/${id}/status`;

	try {
		await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(statusDto)
		});

		carregarOrcamentos();

	} catch (error) {
		console.error("Falha ao aprovar orçamento:", error);
	}
}

function fecharModalDetalhes() {
	modalContainer.classList.add('hidden');
	orcamentoAbertoAtual = null;
}

// -------------------------------------------------------------------
// 9. LÓGICA DE DESENHO 2D - Konva.js
// -------------------------------------------------------------------

const inputPlantaBaixa = document.getElementById('inputPlantaBaixa');

function inicializarCanvas() {
    if (stage) return;

    const container = document.getElementById('container-canvas');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    stage = new Konva.Stage({
        container: container.id,
        width: width,
        height: height,
    });

    backgroundLayer = new Konva.Layer();
    objectLayer = new Konva.Layer();
    stage.add(backgroundLayer, objectLayer);

    tr = new Konva.Transformer({
        nodes: [],
        keepRatio: true,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        rotateAnchorOffset: 60,
    });
    objectLayer.add(tr);

    stage.on('click tap', function (e) {
		console.log("Clicou em:", e.target.attrs.name || "Objeto sem nome");
        if (e.target === stage) {
            tr.nodes([]);
            tr.getLayer().batchDraw();
            return;
        }

        if (!e.target.hasName('item-desenho')) {
            return;
        }

        const itemClicado = e.target;
        tr.nodes([itemClicado]);
        tr.getLayer().batchDraw();
    });

    console.log("Canvas Konva inicializado.");

    container.addEventListener('dragover', (e) => { e.preventDefault(); });
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragItemId === null) return;
        stage.setPointersPositions(e);
        const pos = stage.getPointerPosition();
        adicionarItemCanvas(pos.x, pos.y, dragItemId);
        dragItemId = null;
    });
}

function exportarCanvasPNG() {
	if (!stage) {
		showToastError("O canvas ainda não foi inicializado.");
		return;
	}

	const dataURL = stage.toDataURL({ 
		pixelRatio: 1
	});

	const link = document.createElement('a');
	link.href = dataURL;
	link.download = 'desenho_rede_sior.png';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function carregarPlantaBaixa(event) {
	const file = event.target.files[0];
	if (!file) return;

	const imgUrl = URL.createObjectURL(file);

	const imageObj = new Image();
	imageObj.src = imgUrl;

	imageObj.onload = () => {
		backgroundLayer.destroyChildren();

		const konvaImage = new Konva.Image({
			x: 0,
			y: 0,
			image: imageObj,
			width: stage.width(),
			height: stage.height(),
			name: 'planta-baixa'
		});

		backgroundLayer.add(konvaImage);

		backgroundLayer.moveToBottom();

		backgroundLayer.draw();

		event.target.value = null; 
	};

	imageObj.onerror = () => {
		showToastError("Não foi possível carregar a imagem.");
	}
}

// -------------------------------------------------------------------
// 9.5: FUNÇÕES GLOBAIS DE DESENHO
// -------------------------------------------------------------------

function carregarAssetsKonva() {
	konvaImages['tool-pc'] = new Image();
	konvaImages['tool-pc'].crossOrigin = "Anonymous"; 

	konvaImages['tool-pc'].src = 'https://img.icons8.com/ios-filled/50/workstation.png?v=1'; 
	konvaImages['tool-pc'].onerror = () => console.error("Falha ao carregar ícone PC");

	konvaImages['tool-switch'] = new Image();
	konvaImages['tool-switch'].crossOrigin = "Anonymous"; 

	konvaImages['tool-switch'].src = 'https://img.icons8.com/ios-filled/50/router.png?v=1'; 
	konvaImages['tool-switch'].onerror = () => console.error("Falha ao carregar ícone Switch");
}

function adicionarItemCanvas(x, y, tipoIcone) {
    const imagemPreCarregada = konvaImages[tipoIcone];

    if (!imagemPreCarregada) {
        if (typeof showToastError === 'function') {
            showToastError("Erro: Ícone ainda não carregado ou não encontrado.");
        } else {
            console.error("Erro: Imagem não encontrada em konvaImages para:", tipoIcone);
        }
        return; 
    }

    const konvaImage = new Konva.Image({
        x: x,
        y: y,
        image: imagemPreCarregada,
        width: 50,
        height: 50,
        draggable: true,
        name: 'item-desenho'
    });

    konvaImage.on('mouseenter', function () {
        stage.container().style.cursor = 'move';
    });
    konvaImage.on('mouseleave', function () {
        stage.container().style.cursor = 'default';
    });

    objectLayer.add(konvaImage);
    objectLayer.batchDraw();

    if (tr) {
        tr.nodes([konvaImage]);
        tr.getLayer().batchDraw(); 
    }
}

// -------------------------------------------------------------------
// 10. EVENT LISTENERS
// -------------------------------------------------------------------

// Gatilho 1: Botão "Novo Orçamento"
btnNovoOrcamento.addEventListener('click', () => {
	limparFormularioOrcamento();
	mostrarSecao('novoOrcamento');
});

// Gatilho 2: Botão "Cancelar" do form
btnCancelarNovoOrcamento.addEventListener('click', () => {

	Swal.fire({
		title: 'Deseja cancelar?',
		text: "Todos os itens adicionados serão perdidos.",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#d33',
		cancelButtonColor: '#3085d6',
		confirmButtonText: 'Sim, cancelar!',
		cancelButtonText: 'Não, continuar'
	}).then((result) => {
		if (result.isConfirmed) {
			limparFormularioOrcamento();
			mostrarSecao('orcamentos');
		}
	});
});

// Gatilho 3: Botão "Adicionar Item"
btnAdicionarItem.addEventListener('click', adicionarItemTemp);

// Gatilho 4: Submit do Formulário de Orçamento
formNovoOrcamento.addEventListener('submit', salvarOrcamento);

// Gatilho 5: Tabela de Itens Temporários
corpoTabelaItensTemp.addEventListener('click', (event) => {
	if (event.target.classList.contains('btn-remover-item')) {
		const produtoID = parseInt(event.target.dataset.id);
		removerItemTemp(produtoID);
	}
});

// Gatilho 6: Tabela Principal de Orçamentos
corpoTabelaOrcamentos.addEventListener('click', (event) => {
	if (event.target.classList.contains('btn-excluir')) {
		const id = parseInt(event.target.dataset.id);
		excluirOrcamento(id);
	}
	if (event.target.classList.contains('btn-ver-detalhes')) {
		const id = parseInt(event.target.dataset.id);
		abrirModalDetalhes(id);
	}
	if (event.target.classList.contains('btn-editar-orcamento')) {
		const id = parseInt(event.target.dataset.id);
		abrirFormularioEdicaoOrcamento(id);
		}
});

// Gatilho 7: Fechar o Modal
modalCloseBtn.addEventListener('click', fecharModalDetalhes);
modalContainer.addEventListener('click', (event) => {
	if (event.target === modalContainer) {
		fecharModalDetalhes()
	}
});

// Gatilhos do Módulo de Desenho
inputPlantaBaixa.addEventListener('change', carregarPlantaBaixa);

navLinks.desenho.addEventListener('click', () => {
	mostrarSecao('desenho');
	setTimeout(inicializarCanvas, 10); 
});

function limparCanvas() {
    Swal.fire({
        title: 'Limpar o desenho?',
        text: "Tem certeza? Todos os itens e a planta baixa serão removidos.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, limpar tudo!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {

        if (result.isConfirmed) {
            if (objectLayer && tr) { 
                
                tr.nodes([]);

                const icones = objectLayer.find('.item-desenho');
                icones.forEach(icone => {
                    icone.destroy();
                });

                if (backgroundLayer) {
                    backgroundLayer.destroyChildren();
                    backgroundLayer.draw();
                }

                objectLayer.batchDraw();

                showToastSuccess("Desenho e planta baixa limpos com sucesso!");
            } else {
                showToastError("Erro: Camadas não encontradas.");
            }
        }
    });
}

// -------------------------------------------------------------------
// 11. INICIALIZAÇÃO
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
	// Define a aba "Orçamentos" como padrão
	mostrarSecao('orcamentos');

	// Carrega dados essenciais
	carregarClientesGlobal();
	carregarProdutosGlobal();

	// Carrega a lista inicial
	carregarClientes();
	carregarProdutos();
	carregarOrcamentos();
	carregarCategorias();

	// Carrega o Konva
	carregarAssetsKonva();

	const btnBaixar = document.getElementById('btnBaixarPDF');
		btnBaixar.addEventListener('click', () => {

			const elemento = document.getElementById('modalContentPDF');

			const opt = {
				margin: 0.5,
				filename: `orcamento_${idOrcamentoAberto}.pdf`,
				image: { type: 'jpeg', quality: 0.98 },
				html2canvas: { scale: 2 },
		backgroundColor: '#ffffffff',
			jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
			};

		elemento.classList.add('pdf-export-mode');

		html2pdf().from(elemento).set(opt).save().then(() => {

			elemento.classList.remove('pdf-export-mode');
			});
		});

		const btnExportarExcel = document.getElementById('btnExportarXLSX');
			btnExportarExcel.addEventListener('click', exportarParaExcel);

		const inputTelefone = document.getElementById('telefone');

		if (inputTelefone) {
			const mascaraTelefone = {
				mask: [
					{ mask: '(00) 0000-0000' },
					{ mask: '(00) 00000-0000' }
				]
			};
			const mascara = IMask(inputTelefone, mascaraTelefone);
		}

		document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            
            if (tr && tr.nodes().length > 0) {
                
                const itemSelecionado = tr.nodes()[0];
                
                itemSelecionado.destroy();
                tr.nodes([]);
                objectLayer.batchDraw();
                
                e.preventDefault(); 
            }
        }
    });

		document.getElementById('tool-pc').addEventListener('dragstart', (e) => {
			dragItemId = e.target.id;
		});
		document.getElementById('tool-switch').addEventListener('dragstart', (e) => {
			dragItemId = e.target.id;
		});
	document.getElementById('btnExportarPNG').addEventListener('click', exportarCanvasPNG);
	const btnClear = document.getElementById('btnLimparCanvas');
		if (btnClear) {
			btnClear.addEventListener('click', limparCanvas);
		}
});

// -------------------------------------------------------------------
// 12. EXTRAS
// -------------------------------------------------------------------

function exportarParaExcel() {
	if (!orcamentoAbertoAtual) {
		showToastError("Nenhum orçamento carregado para exportar.");
		return;
	}

	const orc = orcamentoAbertoAtual;
	let data = [];

	data.push(["Orçamento ID:", orc.orcamentoID]);
	data.push(["Cliente:", orc.cliente.nome]);
	data.push(["Data:", new Date(orc.dataCriacao).toLocaleString()]);
	data.push(["Status:", orc.status]);
	data.push([]);

	data.push(["Produto", "Quantidade", "Preço Unitário (R$)", "Subtotal (R$)"]);

	orc.itens.forEach(item => {
		const subtotal = item.quantidade * item.precoUnitarioVenda;
		data.push([
			item.produto.nome,
			item.quantidade,
			item.precoUnitarioVenda,
			subtotal
		]);
	});

	data.push([]);
	data.push(["", "", "Total:", orc.valorTotal]);

	const wb = XLSX.utils.book_new();

	const ws = XLSX.utils.aoa_to_sheet(data);

	ws['!cols'] = [
		{ wch: 50 }, // Coluna A (Produto)
		{ wch: 10 }, // Coluna B (Qtd)
		{ wch: 20 }, // Coluna C (Preço Unit.)
		{ wch: 20 } // Coluna D (Subtotal)
	];

	XLSX.utils.book_append_sheet(wb, ws, "Orçamento");

	const nomeArquivo = `orcamento_${orc.orcamentoID}.xlsx`;
	XLSX.writeFile(wb, nomeArquivo);
}

// ===== Alternância de Tema =====
const btnTema = document.getElementById("toggleTema");

const temaSalvo = localStorage.getItem("tema");
if (temaSalvo === "light") {
	document.body.classList.add("light-mode");
	btnTema.textContent = "☀️";
}

btnTema.addEventListener("click", () => {
	document.body.classList.toggle("light-mode");

	const modoAtual = document.body.classList.contains("light-mode") ? "light" : "dark";
	localStorage.setItem("tema", modoAtual);

	btnTema.textContent = modoAtual === "light" ? "☀️" : "🌙";
});

/**
* @param {string} message
*/
function showToastSuccess(message) {
	Toastify({
		text: message,
		duration: 3000,
		close: true,
		gravity: "top",
		position: "right",
		style: {
			background: "linear-gradient(to right, #00b09b, #96c93d)",
		}
	}).showToast();
}

/**
* @param {string} message
*/
function showToastError(message) {
	Toastify({
		text: message,
		duration: 3000,
		close: true,
		gravity: "top",
		position: "right",
		style: {
			background: "linear-gradient(to right, #ff5f6d, #ffc371)",
		}
	}).showToast();
}