'use client';

import styles from '../../styles/criarProdutos/criarProdutos.module.scss';
import { useEffect, useState, useContext } from 'react';
import { Plus, PackageCheck, AlertTriangle, PackageX, Trash2, Edit3 } from 'lucide-react';
import { ComercioContext } from '../layout';
import toast from 'react-hot-toast';
import { getCookieClient } from '@/lib/cookieClient';
import { api } from '@/services/api';

export default function PainelProdutos() {
  const comercioId = useContext(ComercioContext);

  const [modalAberto, setModalAberto] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);

  const [name, setName] = useState('');
  const [preco, setPreco] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ativo, setAtivo] = useState('true');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);


      
    function resetarFormularioProduto() {
  setFile(null);
  setPreview(null);
  setName('');
  setPreco('');
  setPrecoCusto('');
  setDescricao('');
  setEstoque('');
  setQuantidade('');
  setIdCategoria('');
  setCodigo('');
  setAtivo('true');
  setEstoqueMinimo('');

  // Também limpa o input file (opcional, ajuda em alguns navegadores)
  const inputBanner = document.getElementById("banner");
  if (inputBanner) inputBanner.value = "";
}


  async function GetCategory() {
    try {
      const response = await api.get('/categorias', { params: { comercioId } });
      setCategorias(response.data);
    } catch (erro) {
      toast.error('Erro ao buscar categorias');
    }
  }

  async function GetProdutos() {
    if (!comercioId) return;
    const token = getCookieClient();

    try {
      const response = await api.get('/produtos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { comercioId },
      });
      setProdutos(response.data);

    } catch (erro) {
      toast.error('Erro ao buscar produtos');
    }
  }

  useEffect(() => { if (comercioId) GetCategory(); }, [comercioId]);
  useEffect(() => { if (comercioId) GetProdutos(); }, [comercioId]);

  async function handleProdutos(event) {
    event.preventDefault();
    if (!comercioId) return toast.error('Comércio não identificado.');
      if (!comercioId) {
    toast.error('Erro interno: comércio não identificado.');
    return;
  }

  if (!idCategoria) {
    toast.error('Selecione uma categoria.');
    return;
  }

  if (!name) {
    toast.error('Digite o nome do produto.');
    return;
  }

  if (!preco) {
    toast.error('Digite o preço de venda do produto.');
    return;
  }

  if (!precoCusto) {
    toast.error('Digite o preço de custo do produto.');
    return;
  }

  if (!codigo) {
    toast.error('Informe o código do produto.');
    return;
  }

  if (!descricao) {
    toast.error('Descreva o produto.');
    return;
  }

  if (!quantidade) {
    toast.error('Informe a quantidade disponível.');
    return;
  }

  if (!estoqueMinimo) {
    toast.error('Informe o estoque mínimo.');
    return;
  }

  if (!estoque) {
    toast.error('Informe o estoque inicial.');
    return;
  }

  if (!file) {
    toast.error('Adicione uma imagem do produto.');
    return;
  }
    const token = getCookieClient();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('preco', preco.replace(',', '.'));
    formData.append('precoCusto', precoCusto.replace(',', '.'));
    formData.append('descricao', descricao);
    formData.append('estoque', estoque);
    formData.append('quantidade', quantidade);
    formData.append('id_categoria', idCategoria);
    formData.append('codigo', codigo);
    formData.append('ativo', ativo);
    formData.append('file', file);
    formData.append('comercioId', comercioId);
    formData.append('estoque_minimo', estoqueMinimo);

  


    try {
      const response = await api.post('/produtos', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const produtoCriado = response.data;


      // Adiciona o estoque com a rota separada
      await api.post('/estoque', {
        produto_id: produtoCriado.id,
        quantidade: parseInt(estoque),
        localizacao: 'Estoque principal',
        comercioId: comercioId,
        estoque_minimo: parseInt(estoqueMinimo)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      resetarFormularioProduto();
      
      toast.success('Produto criado com sucesso!');
      setModalAberto(false);

      

      await GetProdutos();
      await GetCategory();
    } catch (erro) {
      toast.error(erro.response?.data?.error || 'Erro ao criar produto.');
    }


    
  }


  //FUNCAO PARA DELETAR PRODUTO
  async function handleDelete(id) {
    const token = getCookieClient();
    if (!comercioId) return toast.error("Comércio não identificado.");

    try {
      await api.delete(`/produtos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { comercioId }
      });
      toast.success('Produto excluído com sucesso!');
      await GetProdutos();
    } catch (erro) {
      toast.error('Erro ao excluir produto.');
    }
  }



  











  // FUNCAO PARA ATUALIZAR PRODUTO
  function abrirModalEdicao(produto) {
  console.log('Produto selecionado:', produto);

    setProdutoSelecionado(produto);
    setCodigo(produto.codigo || '');
    setIdCategoria(produto.categoria?.id || '');
    setName(produto.name || '');
    setPreco(produto.preco || '');
    setPrecoCusto(produto.precoCusto || '');
    setDescricao(produto.descricao || '');
    setQuantidade(produto.quantidade || '');
    setEstoque(produto.estoque?.[0]?.quantidade || '');
    setEstoqueMinimo(produto.estoque?.[0]?.estoque_minimo || '');
    setAtivo(produto.ativo ? 'true' : 'false');
    setModalEditar(true);
  }

  async function handleAtualizarProduto(e) {

  e.preventDefault();
  const token = getCookieClient();
  if (!produtoSelecionado) return;

  const formData = new FormData();
  formData.append('name', name);
  formData.append('preco', preco.replace(',', '.'));
  formData.append('precoCusto', precoCusto.replace(',', '.'));
  formData.append('descricao', descricao);
  formData.append('estoque', estoque);
  formData.append('estoque_minimo', estoqueMinimo);
  formData.append('quantidade', quantidade);
  formData.append('id_categoria', idCategoria);
  formData.append('codigo', codigo);
  formData.append('ativo', ativo === 'true');
  formData.append('comercioId', comercioId);

  if (file) {
    formData.append('file', file);
  }

  try {
    // Atualiza o produto
    const response = await api.put(`/produtos/${produtoSelecionado.id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Não defina manualmente multipart/form-data aqui
      }
    });

const estoqueId = produtoSelecionado.estoque?.[0]?.id;
console.log(estoqueId)



    if (estoqueId) {
      await api.put(`/estoque/${estoqueId}?comercioId=${comercioId} `, {
        produto_id: produtoSelecionado.id,
        quantidade: parseInt(estoque),
        comercioId,
        estoque_minimo: parseInt(estoqueMinimo),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    toast.success('Produto atualizado com sucesso!');
    setModalEditar(false);
    setProdutoSelecionado(null);
    setFile(null);
    setPreview(null);
    await GetProdutos();
  } catch (erro) {
    toast.error(erro.response?.data?.error || 'Erro ao atualizar produto.');
  }
}




  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Criar Novo Produto</h1>
        <button
  className={styles.botaoNovo}
  onClick={() => {
    resetarFormularioProduto(); // limpa tudo antes
    setModalAberto(true);
  }}
>
  <Plus size={20} /> Novo
</button>

      </div>

      <div className={styles.tabelaContainer}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Cód. Produto</th>
              <th>Categoria</th>
              <th>Nome</th>
              <th>Preço Custo</th>
              <th>Preço Venda</th>
              <th>Quantidade</th>
              <th>Estoque mínimo</th>
              <th>Estoque</th>
              <th>Sit. Estoque</th>
              <th>Status do produto</th>
              <th>Deletar Produtos</th>
              <th>Atualizar produtos</th>

            </tr>
          </thead>

         <tbody>
  {produtos.length === 0 ? (
    <tr>
  <td colSpan={12} className={styles.mensagemNenhumProduto}>
  Nenhum produto cadastrado no momento.
</td>


    </tr>
  ) : (
    produtos.map((produto) => {

      // Calcula total estoque e estoque mínimo para a linha atual
      const estoqueMinimo = produto.estoque?.length > 0 ? produto.estoque[0].estoque_minimo : 0;
      const totalEstoque = produto.estoque?.length > 0
        ? produto.estoque.reduce((t, i) => t + i.quantidade, 0)
        : 0;

      return (
        <tr key={produto.id}>
          <td>{produto.codigo || '-'}</td>
          <td>{produto.categoria?.name || '-'}</td>
          <td>{produto.name}</td>
          <td>{produto.precoCusto || '-'}</td>
          <td>{produto.preco}</td>
          <td >{produto.quantidade}</td>
          <td>{estoqueMinimo || '0'}</td>
          <td>{totalEstoque || '0'}</td>

          {/* Aqui a correção: comparar totalEstoque e estoqueMinimo */}
          <td>
            {totalEstoque === 0 ? (
              <PackageX className={styles.iconeOff} />
            ) : totalEstoque <= estoqueMinimo ? (
              <AlertTriangle className={styles.iconeAlerta} />
            ) : (
              <PackageCheck className={styles.iconeOn} />
            )}
          </td>


          <td>
            <span style={{ color: produto.ativo ? 'green' : 'red' }}>
              {produto.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>

          <td>
            <button
              className={styles.buttonTrash}
              onClick={() => {
                if (confirm(' Deseja excluir o Produto ?')) {
                  handleDelete(produto.id);
                }
              }}
            >
              <Trash2 />
            </button>
          </td>

          <td>
         <button
  className={styles.buttonAtualiza}
  onClick={() => abrirModalEdicao(produto)}
>
  <Edit3 />
</button>

          </td>
        </tr>
      );
    })
  )}
</tbody>

        </table>
      </div>






      {/* COMEÇO DO MODAL DOS PRODUTOS */}

      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Novo Produto</h2>
            <div className={styles.formGroup}>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className={styles.bannerBackground}
                />
              )}
              <label htmlFor="banner" className={styles.uploadButton}>
                <Plus size={52} />
              </label>
              <input
                type="file"
                id="banner"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const selected = e.target.files[0];
                  if (selected) {
                    setFile(selected);
                    setPreview(URL.createObjectURL(selected));
                  }
                }}
              />
            </div>

            <div className={styles.formGrid}>
              <input
                type="number"
                placeholder="Código do produto"
                className={styles.input}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              <select
                className={styles.input}
                value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value)}
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nome do Produto"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                step="0.01"
                placeholder="R$ Preço do custo do produto"
                className={styles.input}
                value={precoCusto}
                onChange={(e) => setPrecoCusto(e.target.value)}
                onBlur={() => {
                  if (precoCusto) {
                    const formated = parseFloat(precoCusto.replace(',', '.'));
                    if (!isNaN(formated))
                      setPrecoCusto(formated.toFixed(2).replace(',', '.'));
                  }
                }}
              />
              <input
                type="text"
                step="0.01"
                placeholder="R$ Preço da venda do produto"
                className={styles.input}
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                onBlur={() => {
                  if (preco) {
                    const formated = parseFloat(preco.replace(',', '.'));
                    if (!isNaN(formated))
                      setPreco(formated.toFixed(2).replace(',', '.'));
                  }
                }}
              />
              <input
                type="number"
                placeholder="Quantidade disponível"
                className={styles.input}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
              <input
                type="text"
                placeholder="Descrição"
                className={styles.input}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
              <input
                type="number"
                placeholder="Estoque Minimo"
                className={styles.input}
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                
              />
              <input
                type="number"
                placeholder="Estoque"
                className={styles.input}
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
              />
            </div>

            <div className={styles.modalBotoes}>
              <button
                className={styles.cancelar}
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.salvar}
                onClick={handleProdutos}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* FIM DO MODAL DOS PRODUTOS */}
























