import {
  Mail,
  Phone,
  MapPin,
  Store,
  Clock,
  DollarSign,
} from "lucide-react";
import styles from "../../../styles/comercio/comercio.module.scss";
import { api } from "@/services/api";
import { getCookieServer } from "@/lib/cookieServer";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/button/Botao";









export default async function Comercio({ params }) {
      const awaitedParams = await params; // Tenta resolver a Promise
  const comercioId = awaitedParams.id;

  console.log("params:", awaitedParams);
  console.log("comercioId:", comercioId);

  async function handleAtualizarLojas(formData) {
    "use server";

    const token = await getCookieServer();
    const comercioId = formData.get("comercioId")?.toString() || "";
    console.log("Token:", token);
    console.log("comercioId:", comercioId);

    const form = new FormData();

    form.append("tipo", formData.get("tipo")?.toString() || "");
    form.append("nome", formData.get("nome")?.toString() || "");
    form.append("email", formData.get("email")?.toString() || "");
    form.append("telefone", formData.get("telefone")?.toString() || "");
    form.append("enderecoComercio", formData.get("enderecoComercio")?.toString() || "");
    form.append("cidade", formData.get("cidade")?.toString() || "");
    form.append("estado", formData.get("estado")?.toString() || "");
    form.append("tempoRetirada", formData.get("tempoRetirada")?.toString() || "");
    form.append("tempoEntrega", formData.get("tempoEntrega")?.toString() || "");
    form.append("taxaEntrega", formData.get("taxaEntrega")?.toString() || "");

    const file = formData.get("banner");
    if (file && file instanceof File && file.size > 0) {
      form.append("file", file);
    }

    for (let [key, value] of form.entries()) {
      console.log(key, value);
    }

    try {
      const response = await api.put(`/comercio/${comercioId}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Comércio atualizado:", response.data);
    } catch (err) {
      console.error("Erro ao atualizar comércio:", err);
      console.error("Detalhes do erro:", err.response?.data);
      return;
    }
    redirect('/dashboardComercio')
  }

  return (
    <main className={styles.comercioContainer}>
      <section className={styles.formCard}>
        <h1 className={styles.formTitle}>Atualizar Comércio</h1>
        <form className={styles.formContent} action={handleAtualizarLojas}>
          <input type="hidden" name="comercioId" value={comercioId} />
          {/* Tipo */}
          <div className={styles.formGroup}>
            <label htmlFor="tipo">Tipo *</label>
            <select id="tipo" name="tipo" required>
              <option value="">Selecione um tipo</option>
              <option value="Comidas">Comidas</option>
              <option value="Mecânicos">Mecânicos</option>
              <option value="Moda e Estilo">Moda e Estilo</option>
              <option value="Veiculos">Veículos</option>
              <option value="Games">Games</option>
              <option value="Celulares e acessorios">Celulares e acessórios</option>
            </select>
          </div>
          {/* Nome */}
          <div className={styles.formGroup}>
            <label htmlFor="nome">Nome *</label>
            <div className={styles.inputIconWrapper}>
              <Store className={styles.icon} />
              <input
                type="text"
                id="nome"
                name="nome"
                placeholder="Nome do comércio"
                
              />
            </div>
          </div>
          {/* Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <div className={styles.inputIconWrapper}>
              <Mail className={styles.icon} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="exemplo@comercio.com"
                
              />
            </div>
          </div>
          {/* Telefone */}
          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone *</label>
            <div className={styles.inputIconWrapper}>
              <Phone className={styles.icon} />
              <input
                type="tel"
                id="telefone"
                name="telefone"
                placeholder="(11) 99999-9999"
                
              />
            </div>
          </div>
          {/* Endereço */}
          <div className={styles.formGroup}>
            <label htmlFor="enderecoComercio">Endereço *</label>
            <div className={styles.inputIconWrapper}>
              <MapPin className={styles.icon} />
              <input
                type="text"
                id="enderecoComercio"
                name="enderecoComercio"
                placeholder="Rua, número, complemento"
                
              />
            </div>
          </div>
          {/* Tempo Minimo */}
          <div className={styles.formGroup}>
            <label htmlFor="tempoRetirada">Tempo min *</label>
            <div className={styles.inputIconWrapper}>
              <Clock className={styles.icon} />
              <input
                type="text"
                id="tempoRetirada"
                name="tempoRetirada"
                placeholder="Tempo Min"
                
              />
            </div>
          </div>
          {/* Tempo Max */}
          <div className={styles.formGroup}>
            <label htmlFor="tempoEntrega">Tempo max *</label>
            <div className={styles.inputIconWrapper}>
              <Clock className={styles.icon} />
              <input
                type="text"
                id="tempoEntrega"
                name="tempoEntrega"
                placeholder="Tempo Max"
                
              />
            </div>
          </div>
          {/* Taxa de entrega */}
          <div className={styles.formGroup}>
            <label htmlFor="taxaEntrega">Taxa de entrega *</label>
            <div className={styles.inputIconWrapper}>
              <DollarSign className={styles.icon} />
              <input
                type="text"
                id="taxaEntrega"
                name="taxaEntrega"
                placeholder="Valor da taxa de entrega"
                
              />
            </div>
          </div>
          {/* Cidade e Estado */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cidade">Cidade *</label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                placeholder="Cidade"
                
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="estado">Estado *</label>
              <input
                type="text"
                id="estado"
                name="estado"
                maxLength={2}
                placeholder="SP"
                
                pattern="[A-Za-z]{2}"
                title="Digite apenas 2 letras"
              />
            </div>
          </div>
          {/* Banner */}
          <div className={styles.formGroup}>
            <label htmlFor="banner">Banner (imagem)</label>
            <input
              type="file"
              id="banner"
              name="banner"
              accept="image/*"
            />
          </div>
          {/* Botão */}
         <SubmitButton>
  Atualizar comércio
</SubmitButton>
        </form>
      </section>
    </main>
  );
}
