"use client";
import { RefreshCw, X, Search, CreditCard, ChevronDown } from "lucide-react";
import styles from "../../styles/pedidos/pedido.module.scss";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import { useContext, useEffect, useState, useRef } from "react";
import { toast } from 'react-hot-toast';
import { ComercioContext } from "../layout";

export default function Pedidos() {
  const comercioId = useContext(ComercioContext);
  const [listarPedidos, setListarPedidos] = useState([]);
  const [somAtivo, setSomAtivo] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const audioNovoPedido = useRef(null);
  const inputFileRef = useRef(null);
  const ultimoPedidoCount = useRef(0);
  const [mostrarDetalhesModal, setMostrarDetalhesModal] = useState(false);
  const [pedidoParaVisualizar, setPedidoParaVisualizar] = useState(null);
  const [motoboys, setMotoboys] = useState([]);
  const [mostrarMotoboys, setMostrarMotoboys] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [filtroMotoboy, setFiltroMotoboy] = useState('todos');

  // Funções de Ação/Status simplificadas para usar o status do pedido visualizado
  const AtualizarStatusEFecharModal = async (status) => {
    if (pedidoParaVisualizar) {
      await AtualizarStatus(pedidoParaVisualizar.id, status);
      // setMostrarDetalhesModal(false); // Descomente se quiser fechar o modal após qualquer atualização
    }
  };

  const handleMarcar = () => AtualizarStatusEFecharModal("ACEITO");
  const handlePendente = () => AtualizarStatusEFecharModal("PENDENTE");
  const handlePreparo = () => AtualizarStatusEFecharModal("PREPARO");
  const handlePronto = () => AtualizarStatusEFecharModal("PRONTO");
  const handleCancelado = () => AtualizarStatusEFecharModal("CANCELADO");
  const handleFinalizado = () => AtualizarStatusEFecharModal("FINALIZADO");

  const handleEntregar = () => {
    if (pedidoParaVisualizar) {
      setPedidoSelecionado(pedidoParaVisualizar);
      setMostrarMotoboys(true);
      // O AtualizarStatus("ENTREGA") será chamado após a seleção do motoboy em confirmarMotoboy
    }
  };
  
  // Função para DESFAZER o último status (se necessário, ou mantém o fluxo de Avançar)
  const handleDesmarcar = (statusAtual) => {
    let statusAnterior = "ACEITO"; // Padrão
    switch (statusAtual.toUpperCase()) {
      case "PENDENTE": statusAnterior = "ACEITO"; break;
      case "PREPARO": statusAnterior = "PENDENTE"; break;
      case "PRONTO": statusAnterior = "PREPARO"; break;
      case "ENTREGA": statusAnterior = "PREPARO"; break; 
      case "CANCELADO": statusAnterior = "ACEITO"; break; 
      case "FINALIZADO": statusAnterior = "ACEITO"; break; 
      default: statusAnterior = "ACEITO";
    }
    AtualizarStatus(pedidoParaVisualizar.id, statusAnterior);
  };


  const [entregasMotoboys, setEntregasMotoboys] = useState(() => {
    if (typeof window !== "undefined") {
      const dadosSalvos = localStorage.getItem("entregas");
      return dadosSalvos ? JSON.parse(dadosSalvos) : [];
    }
    return [];
  });

  function abrirModalDetalhes(pedido) {
    // Ao abrir, apenas define o pedido para visualização
    setPedidoParaVisualizar(pedido);
    setMostrarDetalhesModal(true);
  }

  function fecharModalDetalhes() {
    setPedidoParaVisualizar(null);
    setMostrarDetalhesModal(false);
  }

  const totalGeral = entregasMotoboys.reduce((acc, e) => acc + e.taxa, 0);
  const nomesMotoboys = Array.from(new Set(entregasMotoboys.map(e => e.nome)));
  const entregasFiltradas = filtroMotoboy === 'todos' ? entregasMotoboys : entregasMotoboys.filter(e => e.nome === filtroMotoboy ) ;
  const resumoFiltrado = entregasFiltradas.reduce((acc, entrega) => {
    if (!acc[entrega.nome]) acc[entrega.nome] = 0;
    acc[entrega.nome] += entrega.taxa;
    return acc;
  }, {});

  useEffect( () => {
    const dadosSalvosMotoboy = localStorage.getItem("entregas");
    if(dadosSalvosMotoboy) {
      setEntregasMotoboys(JSON.parse(dadosSalvosMotoboy));
    }
  },[])

  useEffect( () => {
    localStorage.setItem("entregas",JSON.stringify(entregasMotoboys))
  },[entregasMotoboys])

  useEffect(() => {
    async function listarMotoboys() {
      if (!comercioId) return;
      const token = getCookieClient();
      try {
        const response = await api.get(`/motoboys?comercioId=${comercioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ativos = response.data.filter(m => m.ativo);
        setMotoboys(ativos);
      } catch (error) {
        console.error("ERRO AO LISTAR MOTOBOYS", error);
      }
    }
    listarMotoboys();
  }, [comercioId]);

  function selecionarMotoboy(pedido) {
    fecharModalDetalhes();
    setPedidoSelecionado(pedido);
    setMostrarMotoboys(true);
  }

  async function confirmarMotoboy(motoboyId) {
    setMostrarMotoboys(false);
    const motoboySelecionado = motoboys.find(m => m.id === motoboyId);
    if (motoboySelecionado) {
      setEntregasMotoboys(prev => {
        const entregasSemPedidoAtual = prev.filter(entrega => entrega.pedidoId !== pedidoSelecionado.id);
        return [
          ...entregasSemPedidoAtual,
          {
            nome: motoboySelecionado.nome,
            taxa: pedidoSelecionado.taxaEntrega,
            pedidoId: pedidoSelecionado.id,
            status: "ENTREGA", 
          }
        ];
      });
    }
    await AtualizarStatus(pedidoSelecionado.id, "ENTREGA", motoboyId);
    setPedidoSelecionado(null); 
  }

  async function AtualizarStatus(pedidoId, status, motoboyId = null) {
    if (!comercioId) return;
    const token = getCookieClient();
    const statusMaiusculo = status.toUpperCase();
    if(statusMaiusculo === "FINALIZADO" || statusMaiusculo === "CANCELADO"){
      const confirmar = window.confirm(`Tem certeza que deseja ${status.toLowerCase()} o pedido?`);
      if (!confirmar) return // FECHA O MODAL APÓS CANCELAR
        fecharModalDetalhes();
    }
    try {
      const response = await api.put(
        "/pedidos/status",
        { id: pedidoId, status: statusMaiusculo, motoboyId },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { comercioId },
        }
      );
      
      const novoPedidoStatus = response.data.status;
      
      setListarPedidos((prevPedidos) =>
        prevPedidos
          .map((pedido) =>
            pedido.id === pedidoId
              ? { ...pedido, status: novoPedidoStatus }
              : pedido
          )
          .filter(
            (pedido) =>
              pedido.status.toUpperCase() !== "FINALIZADO" &&
              pedido.status.toUpperCase() !== "CANCELADO"
          )
      );
      
      // ATUALIZA O ESTADO DO PEDIDO NO MODAL
      setPedidoParaVisualizar((prev) =>
        prev && prev.id === pedidoId
          ? { ...prev, status: novoPedidoStatus }
          : prev
      );

      // Atualiza o registro de entregas se o status for ENTREGA
      if (statusMaiusculo === "ENTREGA" && pedidoParaVisualizar) {
          setEntregasMotoboys(prev => prev.map(entrega => 
              entrega.pedidoId === pedidoId ? {...entrega, status: novoPedidoStatus} : entrega
          ));
      }

      if (statusMaiusculo === "FINALIZADO") {
        toast.success("Seu pedido foi finalizado com sucesso!", {
          style:{backgroundColor:"#4CAF50", color:"white", fontWeight:"600", borderLeft:"6px solid #2e7d32",boxShadow:" 0 2px 8px rgba(46, 125, 50, 0.4)"}
        });
      } else if (statusMaiusculo === "CANCELADO") {
        toast.success("Seu pedido foi cancelado com sucesso!", {
          style:{backgroundColor:"#f44336", color:"white", fontWeight:"600", borderLeft:"6px solid #ff0000ff",boxShadow:" 0 2px 8px rgba(171, 14, 48, 1)"}
        });
      } else {
        toast.success(`Pedido atualizado para ${status.toLowerCase()}`);
      }
    } catch (error) {
      toast.error("Erro ao atualizar status do pedido.");
      console.error("ERRO AO ATUALIZAR STATUS", error);
    }
  }

  useEffect(() => {
    if (audioURL) {
      audioNovoPedido.current = new Audio(audioURL);
    } else {
      audioNovoPedido.current = null;
    }
  }, [audioURL]);

  function abrirSeletor() {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  }

  function handleAudioChange(event) {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setAudioURL(fileURL);
      setSomAtivo(true);
      const testAudio = new Audio(fileURL);
      testAudio.play().catch(() => {
        alert("Não foi possível reproduzir o áudio selecionado.");
      });
      setTimeout(() => {
        testAudio.pause();
        testAudio.currentTime = 0;
      }, 3000);
    }
  }

  function toggleSom() {
    if (!audioURL) {
      alert("Por favor, selecione um arquivo de áudio primeiro.");
      return;
    }
    setSomAtivo(!somAtivo);
  }

  useEffect(() => {
    if (!comercioId) return;
    let intervalo;
    async function getPedidos() {
      const token = getCookieClient();
      try {
        const response = await api.get("/pedidos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { comercioId },
        });
        const novosPedidos = response.data;
        const pedidosAtivos = novosPedidos.filter( (pedido) => pedido.status.toUpperCase() !== "FINALIZADO" && pedido.status.toUpperCase() !== "CANCELADO");
        if (somAtivo && audioNovoPedido.current && novosPedidos.length > ultimoPedidoCount.current) {
          audioNovoPedido.current.currentTime = 0;
          audioNovoPedido.current.play().catch(() => {
            console.log("Som bloqueado pelo navegador");
          });
          setTimeout(() => {
            if (audioNovoPedido.current) {
              audioNovoPedido.current.pause();
              audioNovoPedido.current.currentTime = 0;
            }
          }, 3000);
        }
        ultimoPedidoCount.current = novosPedidos.length;
        setListarPedidos(pedidosAtivos);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }
    getPedidos();
    intervalo = setInterval(getPedidos, 5000);
    return () => clearInterval(intervalo);
  }, [comercioId, somAtivo, audioURL]);

  function getStatusClass(status) {
    switch (status.toUpperCase()) {
      case "ACEITO": return styles.statusAceitar;
      case "PENDENTE": return styles.statusPendente;
      case "PREPARO": return styles.statusEmPreparo;
      case "ENTREGA": return styles.statusEntregar;
      case "PRONTO": return styles.statusPronto;
      case "CANCELADO": return styles.statusCancelado;
      case "FINALIZADO": return styles.statusFinalizar;
      default: return styles.status;
    }
  }

  function getStatusSpanClass(status) {
    switch (status.toUpperCase()) {
      case "ACEITO": return "statusSpanAceitar";
      case "PENDENTE": return "statusSpanPendente";
      case "PREPARO": return "statusSpanEmPreparo";
      case "ENTREGA": return "statusSpanEntregar";
      case "PRONTO": return "statusSpanPronto";
      case "CANCELADO": return "statusSpanCancelado";
      case "FINALIZADO": return "statusSpanFinalizar";
      default: return "";
    }
  }

  function formatarHora(dataISO) {
    if (!dataISO) return "—";
    const data = new Date(dataISO);
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function handleDeletarStorage(){
    const confirmado = window.confirm("Deseja deletar o registo de motoboys ?")
    if(entregasMotoboys.length === 0){
      return toast.error(" Não há registros para deletar")
    }
    if(confirmado){
      localStorage.removeItem("entregas")
      setEntregasMotoboys([])
      toast.success(" Registros de motoboy deletado com sucesso")
    }
  }

  // Define a ordem sequencial dos status
  const statusOrder = ["ACEITO", "PENDENTE", "PREPARO", "ENTREGA", "PRONTO", "FINALIZADO"];

  // Função PRINCIPAL: Checa se o status foi atingido (passado ou atual)
  const isCompletedOrCurrentStatus = (statusParaChecar) => {
    const currentStatusUpperCase = pedidoParaVisualizar?.status?.toUpperCase();
    if (!currentStatusUpperCase) return false;
    
    // Status quebram a trilha (são únicos e não sequenciais)
    if (statusParaChecar.toUpperCase() === "CANCELADO" || statusParaChecar.toUpperCase() === "FINALIZADO") {
        return statusParaChecar.toUpperCase() === currentStatusUpperCase;
    }

    const currentStatusIndex = statusOrder.indexOf(currentStatusUpperCase);
    const chekingStatusIndex = statusOrder.indexOf(statusParaChecar.toUpperCase());
    
    // É marcado se seu índice for menor ou igual ao índice do status atual
    return chekingStatusIndex !== -1 && chekingStatusIndex <= currentStatusIndex;
  };
  
  // Função auxiliar para determinar a classe do botão Marcar (Corpo do botão)
  const getBotaoMarcarClass = (statusParaChecar) => {
      const isMarked = isCompletedOrCurrentStatus(statusParaChecar);

      if (statusParaChecar.toUpperCase() === 'CANCELADO') {
          // Se o status atual for CANCELADO, marca seu botão em vermelho
          return `${styles.btnmarcarCancelado} ${isMarked ? styles.marcarDesativadoCancelado : ''}`;
      }
      
      if (statusParaChecar.toUpperCase() === 'FINALIZADO') {
          // Se o status atual for FINALIZADO, marca seu botão em verde (marcarDesativadoFinalizado)
          return `${styles.btnmarcar} ${isMarked ? styles.marcarDesativadoFinalizado : ''}`;
      }
      
      // Para todos os status sequenciais, aplica o estilo verde claro 'Marcado' se concluído ou atual
      return `${styles.btnmarcar} ${isMarked ? styles.marcarDesativado : ''}`;
  };

  // Função auxiliar para determinar a classe do Círculo de Status (Preenchimento do círculo)
  const getCirculoStatusClass = (statusParaChecar, baseClass) => {
      const isMarked = isCompletedOrCurrentStatus(statusParaChecar);
      
      let extraClass = '';
      
      // Aplica a cor SÓLIDA para todos os status marcados (passados ou atuais), exceto Cancelado
      if (isMarked) {
          switch (statusParaChecar.toUpperCase()) {
              case "ACEITO": extraClass = styles.aceitarVerde; break;
              case "PENDENTE": extraClass = styles.pendenteLaranja; break;
              case "PREPARO": extraClass = styles.preparoRoxo; break;
              case "ENTREGA": extraClass = styles.entregaAzul; break;
              case "PRONTO": extraClass = styles.prontoAzul; break;
              case "CANCELADO": extraClass = styles.canceladoVermelho; break;
              case "FINALIZADO": extraClass = styles.finalizadoVerde; break;
              default: extraClass = '';
          }
      }
      
      return `${styles.botao} ${baseClass} ${extraClass}`;
  };


  return (
    <div className={styles.container}>
      {/* Botão de Resumo e Header */}
      <button onClick={() => setMostrarResumo(true)} className={styles.botaoResumo}>
        📊 Resumo das Entregas
      </button>

      <div className={styles.header}>
        <h1 className={styles.titulo}>📦 Painel de Pedidos</h1>
        <input
          ref={inputFileRef}
          type="file"
          accept="audio/*"
          onChange={handleAudioChange}
          style={{ display: "none" }}
        />
        <button
          onClick={() => {
            if (!audioURL) {
              const confirmar = window.confirm("Deseja escolher um som de notificação?");
              if (confirmar) abrirSeletor();
            } else {
              const confirmar = window.confirm(
                somAtivo
                  ? "Deseja desativar o som de notificações?"
                  : "Deseja ativar o som de notificações?"
              );
              if (confirmar) toggleSom();
            }
          }}
          className={`${styles.botaoAudio} ${somAtivo ? styles.somAtivo : styles.somInativo}`}
          title={!audioURL ? "Clique para escolher o som" : somAtivo ? "Clique para desativar o som" : "Clique para ativar o som"}
        >
          {!audioURL ? "🔊" : somAtivo ? "🔕" : "🔈"}
        </button>
      </div>

      {listarPedidos.length === 0 && (
        <div className={styles.emptyState}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={styles.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-6h6v6m-9 4h12a2 2 0 002-2V7a2 2 0 00-2-2h-5l-2-2h-5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className={styles.title}>Nenhum pedido encontrado</p>
          <p className={styles.subtitle}>
            Os pedidos aparecerão aqui quando forem realizados.
          </p>
        </div>
      )}

      {/* LISTA SIMPLIFICADA DE PEDIDOS */}
      <div className={styles.listaSimples}>
        {listarPedidos.map((pedido, index) => (
          <button
            key={pedido.id}
            className={`${styles.pedidoBotaoCard} ${getStatusClass(pedido.status)}`}
            onClick={() => abrirModalDetalhes(pedido)}
          >
            <span className={styles.pedidoNumeroSimples}>
              📦 Pedido #{String(index + 1).padStart(2, "0")}
            </span>
            <span className={styles.statusTagSimples}>
              {pedido.status}
            </span>
          </button>
        ))}
      </div>

      {/* MODAL DE DETALHES DO PEDIDO */}
      {mostrarDetalhesModal && pedidoParaVisualizar && (

        <div className={styles.modalDetalhesContent}>

          <div className={styles.modalDetalhesBox}>


            <div className={styles.modalDetalhesHeader}>
              <h4 className={styles.modalDetalhesTitulo}>

                <span className={styles.h4detalhes}>
                  {pedidoParaVisualizar.cliente?.nome || "—"}
                </span>

                <p className={styles.pTel}>
                  {pedidoParaVisualizar.cliente?.telefone || "—"}
                </p>
              </h4>

              <div style={{paddingRight:'20px', display: "flex", gap:'20px'}}>

                <button className={styles.botaoImpressora}>
                  <img src="/impressora.png" width={34} height={34}/>
                </button>

                <button className={styles.botaoWhatsApp}>
                  <a>
                    <img src="/whats.png" width={34} height={34}/>
                  </a>
                </button>

                <button onClick={fecharModalDetalhes} className={styles.botaoFecharModal}>
                  <X size={34} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop:"30px" }}>
              <div>
                Número do Pedido: <strong>#0{listarPedidos.findIndex(p => p.id === pedidoParaVisualizar.id) + 1}</strong>
              </div>

              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap:'10px'}}>
                <div className={styles.relogio}>
                  <span className={styles.labelHora}>Hoje às</span>
                  <span className={styles.hora}>{formatarHora(pedidoParaVisualizar.dataPedido)}</span>

                </div>
                <span className={`${styles.statusSpan} ${styles[getStatusSpanClass(pedidoParaVisualizar.status)]}`}>
                  {pedidoParaVisualizar.status}
                </span>
              </div>
            </div>

            {/* AÇÕES NO MODAL */}
            <div className={styles.divAlinhamento}>
              <div className={styles.actions}>

                {/* Botão ACEITO */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", }} >
                  <button
                    className={getCirculoStatusClass("ACEITO", styles.aceitar)}
                  ></button>
                  <span className="btn-label">Aceitar</span>
                  <button
                    className={getBotaoMarcarClass("ACEITO")}
                    onClick={isCompletedOrCurrentStatus("ACEITO") && !isCompletedOrCurrentStatus("CANCELADO") && !isCompletedOrCurrentStatus("FINALIZADO") ? () => handleDesmarcar(pedidoParaVisualizar.status) : handleMarcar}
                    disabled={isCompletedOrCurrentStatus("CANCELADO") || isCompletedOrCurrentStatus("FINALIZADO")}
                  >
                    <span>{isCompletedOrCurrentStatus("ACEITO") ? "Marcado" : "Marcar"}</span>
                  </button>
                </div>

                {/* Botão PENDENTE */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", }} >
                  <button
                    className={getCirculoStatusClass("PENDENTE", styles.pendente)}
                  ></button>
                  <span className="btn-label">Pendente</span>
                  <button
                    className={getBotaoMarcarClass("PENDENTE")}
                    onClick={isCompletedOrCurrentStatus("PENDENTE") && !isCompletedOrCurrentStatus("CANCELADO") && !isCompletedOrCurrentStatus("FINALIZADO") ? () => handleDesmarcar(pedidoParaVisualizar.status) : handlePendente}
                    disabled={isCompletedOrCurrentStatus("CANCELADO") || isCompletedOrCurrentStatus("FINALIZADO")}
                  >
                    <span>{isCompletedOrCurrentStatus("PENDENTE") ? "Marcado" : "Marcar"}</span>
                  </button>
                </div>


                <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                  <button
                    className={getCirculoStatusClass("PREPARO", styles.emPreparo)}
                  />
                  <span className="btn-label">Em Preparo</span>
                  <button
                    className={getBotaoMarcarClass("PREPARO")}
                    onClick={isCompletedOrCurrentStatus("PREPARO") && !isCompletedOrCurrentStatus("CANCELADO") && !isCompletedOrCurrentStatus("FINALIZADO") ? () => handleDesmarcar(pedidoParaVisualizar.status) : handlePreparo}
                    disabled={isCompletedOrCurrentStatus("CANCELADO") || isCompletedOrCurrentStatus("FINALIZADO")}
                  >
                    <span>{isCompletedOrCurrentStatus("PREPARO") ? "Marcado" : "Marcar"}</span>
                  </button>
                </div >

                {pedidoParaVisualizar.tipoPedido !== "RETIRADA" && (
                  <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                    <button
                      className={getCirculoStatusClass("ENTREGA", styles.entregar)}
                    />
                    <span className="btn-label">Entregar</span>
                    <button
                      className={getBotaoMarcarClass("ENTREGA")}
                      onClick={isCompletedOrCurrentStatus("ENTREGA") && !isCompletedOrCurrentStatus("CANCELADO") && !isCompletedOrCurrentStatus("FINALIZADO") ? () => handleDesmarcar(pedidoParaVisualizar.status) : handleEntregar}
                      disabled={isCompletedOrCurrentStatus("CANCELADO") || isCompletedOrCurrentStatus("FINALIZADO")}
                    >
                      <span>{isCompletedOrCurrentStatus("ENTREGA") ? "Marcado" : "Marcar"}</span>
                    </button>
                  </div>
                )}

                {pedidoParaVisualizar.tipoPedido !== "ENTREGA" && (
                  <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                    <button
                      className={getCirculoStatusClass("PRONTO", styles.pronto)}
                    />
                    <span className="btn-label">Pronto</span>
                    <button
                      className={getBotaoMarcarClass("PRONTO")}
                      onClick={isCompletedOrCurrentStatus("PRONTO") && !isCompletedOrCurrentStatus("CANCELADO") && !isCompletedOrCurrentStatus("FINALIZADO") ? () => handleDesmarcar(pedidoParaVisualizar.status) : handlePronto}
                      disabled={isCompletedOrCurrentStatus("CANCELADO") || isCompletedOrCurrentStatus("FINALIZADO")}
                    >
                      <span>{isCompletedOrCurrentStatus("PRONTO") ? "Marcado" : "Marcar"}</span>
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} >
                  <button
                    className={getCirculoStatusClass("CANCELADO", styles.cancelado)}
                  />
                  <span className="btn-label">Cancelar</span>
                  <button
                    className={getBotaoMarcarClass("CANCELADO")}
                    onClick={handleCancelado}
                  >
                    <span>{isCompletedOrCurrentStatus("CANCELADO") ? "Marcado" : "Marcar"}</span>
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} >
                  <button
                    className={getCirculoStatusClass("FINALIZADO", styles.finalizar)}
                  />
                  <span className="btn-label">Finalizar</span>
                  <button
                    className={getBotaoMarcarClass("FINALIZADO")}
                    onClick={handleFinalizado}
                  >
                    <span>{isCompletedOrCurrentStatus("FINALIZADO") ? "Marcado" : "Marcar"}</span>
                  </button>
                </div>
              </div>
            </div>


            <div className={styles.info}>


              <p>
                <strong>💸 Tipo de pedido:</strong> {pedidoParaVisualizar.tipoPedido}
              </p>
              <p>
                <strong>🕒 Recebido às: </strong> {formatarHora(pedidoParaVisualizar.dataPedido)}
              </p>

              <div className={styles.produtoBox}>
                <p style={{ textAlign: "center" }}>
                  <strong>🍕 Produtos do Pedido</strong>
                </p>

                {pedidoParaVisualizar.itemPedidos?.map((item, i) => {
                  const saboresSeparados =
                    pedidoParaVisualizar.sabores?.split(",").map((s) => s.trim()) || [];
                  const totalSabores = saboresSeparados.length;

                  return (
                    <div key={i} className={styles.itemBox}>
                      <div className={styles.saboresBox}>
                        <p className={styles.teste}>
                          <strong>{i + 1}.</strong> {item.produto?.name || "Produto"}
                        </p>

                        {totalSabores > 1 ? (
                          saboresSeparados.map((sabor, index) => (
                            <p key={index} className={styles.saborLinha}>
                              {` ${sabor}`}
                            </p>
                          ))
                        ) : (
                          <p className={styles.saborLinha}>
                            {`${item.produto?.name || 'Produto'} `}
                          </p>
                        )}

                        <div className={styles.linhaDetalhes}>
                          <p className={styles.quantidade}>
                            Quantidade: **{item.quantidade}**
                          </p>

                        </div>

                        {item.descricao && (
                          <p className={styles.observacao}>
                            **📝 Observação:** {item.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p>
                <strong>👤 Cliente:</strong> {pedidoParaVisualizar.cliente?.nome || "—"}
              </p>
              <p>
                <strong>🔢 Quantidade de produtos:</strong> {pedidoParaVisualizar.quantidade || "—"}
              </p>

              <div  style={{display:"flex", alignItems:"center", gap:'7px' }}>
                <span style={{marginBottom:'5px'}}><CreditCard size={20}/> </span>
                <p>
                  <strong>  Pagamento:</strong>{" "}
                  <strong>{pedidoParaVisualizar.formaPagamento || "—"}</strong>
                  {Number(pedidoParaVisualizar.troco) > 0 && (
                    <strong>
                      {" "}
                      <span> — Troco Para: R$ {Number(pedidoParaVisualizar.troco).toFixed(2)}</span>{" "}
                    </strong>
                  )}
                </p>
              </div>

              {pedidoParaVisualizar.tipoPedido !== "RETIRADA" && (
                <>
                  <p>
                    <span className={styles.label}>📍 Endereço:</span>{" "}
                    {pedidoParaVisualizar.cliente?.endereco || "—"}
                    <span className={styles.numero}>
                      <span className={styles.label}>Nº:</span>{" "}
                      {pedidoParaVisualizar.cliente?.numero || "—"}
                    </span>
                  </p>

                  <p>
                    <strong>🏘️ Bairro:</strong> {pedidoParaVisualizar.cliente?.bairro || "—"}
                  </p>

                  <p>
                    <strong>💲 Taxa:</strong> R$ {pedidoParaVisualizar.taxaEntrega.toFixed(2)}
                  </p>

                  <p>
                    <strong> Cidade:</strong> {pedidoParaVisualizar.cliente?.cidade || "—"}
                  </p>
                  <button
                    onClick={() => {
                      const enderecoCompleto = `${pedidoParaVisualizar.cliente?.endereco || ''} ${pedidoParaVisualizar.cliente?.numero || ''} ${pedidoParaVisualizar.cliente?.cidade || ''}`;
                      const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;
                      window.open(urlMapa, '_blank', 'noopener,noreferrer');
                    }}
                    className={styles.botaoMapa}
                  >
                    Ver no mapa 📍
                  </button>
                </>
              )}

              <p>
                <strong>📞 Telefone:</strong> {pedidoParaVisualizar.cliente?.telefone || "—"}
              </p>

              {pedidoParaVisualizar.tipoPedido !== "ENTREGA" &&
                pedidoParaVisualizar.cliente?.email &&
                pedidoParaVisualizar.cliente.email !== "0" && (
                  <p>
                    <strong>📌 Observação da retirada:</strong>{" "}
                    <span className={styles.status}>{pedidoParaVisualizar.cliente.email}</span>
                  </p>
                )}

              <p style={{ marginTop: "10px" }}>
                <strong>💰 Total:</strong> R$ {pedidoParaVisualizar.tipoPedido === "ENTREGA" ? (pedidoParaVisualizar.total + pedidoParaVisualizar.taxaEntrega).toFixed(2) : pedidoParaVisualizar.total.toFixed(2)}
              </p>

            </div>

            {/* FIM MODAL DETALHES BOX */}
          </div>

          {/* FIM MODAL DE DETALHES */}
        </div>
      )}

      {/* MODAL MOTOBOYS */}
      {mostrarMotoboys && pedidoSelecionado && (
        <div className={styles.modalDetalhesContent}>
          <div className={styles.modalMotoboys}>
            <div className={styles.modalMotoboysHeader}>
              <h4>Selecione o Motoboy para o Pedido #{listarPedidos.findIndex(p => p.id === pedidoSelecionado.id) + 1}</h4>
              <button onClick={() => setMostrarMotoboys(false)} className={styles.botaoFecharModal}><X size={24} /></button>
            </div>
            <div className={styles.motoboysLista}>
              {motoboys.length === 0 ? (
                <p>Nenhum motoboy ativo encontrado.</p>
              ) : (
                motoboys.map(motoboy => (
                  <button
                    key={motoboy.id}
                    className={styles.motoboyItem}
                    onClick={() => confirmarMotoboy(motoboy.id)}
                  >
                    {motoboy.nome}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESUMO DE ENTREGAS */}
      {mostrarResumo && (
        <div className={styles.modalDetalhesContent}>
          <div className={styles.modalResumo}>
            <div className={styles.modalResumoHeader}>
              <h4>Resumo das Entregas</h4>
              <button onClick={() => setMostrarResumo(false)} className={styles.botaoFecharModal}><X size={24} /></button>
            </div>

            <div className={styles.filtroContainer}>
              <label htmlFor="filtroMotoboy" className={styles.filtroLabel}>Filtrar por Motoboy:</label>
              <div className={styles.selectWrapper}>
                <select
                  id="filtroMotoboy"
                  className={styles.filtroSelect}
                  value={filtroMotoboy}
                  onChange={(e) => setFiltroMotoboy(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {nomesMotoboys.map(nome => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>
                <ChevronDown size={20} className={styles.selectIcon} />
              </div>
            </div>

            <div className={styles.resumoContent}>
              <p className={styles.resumoTotal}>
                Total Geral de Taxas Registradas: <strong>R$ {totalGeral.toFixed(2)}</strong>
              </p>

              {Object.keys(resumoFiltrado).length > 0 && (
                <div className={styles.resumoMotoboys}>
                  <h5>Total por Motoboy (Filtro Atual):</h5>
                  {Object.entries(resumoFiltrado).map(([nome, total]) => (
                    <p key={nome} className={styles.motoboyTotalItem}>
                      {nome}: <strong>R$ {total.toFixed(2)}</strong>
                    </p>
                  ))}
                </div>
              )}

              {entregasFiltradas.length > 0 && (
                <div className={styles.detalhesEntregas}>
                  <h5>Detalhes das Entregas:</h5>
                  <ul className={styles.listaDetalhes}>
                    {entregasFiltradas.map((entrega, index) => (
                      <li key={index} className={styles.detalheItem}>
                        Motoboy: **{entrega.nome}** | Pedido ID: {entrega.pedidoId.slice(-4)} | Taxa: R$ {entrega.taxa.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button className={styles.botaoDeletarStorage} onClick={handleDeletarStorage}>
                Limpar Registros de Entregas
              </button>
            </div>

          </div>
        </div>
      )}
 


      {/* MODAL DE RESUMO DAS ENTREGAS (mantido) */}
      {mostrarResumo && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>

            <div className={styles.modalHeader}>
              <button
                className={styles.botaoCancelar}
                onClick={() => setMostrarResumo(false)}
                aria-label="Fechar resumo"
              >
                <X width={24} height={24} />
              </button>

              <h3 className={styles.h3}>📊 Resumo das Entregas</h3>
              <button ></button> {/* Placeholder para alinhamento */}
            </div>

            {/* Filtro */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="filtroMotoboy" style={{ fontWeight: '600', marginRight: 8 }}>
                Filtrar por motoboy:
              </label>
              <select
                id="filtroMotoboy"
                value={filtroMotoboy}
                onChange={e => setFiltroMotoboy(e.target.value)}
                style={{
                  padding: '6px 8px',
                  fontSize: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                <option value="todos">Todos</option>
                {nomesMotoboys.map(nome => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>

            <div className={styles.tableContainer}>
              {entregasFiltradas.length === 0 ? (
                <p>Nenhuma entrega registrada</p>
              ) : (
                <table className={styles.tabelaResumo}>
                  <thead>
                    <tr>
                      <th>Motoboy</th>
                      <th>Total Recebido (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resumoFiltrado).map(([nome, total], i) => (
                      <tr key={i}>
                        <td>{nome}</td>
                        <td>R$ {total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div
              style={{
                marginTop: '24px',
                fontWeight: '700',
                fontSize: '1.2rem',
                color: '#1976d2',
                userSelect: 'none',
                textAlign: 'right',
                display:"flex",
                justifyContent:"space-between"
              }}
            >
              <button
                style={{
                  backgroundColor: "#d32f2f",
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#b71c1c")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#d32f2f")}
                onClick={handleDeletarStorage}
              >
                Deletar Registros
              </button>

              Total Geral: R$ {totalGeral.toFixed(2)}
            </div>

          </div>
        </div>
      )}

                   {/* MODAL DE SELEÇÃO DE MOTOBOY (mantido) */}
      {mostrarMotoboys && (
        <div className={styles.modal1}>
          <div className={styles.modalMotoboy}>
            <h3>Escolha o motoboy</h3>

            {motoboys.length === 0 ? (
              <p className={styles.semMotoboy}>Nenhum motoboy ativo no momento</p>
            ) : (
              <div className={styles.listaMotoboys}>
                {motoboys.map(m => (
                  <div
                    key={m.id}
                    className={styles.cardMotoboy}
                    onClick={() => confirmarMotoboy(m.id)}
                  >
                    <div className={styles.motoboyInfo}>
                      <strong>{m.nome}</strong>
                      <span>{m.telefone}</span>
                    </div>
                    <span className={styles.selecionar}>Selecionar</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className={styles.botaoCancelar1}
              onClick={() => setMostrarMotoboys(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
        
      )}


    </div>

    
  );

  
}