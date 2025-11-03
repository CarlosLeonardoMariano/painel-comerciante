"use client";
import { useContext, useEffect, useState } from "react";
import { ComercioContext } from "../layout";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import { Loader2, ChevronDown, Trash2 } from "lucide-react";
import styles from "../../styles/listarComercio/listarComercio.module.scss"

export default function ListarCategorias() {
  const comercioId = useContext(ComercioContext);
  const [categorias, setCategorias] = useState([]);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltro, setMostrarFiltro] = useState(false);

  useEffect(() => {
    if (!comercioId) return;

   async function fetchCategorias() {
  try {
    const response = await api.get("/categorias", {
      params: {
        comercioId: comercioId,
      },
    });
    setCategorias(response.data || []);
  } catch (erro) {
    console.error("Erro ao listar categorias:", erro);
    setAlerta("Erro ao listar categorias.");
  } finally {
    setLoading(false);
  }
}
fetchCategorias();
}, [comercioId]);




//FUNÇÃO PARA EXCLUIR CATEGORIA

async function handleDelete(id){
  const token = getCookieClient();

  try {
    const response = await api.delete(`/categorias/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        },
        params: {
          comercioId: comercioId
        }
      });
      console.log(response.data)
      setAlerta("Categoria excluída com sucesso");

      // Tempo de 3 segundos para atualizar a lista de categorias
      setTimeout( () => {
        setAlerta(null)
       }, 3000)

       // atualizar a lista de categorias após a exclusão dela
       setCategorias( (atualizar) => atualizar.filter( (atualizarParte2) => atualizarParte2.id !== id) )
       
       
        } catch (erro) {
          console.error("Erro ao excluir categoria:", erro);
          setAlerta("Erro ao excluir categoria.");
        }
    }














 if (!comercioId) {
  return (
    <div className={styles.comercioIdCarregando}>
      <Loader2 className={styles.spinner} />
      <p className={styles.textoCarregando}>Carregando comércio...</p>
    </div>
  );
}


  if (loading) {
    return (
      <div className={styles.comercioIdCarregando}>
        <Loader2 className={styles.spinner} />
        <p>Carregando categorias...</p>
      </div>
    );
  }

  return (
    <>
    <div className={styles.containerPrincipal}>
  <main className={styles.conteudo}>
    <h2 className={styles.titulo}>Listar Categorias do comercio</h2>
  <button className={styles.button} onClick={() => setMostrarFiltro(!mostrarFiltro)}>
  <span>Filtrar Categorias</span>
  <ChevronDown className={`${styles.chevron} ${mostrarFiltro ? styles.aberta : ""}`} />
</button>

   
{!mostrarFiltro && (
  <>
      {alerta && <p className={styles.alerta}>{alerta}</p>}


    {categorias.length === 0 ? (
      <p className={styles.mensagem}>Nenhuma categoria encontrada.</p>
    ) : (
      
      <ul className={styles.listaCategorias}>
        {categorias.map((categoria) => (
          <li key={categoria.id} className={styles.itemCategoria}>
            {categoria.name}
            <button className={styles.buttonTrash} onClick={ () => {

              if(confirm(" Deseja excluir a categoria?")) {
                handleDelete( categoria.id );
              }
            }
          }>
            <Trash2 />
          </button>
          </li>
          
        ))}
       
      </ul>
    )}

  </>
)}

  </main>
</div>

     
    </>
  );
}
