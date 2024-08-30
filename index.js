const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Configure CORS
app.use(cors({
    origin: 'http://localhost:3000/', // Frontend origin
    methods: ['GET', 'POST', 'DELETE'], // Allowed methods
}));

// Caminho para o arquivo de IDs válidos
const filePath = path.join(__dirname, 'validIDs.json');
let validIDs = [];

// Função para ler os IDs do arquivo
const loadValidIDs = () => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            validIDs = JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao ler o arquivo de IDs:', error);
        validIDs = [];
    }
};

// Função para salvar os IDs no arquivo
const saveValidIDs = () => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(validIDs, null, 2));
    } catch (error) {
        console.error('Erro ao salvar o arquivo de IDs:', error);
    }
};

// Carregar os IDs ao iniciar o servidor
loadValidIDs();

// Função para verificar se o ID tem o formato correto (11 caracteres)
const isValidID = (id) => /^[a-zA-Z0-9]{11}$/.test(id);

// Rota para listar os IDs válidos
app.get('/listid', (req, res) => {
    res.json(validIDs);
});

// Rota para adicionar um ID
app.post('/addid', (req, res) => {
    const { id } = req.body;
    if (!isValidID(id)) {
        return res.status(400).json({ message: 'Formato de ID inválido' });
    }
    if (!validIDs.includes(id)) {
        validIDs.push(id);
        saveValidIDs();
        res.status(201).json({ message: 'ID adicionado com sucesso' });
    } else {
        res.status(400).json({ message: 'ID já existe' });
    }
});

// Rota para deletar um ID
app.delete('/deleteid/:id', (req, res) => {
    const { id } = req.params;
    if (!validIDs.includes(id)) {
        return res.status(404).json({ message: 'ID não encontrado' });
    }
    validIDs = validIDs.filter(validID => validID !== id);
    saveValidIDs();
    res.status(200).json({ message: 'ID deletado com sucesso' });
});

// Rota para salvar os dados do formulário
app.post('/save-form/:id', (req, res) => {
    const { id } = req.params;

    // Verifica se o ID é válido
    if (!validIDs.includes(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    // Caminho para o arquivo onde os dados serão salvos
    const formFilePath = path.join(__dirname, `formData-${id}.json`);

    // Salva os dados do formulário no arquivo JSON
    try {
        fs.writeFileSync(formFilePath, JSON.stringify(req.body, null, 2));
        res.status(201).json({ message: 'Formulário salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar os dados do formulário:', error);
        res.status(500).json({ message: 'Erro ao salvar os dados do formulário' });
    }
});

// Rota para verificar se o formulário já foi enviado para um ID
app.get('/form-status/:id', (req, res) => {
    const { id } = req.params;

    // Verifica se o ID é válido
    if (!validIDs.includes(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    // Caminho para o arquivo onde os dados do formulário deveriam estar
    const formFilePath = path.join(__dirname, `formData-${id}.json`);

    // Verifica se o arquivo existe
    fs.access(formFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(200).json({ formExists: false });
        } else {
            res.status(200).json({ formExists: true });
        }
    });
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

// Inicializar o servidor na porta especificada
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
