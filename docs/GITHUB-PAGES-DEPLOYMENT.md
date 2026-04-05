# GitHub Pages Deployment

## Objetivo

Publicar la landing del evento desde GitHub Pages como sitio estatico, manteniendo el dominio publico y sin depender de Render.

## Base oficial

- GitHub Pages es un servicio de hosting estatico que publica HTML, CSS y JavaScript directamente desde el repositorio.
- GitHub Pages soporta dominios propios.
- Para subdominios, GitHub recomienda configurar un registro `CNAME` en DNS.
- GitHub recomienda verificar el dominio personalizado para reducir riesgo de takeover.

## Configuracion objetivo para este repo

1. Publicacion desde la rama elegida para release.
2. Carpeta publicada: raiz del repo.
3. Archivo `CNAME` versionado en la raiz.
4. Dominio publico actual: `wineexperiencebypazcornu.impulzia.cl`.

## Paso a paso

1. Ir a Settings > Pages en GitHub.
2. Elegir `Deploy from a branch`.
3. Seleccionar la rama de release y la carpeta `/root`.
4. Esperar el primer build exitoso de Pages.
5. Configurar el dominio personalizado en el panel de GitHub Pages.
6. Confirmar que el archivo `CNAME` del repo coincida con el dominio configurado.
7. Activar `Enforce HTTPS` una vez que GitHub confirme el dominio.

## DNS

Como este proyecto usa un subdominio, la configuracion recomendada es un registro `CNAME` apuntando al host de GitHub Pages mostrado por el panel de Settings.

En muchos casos ese destino sera algo con formato `<owner>.github.io`, pero la fuente de verdad operativa debe ser lo que muestre GitHub para ese repositorio.

## Checklist operativo

1. `CNAME` sigue presente en la raiz del repo.
2. GitHub Pages muestra build exitoso.
3. El dominio personalizado esta activo.
4. HTTPS esta activo.
5. La web publica sirve el `index.html` esperado.

## Rollback rapido

1. Revertir el commit problemático en la rama publicada.
2. Esperar la nueva publicacion de Pages.
3. Si por algun motivo el sitio se desactiva, remover o corregir el DNS cuanto antes para evitar takeover del subdominio.

## Referencias oficiales

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages