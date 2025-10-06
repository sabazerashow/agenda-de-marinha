// server.js (VERSÃO FINAL, COMPLETA E CORRIGIDA)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Conexão com o banco de dados
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados", err.message);
        return;
    }
    console.log("Conectado ao banco de dados SQLite.");

    // Usar db.serialize para garantir a execução sequencial
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS compromissos (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, quando TEXT NOT NULL, onde TEXT, observacoes TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS temas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT UNIQUE NOT NULL)`);
        db.run(`CREATE TABLE IF NOT EXISTS assuntos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, tema_id INTEGER, FOREIGN KEY (tema_id) REFERENCES temas(id))`);
        db.run(`CREATE TABLE IF NOT EXISTS mensagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_mensagem TEXT NOT NULL,
            data_hora_texto TEXT,
            origem TEXT,
            para TEXT,
            conteudo TEXT NOT NULL,
            assunto_id INTEGER,
            reservada INTEGER DEFAULT 0, -- 0 para Não, 1 para Sim
            FOREIGN KEY (assunto_id) REFERENCES assuntos(id)
        )`, (err) => {
            if (err) {
                console.error("Erro ao criar tabela de mensagens:", err.message);
            }
            // Apenas após o último comando, garantimos que tudo foi criado
            console.log("Tabelas garantidas no banco de dados.");
        });
    });
});

// --- API PARA COMPROMISSOS ---
app.get('/api/compromissos', (req, res) => {
    const { busca, ordem } = req.query;
    let sql = "SELECT * FROM compromissos WHERE 1=1";
    const params = [];
    if (busca) { sql += " AND (titulo LIKE ? OR observacoes LIKE ?)"; params.push(`%${busca}%`, `%${busca}%`); }
    sql += ` ORDER BY quando ${ordem === 'asc' ? 'ASC' : 'DESC'}`;
    db.all(sql, params, (err, rows) => { if (err) { res.status(500).json({ "error": err.message }); return; } res.json({ data: rows }); });
});
app.post('/api/compromissos', (req, res) => {
    const { titulo, quando, onde, observacoes } = req.body;
    db.run(`INSERT INTO compromissos (titulo, quando, onde, observacoes) VALUES (?, ?, ?, ?)`, [titulo, quando, onde, observacoes], function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "id": this.lastID }); });
});
app.put('/api/compromissos/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, quando, onde, observacoes } = req.body;
    db.run(`UPDATE compromissos SET titulo = ?, quando = ?, onde = ?, observacoes = ? WHERE id = ?`, [titulo, quando, onde, observacoes, id], function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "changes": this.changes }); });
});
app.delete('/api/compromissos/:id', (req, res) => {
    db.run(`DELETE FROM compromissos WHERE id = ?`, req.params.id, function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "changes": this.changes }); });
});

// --- API PARA MENSAGENS, TEMAS E ASSUNTOS ---
app.get('/api/temas', (req, res) => { db.all("SELECT * FROM temas ORDER BY nome", [], (err, rows) => { if (err) { res.status(500).json({ "error": err.message }); return; } res.json({ data: rows }); }); });
app.post('/api/temas', (req, res) => { db.run(`INSERT INTO temas (nome) VALUES (?)`, [req.body.nome], function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "id": this.lastID }); }); });
app.get('/api/temas/:temaId/assuntos', (req, res) => { db.all("SELECT * FROM assuntos WHERE tema_id = ? ORDER BY nome", [req.params.temaId], (err, rows) => { if (err) { res.status(500).json({ "error": err.message }); return; } res.json({ data: rows }); }); });
app.post('/api/assuntos', (req, res) => { const { nome, tema_id } = req.body; db.run(`INSERT INTO assuntos (nome, tema_id) VALUES (?, ?)`, [nome, tema_id], function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "id": this.lastID }); }); });

app.get('/api/mensagens', (req, res) => {
    const { busca, data_inicio, data_fim, data_hora_texto, temaId, assuntoId, classificar } = req.query;
    let params = [];
    let sql = `SELECT m.id, m.data_mensagem, m.data_hora_texto, m.conteudo, m.origem, m.para, m.reservada, a.nome AS assunto_nome, t.nome AS tema_nome FROM mensagens m JOIN assuntos a ON m.assunto_id = a.id JOIN temas t ON a.tema_id = t.id WHERE 1=1`;
    if (busca) { sql += ` AND m.conteudo LIKE ?`; params.push(`%${busca}%`); }
    if (data_inicio) { sql += ` AND m.data_mensagem >= ?`; params.push(data_inicio); }
    if (data_fim) { sql += ` AND m.data_mensagem <= ?`; params.push(data_fim); }
    if (data_hora_texto) { sql += ` AND m.data_hora_texto LIKE ?`; params.push(`%${data_hora_texto}%`); }
    if (temaId) { sql += ` AND t.id = ?`; params.push(temaId); }
    if (assuntoId) { sql += ` AND a.id = ?`; params.push(assuntoId); }
    switch (classificar) {
        case 'assunto_asc': sql += ` ORDER BY a.nome ASC, m.data_mensagem DESC`; break;
        default: sql += ` ORDER BY m.data_mensagem DESC, m.data_hora_texto DESC`; break;
    }
    db.all(sql, params, (err, rows) => { if (err) { res.status(500).json({ "error": err.message }); return; } res.json({ data: rows }); });
});
app.post('/api/mensagens', (req, res) => {
    const { data_mensagem, data_hora_texto, origem, para, conteudo, assunto_id, reservada } = req.body;
    db.run(`INSERT INTO mensagens (data_mensagem, data_hora_texto, origem, para, conteudo, assunto_id, reservada) VALUES (?, ?, ?, ?, ?, ?, ?)`, [data_mensagem, data_hora_texto, origem, para, conteudo, assunto_id, reservada], function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "id": this.lastID }); });
});
app.put('/api/mensagens/:id', (req, res) => { db.run(`UPDATE mensagens SET conteudo = ? WHERE id = ?`, [req.body.conteudo, req.params.id], function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "changes": this.changes }); }); });
app.delete('/api/mensagens/:id', (req, res) => { db.run(`DELETE FROM mensagens WHERE id = ?`, req.params.id, function(err) { if (err) { res.status(400).json({ "error": err.message }); return; } res.json({ "changes": this.changes }); }); });

app.listen(port, () => { console.log(`Servidor rodando em http://localhost:${port}`); });
