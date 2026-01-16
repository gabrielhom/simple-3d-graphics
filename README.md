# Simple 3D Graphics (Vanilla JS)

Um projeto de visualização 3D simples usando HTML5 Canvas e JavaScript puro, sem bibliotecas externas.

## Como rodar

Basta abrir o arquivo `index.html` em qualquer navegador moderno.

## Como funciona

O projeto implementa uma engine 3D básica "do zero":

1.  **Vértices**: Um cubo é definido por 8 pontos em um espaço 3D (x, y, z).
2.  **Projeção**: Usamos uma fórmula de projeção de perspectiva simples para converter as coordenadas 3D para 2D (x, y) que podem ser desenhadas no Canvas.
3.  **Rotação e Física**:
    - **Clique Esquerdo / 1 Dedo**: Rotaciona o objeto.
    - **Clique Direito / 2 Dedos**: Move o objeto (Pan).
    - **Momentum**: Inércia ao soltar.
    - **Zoom**: Scroll ou Slider.
4.  **Personalização**:
    - Use o painel para alterar **Cor**, **Espessura** e **Zoom**.
    - Em dispositivos móveis, o painel se ajusta para o topo da tela.
5.  **Touch Support**: Funciona em celulares com gestos de toque para girar.
6.  **Carregar Modelo (.obj)**:
    - Use o botão "Escolher arquivo" para carregar seus próprios modelos 3D em formato `.obj`.
    - O sistema lê vértices (`v`) e faces (`f`) e cria o wireframe automaticamente.
7.  **Render Loop**: O `requestAnimationFrame` atualiza o canvas continuamente.

## Arquivos

- `index.html`: Estrutura base e Canvas.
- `style.css`: Estilização para tela cheia e fundo escuro.
- `main.js`: Lógica matemática e loop de renderização.

## Créditos

- Baseado no projeto de **Radu Mariescu-Istodor**: [YouTube Video](https://www.youtube.com/watch?v=qjWkNZ0SXfo)
- Modelo `penger.obj` por **Max Kawula**: [GitHub Repository](https://github.com/Max-Kawula/penger-obj)
