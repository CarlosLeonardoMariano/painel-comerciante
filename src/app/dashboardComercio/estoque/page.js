"use client"
import styles from "../../styles/criarProdutos/criarProdutos.module.scss"
import { Plus, AlertTriangle, Trash2, Edit3, PackageCheck,Loader2, PackageX } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { ComercioContext } from "../layout";
import { getCookieClient } from "@/lib/cookieClient";
import { api } from "@/services/api";
import toast from "react-hot-toast";

export default function Estoque() {
  const comercioId = useContext(ComercioContext);

    const [produtos, setProdutos] = useState([]);
    const [produtoAtualizar, setProdutoAtualizar] = useState(null);
    const [modalAberto , setModalAberto] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [totalEstoque, setTotalEstoque] = useState("");
    const [estoqueMinimo, setEstoqueMinimo] = useState("");
    const [codigoId, setCodigoId] = useState("");
    const [estoque , setEstoque] = useState("");
    const [nome, setNome] = useState("");
    const [localizacao, setLocalizacao] = useState("");
    const [loading, setLoading] = useState(true)
    const [loadingRequisicao, setLoadingRequisicao] = useState(false);



    async function handleEstoque(event) {
    event.preventDefault();
    setLoadingRequisicao(true)
  

  if (!comercioId) {
    alert("Você precisa estar logado para acessar essa página");
setLoadingRequisicao(false)
    return;
  }

  // Validação segura para números
  const estoqueMinimoNumber = Number(estoqueMinimo);
  const estoqueNumber = Number(estoque);

  if (isNaN(estoqueMinimoNumber) || isNaN(estoqueNumber)) {
    toast("Preencha corretamente os campos de estoque (mínimo e atual).");
setLoadingRequisicao(false)
    return;
  }

  if (!codigoId || !nome || !estoqueMinimoNumber || !estoqueNumber) {
    toast.error("Preencha todos os campos obrigatórios.",{
      style: {
        "background": "#f87171", color:"white", padding:"10px"
      }
    });
setLoadingRequisicao(false)
    return;
  }


  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('estoque_minimo', estoqueMinimoNumber);
  formData.append('quantidade', estoqueNumber);
  formData.append('localizacao', localizacao);
  formData.append('codigo', codigoId)

  const token = getCookieClient();

  try {
    const response = await api.post('/estoqueLivre', formData, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        comercioId: comercioId
      },
    });
    toast.success(" Estoque criado com sucesso");
    setProdutos(prevProdutos => [...prevProdutos, response.data])
    setCodigoId("")
    setEstoque("");
    setNome("");
    setLocalizacao("");
    setEstoqueMinimo("");
    setModalAberto(false)
  } catch (err) {
  const mensagem = err.response?.data?.message; 

  if (mensagem === "Já existe um nome de estoque para esse comercio") {
    toast.error("Já existe um produto com esse nome para este comércio.", {
      style: {
        background: "#f87171",
        color: "white"
      }
    });
    return;
    
  } else if (mensagem === "Já existe um código de estoque para esse comercio") {
    toast.error("Já existe um produto com esse código para este comércio.", {
      style: {
        background: "#f87171",
        color: "white"
      }
    });
    return;
  } else {
    toast.error("Erro ao salvar estoque. Verifique os dados e tente novamente.");
    return;
  }
} finally {
  setLoadingRequisicao(false);
}
return;

}




