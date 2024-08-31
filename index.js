const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Configure CORS
app.use(cors({
    origin: 'http://localhost:3000/', // Frontend origin
    methods: ['GET', 'POST', 'DELETE'], // Allowed methods
}));

const filePath = path.join(__dirname, 'validIDs.json');
let validIDs = [];

// Função para ler os IDs do arquivo
const loadValidIDs = async () => {
    try {
        if (await fs.access(filePath)) {
            const data = await fs.readFile(filePath, 'utf8');
            validIDs = JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao ler o arquivo de IDs:', error);
        validIDs = [];
    }
};

// Função para salvar os IDs no arquivo
const saveValidIDs = async () => {
    try {
        await fs.writeFile(filePath, JSON.stringify(validIDs, null, 2));
    } catch (error) {
        console.error('Erro ao salvar o arquivo de IDs:', error);
    }
};

// Carregar os IDs ao iniciar o servidor
loadValidIDs();

// Função para verificar se o ID tem o formato correto (11 caracteres)
const isValidID = (id) => /^[a-zA-Z0-9]{11}$/.test(id);

// Rota para listar os IDs válidos
app.get('/listid', async (req, res) => {
    res.json(validIDs);
});

// Rota para adicionar um ID
app.post('/addid', async (req, res) => {
    const { id } = req.body;
    if (!isValidID(id)) {
        return res.status(400).json({ message: 'Formato de ID inválido' });
    }
    if (!validIDs.includes(id)) {
        validIDs.push(id);
        await saveValidIDs();
        res.status(201).json({ message: 'ID adicionado com sucesso' });
    } else {
        res.status(400).json({ message: 'ID já existe' });
    }
});

// Rota para deletar um ID
app.delete('/deleteid/:id', async (req, res) => {
    const { id } = req.params;
    if (!validIDs.includes(id)) {
        return res.status(404).json({ message: 'ID não encontrado' });
    }
    validIDs = validIDs.filter(validID => validID !== id);
    await saveValidIDs();
    res.status(200).json({ message: 'ID deletado com sucesso' });
});

// Rota para salvar os dados do formulário
app.post('/save-form/:id', async (req, res) => {
    const { id } = req.params;

    if (!validIDs.includes(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    const formFilePath = path.join(__dirname, `formData-${id}.json`);

    try {
        await fs.writeFile(formFilePath, JSON.stringify(req.body, null, 2));
        res.status(201).json({ message: 'Formulário salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar os dados do formulário:', error);
        res.status(500).json({ message: 'Erro ao salvar os dados do formulário' });
    }
});

// Rota para verificar se o formulário já foi enviado para um ID
app.get('/form-status/:id', async (req, res) => {
    const { id } = req.params;

    if (!validIDs.includes(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    const formFilePath = path.join(__dirname, `formData-${id}.json`);

    try {
        await fs.access(formFilePath);
        res.status(200).json({ formExists: true });
    } catch {
        res.status(200).json({ formExists: false });
    }
});

// Rota para obter os dados do formulário
app.get('/form-data/:id', async (req, res) => {
    const { id } = req.params;

    if (!validIDs.includes(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    const formFilePath = path.join(__dirname, `formData-${id}.json`);

    try {
        const data = await fs.readFile(formFilePath, 'utf8');
        res.status(200).json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ message: 'Dados do formulário não encontrados' });
        } else {
            console.error('Erro ao ler os dados do formulário:', error);
            res.status(500).json({ message: 'Erro ao ler os dados do formulário' });
        }
    }
});

// Middleware para rotas não encontradas
app.use((req, res, next) => {
    res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Algo deu errado!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
