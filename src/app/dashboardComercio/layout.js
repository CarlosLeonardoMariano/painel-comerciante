"use client";

import React, { createContext, useState, useEffect } from "react";
import { Home, ShoppingCart, BarChart2, Store, PlusCircle, ClipboardList, Tag, Boxes, Settings, CircleFadingPlusIcon } from "lucide-react";
import Link from "next/link";
import styles from "../styles/dashboard/dashboard.module.scss";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import { FaMotorcycle, FaPlusCircle } from 'react-icons/fa';

export const ComercioContext = createContext(null);

export default function DashboardLayout({ children }) {
  const [comercioId, setComercioId] = useState(null);
  const [comercioTipo, setComercioTipo] = useState(null);

  // IDs que não podem ver o link de entregadores
  const idsBloqueados = [
    //"fbf5e2a0-097d-4d10-87d0-fb296df1934b" 
  ];

  useEffect(() => {
    async function fetchComercio() {
      const token = getCookieClient();
      try {
        const response = await api.get("/usuarios/detalhes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const comercio = response.data?.comercios?.[0];
        if (comercio?.id) {
          setComercioId(comercio.id);
          setComercioTipo(comercio.tipo);
        }
      } catch (error) {
        console.error("Erro ao buscar ID do comércio:", error);
      }
    }
    fetchComercio();
  }, []);

  const podeVerEntregadores = comercioId && !idsBloqueados.includes(comercioId);

  return (
    <ComercioContext.Provider value={comercioId}>
      <div className={styles.dashboard}>
        <aside className={styles.sidebar}>
          <h2 className={styles.h2}>Painel Administrativo</h2>
          <nav>
            <Link href="/dashboardComercio" className={styles.navLink}>
              <Home className={styles.navIcon} /> Dashboard
            </Link>
            <Link href="/dashboardComercio/pedidos" className={styles.navLink}>
              <ShoppingCart className={styles.navIcon} /> Pedidos
            </Link>
            <Link href="/dashboard/relatorios" className={styles.navLink}>
              <BarChart2 className={styles.navIcon} /> Relatórios
            </Link>
            {comercioId && (
              <Link href={`/dashboardComercio/comercio/${comercioId}`} className={styles.navLink}>
                <Store className={styles.navIcon} /> Comércio Público
              </Link>
            )}
            <Link href={`/dashboardComercio/categorias`} className={styles.navLink}>
              <PlusCircle className={styles.navIcon} /> Criar Categorias
            </Link>
            <Link href={`/dashboardComercio/listarCategorias`} className={styles.navLink}>
              <ClipboardList className={styles.navIcon} /> Listar Categorias
            </Link>
            <Link href={`/dashboardComercio/criarProdutos`} className={styles.navLink}>
              <Tag className={styles.navIcon} /> Criar Produtos
            </Link>
            <Link href={`/dashboardComercio/listarProdutos`} className={styles.navLink}>
              <ClipboardList className={styles.navIcon} /> Listar Produtos
            </Link>
            <Link href={`/dashboardComercio/estoque`} className={styles.navLink}>
              <Boxes className={styles.navIcon} /> Estoque
            </Link>
            <Link href={`/dashboardComercio/bairros`} className={styles.navLink}>
              <Settings className={styles.navIcon} /> Taxas dos bairros
            </Link>

            {/* Entregadores só se tipo = Comidas e não estiver bloqueado */}
            
              <Link href={`/dashboardComercio/motoboys`} className={styles.navLink}>
                <FaMotorcycle className={styles.navIcon} /> Entregadores
              </Link>

               <Link href={`/dashboardComercio/extras`} className={styles.navLink}>
                <CircleFadingPlusIcon  className={styles.navIcon} /> Cadastrar extras
              </Link>
            
          </nav>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </ComercioContext.Provider>
  );
}
