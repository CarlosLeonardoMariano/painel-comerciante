"use client";

import { useState, useEffect, useContext } from "react";
import { getCookieClient } from "@/lib/cookieClient";
import { api } from "@/services/api";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { ComercioContext } from "./layout";
import { DollarSign, ClipboardList, Users, LogOut, X, Search, ArrowLeft  } from "lucide-react";
import styles from "../styles/dashboard/dashboard.module.scss";

const PieChart = dynamic(() => import("@/components/barChat/barChart"), {
  ssr: false,
});

export default function DashboardComercio() {
  const comercioId = useContext(ComercioContext);
  const [user, setUser] = useState(null);
  const [logo, setLogo] = useState(null);
  const router = useRouter();

  const [pedidos, setPedidos] = useState([]);
  const [pedidoAberto, setPedidoAberto] = useState(null);
  const [totalPedidosFinalizadosCancelados, setTotalPedidosFinalizadosCancelados] = useState(0);
  const [filtroData, setFiltroData] = useState("TODOS");

  const [mostrarPedidosFiltrados, setMostrarPedidosFiltrados] = useState(false);
  const [mostrarModalClientes, setMostrarModalClientes] = useState(false);
  const [clientesFinalizados, setClientesFinalizados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVendas, setSearchVendas] = useState("");
  const [detalheCliente, setDetalheCliente] = useState(null);
  const [mostrarModalVendas, setMostrarModalVendas] = useState(false)


  // BLOQUEAR SCROLL QUANDO ABRIR MODAL DE PEDIDOS
  useEffect(() => {
    if (mostrarPedidosFiltrados) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mostrarPedidosFiltrados]);


    // BLOQUEAR SCROLL QUANDO ABRIR MODAL DE MOSTRAR MODAL CLIENTES
  useEffect(() => {
    if (mostrarModalClientes) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mostrarModalClientes]);




  // BLOQUEAR SCROLL QUANDO ABRIR MODAL DE MOSTRAR MODAL VENDAS
  useEffect(() => {
    if (mostrarModalVendas) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mostrarModalVendas]);


  // PEGAR DADOS DO USUÁRIO
  useEffect(() => {
    async function getDashboard() {
      const token = getCookieClient();
      const response = await api.get('/usuarios/detalhes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    }
    getDashboard();
  }, []);

  // PEGAR PEDIDOS
  useEffect(() => {
    if (!comercioId) return;

    let intervalo;

    async function getPedidos() {
      const token = getCookieClient();
      try {
        const response = await api.get("/pedidos", {
          headers: { Authorization: `Bearer ${token}` },
          params: { comercioId },
        });

        const pedidosData = response.data;
        setPedidos(pedidosData);
        //console.log(response.data)

        // TOTAL PEDIDOS FINALIZADOS/CANCELADOS
        const totalFinalizadosCancelados = pedidosData.filter(p => 
          ["FINALIZADO", "CANCELADO"].includes(p.status?.toUpperCase())
        ).length;
        setTotalPedidosFinalizadosCancelados(totalFinalizadosCancelados);

        // CLIENTES ÚNICOS FINALIZADOS
        const clientesUnicos = [];
        const telefoneVistos = new Set();
        pedidosData
          .filter(p => p.status?.toUpperCase() === "FINALIZADO")
          .forEach(pedido => {
            const cliente = pedido.cliente;
            if (cliente?.telefone && !telefoneVistos.has(cliente.telefone)) {
              telefoneVistos.add(cliente.telefone);
              clientesUnicos.push(cliente);
            }
          });
        setClientesFinalizados(clientesUnicos);

      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }

    getPedidos();
    intervalo = setInterval(getPedidos, 10000);
    return () => clearInterval(intervalo);

  }, [comercioId]);

  // PEGAR LOGO DO LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem("logoComercio");
    if (saved) setLogo(saved);
  }, []);

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert('Formato de Imagem Inválido..');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
      localStorage.setItem("logoComercio", reader.result);
    };
    reader.readAsDataURL(file);
  }

  function formatarAdmin(tipo) {
    if (tipo === "ADMIN") return "Administrador";
    if (tipo === "FUNCIONARIO") return "Funcionário";
    return "";
  }

  async function handleLogout() {
    await deleteCookie("session");
    alert("Sessão encerrada com sucesso!");
    router.push('/');
  }

  const filtrarPorData = (pedido) => {
    const dataPedido = new Date(pedido.dataPedido);
    const hoje = new Date();
    const diaDaSemana = dataPedido.getDay();
    switch (filtroData) {
      case "HOJE":
        return dataPedido.toDateString() === hoje.toDateString();
      case "SEMANA":
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);
        return dataPedido >= seteDiasAtras && dataPedido <= hoje;
      case "MES":
        return dataPedido.getMonth() === hoje.getMonth() && dataPedido.getFullYear() === hoje.getFullYear();
      case "SEGUNDA": case "TERCA": case "QUARTA": case "QUINTA": case "SEXTA": case "SABADO": case "DOMINGO":
        const mapa = { DOMINGO:0, SEGUNDA:1, TERCA:2, QUARTA:3, QUINTA:4, SEXTA:5, SABADO:6 };
        return diaDaSemana === mapa[filtroData];
      default:
        return true;
    }
  };


  const contarPedidosCliente = (cliente) => {
  if (!cliente) return 0;
  return pedidos.filter(
    p => (p.cliente?.id === cliente.id || p.cliente?.telefone === cliente.telefone)
         && p.status?.toUpperCase() === "FINALIZADO"
  ).length;
};


