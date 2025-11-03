"use client"
import { getCookieClient } from '@/lib/cookieClient';
import styles from '../../styles/listarProdutos/listarProdutos.module.scss';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState, useContext } from 'react';
import { ComercioContext } from '../layout';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function ListarProdutos() {
  const comercioId = useContext(ComercioContext);
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categoriasAbertas, setCategoriasAbertas] = useState({});

  useEffect(() => {
    const token = getCookieClient();
    if (!comercioId) return;

    async function listarProdutos() {
      try {
        const response = await api.get('/listarProdutos', {
          headers: { Authorization: `Bearer ${token}` },
          params: { comercioId }
        });
        setProdutos(response.data);
      } catch (erro) {
        toast.error('Erro ao buscar produtos');
      }
    }

    listarProdutos();
  }, [comercioId]);


  // Pega as categorias únicas direto dos produtos
  const categoriasUnicas = [];

  produtos.forEach(produto => {
    const categoriasDoForEache = produto.categoria || { id: 'sem-categoria', name: 'Sem categoria' };
    // adiciona categoria se ainda não estiver na lista
    if (!categoriasUnicas.find(c => c.id === categoriasDoForEache.id)) {
      categoriasUnicas.push(categoriasDoForEache);
    }
  });

 
  

  function toggleCategoria(id) {
  setCategoriasAbertas(prev => {
    const novoEstado = { ...prev };

    if (novoEstado[id]) {
      novoEstado[id] = false; // já estava aberto, então fecha
    } else {
      novoEstado[id] = true; // estava fechado, então abre
    }

    return novoEstado;
  });
  
  }
  return (
    <div className={styles.containerPrincipal}>
      <main className={styles.conteudo}>
        <h2 className={styles.titulo}>Listar Produtos do comércio</h2>

        <button className={styles.button} onClick={() => setMostrarFiltro(!mostrarFiltro)}>
          <span>Filtrar Produtos</span>
          <ChevronDown className={`${styles.chevron} ${mostrarFiltro ? styles.aberta : ''}`} />
        </button>

        {!mostrarFiltro && (
          <>
            {alerta && <p className={styles.alerta}>{alerta}</p>}

            {produtos.length === 0 ? (
              <p className={styles.mensagem}>Nenhum Produto encontrado.</p>
            ) : (
              <ul className={styles.listaProdutos}>
                {categoriasUnicas.map(categoria => (
                  <li key={categoria.id}>
                    <div
                      className={styles.itemProdutos}
                      onClick={() => toggleCategoria(categoria.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {categoria.name}
                      <ChevronDown
                        className={`${styles.chevron} ${categoriasAbertas[categoria.id] ? styles.aberta : ''}`}
                      />
                    </div>

                    {categoriasAbertas[categoria.id] && (
                      <ul className={styles.subLista}>
                        {produtos
                          .filter(p => (p.categoria?.id || 'sem-categoria') === categoria.id)
                          .map(produto => (
                            <li key={produto.id} className={styles.produtoItem}>
                              {produto.name} – R$ {produto.preco}
                            </li>
                          ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
