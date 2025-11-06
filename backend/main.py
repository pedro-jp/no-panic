from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
import bcrypt
from dotenv import load_dotenv
import os

# Carrega o .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

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
    pool_size=5,  # ajusta conforme a carga do servidor
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
    cursor = conexao.cursor()

    try:
        cursor.execute(
            "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s, %s, %s, %s)",
            (nome, cpf, email, senha_hash.decode('utf-8'))
        )
        id_usuario = cursor.lastrowid
        return jsonify({"mensagem": "Usuário cadastrado com sucesso!"}), 201
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
def listTerapeutas():
    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    especialidade = request.args.get('especialidade')

    if especialidade:
        query = """
            SELECT u.id_usuario, u.nome, u.email,
                t.especialidade, t.CRP, t.disponibilidade
            FROM usuario u
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
            WHERE t.especialidade LIKE %s
        """
    else:
        query = """
            SELECT u.id_usuario, u.nome, u.email,
                t.especialidade, t.CRP, t.disponibilidade
            FROM usuario u
            LEFT JOIN terapeuta t ON u.id_usuario = t.id_usuario
        """

    try:
        if especialidade:
            cursor.execute(query, (f"%{especialidade}%",))
        else:
            cursor.execute(query)
        terapeutas = cursor.fetchall()

        return jsonify(terapeutas), 200
    except Exception as e:
        conexao.rollback()
        return jsonify({"erro": str(e)}), 500
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
    except Exception as e:
        return jsonify({"erro": f"Erro ao listar usuários que favoritaram: {str(e)}"}), 500
    finally:
        cursor.close()
        conexao.close()

# ======== EXECUTAR API ==========
if __name__ == "__main__":
    app.run(debug=True)