{modalEditar && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>Editar Produto</h2>

      {/* Preview da imagem atual ou nova */}
      <div className={styles.formGroup}>
        {preview ? (
          <img src={preview} alt="Preview" className={styles.bannerBackground} />
        ) : (
          produtoSelecionado?.banner && (
            <img src={produtoSelecionado.banner} alt="Imagem atual" className={styles.bannerBackground} />
          )
        )}

        <label htmlFor="bannerEditar" className={styles.uploadButton}>
          <Plus size={52} />
        </label>
        <input
          type="file"
          id="bannerEditar"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(e) => {
            const selected = e.target.files[0];
            if (selected) {
              setFile(selected);
              setPreview(URL.createObjectURL(selected));
            }
          }}
        />
      </div>

      <div className={styles.formGrid}>
        {/* seus inputs atuais */}
        <input type="text" placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} className={styles.input} />
        <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} className={styles.input}>
          <option value="">Selecione uma categoria</option>
          {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />

        <input type="text" placeholder="Preço Custo" value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)}
        onBlur={() => {
          if(precoCusto){
            const formated = parseFloat(precoCusto.replace(',', '.'))
            if(!isNaN(formated)){
              setPrecoCusto(formated.toFixed(2).replace(',', '.'))
            }
          }
        }}
        className={styles.input} />


        <input type="text" placeholder="Preço Venda" value={preco} onChange={(e) => setPreco(e.target.value)} onBlur={() => {
          if(preco) {
            const formated = parseFloat(preco.replace(',', '.'));
            if(!isNaN(formated)){
              setPreco(formated.toFixed(2).replace(',', '.'));
            }
          }
        }} className={styles.input} />

        <input type="text" placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} className={styles.input} />
        <input type="number" placeholder="Quantidade" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={styles.input} />
        <input type="number" placeholder="Estoque" value={estoque} onChange={(e) => setEstoque(e.target.value)} className={styles.input} />
        <input type="number" placeholder="Estoque Mínimo" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} className={styles.input} />
        <select value={ativo} onChange={(e) => setAtivo(e.target.value)} className={styles.input}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>

        

      <div className={styles.modalBotoes}>
        <button className={styles.cancelar} onClick={() => setModalEditar(false)}>Cancelar</button>
        <button className={styles.salvar} onClick={handleAtualizarProduto}>Salvar</button>
      </div>
    </div>
  </div>
)}




    </div>
  );
}
