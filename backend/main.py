from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
import bcrypt
from dotenv import load_dotenv
import os
import time

# Carrega o .env
load_dotenv()



DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

POOL_SIZE = int(os.getenv("POOL_SIZE"))

app = Flask(__name__)
CORS(app)

# ======== POOL DE CONEXÕES ==========
# Em vez de abrir uma conexão nova a cada request,
# o pool mantém conexões abertas e reaproveita — muito mais rápido.
dbconfig = {
    "host": DB_HOST,
    "user": DB_USER,
    "password": DB_PASSWORD,
    "database": DB_NAME,
    "port": DB_PORT,
    "autocommit": True
}

connection_pool = pooling.MySQLConnectionPool(
    pool_name="main_pool",
    pool_size=POOL_SIZE,  # ajusta conforme a carga do servidor
    pool_reset_session=True,
    **dbconfig
)

def get_connection():
    return connection_pool.get_connection()

# =====================================================
# ROTAS (todo o resto do teu código, sem mudanças)
# =====================================================

@app.route('/', methods=['GET'])
def home():
    return render_template("index.html")

# ======== ROTA: CADASTRO ==========
@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.json
    nome = data.get("nome")
    cpf = data.get("cpf")
    email = data.get("email")
    senha = data.get("senha")

    if not all([nome, cpf, email, senha]):
        return jsonify({"erro": "Campos obrigatórios faltando"}), 400

    senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)

    try:
        cursor.execute(
            "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s, %s, %s, %s)",
            (nome, cpf, email, senha_hash.decode('utf-8'))
        )
        conexao.commit()

        id_novo = cursor.lastrowid

        # Busca o usuário recém-criado
        cursor.execute("SELECT * FROM usuario WHERE email = %s", (email,))
        u = cursor.fetchone()

        usuario = {
            "id": u["id_usuario"],
            "nome": u["nome"],
            "email": u["email"],
            "cpf": u["cpf"],
            "primeiro_login": u["primeiro_login"]
        }

        return jsonify(usuario), 201

    except mysql.connector.Error as e:
        conexao.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()


# ======== ROTA: LOGIN ==========
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"erro": "JSON inválido"}), 400

    email = data.get("email")
    senha = data.get("senha")
    if not email or not senha:
        return jsonify({"erro": "Informe email e senha"}), 400

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuario WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        if bcrypt.checkpw(senha.encode('utf-8'), usuario["senha"].encode('utf-8')):
            newUsuario = {
                "id": usuario["id_usuario"],
                "nome": usuario["nome"],
                "email": usuario["email"],
                "cpf": usuario["cpf"],
                "primeiro_login": usuario["primeiro_login"]
            }
            return jsonify(newUsuario), 200
        else:
            return jsonify({"erro": "Senha incorreta"}), 401
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/has-terapeuta', methods=['POST'])
def hasTerapeuta():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"erro": "JSON inválido"}), 400

    id = data.get("id")
    if not id:
        return jsonify({"erro": "Informe o id"}), 400

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        query = """
            SELECT t.CRP
            FROM usuario u
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
            WHERE u.id_usuario = %s
        """
        cursor.execute(query, (id,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404


        if usuario["CRP"]:
            user = {
                "CRP": usuario["CRP"],
            }
            return jsonify(user), 200
        return jsonify({"message": "Terapeuta não cadastrado"})


    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/load-user', methods=['POST'])
def loadUser():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"erro": "JSON inválido"}), 400

    email = data.get("email")
    if not email:
        return jsonify({"erro": "Informe email"}), 400

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
        cursor.execute(query, (email,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404

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

        return jsonify(newUsuario), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/primeiro-login', methods=['PUT'])
def primeiroLogin():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"erro": "JSON inválido"}), 400

    id = data.get("id")
    if not id:
        return jsonify({"erro": "Informe o id do usuário"}), 400

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuario WHERE id_usuario = %s", (id,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 400
        
        cursor.execute("UPDATE usuario SET primeiro_login = false WHERE id_usuario = %s", (id,))
        conexao.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/cadastro-terapeuta', methods=['POST'])
