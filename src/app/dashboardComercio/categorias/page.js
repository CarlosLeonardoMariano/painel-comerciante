"use client";

import { useContext, useEffect, useState } from "react";
import { ComercioContext } from "../layout";
import styles from "../../styles/categorias/categorias.module.scss";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import { SubmitButton } from "@/components/button/Botao";
import { useRouter } from "next/navigation";

export default function Categorias() {
  const router = useRouter();
  const comercioId = useContext(ComercioContext);
  const [nameCategoria, setNameCategoria] = useState("");
  const [status, setStatus] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();

    if (!comercioId || !nameCategoria.trim()) {
      setStatus("Preencha o nome da categoria.");
      return;
    }

   

    try {
      const token = getCookieClient();
      const response = await api.post(
        "/categorias",
        {
          name: nameCategoria,
          comercioId: comercioId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data)
      setStatus("Categoria cadastrada com sucesso!");
      setNameCategoria("")
      // Esconde a mensagem após 3 segundos

      setTimeout( () => {
        setStatus(null)
        }, 3000);
      
      
    } catch (error) {
      console.error("Erro ao cadastrar categoria:", error);
      setStatus("Erro ao cadastrar categoria.");
     
    }

  };

  return (
    <div className={styles.containerPrincipal}>
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastrar Categorias</h1>
    

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Nome da categoria"
          value={nameCategoria}
          onChange={ (e) => setNameCategoria(e.target.value) }
         
          className={styles.input}
        />
        <SubmitButton >
            Cadastrar Categorias
        </SubmitButton>
        {status && (
            <p className={status.toLowerCase().includes("erro") ? styles.error : styles.success}>
                {status}
            </p>
        )}
       
      </form>
    </div>
    </div>
  );
}
