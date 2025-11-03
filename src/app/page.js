"use client"
import { api } from '@/services/api';
import styles from '@/app/styles/cadastro.module.scss';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next'; // ✅ CERTO no client component

export default function Login() {
  const router = useRouter();

  async function handleLogin(formData) {
    const email = formData.get("email");
    const password = formData.get("password");
      console.log("Enviando login:", { email, password }); 


      if(email ===  "" || password === "") {
        alert("Preencha todos os campos");
        return;
        }
        

        try {
          const response = await api.post("/login", {
            email,
            password
            });
            //console.log(response.data);

            const expressTime = 60 * 60 *24 * 30;
            setCookie("session", response.data.token, {
              maxAge: expressTime,
              path: '/',
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',

            })

            if(!response.data.token){
              alert("Você não tem permissão para acessar essa página!");
              return;
              
            }

            const comercios = response.data.comercios;

            if(!comercios || comercios.length === 0){
              alert("Você não tem permissão para acessar essa página, pois não possui um comércio cadastrado.");
              return;
              }

        } catch(err){
          alert("Email ou senha inválidos, tente novamente!");
          console.log(err)
          return;
        }

        router.push('/dashboardComercio')



    
  }
  return (
      <>
    <div className={styles.containerCenter}>

              <div className={styles.logoTotal}> 
                      Conecta<p className={styles.p}>Cidade</p>
              </div>
      <section className={styles.login}>
        
        <form className={styles.formulario} onSubmit={(e) => {
          e.preventDefault();
          handleLogin(new FormData(e.target));
        }} >
          <input type="email"
          required
          name="email"
          placeholder="Digite seu email"
          className={styles.input}/>



          <input type="password"
          required
          name="password"
          placeholder="***********"
          className={styles.input}/>


          <button type="submit" className={styles.acessar}>
          Acessar Conta
          </button>

        </form>
 

           






      </section>
    </div>
      
</>
  );
}