useEffect(() => {
  async function handleCarregar() {
    if (!comercioId) return;

    const token = getCookieClient();

    try {
      const response = await api.get('/estoqueLivre', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          comercioId,
        },
      });

      setProdutos(response.data); // substitui os produtos no estado
    } catch (err) {
      console.error("Erro ao carregar estoque:", err.response?.data || err.message);
    } finally {
      setLoading(false)
    }
  }

  handleCarregar();
}, [comercioId]);



  

      if (loading) {
    return (
      <div className={styles.comercioIdCarregando}>
        <Loader2 className={styles.spinner} />
        <p>Carregando dados do estoque...</p>
      </div>
    );
  }


  // FUNÇÃO PARA DELETAR O ESTOQUE
  async function handleDelete(id) {
    const token = getCookieClient();
    if(!comercioId) return;

    try {
      const response = await api.delete(`/estoqueLivre/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }, params: { comercioId }
      });
      toast.success("estoque removido com sucesso");
          // Atualizar o estado removendo o item deletado
          setProdutos( (prevProdutos) => prevProdutos.filter( (produto) => produto.id !== id ));

    } catch(erro){
          console.error(erro);
      toast.error(" Erro ao deletar estoque! ");
    }

  }







async function handleAtualizaProduto() {
  if (!comercioId || !produtoAtualizar) return;

  const estoqueNumber = Number(estoque);
  const estoqueMinimoNumber = Number(estoqueMinimo);

  if (!codigoId || !nome || isNaN(estoqueNumber) || isNaN(estoqueMinimoNumber)) {
    toast.error("Preencha todos os campos corretamente.");
    return;
  }

  const token = getCookieClient();

  try {
    const response = await api.put(`/estoqueLivre/${produtoAtualizar.id}`, {
      nome,
      codigo: codigoId,
      quantidade: estoqueNumber,
      estoque_minimo: estoqueMinimoNumber,
      localizacao
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        comercioId
      }
    });

    toast.success("Estoque atualizado com sucesso.");

    // Atualizar o item no estado `produtos`
    setProdutos(prev =>
      prev.map(item =>
        item.id === produtoAtualizar.id ? response.data : item
      )
    );

    // Limpar e fechar modal
    setModalEditar(false);
    setProdutoAtualizar(null);
    setCodigoId("");
    setNome("");
    setEstoque("");
    setEstoqueMinimo("");
    setLocalizacao("");
  } catch (error) {
    toast.error("Erro ao atualizar o estoque.");
    console.error(error);
  }
}



    return (
      <div className={styles.container}>

        {loadingRequisicao && (
  <div className={styles.overlayLoader}>
    <div className={styles.loaderContent}>
      <Loader2 className={styles.spinnerCentral} />
      <p>Criando estoque, aguarde um momento...</p>
    </div>
  </div>
)}

      <div className={styles.header}>
        <h1 className={styles.title}>Criar Estoque</h1>
        <button
  className={styles.botaoNovo}
  onClick={() => {
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
              <th>Codigo</th>
              <th>Nome</th>
              <th>Estoque mínimo</th>
              <th>Estoque</th>
              <th>Localização do produto</th>
              <th>Sit. Estoque</th>
              <th>Deletar Produtos</th>
              <th>Atualizar produtos</th>

            </tr>
          </thead>

         <tbody>

 {produtos.length === 0 ? (
      <tr><td colSpan="8" style={{color:"red", fontStyle:"italic", fontSize:"16px", fontFamily:"arial,sans-serif"}}>Nenhum estoque criado até o momento...</td></tr>
    ) : (
      produtos.map(produto => (
        <tr key={produto.id || '-'}>
          <td>{produto.codigo || '-'}</td>
          <td>{produto.nome || '-'}</td>
          <td>{produto.estoque_minimo}</td>
          <td>{produto.quantidade}</td>
          <td>{produto.localizacao || '-'}</td>
          <td>
            {produto.quantidade === 0 ? (
              <PackageX className={styles.iconeOff} />
            ) : produto.quantidade <= produto.estoque_minimo ? (
              <AlertTriangle className={styles.iconeAlerta} />
            ) : (
              <PackageCheck className={styles.iconeOn} />
            )}
          </td>
          <td>
            <button
              className={styles.buttonTrash}
              onClick={() => {
                if (confirm('Deseja excluir o Produto?')) {
                  // função de deletar aqui
                  handleDelete(produto.id)
                }
              }}
            >
              <Trash2 />
            </button>
          </td>
          <td>
            <button className={styles.buttonAtualiza}
  onClick={() => {
    setProdutoAtualizar(produto); // salva o produto atual
    setCodigoId(produto.codigo || "");
    setNome(produto.nome || "");
    setEstoque(produto.quantidade || "");
    setEstoqueMinimo(produto.estoque_minimo || "");
    setLocalizacao(produto.localizacao || "");
    setModalEditar(true); // abre o modal
  }}>

    
              <Edit3 />
            </button>
          </td>
        </tr>
      ))
    )}
      
</tbody>

        </table>
      </div>






      {/* COMEÇO DO MODAL DOS PRODUTOS */}

      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Novo Estoque</h2>
            

            <div className={styles.formGrid}>
              <input
                type="text"
                placeholder="Código do produto"
                className={styles.input}
                value={codigoId}
                onChange={(e) => setCodigoId(e.target.value)}
              />
             
              <input
                type="text"
                placeholder="Nome do Produto"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
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

                   <input
                type="text"
                placeholder="Localização"
                className={styles.input}
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
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
  onClick={handleEstoque}
  disabled={loadingRequisicao}
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
      <h2>Atualizar Estoque</h2>

     

      <div className={styles.formGrid}>
        {/* seus inputs atuais */}
        <input type="text" placeholder="Código" value={codigoId} onChange={(e) => setCodigoId(e.target.value)} className={styles.input} />
        <input type="text" placeholder="Nome" value={nome} onChange={ (e) => setNome(e.target.value) } className={styles.input} />
        <input type="number" placeholder="Estoque" value={estoque} onChange={(e) => setEstoque(e.target.value)} className={styles.input} />
        <input type="number" placeholder="Estoque Mínimo" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} className={styles.input} />
        <input type="text" placeholder="Localização do estoque" value={localizacao} onChange={ (e) => setLocalizacao(e.target.value)} className={styles.input} />
      
      </div>

        

      <div className={styles.modalBotoes}>
        <button className={styles.cancelar} onClick={() => setModalEditar(false)}>Cancelar</button>
        <button className={styles.salvar} onClick={handleAtualizaProduto}>Salvar</button>
      </div>
    </div>
  </div>
)}




    </div>
    )
}