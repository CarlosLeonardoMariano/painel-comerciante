"use client"
import { useState, useContext, useEffect} from 'react';
import { Plus, Trash2, Edit3, PackageCheck, PackageX, AlertTriangle } from 'lucide-react';
import styles from "../../styles/motoboys/motoboys.module.scss"
import { getCookieClient } from '@/lib/cookieClient';
import { ComercioContext } from '../layout';
import axios from 'axios';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function Motoboys() {
  const comercioId = useContext(ComercioContext)

  const [motoboys, setMotoboys] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);

  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [placa, setPlaca] = useState('');
  const [ativo, setAtivo] = useState('Ativo');
  const [habilitacao, setHabilitacao] = useState('');
  const [idEditando, setIdEditando] = useState(null);




  async function handleCadastrar(event) {
    event.preventDefault()

    const token = getCookieClient();

    if(!comercioId) return;
    
    if(!nome){
     toast.error("Preencha o campo nome");
      return;
    } 
    
    if(!telefone){
      toast.error("Preencha o campo telefone");
      return;
    }

   const dados = {
    nome,
    telefone,
    idade: parseInt(idade),
    habilitacao: habilitacao === "Sim", // agora é boolean ✅
    veiculo,
    placa,
    ativo,
    
  };

    try {
      const response = await api.post(`/motoboys?comercioId=${comercioId}`, dados,{
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log(response.data)
      resetarFormulario("")
      setModalAberto(false)
      toast.success("Motoboy cadastrado com sucesso");

    } catch(erro){
      console.error(" Erro ao cadastrar motoboy", erro);
    }
  }

  function resetarFormulario() {
  setNome('');
  setTelefone('');
  setIdade('');
  setHabilitacao('');
  setVeiculo('');
  setPlaca('');
  setAtivo('Ativo');
}



useEffect( () => {
  async function carregarComercio() {

  const token = getCookieClient();
  
  try {
    const response = await api.get(`/motoboys?comercioId=${comercioId}`,{
      headers: { Authorization: `Bearer ${token}` }
      })
      setMotoboys(response.data)
      

  } catch (erro){
    console.error("Erro ao buscar dados do usuário", erro)
  }


}
carregarComercio()

},[comercioId])

 

async function handleDelete(id) {
  const token = getCookieClient();
      if (!comercioId) return toast.error("Comércio não identificado.");

  try {
    const response = await api.delete('/motoboys/deletar', {
      headers: { Authorization: `Bearer ${token}` },
      params: { id, comercioId: comercioId}
      });
     setMotoboys( motoboys.filter(motoboy => motoboy.id !== id) );
    } catch (erro) {
      console.error("Erro ao deletar motoboy", erro);
      }
  
}

// 1️⃣ Função só para abrir o modal e carregar os dados
function handleEditarMotoboy(m) {
  setIdEditando(m.id)
  setNome(m.nome);
  setTelefone(m.telefone);
  setIdade(m.idade || '');
  setVeiculo(m.veiculo || '');
  setPlaca(m.placa || '');
  setHabilitacao(m.habilitacao ? "Sim" : "Não");
  setAtivo(m.ativo ? "Ativo" : "Inativo");
  setIdEditando(m.id);
  setModalEditar(true);
}

// 2️⃣ Função para enviar para o backend
async function handleAtualizar() {
  const token = getCookieClient();

  const dadosAtualizado = {
    nome,
    telefone,
    idade: parseInt(idade),
    habilitacao: habilitacao === "Sim",
    veiculo,
    placa,
    ativo : ativo === "Ativo",
  };

  try {
    const response = await api.put("/motoboys/status",dadosAtualizado, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id: idEditando, comercioId: comercioId },
      }
    );
    setMotoboys(motoboys.map(index => index.id === idEditando ? {...index, ...dadosAtualizado} : index));
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
        <h1 className={styles.title}>Cadastro de Motoboy</h1>
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
              <th>Telefone</th>
              <th>Veículo</th>
              <th>Placa</th>
              <th>Ativo</th>
              <th>Deletar</th>
              <th>Editar</th>
            </tr>
          </thead>
          <tbody>
            {motoboys.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.mensagemNenhumProduto}>
                  Nenhum motoboy cadastrado no momento.
                </td>
              </tr>
            ) : (
              motoboys.map((m) => (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td>{m.telefone || '-'}</td>
                  <td>{m.veiculo || '-'}</td>
                  <td>{m.placa || '-'}</td>
                  <td style={{ color: m.ativo === true ? 'green' : 'red', fontWeight: 'bold' }}>
                    {m.ativo ? "Ativo" : "Inativo"} 
                  </td>
                  <td>
                    <button className={styles.buttonTrash} onClick={ () => {
                      if(confirm(" Deseja realmente deletar esse motoboy?")) {
                        handleDelete(m.id)
                      }
                    }}>
                      <Trash2 color='red'/>
                    </button>
                  </td>
                  <td>
                    <button className={styles.buttonAtualiza} onClick={ () => {
                      if(confirm(" Deseja realmente editar esse motoboy?")) {
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

      {/* Modal Novo Motoboy */}
      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Novo Motoboy</h2>

            <div className={styles.formGrid}>
              
              <input
                type="text"
                placeholder="Nome completo"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="text"
                placeholder="Idade"
                className={styles.input}
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Telefone"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
              <select
                className={styles.input}
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
              >
                <option value="">Selecione o veículo</option>
                <option value="Moto">Moto</option>
                <option value="Bicicleta">Bicicleta</option>
                <option value="Carro">Carro</option>
              </select>

              
              <input
                type="text"
                placeholder="Placa do veículo"
                className={styles.input}
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
              />
           

                <select
                className={styles.input}
                value={habilitacao}
                onChange={(e) => setHabilitacao(e.target.value)}
              >
                <option value="">Selecione se o motoboy tem habilitação</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>


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

      {/* Modal Editar Motoboy */}
      {modalEditar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Editar Motoboy</h2>

            <div className={styles.formGrid}>
          
              <input
                type="text"
                placeholder="Nome completo"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="text"
                placeholder="Idade"
                className={styles.input}
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Telefone"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
              <select
                className={styles.input}
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
              >
                <option value="">Selecione o veículo</option>
                <option value="Moto">Moto</option>
                <option value="Bicicleta">Bicicleta</option>
                <option value="Carro">Carro</option>
              </select>

                   <select
                className={styles.input}
                value={habilitacao}
                onChange={(e) => setHabilitacao(e.target.value)}
              >
                <option value="">Selecione se o motoboy tem habilitação</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
              <input
                type="text"
                placeholder="Placa do veículo"
                className={styles.input}
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
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
