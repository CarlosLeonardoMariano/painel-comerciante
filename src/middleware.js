import { NextResponse } from "next/server";
import { getCookieServer } from "./lib/cookieServer";
import { api } from "./services/api";



export async function middleware(req) {

    const { pathname } = req.nextUrl;

    // Ignorando caminhos do Next.js como "/_next" ou a rota raiz "/"
    if (pathname.startsWith("/_next") || pathname === "/") {
        return NextResponse.next();
    }

    // Verificando se tem um token
    const token = await getCookieServer();
    

    // Se não tiver token, redireciona para a página de login
    if (pathname.startsWith("/dashboardComercio")){
        if(!token){
            return NextResponse.redirect(new URL("/", req.url));
        }

        const isValidade = await validadetoken(token)

        if(!isValidade){
        return NextResponse.redirect(new URL("/", req.url));
        }
    }


    return NextResponse.next();
}



// função para verificar se o token é válido
 async function validadetoken(token) {
  if (!token) return false;

  try {
    const response = await api.get("/usuarios/detalhes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(response.data);
    return true;
    
  } catch (err) {
    console.log(err);
    return false;
  }
}
