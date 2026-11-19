# Calculadora de indemnización por despido

Web estática (Astro + TypeScript) que estima la indemnización por despido objetivo o improcedente en España, incluidos los contratos anteriores a la reforma laboral del 12/02/2012.

## Desarrollo

```bash
npm install
npm run dev      # servidor local en http://localhost:4321/redundancy-pay-calculator
npm test         # tests de la fórmula (Vitest)
npm run build    # comprobación de tipos + build estático en dist/
npm run preview  # sirve dist/ en local
```

## Estructura

- `src/lib/indemnizacion.ts`: lógica del cálculo, sin dependencias del DOM.
- `src/lib/indemnizacion.test.ts`: casos de prueba.
- `src/components/Calculadora.astro`: formulario y resultado.
- `src/pages/index.astro`: página principal con la calculadora.
- `src/pages/como-se-calcula.astro`: guía de la fórmula, con un ejemplo calculado al generar la web y preguntas frecuentes.
- `src/layouts/Base.astro`: cabecera, navegación, pie y metadatos SEO.
- `.github/workflows/deploy.yml`: despliegue automático a GitHub Pages al hacer push a `main`.

## Reglas de cálculo

| Tipo | Días por año | Tope |
|---|---|---|
| Objetivo / procedente | 20 | 12 mensualidades |
| Improcedente (contrato desde 12/02/2012) | 33 | 24 mensualidades |
| Improcedente (contrato anterior) | 45 hasta 11/02/2012 + 33 después | 24 mensualidades, o el importe del tramo anterior a 2012 si es mayor (máx. 42) |
| Despido colectivo (ERE) | Pactado (mín. 20) | Pactado (mín. 12 mensualidades) o sin tope |

Salario diario = bruto anual / 365. Los meses incompletos cuentan como mes entero.

Cálculo orientativo, no sustituye asesoramiento profesional.
