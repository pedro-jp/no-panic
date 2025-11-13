from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr
from typing import Optional, List

import mysql.connector
from mysql.connector import pooling
import bcrypt
from dotenv import load_dotenv
import os
import time

# Carrega o .env
load_dotenv()

# --- Modelos Pydantic (Validação de Request Body) ---
# Substituem o request.json e validam os dados automaticamente

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
    data_hora_agendamento: str # Considere usar datetime para validação extra

class AtualizarSessaoBody(BaseModel):
    status: str

class AtualizarTerapeutaBody(BaseModel):
    especialidade: Optional[str] = None
    CRP: Optional[str] = None
    disponibilidade: Optional[str] = None

# --- Configuração do Banco de Dados ---
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

POOL_SIZE = int(os.getenv("POOL_SIZE", 5)) # Default pool size

dbconfig = {
    "host": DB_HOST,
    "user": DB_USER,
    "password": DB_PASSWORD,
    "database": DB_NAME,
    "port": DB_PORT,
    "autocommit": True # Muito importante para FastAPI/async
}

connection_pool = pooling.MySQLConnectionPool(
    pool_name="main_pool",
    pool_size=POOL_SIZE,
    pool_reset_session=True,
    **dbconfig
)

def get_connection():
    # Esta função continua síncrona, o que é OK.
    # FastAPI rodará o handler da rota em um threadpool.
    return connection_pool.get_connection()

# --- Inicialização do App FastAPI ---
app = FastAPI()

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, restrinja isso
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração para renderizar o index.html
# Mova seu `index.html` para uma pasta chamada `templates`
templates = Jinja2Templates(directory="templates")

# =====================================================
# ROTAS (Convertidas para FastAPI)
# =====================================================

@app.get('/', response_class=HTMLResponse)
async def home(request: Request):
    # Assegure-se que `index.html` está na pasta `templates`
    return templates.TemplateResponse("index.html", {"request": request})

# ======== ROTA: CADASTRO ==========
@app.post('/cadastro', status_code=status.HTTP_201_CREATED)
async def cadastro(data: CadastroBody):
    senha_hash = bcrypt.hashpw(data.senha.encode('utf-8'), bcrypt.gensalt())

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s, %s, %s, %s)",
            (data.nome, data.cpf, data.email, senha_hash.decode('utf-8'))
        )
        conexao.commit()

        # Busca o usuário recém-criado
        cursor.execute("SELECT * FROM usuario WHERE email = %s", (data.email,))
        u = cursor.fetchone()

        usuario = {
            "id": u["id_usuario"],
            "nome": u["nome"],
            "email": u["email"],
            "cpf": u["cpf"],
            "primeiro_login": u["primeiro_login"]
        }
        return usuario

    except mysql.connector.Error as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()