def cadastro_terapeuta():
    data = request.json
    id_usuario = data.get("id")
    especialidade = data.get("especialidade")
    crp = data.get("crp")
    disponibilidade = data.get("disponibilidade")

    if not all([id_usuario, especialidade, crp, disponibilidade]):
        return jsonify({"erro": "Campos obrigatórios faltando"}), 400

    conexao = get_connection()
    cursor = conexao.cursor()
    try:
        cursor.execute(
            "INSERT INTO terapeuta (id_usuario, especialidade, CRP, disponibilidade) VALUES (%s, %s, %s, %s)",
            (id_usuario, especialidade, crp, disponibilidade)
        )
        conexao.commit()
        return jsonify({"mensagem": "Terapeuta cadastrado com sucesso!"}), 201
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/cadastro-usuario', methods=['PUT'])
def cadastro_usuario():
    data = request.json
    id_usuario = data.get("id")
    data_nascimento = data.get("data_nascimento")
    endereco = data.get("endereco")
    contato_emergencia = data.get("contato_emergencia")

    if not all([id_usuario, data_nascimento, endereco, contato_emergencia]):
        return jsonify({"erro": "Campos obrigatórios faltando"}), 400

    conexao = get_connection()
    cursor = conexao.cursor()
    try:
        cursor.execute(
            "UPDATE usuario SET data_nascimento = %s, endereco = %s, contato_emergencia = %s WHERE id_usuario = %s",
            (data_nascimento, endereco, contato_emergencia, id_usuario)
        )
        conexao.commit()
        return jsonify({"mensagem": "Usuário alterado com sucesso!"}), 201
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/terapeutas', methods=['GET'])
def listarTerapeutas():
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    
    # Essa parte eu não sabia, peguei com Gemini, veja se está certo!!!!!*(Mas pelo que entendi, default = 1 é qual página o usuário esta, e o default 20 é o limite de terapeutas por página...Creio que seja isso)
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=20, type=int)
    offset = (page - 1) * limit
    especialidade = request.args.get('especialidade')

    # Conta os terapeutas do banco de dadoss (Bd não é o meu forte ainda)
    count_query = "SELECT COUNT(*) AS total FROM usuario u LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario WHERE t.id_usuario IS NOT NULL"
    print(count_query)
    # Aqui é para puxar os dados do banco de dados
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
    
    # Peguei com ajuda da INTERNET essa parte
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

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"erro": f"Erro ao listar terapeutas: {str(e)}"}), 500

    finally:
        cursor.close()
        conexao.close()

@app.route('/favoritar', methods=['POST'])
def favoritar_terapeuta():
    conexao = get_connection()
    cursor = conexao.cursor()
    try:
        data = request.get_json()
        id_usuario = data['id_usuario']
        id_terapeuta = data['id_terapeuta']
    except Exception as e:
        return jsonify({"erro": "Dados inválidos: id_usuario e id_terapeuta são obrigatórios."}), 400

    query = """
    INSERT INTO usuario_salva_terapeuta (id_usuario, id_terapeuta)
    VALUES (%s, %s)
    """

    try:
        cursor.execute(query, (id_usuario, id_terapeuta))
        conexao.commit()
        return jsonify({"mensagem": "Terapeuta favoritado com sucesso!"}), 201
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": f"Erro ao favoritar terapeuta: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/usuarios/<int:id_usuario>/terapeutas', methods=['GET'])
def listar_terapeutas_por_usuario(id_usuario):
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
        return jsonify(terapeutas_favoritos), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao listar terapeutas favoritos: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/terapeuta/<int:id_terapeuta>/usuarios', methods=['GET'])
