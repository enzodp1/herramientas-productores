# Lumbra

Herramientas gratis para compositores y productores. Web estática: se publica tal cual desde la rama `main` (Netlify).

- `/` portada
- `/rimas/` buscador de rimas en español (`assets/rimas.js`, diccionario en `datos/palabras-es.txt`)

Contexto: `datos/vectores-es.bin` guarda un vector de significado de 64 enteros de 8 bits por palabra, en el mismo orden que `palabras-es.txt`. Sale de los vectores fastText de spaCy `es_core_news_lg` 3.8 (fuente: Explosion fastText Vectors, OSCAR + Wikipedia, CC0), reducidos con PCA. Solo se descarga si el usuario escribe un contexto.

Diccionario: lista de frecuencias de [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (CC BY-SA 4.0) filtrada con el diccionario ortográfico de LibreOffice.