const totalGastoCliente = (cliente) => {
  if (!cliente) return 0;
  return pedidos
    .filter(
      p => (p.cliente?.id === cliente.id || p.cliente?.telefone === cliente.telefone)
           && p.status?.toUpperCase() === "FINALIZADO"
    )
    .reduce((total, p) => total + (p.total || 0) + (p.taxaEntrega || 0), 0);
};





function TotalValor() {
  return pedidos
    .reduce((acc, valor) => acc + (valor.total || 0), 0)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


function TicketMedio() {
  const pedidosFinalizados = pedidos.filter( p => p.status === "FINALIZADO");
  const soma = pedidosFinalizados.reduce( (acc, soma) => acc + (soma.total || 0), 0);
  const ticketMedio = pedidosFinalizados.length > 0 ? soma / pedidosFinalizados.length : 0;

  return ticketMedio.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
}


  return (
    <>
      <div className={styles.dashboard}>
        <main className={styles.main}>

          {/* Topbar */}
          <header className={styles.header}>
            <div className={styles.cabeca}>
              <h1>{user?.comercios?.[0]?.nome || "Nome do comércio"}</h1>

              <div className={styles.imageWrapper}>
                {logo ? (
                  <img src={logo} alt="Logo do comércio" className={styles.commerceImage} />
                ) : (
                  <div className={styles.noImage}>Sem foto</div>
                )}
                <label htmlFor="fileInput" className={styles.uploadLabel}>Trocar</label>
                <input id="fileInput" type="file" accept="image/*" onChange={handleImageUpload} className={styles.hiddenInput} />
              </div>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"97%" }}>
              <section className={styles.userProfile}>
                <h1 className={styles.title}>Bem-vindo, {user?.name || "Usuário"}</h1>
                <div className={styles.userInfo}>
                  <p><strong>{formatarAdmin(user?.admin)}</strong> da empresa <strong>{user?.comercios?.[0]?.nome}</strong></p>
                  <p><strong>Email cadastrado:</strong> {user?.email}</p>
                  <p><strong>Tipo do comércio:</strong> <span>{user?.comercios?.[0]?.tipo}</span></p>
                </div>
              </section>
              <LogOut width={30} height={30} className={styles.logout} onClick={handleLogout} />
            </div>
          </header>

          {/* Cards */}
          <section className={styles.cards}>
            <div className={styles.card} onClick={() => setMostrarModalVendas(true)}>
              <DollarSign className={styles.icon} />
              <div>
                <h3 className={styles.h3Vendas}>Vendas</h3>
                <p>{TotalValor()}</p>
              </div>
            </div>

            <div className={styles.card1} onClick={() => setMostrarPedidosFiltrados(true)} style={{ cursor:"pointer" }}>
              <ClipboardList className={styles.icon} />
              <div>
                <h3 className={styles.h3Pedidos}>Pedidos</h3>
                <p>{totalPedidosFinalizadosCancelados}</p>
              </div>
            </div>

            <div className={styles.card2} onClick={() => setMostrarModalClientes(true)} style={{ cursor:"pointer" }}>
              <Users className={styles.icon} />
              <div>
                <h3 className={styles.h3Clientes}>Clientes</h3>
                <p>{clientesFinalizados.length}</p>
              </div>
            </div>
          </section>

          {/* Gráfico */}
          <section className={styles.report}>
            <h2>Relatório Mensal</h2>
            <div style={{ height: 400 }}>
              <PieChart />
            </div>
          </section>

        </main>
      </div>



