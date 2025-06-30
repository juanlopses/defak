const express = require('express');
const { Client } = require('@gradio/client');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

// Middleware para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Ruta GET para el face swap
app.get('/api/face-swap', async (req, res) => {
  try {
    // Validar parámetros requeridos
    const { source_url, target_url, enhance } = req.query;
    
    if (!source_url || !target_url) {
      return res.status(400).json({
        error: 'Se requieren los parámetros source_url y target_url con URLs de imágenes válidas'
      });
    }

    // Descargar las imágenes desde las URLs proporcionadas
    const [sourceResponse, targetResponse] = await Promise.all([
      fetch(source_url),
      fetch(target_url)
    ]);

    if (!sourceResponse.ok || !targetResponse.ok) {
      return res.status(400).json({ error: 'No se pudieron descargar una o ambas imágenes' });
    }

    const sourceBlob = await sourceResponse.blob();
    const targetBlob = await targetResponse.blob();

    // Conectar al cliente de Gradio
    const client = await Client.connect("davecarrau/nsfw-face-swap");

    // Realizar la predicción
    const result = await client.predict("/predict", {
      source_file: sourceBlob,
      target_file: targetBlob,
      doFaceEnhancer: enhance === 'true'
    });

    // Enviar respuesta
    res.json({
      success: true,
      result: result.data
    });

  } catch (error) {
    console.error('Error en la API:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud',
      details: error.message
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send(`
    <h1>API de NSFW Face Swap</h1>
    <p>Ejemplo de uso:</p>
    <code>
      /api/face-swap?source_url=URL_IMAGEN_ORIGEN&target_url=URL_IMAGEN_DESTINO&enhance=true
    </code>
  `);
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`API de NSFW Face Swap (GET) corriendo en http://localhost:${port}`);
});
