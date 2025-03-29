# Adju-Great! - Interactive Adjoint Matrix Tutor

An interactive web application designed to teach the concepts of the classical adjoint (adjugate) matrix using problem sets derived from LaTeX documents.

**Live Demo:** [https://motilinbal.github.io/adjugate/](https://motilinbal.github.io/adjugate/)

## Features

* Presents questions about the classical adjoint matrix step-by-step.
* Renders mathematical notation beautifully using MathJax.
* Provides hints for users when they get stuck.
* Navigates through sections, problems, and questions defined in a JSON database.
* Removes citation markers (e.g., `[cite: 1, 2]`) from displayed text.

## Technology Stack

* **Frontend:** HTML[cite: 1], CSS[cite: 1], Vanilla JavaScript [cite: 1]
* **Math Rendering:** [MathJax 3](https://www.mathjax.org/)
* **Data:** Questions and hints stored in `database.json` [cite: 1] following a defined schema (`schema.txt` [cite: 1]).
* **Deployment:** [GitHub Pages](https://pages.github.com/)

## Data Source

The questions and structure are based on the content from `adjugate problems.tex` and `more problems.tex` (visible in [cite: 1]), which have been converted into the `database.json` [cite: 1] format.

## Running Locally

1.  Clone the repository:
    ```bash
    git clone [https://github.com/motilinbal/adjugate.git](https://www.google.com/search?q=https://github.com/motilinbal/adjugate.git)
    cd adjugate
    ```
2.  Serve the files using a simple local web server. Because the application uses the `Workspace` API to load `database.json`, opening `index.html` directly from the filesystem (`file://...`) will likely cause errors due to browser security restrictions (CORS policy).
    * **Using Python 3:**
        ```bash
        python -m http.server
        ```
        Then open `http://localhost:8000` (or the port indicated) in your browser.
    * **Using Node.js (with `http-server`):**
        ```bash
        # If you don't have http-server install it globally: npm install -g http-server
        http-server .
        ```
        Then open `http://localhost:8080` (or the port indicated) in your browser.
    * **Using VS Code Live Server Extension:** If you use VS Code, the "Live Server" extension provides an easy way to serve the folder.

## Future Enhancements

* Implement dynamic answer input elements in the `#answer-area` based on the `answerType` specified in `database.json`[cite: 1].
* Add answer validation logic using the `correctAnswer` field [cite: 1] for computational problems.
* Implement interactive hint features based on the optional schema fields (`interactivePromptText`, etc.)[cite: 1].
* Improve visual design and user experience.
* Potentially add progress tracking for users.