def listar_usuarios_por_terapeuta(id_terapeuta):
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
        return jsonify(usuarios_que_favoritaram), 200
    except NameError as e:
        return jsonify({"erro": f"Erro ao listar usuários que favoritaram: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/atualizar-usuario/<int:id_usuario>', methods=['PUT'])
def atualizar_usuario(id_usuario):
    data = request.json
    if not data:
        return jsonify({"erro": "Nenhum dado enviado"}), 400
    set_clauses = []
    params = [] 
    dados = {
        "nome": data.get("nome"),
        "email": data.get("email"),
        "data_nascimento": data.get("data_nascimento"),
        "endereco": data.get("endereco"),
        "contato_emergencia": data.get("contato_emergencia")
    }
    senha = data.get("senha")
    for dado, valor in dados.items():
        if valor is not None:
            set_clauses.append(f"{dado} = %s")
            params.append(valor)
    if senha:
        try:
            senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
            set_clauses.append("senha = %s") 
            params.append(senha_hash.decode('utf-8'))
        except Exception as e:
            return jsonify({"erro": f"Erro ao processar senha: {str(e)}"}), 500
    if not set_clauses:
        return jsonify({"mensagem": "Nenhum dado fornecido para atualização."}), 400
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
           return jsonify({"erro": "Usuário não encontrado"}), 404
       return jsonify({"mensagem": "Usuário atualizado com sucesso!"}), 200
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": f"Erro ao atualizar usuário: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

    
@app.route('/sessao', methods=['POST'])
def criarSessao():
    conexao = get_connection()
    cursor = conexao.cursor()
    try:
        data = request.get_json()
        id_usuario = data['id_usuario']
        id_terapeuta = data['id_terapeuta']
        data_hora_agendamento = data['data_hora_agendamento']

    except Exception as e:
        return jsonify({"erro": "Dados inválidos: id_usuario, id_terapeuta e data_hora_agendamento são obrigatórios. "}), 400

    query = """
    INSERT INTO sessao (id_usuario, id_terapeuta, data_hora_agendamento)
    VALUES (%s, %s, %s)
    """

    try:
        cursor.execute(query, (id_usuario, id_terapeuta, data_hora_agendamento))
        conexao.commit()
        return jsonify({"mensagem": "Sessão criada com sucesso!"}), 201
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": f"Erro ao favoritar terapeuta: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/sessoes/<string:tipo>/<int:id>', methods=['GET'])
def listar_sessoes_terapeuta(tipo,id):
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
        return jsonify(sessoes), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao listar sessoes: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

@app.route('/sessao/<int:id>', methods=['GET'])
def get_sessao(id):
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
        print(sessao)
        if not sessao:
            return jsonify({"erro": "Sessão não encontrada"}), 404
        return jsonify(sessao), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao buscar sessão: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()


@app.route('/atualizar-sessao/<int:id_sessao>', methods=['PUT'])
def atualizar_sessao(id_sessao):
    data = request.json
    if not data:
        return jsonify({"erro": "Nenhum dado enviado"}), 400
    
    status = data.get("status")
        
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
       cursor.execute(query, (status,id_sessao))
       conexao.commit()
       if cursor.rowcount == 0:
           return jsonify({"erro": "Sessao nao encontrada"}), 404
       return jsonify({"mensagem": "Sessao atualizada com sucesso!"}), 200
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": f"Erro ao atualizar sessao: {str(e)}"}), 500
    finally:
         cursor.close()
         conexao.close()


@app.route('/atualizar-terapeuta/<int:id_usuario>', methods=['PUT'])
def atualizar_terapeuta(id_usuario):
    data = request.json
    if not data:
        return jsonify({"erro": "Nenhum dado enviado"}), 400

    set_clauses = []
    params = []

    dados = {
        "especialidade": data.get("especialidade"),
        "CRP": data.get("CRP"),
        "disponibilidade": data.get("disponibilidade")
    }

    for dado, valor in dados.items():
        if valor is not None:
            set_clauses.append(f"{dado} = %s")
            params.append(valor)

    if not set_clauses:
        return jsonify({"mensagem": "Nenhum dado fornecido para atualização."}), 400

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
            return jsonify({"erro": "Terapeuta não encontrado"}), 404
        return jsonify({"mensagem": "Terapeuta atualizado com sucesso!"}), 200
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": f"Erro ao atualizar terapeuta: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()


# ======== EXECUTAR API ==========
if __name__ == "__main__":
    app.run(debug=True)
