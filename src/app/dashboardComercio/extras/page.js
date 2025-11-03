"use client"
import { useState, useContext, useEffect} from 'react';
import { Plus, Trash2, Edit3, PackageCheck, PackageX, AlertTriangle } from 'lucide-react';
import styles from "../../styles/motoboys/motoboys.module.scss"
import { getCookieClient } from '@/lib/cookieClient';
import { ComercioContext } from '../layout';
import axios from 'axios';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function Extras() {
  const comercioId = useContext(ComercioContext)

  const [extras, setExtras] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ativo, setAtivo] = useState('Ativo');
  const [idEditando, setIdEditando] = useState(null);




  async function handleCadastrar(event) {
    event.preventDefault()

    const token = getCookieClient();

    if(!comercioId) return;
    
    if(!nome){
     toast.error("Preencha o campo nome");
      return;
    } 

    if(isNaN(Number(preco))){
      return alert("somente numero!")
    }
  

   const dados = {
    nome,
    preco: Number(preco),
    categoria,
    ativo:Boolean(ativo),
    
  };

    try {
      const response = await api.post(`/extras?comercioId=${comercioId}`, dados,{
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log(response.data)
      setExtras( (prev) => [...prev, response.data])
      resetarFormulario("")
      setModalAberto(false)
      toast.success("Extra cadastrado com sucesso");
      console.log(response.data)

    } catch(erro){
      console.error(" Erro ao cadastrar extra", erro);
    }
  }

  function resetarFormulario() {
  setNome('');
  setPreco('')
  setCategoria('')
  setAtivo('Ativo');
}



useEffect(() => {
  async function carregarComercio() {
    if (!comercioId) return; // só busca se tiver id válido

    const token = getCookieClient();

    try {
      const response = await api.get(`/extras?comercioId=${comercioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExtras(response.data);

    } catch (erro) {
      console.error("Erro ao buscar extras do comércio", erro);
    }
  }

  carregarComercio();
}, [comercioId]);


 

async function handleDelete(id) {
  const token = getCookieClient();
      if (!comercioId) return toast.error("Comércio não identificado.");

  try {
    const response = await api.delete('/extras/deletar', {
      headers: { Authorization: `Bearer ${token}` },
      params: { id, comercioId: comercioId}
      });
     setExtras(extras.filter(delExtras => delExtras.id !== id) );
    } catch (erro) {
      console.error("Erro ao deletar motoboy", erro);
      }
  
}

// 1️⃣ Função só para abrir o modal e carregar os dados
function handleEditarMotoboy(m) {
  setIdEditando(m.id)
  setNome(m.nome);
  setPreco(m.preco);
  setCategoria(m.categoria || '');
  setAtivo(m.ativo ? "Ativo" : "Inativo");
  setModalEditar(true);
}

// 2️⃣ Função para enviar para o backend
async function handleAtualizar() {
  const token = getCookieClient();

  const dadosAtualizado = {
    nome,
    preco,
    categoria,
    ativo : ativo === "Ativo",
  };

  try {
    const response = await api.put("/extras", dadosAtualizado, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id: idEditando, comercioId: comercioId },
      }
    );
    setExtras(extras.map(index => index.id === idEditando ? {...index, ...dadosAtualizado} : index));
          toast.success("Dados do motoboy atualizados com sucesso.");

    setModalEditar(false); // fecha o modal
  } catch (erro) {
    console.log(erro)
    toast.error("Erro ao atualizar dados do motoboy", erro);
  }
}

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cadastrar extras</h1>
        <button
          className={styles.botaoNovo}
          onClick={() => {
            resetarFormulario();
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
              <th>Nome</th>
              <th>Preço</th>
              <th>Categorias</th>
              <th>Ativo</th>
              <th>Deletar</th>
              <th>Editar</th>
            </tr>
          </thead>
          <tbody>
            {extras.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.mensagemNenhumProduto}>
                  Nenhum extra cadastrado no momento.
                </td>
              </tr>
            ) : (
              extras.map((m) => (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td>{m.preco || '-'}</td>
                  <td>{m.categoria || '-'}</td>
                  <td style={{ color: m.ativo === true ? 'green' : 'red', fontWeight: 'bold' }}>
                    {m.ativo ? "Ativo" : "Inativo"} 
                  </td>
                  <td>
                    <button className={styles.buttonTrash} onClick={ () => {
                      if(confirm(" Deseja realmente deletar esse extra?")) {
                        handleDelete(m.id)
                      }
                    }}>
                      <Trash2 color='red'/>
                    </button>
                  </td>
                  <td>
                    <button className={styles.buttonAtualiza} onClick={ () => {
                      if(confirm(" Deseja realmente editar esse extra ?")) {
                        handleEditarMotoboy(m)
                      }
                    }}>
                      <Edit3 style={{color:"blue"}}/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Extras */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Cadastrar Extras</h2>

            <div className={styles.formGrid}>
              
              <input
                type="text"
                placeholder="Nome do extra"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="text"
                placeholder="Preço"
                className={styles.input}
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
              <input
                type="text"
                placeholder="categoria do produto"
                className={styles.input}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
           

              
           

              <select
                className={styles.input}
                value={ativo}
                onChange={(e) => setAtivo(e.target.value)}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            
            </div>

            <div className={styles.modalBotoes}>
              <button className={styles.cancelar} onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button className={styles.salvar} onClick={handleCadastrar}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Extras */}
      {modalEditar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Editar Extras</h2>

            <div className={styles.formGrid}>
          
              <input
                type="text"
                placeholder="Nome"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="text"
                placeholder="preço"
                className={styles.input}
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
              <input
                type="text"
                placeholder="categorias"
                className={styles.input}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            
              <select
                className={styles.input}
                value={ativo}
                onChange={(e) => setAtivo(e.target.value)}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
           
            </div>

            <div className={styles.modalBotoes}>
              <button className={styles.cancelar} onClick={() => setModalEditar(false)}>
                Cancelar
              </button>
              <button className={styles.salvar} onClick={handleAtualizar} >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