{/* MODAL CLIENTES PROFISSIONAL */}
{mostrarModalClientes && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>

      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
      <h2>Clientes cadastrado do comercio</h2>

<button
  onClick={() => setMostrarModalClientes(false)}
  className={styles.botaoFecharModal}
>
  &times;
</button>

      </div>


 <div className={styles.searchWrapper}>
  <input
    type="text"
    placeholder="Pesquisar cliente..."
    className={styles.searchInput}
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <Search className={styles.searchIcon} />
</div>


      <ul className={styles.clientesList}>
        {clientesFinalizados
          .filter(cliente => 
            cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cliente.telefone && cliente.telefone.includes(searchTerm))
          )
          .map(cliente => (
            <li key={cliente.telefone || cliente.id} className={styles.clienteItem}>
              <span>{cliente.nome}</span>
              <div>
                <button onClick={() => setDetalheCliente(cliente)} className={styles.detalhesBtn}>Ver Detalhes</button>
              </div>
            </li>
          ))}
      </ul>


      {/* Modal de detalhes */}
   {detalheCliente && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>

      {/* Botão de fechar no canto superior */}
      <button
        className={styles.botaoFecharModal2}
        onClick={() => setDetalheCliente(false)}
      >
        &times;
      </button>

      {/* Cabeçalho */}
      <h2 className={styles.modalTitle}>Detalhes do Cliente</h2>

      {/* Informações do cliente */}
      <div className={styles.clienteInfo}>
        <p><strong>Nome:</strong> {detalheCliente.nome || "Não informado"}</p>
        <p><strong>Telefone:</strong> {detalheCliente.telefone || "Não informado"}</p>
        <p><strong>Endereço:</strong> {detalheCliente.endereco}, Nº {detalheCliente.numero}</p>
        <p><strong>Bairro:</strong> {detalheCliente.bairro}</p>
        {detalheCliente.cidade && <p><strong>Cidade:</strong> {detalheCliente.cidade} - SP</p>}
      </div>

      {/* Painel de resumo */}
      <div className={styles.resumoGrid}>
        <div className={styles.cardGreen}>
          <strong>Qtd de Pedidos Realizados</strong>
          <p>{contarPedidosCliente(detalheCliente)}</p>
        </div>
        <div className={styles.cardYellow}>
          <strong>Total Gerado</strong>
          <p>R$ {totalGastoCliente(detalheCliente).toFixed(2)}</p>
        </div>
        <div className={styles.cardBlue}>
          <strong>Ticket Médio</strong>
          <p>
            R$ {contarPedidosCliente(detalheCliente) > 0
              ? (totalGastoCliente(detalheCliente)/contarPedidosCliente(detalheCliente)).toFixed(2)
              : "0,00"}
          </p>
        </div>
        <div className={styles.cardRed}>
          <strong>Último Pedido Feito Em</strong>
          <p>
            {pedidos
              .filter(p => p.cliente?.id === detalheCliente.id && p.status?.toUpperCase() === "FINALIZADO")
              .sort((a,b) => new Date(b.dataPedido) - new Date(a.dataPedido))[0]?.dataPedido
              ? new Date(pedidos
                  .filter(p => p.cliente?.id === detalheCliente.id && p.status?.toUpperCase() === "FINALIZADO")
                  .sort((a,b) => new Date(b.dataPedido) - new Date(a.dataPedido))[0].dataPedido)
                  .toLocaleDateString()
              : "--"
            }
          </p>
        </div>
      </div>
    </div>
  </div>
)}


    </div>
  </div>
)}




      {/* MODAL PEDIDOS FILTRADOS */}
      {mostrarPedidosFiltrados && (
        <section className={styles.listaPedidos}>
          <div className={styles.topo}>
            <button onClick={() => setMostrarPedidosFiltrados(false)} style={{ borderRadius:"50%", width:"60px", height:"60px" }} className={styles.botaoFechar}>
              <X className={styles.iconeAnimado} />
            </button>

            <div className={styles.filtros}>
              <button onClick={() => setFiltroData("TODOS")}>Todos</button>
              <button onClick={() => setFiltroData("MES")}>Este mês</button>
              <button onClick={() => setFiltroData("SEMANA")}>Últimos 7 dias</button>
              <button onClick={() => setFiltroData("SEGUNDA")}>Segunda</button>
              <button onClick={() => setFiltroData("TERCA")}>Terça</button>
              <button onClick={() => setFiltroData("QUARTA")}>Quarta</button>
              <button onClick={() => setFiltroData("QUINTA")}>Quinta</button>
              <button onClick={() => setFiltroData("SEXTA")}>Sexta</button>
              <button onClick={() => setFiltroData("SABADO")}>Sábado</button>
              <button onClick={() => setFiltroData("DOMINGO")}>Domingo</button>
            </div>
          </div>

          {/* Pedidos Finalizados */}
          <div className={styles.pedidosGrupo}>
            <h2>Pedidos Finalizados</h2>
            {pedidos.filter(p => p.status.toUpperCase() === "FINALIZADO").filter(filtrarPorData).length === 0 ? (
              <p className={styles.semPedidos}>Não há pedidos finalizados</p>
            ) : (
              pedidos.filter(p => p.status.toUpperCase() === "FINALIZADO").filter(filtrarPorData).map(pedido => {
                const isOpen = pedidoAberto === pedido.id;
                return (
                  <div key={pedido.id} className={styles.pedidoCard}>
                    <p style={{ color:"green" }}><strong>Status:</strong> {pedido.status}</p>
                    <p><strong>Data:</strong> {new Date(pedido.dataPedido).toLocaleString()}</p>
                    <p><strong>Cliente:</strong> {pedido.cliente?.nome || "Não informado"}</p>

                    <button onClick={() => setPedidoAberto(isOpen ? null : pedido.id)} className={styles.btnDetalhes}>
                      {isOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
                    </button>

                    {isOpen && (
                      <div className={styles.detalhesPedido}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px", fontWeight:"bold", marginBottom:"25px" }}>
                          <img src={pedido.produto?.banner} width={60} height={60} style={{ borderRadius:"8px" }} />
                          <p>{pedido.sabores}</p>
                        </div>
                        <p><strong>Telefone:</strong> {pedido.cliente?.telefone}</p>
                        <p><strong>Tipo de Pedido:</strong> {pedido.tipoPedido}</p>
                        <p><strong>Forma de Pagamento:</strong> {pedido.formaPagamento}</p>
                        <p><strong>Quantidade:</strong> {pedido.quantidade}</p>
                        {pedido.tipoPedido === "ENTREGA" ? (
                          <>
                            <p><strong>Endereço:</strong> {pedido.cliente?.endereco}, Nº {pedido.cliente?.numero}</p>
                            <p><strong>Bairro:</strong> {pedido.cliente?.bairro}</p>
                            <p><strong>Cidade:</strong> {pedido.cliente?.cidade || "Não informado"}</p>
                            {pedido.cliente?.complemento && <p><strong>Complemento:</strong> {pedido.cliente?.complemento}</p>}
                            {pedido.taxaEntrega && <p><strong>Taxa de Entrega:</strong> R$ {pedido.taxaEntrega.toFixed(2)}</p>}
                            {pedido.taxaEntrega && <p><strong>Total com a entrega:</strong> R$ {(pedido.total + pedido.taxaEntrega).toFixed(2)}</p>}
                          </>
                        ) : (
                          <p><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Pedidos Cancelados */}
          <div className={styles.pedidosGrupo}>
            <h2>Pedidos Cancelados</h2>
            {pedidos.filter(p => p.status.toUpperCase() === "CANCELADO").filter(filtrarPorData).length === 0 ? (
              <p className={styles.semPedidos}>Não há pedidos cancelados</p>
            ) : (
              pedidos.filter(p => p.status.toUpperCase() === "CANCELADO").filter(filtrarPorData).map(pedido => {
                const isOpen = pedidoAberto === pedido.id;
                return (
                  <div key={pedido.id} className={styles.pedidoCard}>
                    <p style={{ color:"red" }}><strong>Status:</strong> {pedido.status}</p>
                    <p><strong>Data:</strong> {new Date(pedido.dataPedido).toLocaleString()}</p>
                    <p><strong>Cliente:</strong> {pedido.cliente?.nome || "Não informado"}</p>

                    <button onClick={() => setPedidoAberto(isOpen ? null : pedido.id)} className={styles.btnDetalhes}>
                      {isOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
                    </button>

                    {isOpen && (
                      <div className={styles.detalhesPedido}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px", fontWeight:"bold", marginBottom:"25px" }}>
                          <img src={pedido.produto?.banner} width={60} height={60} style={{ borderRadius:"8px" }} />
                          <p>{pedido.sabores}</p>
                        </div>
                        <p><strong>Telefone:</strong> {pedido.cliente?.telefone}</p>
                        <p><strong>Tipo de Pedido:</strong> {pedido.tipoPedido}</p>
                        <p><strong>Forma de Pagamento:</strong> {pedido.formaPagamento}</p>
                        <p><strong>Quantidade:</strong> {pedido.quantidade}</p>
                        {pedido.tipoPedido === "ENTREGA" ? (
                          <>
                            <p><strong>Endereço:</strong> {pedido.cliente?.endereco}, Nº {pedido.cliente?.numero}</p>
                            <p><strong>Bairro:</strong> {pedido.cliente?.bairro}</p>
                            <p><strong>Cidade:</strong> {pedido.cliente?.cidade || "Não informado"}</p>
                            {pedido.cliente?.complemento && <p><strong>Complemento:</strong> {pedido.cliente?.complemento}</p>}
                            {pedido.taxaEntrega && <p><strong>Taxa de Entrega:</strong> R$ {pedido.taxaEntrega.toFixed(2)}</p>}
                            {pedido.taxaEntrega && <p><strong>Total com a entrega:</strong> R$ {(pedido.total + pedido.taxaEntrega).toFixed(2)}</p>}
                          </>
                        ) : (
                          <p><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
          

        </section>
      )}


      










      {/* MODAL VENDAS */}
{mostrarModalVendas && (
  <div className={styles.modalVendas}>
    <div className={styles.modalContentVendas}>

      {/* Cabeçalho */}
      <div className={styles.modalHeaderVendas}>
        <h2>Resumo de Vendas</h2>
        <button 
          onClick={() => setMostrarModalVendas(false)} 
          className={styles.botaoFecharModal2}
        >
          &times;
        </button>
      </div>

      {/* Conteúdo */}
      <div className={styles.modalBodyVendas}>
        
        {/* Resumo em Cards */}
        <div className={styles.resumoGridVendas}>
          <div className={styles.resumoCardVendas}>
            <strong>Total em Vendas</strong>
            <p>{pedidos.reduce( (acc, valor) => acc + (valor.total || 0), 0 )
              .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
               </p>
          </div>

          {/* NOVO BLOCO PARA TOTAL EM CANCELAMENTOS */}
<div className={styles.resumoCardVendas} style={{ backgroundColor: '#cc0000', color: 'white' }}>
    <strong>Total em Cancelamentos</strong>
    <p>
        {/* SOMA APENAS PEDIDOS CANCELADOS */}
         {pedidos
            .filter(p => p.status === "CANCELADO") // Filtra só os cancelados
            .reduce((acc, valor) => acc + (valor.total || 0), 0)
            .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        }
    </p>
</div>


          <div className={styles.resumoCardFinalizado}>
            <strong>Pedidos Finalizados</strong>
            <p>{pedidos.filter(p => p.status === "FINALIZADO").length}</p>
          </div>

            <div className={styles.resumoCardCancelado}>
            <strong>Pedidos Cancelados</strong>
            <p>{pedidos.filter(p => p.status === "CANCELADO").length}</p>
          </div>


          <div className={styles.resumoCardTicket}>
            <strong>Ticket Médio</strong>
            <p>
              {TicketMedio()}
            </p>
          </div>
          <div className={styles.resumoCardMaiorVendas}>
            <strong>Maior Venda</strong>
            <p>
               {pedidos.length > 0 ? Math.max(...pedidos.map(p => p.total || 0)).toLocaleString("pt-BR", {style:"currency", currency:"BRL"})
               : "R$ 0,00"
              }
            </p>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className={styles.listaVendas}>
          <h3>Histórico de Vendas</h3>
           <div className={styles.searchWrapper}>
  <input
    type="text"
    placeholder="Pesquisar cliente..."
    className={styles.searchInput}
    value={searchVendas}
    onChange={(e) => setSearchVendas(e.target.value)}
    
  />
  <Search className={styles.searchIcon} />
</div>
<div className="tableContainer">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Valor</th>
                <th>Status</th>                
                <th>Data</th>

              </tr>
            </thead>

         <tbody>
  {pedidos
    // Filtra por FINALIZADO OU CANCELADO
    .filter(p => ["FINALIZADO", "CANCELADO"].includes(p.status))
    .filter(p =>
      (p.cliente?.nome || "").toLowerCase().includes(searchVendas.toLowerCase())
    ).length > 0 ? (
      pedidos
        // Filtra por FINALIZADO OU CANCELADO
        .filter(p => ["FINALIZADO", "CANCELADO"].includes(p.status))
        .filter(p =>
          (p.cliente?.nome || "").toLowerCase().includes(searchVendas.toLowerCase())
        )
        .map(pedido => (
          <tr key={pedido.id}>
            <td>{pedido.cliente?.nome || "Não informado"}</td>
            <td>{pedido.sabores || pedido.produto?.nome}</td>
            <td>R$ {pedido.total.toFixed(2)}</td>
            {/* Cor condicional para o status */}
            <td style={{ 
              color: pedido.status === "FINALIZADO" ? "green" : "red", 
              fontWeight: "600" 
            }}>
              {pedido.status}
            </td>
            <td>{new Date(pedido.dataPedido).toLocaleDateString()}</td>
          </tr>
        ))
    ) : (
      <tr>
        <td colSpan={5} style={{ textAlign: "center" }}>
          Nenhum cliente encontrado
        </td>
      </tr>
    )}
</tbody>

          </table>
          </div>
        </div>

      </div>
    </div>
  </div>
)}

    </>
  );
}
