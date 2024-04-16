const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

app.use(express.json());

app.use(cors());

// Массив для хранения результатов сабмитов
let submissions = [];

app.get('/submissions', (req, res) => {
    res.json(submissions);
});

// Обработчик POST запросов на /submit
app.post('/submit', (req, res) => {
    // Получение данных из запроса
    const submissionData = req.body;
    // Добавление данных в массив
    submissions.push(submissionData);
    // Отправка ответа
    res.status(200).send(`Результаты сабмита успешно сохранены.${submissions.length}`);
});

app.get('/submissions', (req, res) => {
    res.status(200).json(submissions);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
