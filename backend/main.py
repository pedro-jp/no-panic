from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from pydantic import BaseModel, EmailStr
from typing import Optional

import aiomysql
import bcrypt
from dotenv import load_dotenv
import os
import asyncio
from functools import partial

# Carrega o .env
load_dotenv()

# --- Configuração do Banco de Dados ---
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = int(os.getenv("DB_PORT", 3306))
POOL_SIZE = int(os.getenv("POOL_SIZE", 5))

# --- Utilitários para Criptografia (Non-blocking) ---
# O bcrypt é CPU-bound. Se rodar direto, trava o servidor async.
# Esta função joga o processamento pesado para uma thread separada.
async def run_in_thread(func, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(func, *args))

async def hash_password(password: str) -> str:
    hashed = await run_in_thread(bcrypt.hashpw, password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    return await run_in_thread(bcrypt.checkpw, plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# --- Ciclo de Vida da Aplicação (Pool de Conexões) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa o pool ao ligar o servidor
    app.state.pool = await aiomysql.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        minsize=1,
        maxsize=POOL_SIZE,
        autocommit=True # Importante para não precisar dar conn.commit() em tudo
    )
    print(f"✅ Pool de conexões criado: {DB_HOST}:{DB_PORT}")
    
    yield
    
    # Fecha o pool ao desligar
    app.state.pool.close()
    await app.state.pool.wait_closed()
    print("🛑 Pool de conexões encerrado.")

# --- Inicialização do App FastAPI ---
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# --- Modelos Pydantic ---
class CadastroBody(BaseModel):
    nome: str
    cpf: str
    email: EmailStr
    senha: str

class LoginBody(BaseModel):
    email: EmailStr
    senha: str

class IdBody(BaseModel):
    id: int

class EmailBody(BaseModel):
    email: EmailStr

class CadastroTerapeutaBody(BaseModel):
    id: int
    especialidade: str
    crp: str
    disponibilidade: str

class CadastroUsuarioBody(BaseModel):
    id: int
    data_nascimento: str
    endereco: str
    contato_emergencia: str

class FavoritarBody(BaseModel):
    id_usuario: int
    id_terapeuta: int

class AtualizarUsuarioBody(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    data_nascimento: Optional[str] = None
    endereco: Optional[str] = None
    contato_emergencia: Optional[str] = None
    senha: Optional[str] = None

class CriarSessaoBody(BaseModel):
    id_usuario: int
    id_terapeuta: int
    data_hora_agendamento: str

class AtualizarSessaoBody(BaseModel):
    status: str

class AtualizarTerapeutaBody(BaseModel):
    especialidade: Optional[str] = None
    CRP: Optional[str] = None
    disponibilidade: Optional[str] = None

class CriarTermoBody(BaseModel):
    tipo: str
    versao: str
    titulo: str
    conteudo: str

# =====================================================
# ROTAS
# =====================================================

@app.get('/', response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ======== ROTA: CADASTRO ==========
@app.post('/cadastro', status_code=status.HTTP_201_CREATED)
async def cadastro(request: Request, data: CadastroBody):
    senha_hash = await hash_password(data.senha)
    pool = request.app.state.pool

    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            try:
                await cursor.execute(
                    "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s, %s, %s, %s)",
                    (data.nome, data.cpf, data.email, senha_hash)
                )
                # O autocommit está ligado no pool, mas se precisar garantir:
                # await conn.commit()

                # Busca o usuário recém-criado
                await cursor.execute("SELECT * FROM usuario WHERE email = %s", (data.email,))
                u = await cursor.fetchone()

                usuario = {
                    "id": u["id_usuario"],
                    "nome": u["nome"],
                    "email": u["email"],
                    "cpf": u["cpf"],
                    "primeiro_login": u["primeiro_login"]
                }
                return usuario

            except Exception as e:
                # Em caso de erro, o aiomysql/context manager geralmente faz rollback se autocommit=False
                # Como usamos autocommit=True, inserts parciais são raros em query única
                raise HTTPException(status_code=500, detail=str(e))


# ======== ROTA: LOGIN ==========
@app.post('/login')
async def login(request: Request, data: LoginBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
                SELECT u.id_usuario, u.nome, u.email, u.cpf, u.primeiro_login, u.senha,
                       t.especialidade, t.CRP, t.disponibilidade
                FROM usuario u
                LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
                WHERE u.email = %s
            """
            await cursor.execute(query, (data.email,))
            usuario = await cursor.fetchone()
            
            if not usuario:
                raise HTTPException(status_code=404, detail="Usuário não encontrado")

            # Valida senha de forma assíncrona
            if await verify_password(data.senha, usuario["senha"]):
                newUsuario = {
                    "id": usuario["id_usuario"],
                    "nome": usuario["nome"],
                    "email": usuario["email"],
                    "cpf": usuario["cpf"],
                    "primeiro_login": usuario["primeiro_login"],
                    "terapeuta": None
                }

                if usuario["CRP"]:
                    newUsuario["terapeuta"] = {
                        "CRP": usuario["CRP"],
                        "especialidade": usuario["especialidade"],
                        "disponibilidade": usuario["disponibilidade"]
                    }

                return newUsuario
            else:
                raise HTTPException(status_code=401, detail="Senha incorreta")

@app.post('/has-terapeuta')
async def has_terapeuta(request: Request, data: IdBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
                SELECT t.CRP
                FROM usuario u
                LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
                WHERE u.id_usuario = %s
            """
            await cursor.execute(query, (data.id,))
            usuario = await cursor.fetchone()
            
            if not usuario:
                raise HTTPException(status_code=404, detail="Usuário não encontrado")

            if usuario["CRP"]:
                return {"CRP": usuario["CRP"]}
            return {"message": "Terapeuta não cadastrado"}

@app.post('/load-user')
async def load_user(request: Request, data: EmailBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
                SELECT u.id_usuario, u.nome, u.email, u.cpf, u.primeiro_login,
                       t.especialidade, t.CRP, t.disponibilidade
                FROM usuario u
                LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
                WHERE u.email = %s
            """
            await cursor.execute(query, (data.email,))
            usuario = await cursor.fetchone()
            
            if not usuario:
                raise HTTPException(status_code=404, detail="Usuário não encontrado")

            newUsuario = {
                "id": usuario["id_usuario"],
                "nome": usuario["nome"],
                "email": usuario["email"],
                "cpf": usuario["cpf"],
                "primeiro_login": usuario["primeiro_login"],
                "terapeuta": None
            }

            if usuario["CRP"]:
                newUsuario["terapeuta"] = {
                    "CRP": usuario["CRP"],
                    "especialidade": usuario["especialidade"],
                    "disponibilidade": usuario["disponibilidade"]
                }
            return newUsuario

@app.put('/primeiro-login')
async def primeiro_login(request: Request, data: IdBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            # Verifica se existe primeiro
            await cursor.execute("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (data.id,))
            if not await cursor.fetchone():
                raise HTTPException(status_code=404, detail="Usuário não encontrado")
            
            await cursor.execute("UPDATE usuario SET primeiro_login = 0 WHERE id_usuario = %s", (data.id,))
            # await conn.commit() # Se autocommit=True no pool, não precisa
            return {"success": True}

@app.post('/cadastro-terapeuta', status_code=status.HTTP_201_CREATED)
async def cadastro_terapeuta(request: Request, data: CadastroTerapeutaBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                await cursor.execute(
                    "INSERT INTO terapeuta (id_usuario, especialidade, CRP, disponibilidade) VALUES (%s, %s, %s, %s)",
                    (data.id, data.especialidade, data.crp, data.disponibilidade)
                )
                return {"mensagem": "Terapeuta cadastrado com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

@app.put('/cadastro-usuario', status_code=status.HTTP_201_CREATED)
async def cadastro_usuario(request: Request, data: CadastroUsuarioBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                await cursor.execute(
                    "UPDATE usuario SET data_nascimento = %s, endereco = %s, contato_emergencia = %s WHERE id_usuario = %s",
                    (data.data_nascimento, data.endereco, data.contato_emergencia, data.id)
                )
                return {"mensagem": "Usuário alterado com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

@app.get('/terapeutas')
async def listar_terapeutas(
    request: Request,
    page: int = 1,
    limit: int = 20,
    especialidade: Optional[str] = None
):
    pool = request.app.state.pool
    offset = (page - 1) * limit

    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            
            count_query = "SELECT COUNT(*) AS total FROM usuario u LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario WHERE t.id_usuario IS NOT NULL"
            
            data_query_base = """
            SELECT 
            u.id_usuario,
            u.nome,
            u.email,
            t.especialidade,
            t.CRP,
            t.disponibilidade,
            (
                SELECT COUNT(*)
                FROM sessao s
                WHERE s.id_terapeuta = u.id_usuario
                AND s.status = 'concluida'
            ) AS total_sessoes_concluidas
            FROM usuario u 
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
            WHERE t.id_usuario IS NOT NULL
            """ 
            
            params = []
            
            if especialidade:
                count_query += " AND t.especialidade LIKE %s"
                data_query_base += " AND t.especialidade LIKE %s"
                params.append(f"%{especialidade}%")
            
            data_query = data_query_base + " LIMIT %s OFFSET %s"

            try:
                await cursor.execute(count_query, params)
                result_total = await cursor.fetchone()
                total_records = result_total['total']
                
                data_params = params + [limit, offset]
                await cursor.execute(data_query, data_params)
                terapeutas = await cursor.fetchall()
                
                total_pages = (total_records + limit - 1) // limit
                                
                return {
                    "metadata": {
                        "total_records": total_records,
                        "total_pages": total_pages,
                        "current_page": page,
                        "limit": limit
                    },
                    "terapeutas": terapeutas
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao listar terapeutas: {str(e)}")

@app.post('/favoritar', status_code=status.HTTP_201_CREATED)
async def favoritar_terapeuta(request: Request, data: FavoritarBody):
    pool = request.app.state.pool
    query = "INSERT INTO usuario_salva_terapeuta (id_usuario, id_terapeuta) VALUES (%s, %s)"
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                await cursor.execute(query, (data.id_usuario, data.id_terapeuta))
                return {"mensagem": "Terapeuta favoritado com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao favoritar terapeuta: {str(e)}")

@app.get('/usuarios/{id_usuario}/terapeutas')
async def listar_terapeutas_por_usuario(request: Request, id_usuario: int):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
            SELECT u.id_usuario, u.nome, u.email, t.especialidade, t.disponibilidade, t.CRP
            FROM usuario_salva_terapeuta ust
            JOIN terapeuta t ON ust.id_terapeuta = t.id_usuario
            JOIN usuario u ON t.id_usuario = u.id_usuario
            WHERE ust.id_usuario = %s
            """
            await cursor.execute(query, (id_usuario,))
            return await cursor.fetchall()

@app.get('/terapeuta/{id_terapeuta}/usuarios')
async def listar_usuarios_por_terapeuta(request: Request, id_terapeuta: int):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            query = """
            SELECT u.id_usuario, u.nome, u.email
            FROM usuario_salva_terapeuta ust
            JOIN usuario u ON ust.id_usuario = u.id_usuario
            WHERE ust.id_terapeuta = %s
            """
            await cursor.execute(query, (id_terapeuta,))
            return await cursor.fetchall()

@app.put('/atualizar-usuario/{id_usuario}')
async def atualizar_usuario(request: Request, id_usuario: int, data: AtualizarUsuarioBody):
    dados_atualizar = data.model_dump(exclude_unset=True)
    if not dados_atualizar:
        raise HTTPException(status_code=400, detail="Nenhum dado fornecido.")

    set_clauses = []
    params = [] 

    if "senha" in dados_atualizar:
        senha = dados_atualizar.pop("senha")
        try:
            # Hashing assíncrono
            senha_hash_str = await hash_password(senha)
            set_clauses.append("senha = %s") 
            params.append(senha_hash_str)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao processar senha: {str(e)}")

    for key, value in dados_atualizar.items():
        set_clauses.append(f"{key} = %s")
        params.append(value)
    
    if not set_clauses:
        raise HTTPException(status_code=400, detail="Nenhum dado válido.")

    atualizacao = ", ".join(set_clauses)
    query = f"UPDATE usuario SET {atualizacao} WHERE id_usuario = %s"
    params.append(id_usuario)
    
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
               await cursor.execute(query, params)
               if cursor.rowcount == 0:
                   raise HTTPException(status_code=404, detail="Usuário não encontrado ou sem alterações")
               return {"mensagem": "Usuário atualizado com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao atualizar: {str(e)}")

@app.post('/sessao', status_code=status.HTTP_201_CREATED)
async def criar_sessao(request: Request, data: CriarSessaoBody):
    pool = request.app.state.pool
    query = "INSERT INTO sessao (id_usuario, id_terapeuta, data_hora_agendamento) VALUES (%s, %s, %s)"
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                await cursor.execute(query, (data.id_usuario, data.id_terapeuta, data.data_hora_agendamento))
                return {"mensagem": "Sessão criada com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao criar sessão: {str(e)}")

@app.get('/sessoes/{tipo}/{id}')
async def listar_sessoes(request: Request, tipo: str, id: int):
    if tipo not in ('terapeuta', 'usuario'):
        raise HTTPException(status_code=400, detail="Tipo deve ser 'terapeuta' ou 'usuario'")

    pool = request.app.state.pool
    
    base_query = """
    SELECT 
        u.id_usuario, u.nome, u.email,
        s.status, s.data_hora_agendamento, s.data_hora_inicio,
        s.data_hora_fim, s.duracao, s.id_sessao, s.tipo, BIN_TO_UUID(s.uuid) as uuid
    FROM sessao s
    """

    if tipo == 'terapeuta':
        query = base_query + " JOIN usuario u ON s.id_usuario = u.id_usuario WHERE s.id_terapeuta = %s"
    else:
        query = base_query + " JOIN usuario u ON s.id_terapeuta = u.id_usuario WHERE s.id_usuario = %s"

    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            try:
                await cursor.execute(query, (id,))
                sessoes = await cursor.fetchall()
                return sessoes
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao listar sessoes: {str(e)}")

@app.get('/sessao/{id}')
async def get_sessao(request: Request, id: str):
    pool = request.app.state.pool
    query = """
    SELECT 
        s.id_sessao, s.tipo, s.status, s.data_hora_agendamento,
        s.data_hora_inicio, s.data_hora_fim, s.duracao, s.criadoEm, s.atualizadoEm,
        u.id_usuario AS id_usuario, u.nome AS nome_usuario, u.email AS email_usuario,
        t.id_usuario AS id_terapeuta, t.nome AS nome_terapeuta, t.email AS email_terapeuta
    FROM sessao s
    JOIN usuario u ON s.id_usuario = u.id_usuario
    JOIN usuario t ON s.id_terapeuta = t.id_usuario
    WHERE s.uuid = UUID_TO_BIN(%s)
    LIMIT 1
    """
    
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, (id,))
            s = await cursor.fetchone()
            
            if not s:
                raise HTTPException(status_code=404, detail="Sessão não encontrada")

            return {
                "id_sessao":s["id_sessao"],
                "tipo": s["tipo"],
                "status": s["status"],
                "data_hora_agendamento": s["data_hora_agendamento"],
                "data_hora_inicio": s["data_hora_inicio"],
                "data_hora_fim": s["data_hora_fim"],
                "duracao": s["duracao"],
                "criadoEm": s["criadoEm"],
                "atualizadoEm": s["atualizadoEm"],
                "usuario": {
                    "id": s["id_usuario"],
                    "nome": s["nome_usuario"],
                    "email": s["email_usuario"],
                },
                "terapeuta": {
                    "id": s["id_terapeuta"],
                    "nome": s["nome_terapeuta"],
                    "email": s["email_terapeuta"],
                }
            }

@app.put('/atualizar-sessao/{id_sessao}')
async def atualizar_sessao(request: Request, id_sessao: int, data: AtualizarSessaoBody):
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
               await cursor.execute("UPDATE sessao SET status = %s WHERE id_sessao = %s", (data.status, id_sessao))
               if cursor.rowcount == 0:
                   raise HTTPException(status_code=404, detail="Sessao nao encontrada")
               return {"mensagem": "Sessao atualizada com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao atualizar sessao: {str(e)}")

@app.put('/atualizar-terapeuta/{id_usuario}')
async def atualizar_terapeuta(request: Request, id_usuario: int, data: AtualizarTerapeutaBody):
    dados_atualizar = data.model_dump(exclude_unset=True)
    if not dados_atualizar:
        raise HTTPException(status_code=400, detail="Nenhum dado fornecido.")

    set_clauses = []
    params = []
    for key, value in dados_atualizar.items():
        set_clauses.append(f"{key} = %s")
        params.append(value)

    atualizacao = ", ".join(set_clauses)
    query = f"UPDATE terapeuta SET {atualizacao} WHERE id_usuario = %s"
    params.append(id_usuario)
    
    pool = request.app.state.pool
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                await cursor.execute(query, params)
                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Terapeuta não encontrado")
                return {"mensagem": "Terapeuta atualizado com sucesso!"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao atualizar terapeuta: {str(e)}")

@app.post('/termos',status_code=status.HTTP_201_CREATED)
async def criar_termo(request: Request, data: CriarTermoBody):
    pool = request.app.state.pool

    if data.tipo not in ['privacidade', 'uso']:
        raise HTTPException(
            status_code=400, 
            detail="Tipo deve ser 'privacidade' ou 'uso'"
            )
    
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                query = """ 
                INSERT INTO termos 
                (tipo, versao, titulo, conteudo)
                VALUES (%s,%s,%s,%s)
                """
                await cursor.execute(query, (data.tipo, data.versao, data.titulo, data.conteudo))
                await conn.commit()
                return {
                    "mensagem": "Termo criado com sucesso!", 
                    "id": cursor.lastrowid
                }
            except Exception as e:
                await conn.rollback()
                raise HTTPException(status_code=500, detail=f"Erro ao criar termo: {str(e)}")

# Para rodar:
# uvicorn main:app --reload