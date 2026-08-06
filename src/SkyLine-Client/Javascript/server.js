const express = require('express');
const path = require('path');
const app = express();

// CodeHS environment provides its own port dynamicaly :0 -v3mped
const PORT = process.env.PORT || 3000;

// for the html files
const frontendPath = path.join(__dirname, '..', 'Html&Css');
app.use(express.static(frontendPath));

//entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Skyline-Chat running on CodeHS development server`); // - Gl1TCHED2
});
