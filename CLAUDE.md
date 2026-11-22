# Lumbra — web de herramientas para compositores y productores

Resumen completo de decisiones: doc del proyecto de Claude `claude/web-herramientas-resumen.md`.

- Marca: Lumbra. Herramientas de oficio hechas por un músico (Enzo Pazos), no IA que compone.
- Idiomas: español primero, interfaz ES/EN. El inglés se construye herramienta a herramienta, no se traduce en masa.
- Una herramienta = una URL pensada para una búsqueda concreta, con texto explicativo real (necesario para AdSense y SEO).
- Todo funciona en el navegador: sin servidor, coste de mantenimiento 0 €.
- Visual: fondo oscuro cálido #14100C, una sola luz ámbar #F2A541 por pantalla, contrapunto azul mínimo. Fuentes: Fraunces, Instrument Sans, JetBrains Mono.
- Hosting: Netlify o Cloudflare Pages desde la rama main. Dominio pendiente (se compra al final).
- Solo se muestra lo que está terminado: nada de "próximamente", ni secciones de plugins o listas de correo hasta que existan.
- La web está oculta a buscadores (meta noindex + robots.txt Disallow) hasta que Enzo decida lanzarla. Quitarlo es el paso de lanzamiento.
- Perilla común de los plugins: Filamento (EN: Filament).
