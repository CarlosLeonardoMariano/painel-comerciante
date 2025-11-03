"use client";

import { useState, useContext, useEffect } from "react";
import { api } from "@/services/api";
import { ComercioContext } from "../layout";
import { toast } from "react-toastify";
import styles from "../../styles/bairros/bairros.module.scss";
import { getCookieClient } from "@/lib/cookieClient";
import { CircleFadingPlus, DollarSign, Edit3, MapPin, Trash2 } from "lucide-react";


export default function Bairros() {
  const comercioId = useContext(ComercioContext);
  const [nome, setNome] = useState("");
  const [taxa_entrega, setTaxa_entrega] = useState("");
  const [dadosBairro, setDadosBairro] = useState([]);


     async function loadBairros() {
        if (!comercioId) return; // impede erro
      try {
        const response = await api.get(`/bairros?comercioId=${comercioId}`)
          setDadosBairro(response.data);
          } catch (err) {
            console.error(err);
          }
        }

           useEffect( () => {
          loadBairros()
          }, [comercioId]);



  async function handleSalvar(e) {
    e.preventDefault();

    
    const data = {
      nome,
      taxa_entrega: parseFloat(taxa_entrega),
    }
    const token = await getCookieClient();
    try {
      // Enviar todos os bairros de uma vez — 
      // ajuste conforme sua API (se aceitar array), se não, faz loop pra enviar um por um
      const response = await api.post(`/bairros?comercioId=${comercioId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Bairros cadastrados com sucesso!");
      loadBairros();
      setNome("");
      setTaxa_entrega("");
    } catch (err) {
      toast.error("Erro ao cadastrar bairros.");
      console.error(err);
    }
  }



 
    

       
 

 

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2><MapPin size={30} style={{ marginRight: 8, color: 'blue' }} /> Cadastrar Bairros</h2>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSalvar} className={styles.formulario}>
          <div className={styles.inputs}>
            <div className={styles.inputGroup}>
              <input
                placeholder="Nome do Bairro"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              <MapPin className={styles.icon} />
            </div>

            <div className={styles.inputGroup}>
              <input
                placeholder="Taxa de entrega (R$)"
                type="number"
                step="0.01"
                value={taxa_entrega}
                onChange={(e) => setTaxa_entrega(e.target.value)}
                required
                
              />
              <DollarSign className={styles.icon} />
            </div>
          </div>

          <button type="submit" className={styles.botaoPrincipal}>
            <CircleFadingPlus size={16} />
            <span>Salvar Bairro</span>
          </button>
        </form>
      </div>

      <div className={styles.tabela}>
      <table>
  <thead>
    <tr>
      <th>Nome do Bairro</th>
      <th>Taxa de Entrega (R$)</th>
      <th>Remover Bairro</th>
      <th>Atualizar Bairro</th>
    </tr>
  </thead>

  <tbody>
    {dadosBairro.length === 0 ? (
      <tr>
        <td colSpan={4} className={styles.semDados}>
          Nenhum bairro cadastrado...
        </td>
      </tr>
    ) : (
      dadosBairro.map((index) => (
        <tr key={index.id}>
          <td>{index.nome}</td>
          <td>R$ {Number(index.taxa_entrega).toFixed(2).replace(',', '.')}</td>
          <td>
            <button className={styles.botaoIcone} >
              <Trash2 size={18} color="#d11212ff"   />
            </button>
          </td>
          <td>
            <button className={styles.botaoIcone} >
              <Edit3 size={18} color="#0c4a6e" className={styles.Edit3} />
            </button>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>

      </div>
    </div>
  );
}