# ======== ROTA: LOGIN ==========
@app.post('/login')
async def login(data: LoginBody):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        query = """
            SELECT u.id_usuario, u.nome, u.email, u.cpf, u.primeiro_login, u.senha,
                   t.especialidade, t.CRP, t.disponibilidade
            FROM usuario u
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
            WHERE u.email = %s
        """
        cursor.execute(query, (data.email,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        # valida senha
        if bcrypt.checkpw(data.senha.encode('utf-8'), usuario["senha"].encode('utf-8')):
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()


@app.post('/has-terapeuta')
async def has_terapeuta(data: IdBody):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        query = """
            SELECT t.CRP
            FROM usuario u
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
            WHERE u.id_usuario = %s
        """
        cursor.execute(query, (data.id,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        if usuario["CRP"]:
            user = {
                "CRP": usuario["CRP"],
            }
            return user
        return {"message": "Terapeuta não cadastrado"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()

@app.post('/load-user')
async def load_user(data: EmailBody):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        query = """
            SELECT u.id_usuario, u.nome, u.email, u.cpf, u.primeiro_login,
                   t.especialidade, t.CRP, t.disponibilidade
            FROM usuario u
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
            WHERE u.email = %s
        """
        cursor.execute(query, (data.email,))
        usuario = cursor.fetchone()
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()

@app.put('/primeiro-login')
async def primeiro_login(data: IdBody):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuario WHERE id_usuario = %s", (data.id,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        cursor.execute("UPDATE usuario SET primeiro_login = false WHERE id_usuario = %s", (data.id,))
        conexao.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()

@app.post('/cadastro-terapeuta', status_code=status.HTTP_201_CREATED)
async def cadastro_terapeuta(data: CadastroTerapeutaBody):
    conexao = get_connection()
    cursor = conexao.cursor()
    try:
        cursor.execute(
            "INSERT INTO terapeuta (id_usuario, especialidade, CRP, disponibilidade) VALUES (%s, %s, %s, %s)",
            (data.id, data.especialidade, data.crp, data.disponibilidade)
        )
        conexao.commit()
        return {"mensagem": "Terapeuta cadastrado com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()

@app.put('/cadastro-usuario', status_code=status.HTTP_201_CREATED) # Nota: PUT geralmente retorna 200 OK ou 204 No Content. 201 é para POST.
async def cadastro_usuario(data: CadastroUsuarioBody):
    conexao = get_connection()
    cursor = conexao.cursor()
    try:
        cursor.execute(
            "UPDATE usuario SET data_nascimento = %s, endereco = %s, contato_emergencia = %s WHERE id_usuario = %s",
            (data.data_nascimento, data.endereco, data.contato_emergencia, data.id)
        )
        conexao.commit()
        return {"mensagem": "Usuário alterado com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conexao.close()

@app.get('/terapeutas')
async def listar_terapeutas(
    page: int = 1,
    limit: int = 20,
    especialidade: Optional[str] = None
):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    
    offset = (page - 1) * limit

    # Conta os terapeutas
    count_query = "SELECT COUNT(*) AS total FROM usuario u LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario WHERE t.id_usuario IS NOT NULL"
    
    # Puxa os dados
    data_query_base = """
        SELECT 
            u.id_usuario, 
            u.nome, 
            u.email, 
            t.especialidade, 
            t.CRP, 
            t.disponibilidade
        FROM 
            usuario u 
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
        cursor.execute(count_query, params)
        total_records = cursor.fetchone()['total']
        
        data_params = params + [limit, offset]
        cursor.execute(data_query, data_params)
        terapeutas = cursor.fetchall()
        
        total_pages = (total_records + limit - 1) // limit
        
        response = {
            "metadata": {
                "total_records": total_records,
                "total_pages": total_pages,
                "current_page": page,
                "limit": limit
            },
            "terapeutas": terapeutas
        }
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar terapeutas: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

@app.post('/favoritar', status_code=status.HTTP_201_CREATED)
async def favoritar_terapeuta(data: FavoritarBody):
    conexao = get_connection()
    cursor = conexao.cursor()

    query = """
    INSERT INTO usuario_salva_terapeuta (id_usuario, id_terapeuta)
    VALUES (%s, %s)
    """
    try:
        cursor.execute(query, (data.id_usuario, data.id_terapeuta))
        conexao.commit()
        return {"mensagem": "Terapeuta favoritado com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao favoritar terapeuta: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

@app.get('/usuarios/{id_usuario}/terapeutas')
async def listar_terapeutas_por_usuario(id_usuario: int):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    query = """
    SELECT 
        u.id_usuario, 
        u.nome, 
        u.email, 
        t.especialidade,
        t.disponibilidade,
        t.CRP
    FROM 
        usuario_salva_terapeuta ust
    JOIN 
        terapeuta t ON ust.id_terapeuta = t.id_usuario
    JOIN
        usuario u ON t.id_usuario = u.id_usuario
    WHERE 
        ust.id_usuario = %s
    """
    try:
        cursor.execute(query, (id_usuario,))
        terapeutas_favoritos = cursor.fetchall()
        return terapeutas_favoritos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar terapeutas favoritos: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

@app.get('/terapeuta/{id_terapeuta}/usuarios')
async def listar_usuarios_por_terapeuta(id_terapeuta: int):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    query = """
    SELECT 
        u.id_usuario, 
        u.nome, 
        u.email
    FROM 
        usuario_salva_terapeuta ust
    JOIN 
        usuario u ON ust.id_usuario = u.id_usuario
    WHERE 
        ust.id_terapeuta = %s
    """
    try:
        cursor.execute(query, (id_terapeuta,))
        usuarios_que_favoritaram = cursor.fetchall()
        return usuarios_que_favoritaram
    except NameError as e: # O original tinha NameError, mas Exception é mais seguro
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários que favoritaram: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

@app.put('/atualizar-usuario/{id_usuario}')
async def atualizar_usuario(id_usuario: int, data: AtualizarUsuarioBody):
    # Pega apenas os campos que foram enviados (não None)
    dados_atualizar = data.model_dump(exclude_unset=True)
    
    if not dados_atualizar:
        raise HTTPException(status_code=400, detail="Nenhum dado fornecido para atualização.")

    set_clauses = []
    params = [] 

    if "senha" in dados_atualizar:
        senha = dados_atualizar.pop("senha") # Remove para não ser processado no loop
        try:
            senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
            set_clauses.append("senha = %s") 
            params.append(senha_hash.decode('utf-8'))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao processar senha: {str(e)}")

    for key, value in dados_atualizar.items():
        set_clauses.append(f"{key} = %s")
        params.append(value)
    
    if not set_clauses: # Caso apenas a senha tenha sido enviada e falhado
        raise HTTPException(status_code=400, detail="Nenhum dado válido para atualização.")

    atualizacao = ", ".join(set_clauses)
    query = f"""
    UPDATE 
        usuario 
    SET 
        {atualizacao} 
    WHERE 
        id_usuario = %s
    """
    params.append(id_usuario)
    
    conexao = get_connection()
    cursor = conexao.cursor()
    
    try:
       cursor.execute(query, params)
       conexao.commit()
       if cursor.rowcount == 0:
           raise HTTPException(status_code=404, detail="Usuário não encontrado")
       return {"mensagem": "Usuário atualizado com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar usuário: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

    
@app.post('/sessao', status_code=status.HTTP_201_CREATED)
async def criar_sessao(data: CriarSessaoBody):
    conexao = get_connection()
    cursor = conexao.cursor()
    
    query = """
    INSERT INTO sessao (id_usuario, id_terapeuta, data_hora_agendamento)
    VALUES (%s, %s, %s)
    """

    try:
        cursor.execute(query, (data.id_usuario, data.id_terapeuta, data.data_hora_agendamento))
        conexao.commit()
        return {"mensagem": "Sessão criada com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar sessão: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

@app.get('/sessoes/{tipo}/{id}')
async def listar_sessoes(tipo: str, id: int):
    if tipo not in ('terapeuta', 'usuario'):
        raise HTTPException(status_code=400, detail="Tipo deve ser 'terapeuta' ou 'usuario'")

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    queryT = """
    SELECT 
        u.id_usuario, 
        u.nome, 
        u.email,
        s.status,
        s.data_hora_agendamento,
        s.data_hora_inicio,
        s.data_hora_fim,
        s.duracao,
        s.id_sessao,
        s.tipo
    FROM 
        sessao s
    JOIN 
        usuario u ON s.id_usuario = u.id_usuario
    WHERE 
        s.id_terapeuta = %s
    """

    queryU = """
     SELECT 
        u.id_usuario, 
        u.nome, 
        u.email,
        s.status,
        s.data_hora_agendamento,
        s.data_hora_inicio,
        s.data_hora_fim,
        s.duracao,
        s.id_sessao,
        s.tipo
    FROM 
        sessao s
    JOIN 
        usuario u ON s.id_terapeuta = u.id_usuario
    WHERE 
        s.id_usuario = %s
    """

    query = queryT if tipo == 'terapeuta' else queryU;

    try:
        cursor.execute(query, (id,))
        sessoes = cursor.fetchall()
        return sessoes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar sessoes: {str(e)}")
    finally:
        cursor.close()
        conexao.close()

@app.get('/sessao/{id}')
async def get_sessao(id: int):
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)

    query = """
    SELECT 
        s.id_sessao,
        s.tipo,
        s.status,
        s.data_hora_agendamento,
        s.data_hora_inicio,
        s.data_hora_fim,
        s.duracao,
        s.criadoEm,
        s.atualizadoEm,

        -- dados do paciente (usuario)
        u.id_usuario AS id_usuario,
        u.nome AS nome_usuario,
        u.email AS email_usuario,

        -- dados do terapeuta
        t.id_usuario AS id_terapeuta,
        t.nome AS nome_terapeuta,
        t.email AS email_terapeuta

    FROM sessao s
    JOIN usuario u ON s.id_usuario = u.id_usuario
    JOIN usuario t ON s.id_terapeuta = t.id_usuario
    WHERE s.id_sessao = %s
    LIMIT 1
    """

    try:
        cursor.execute(query, (id,))
        s = cursor.fetchone()
        
        if not s:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        sessao = {
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
        return sessao
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar sessão: {str(e)}")
    finally:
        cursor.close()
        conexao.close()


@app.put('/atualizar-sessao/{id_sessao}')
async def atualizar_sessao(id_sessao: int, data: AtualizarSessaoBody):
    query ="""
    UPDATE 
        sessao 
    SET status = %s
    WHERE 
        id_sessao = %s
    """
    conexao = get_connection()
    cursor = conexao.cursor()
    try:
       cursor.execute(query, (data.status, id_sessao))
       conexao.commit()
       if cursor.rowcount == 0:
           raise HTTPException(status_code=404, detail="Sessao nao encontrada")
       return {"mensagem": "Sessao atualizada com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar sessao: {str(e)}")
    finally:
         cursor.close()
         conexao.close()


@app.put('/atualizar-terapeuta/{id_usuario}')
async def atualizar_terapeuta(id_usuario: int, data: AtualizarTerapeutaBody):
    dados_atualizar = data.model_dump(exclude_unset=True)
    if not dados_atualizar:
        raise HTTPException(status_code=400, detail="Nenhum dado fornecido para atualização.")

    set_clauses = []
    params = []

    for key, value in dados_atualizar.items():
        set_clauses.append(f"{key} = %s")
        params.append(value)

    atualizacao = ", ".join(set_clauses)
    query = f"""
    UPDATE 
        terapeuta 
    SET 
        {atualizacao} 
    WHERE 
        id_usuario = %s
    """
    params.append(id_usuario)
    
    conexao = get_connection()
    cursor = conexao.cursor()
    
    try:
        cursor.execute(query, params)
        conexao.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Terapeuta não encontrado")
        return {"mensagem": "Terapeuta atualizado com sucesso!"}
    except Exception as e:
        conexao.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar terapeuta: {str(e)}")
    finally:
        cursor.close()
        conexao.close()


# ======== EXECUTAR API ==========
# Remova o `if __name__ == "__main__":`
# Para rodar o servidor FastAPI, use o comando no seu terminal:
# uvicorn main:app --reload
# (Assumindo que este arquivo se chama main.py)