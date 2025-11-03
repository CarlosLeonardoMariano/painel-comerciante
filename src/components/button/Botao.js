"use client";
import { useFormStatus } from "react-dom";
import styles from "../../../src/app/styles/botao/botao.module.scss";
import { Loader2 } from "lucide-react"; // ícone de carregamento moderno

export function SubmitButton({ children}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending }  // desabilita se estiver pendente OU se prop disabled for true
      className={styles.submitButton}
    >
      {pending ? (
        <>
          <Loader2 className={styles.spinnerIcon} />
          Atualizando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
