document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Script starting."); // LOG 1

    // **** MATHJAX CONFIGURATION OBJECT with ALL MACROS ****
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        macros: {
          adj: "\\operatorname{adj}",
          vect: ["\\boldsymbol{#1}", 1],
          detm: "\\operatorname{det}",
          rank: "\\operatorname{rank}"
        }
      },
      svg: {
        fontCache: 'global'
      },
      startup: {
          ready: () => {
            console.log('MathJax is ready via config.');
            MathJax.startup.defaultReady();
          }
      }
    };
    console.log("MathJax configuration object defined."); // LOG Config

    // --- Regex for cleaning citations ---
    const citationRegex = /\[cite:\s*\d+(\s*,\s*\d+)*\s*\]/g;

    // --- DOM Elements ---
    const sectionTitleEl = document.getElementById('section-title');
    const problemTitleEl = document.getElementById('problem-title');
    const questionTextEl = document.getElementById('question-text');
    const hintsContainerEl = document.getElementById('hints-container');
    const showHintBtn = document.getElementById('show-hint-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const progressIndicatorEl = document.getElementById('progress-indicator');

    // --- State Variables ---
    let allData = [];
    let currentSectionIndex = 0;
    let currentProblemIndex = 0;
    let currentQuestionIndex = 0;
    let currentHintIndex = -1;

    // --- Promises ---
    console.log("Setting up fetch promise."); // LOG 3
    const fetchData = fetch('database.json')
        .then(response => {
            console.log("Fetch response received. Status:", response.status); // LOG 4
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
        })
        .then(data => {
            console.log("JSON data parsed successfully."); // LOG 5
             if (!data || data.length === 0) { throw new Error("database.json seems empty or invalid."); }
            allData = data;
            console.log("Data assigned to allData."); // LOG 6
            return data;
        })
        .catch(err => {
            console.error("Error during fetch or JSON parsing:", err); // LOG 5e
            throw err; // Re-throw
        });

    // --- Initialize After BOTH Fetch and MathJax Ready ---
    console.log("Setting up Promise.all."); // LOG 7
    Promise.all([fetchData, MathJax.startup.promise])
        .then(() => {
            console.log("Promise.all resolved (fetchData & MathJax ready). Calling loadQuestion..."); // LOG 8
            loadQuestion();
        })
        .catch(error => {
            console.error('Initialization failed (Promise.all rejected):', error); // LOG 9
            let specificError = error instanceof Error ? error.message : String(error);
            if (specificError.includes("MathJax")) {
                 showError(`Initialization failed: MathJax could not start. Check console. ${specificError}`);
            } else {
                 showError(`Initialization failed: Could not load data or start MathJax. Check console. ${specificError}`);
            }
        });


    // --- Functions ---
    function typesetElement(element) {
       return MathJax.startup.promise.then(() => {
            if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
                 return MathJax.typesetPromise([element]);
            } else {
                console.error("MathJax or typesetPromise not available for typesetting even after ready promise.");
                 return Promise.resolve();
            }
       }).catch((err) => {
           console.error('MathJax typesetting error:', err);
            return Promise.resolve();
       });
    }


    function loadQuestion() {
        console.log("loadQuestion called."); // LOG 10
        try {
            // Data structure validation
            if (!allData || allData.length === 0 || !allData[currentSectionIndex] ||
                !allData[currentSectionIndex].problems || allData[currentSectionIndex].problems.length === 0 ||
                !allData[currentSectionIndex].problems[currentProblemIndex] ||
                !allData[currentSectionIndex].problems[currentProblemIndex].questions || allData[currentSectionIndex].problems[currentProblemIndex].questions.length === 0 ||
                !allData[currentSectionIndex].problems[currentProblemIndex].questions[currentQuestionIndex]) {
                console.error("Data structure validation failed in loadQuestion."); // LOG 11
                showError("Error: Cannot find the specified question in the data structure.");
                return;
            }
            console.log("Data structure validation passed."); // LOG 12

            const section = allData[currentSectionIndex];
            const problem = section.problems[currentProblemIndex];
            const question = problem.questions[currentQuestionIndex];
            console.log("Current Question ID:", question.questionId); // LOG 13

            sectionTitleEl.textContent = section.sectionTitle || 'Unnamed Section';
            problemTitleEl.textContent = problem.problemTitle || 'Unnamed Problem';

            // Clean and set question text
            const cleanedQuestionText = (question.questionText || 'No question text provided.').replace(citationRegex, '');
            questionTextEl.textContent = cleanedQuestionText;

            // Reset hints display
            hintsContainerEl.innerHTML = '<p>Hints will appear here when requested.</p>';
            currentHintIndex = -1;
            showHintBtn.disabled = !question.hints || question.hints.length === 0;
            showHintBtn.textContent = "Show Hint";
            console.log("DOM elements updated with text content."); // LOG 14

            // Typeset content
            console.log("Calling typesetElement for question text."); // LOG 15
            typesetElement(questionTextEl)
                .then(() => console.log("Question text typesetting attempted.")) // LOG 16
                .catch(err => console.error("Error during question typesetting:", err));

            updateNavigation();
            console.log("loadQuestion finished."); // LOG 17

        } catch (error) {
            console.error("Error inside loadQuestion function:", error); // LOG 18
            showError(`Error loading question content. ${error.message}`);
        }
    }

    function showHint() {
        const hints = allData[currentSectionIndex]?.problems?.[currentProblemIndex]?.questions?.[currentQuestionIndex]?.hints;
        if (!hints || hints.length === 0) { return; }
        currentHintIndex++;
        if (currentHintIndex === 0) { hintsContainerEl.innerHTML = ''; }

        if (currentHintIndex < hints.length) {
            const hint = hints[currentHintIndex];
            const hintElement = document.createElement('div');
            hintElement.classList.add('hint');

            // Clean and set hint text
            const cleanedHintText = (hint.hintText || 'Hint text missing.').replace(citationRegex, '');
            hintElement.textContent = cleanedHintText;

            hintsContainerEl.appendChild(hintElement);
            console.log("Calling typesetElement for hint text.");
            typesetElement(hintElement)
                .then(() => console.log("Hint text typesetting attempted."))
                .catch(err => console.error("Error during hint typesetting:", err));
        }

        if (currentHintIndex >= hints.length - 1) {
            showHintBtn.disabled = true;
             showHintBtn.textContent = "All Hints Shown";
        }
    }

     function updateNavigation() {
        const totalSections = allData.length;
        const totalProblemsInSection = allData[currentSectionIndex]?.problems?.length || 0;
        const totalQuestionsInProblem = allData[currentSectionIndex]?.problems?.[currentProblemIndex]?.questions?.length || 0;
        progressIndicatorEl.textContent = `S: ${currentSectionIndex + 1}/${totalSections} | P: ${currentProblemIndex + 1}/${totalProblemsInSection} | Q: ${currentQuestionIndex + 1}/${totalQuestionsInProblem}`;
        prevBtn.disabled = (currentSectionIndex === 0 && currentProblemIndex === 0 && currentQuestionIndex === 0);
        const isLastQuestion = currentSectionIndex === totalSections - 1 &&
                              currentProblemIndex === totalProblemsInSection - 1 &&
                              currentQuestionIndex === totalQuestionsInProblem - 1;
        nextBtn.disabled = isLastQuestion;
    }

     function navigate(direction) {
         console.log(`Maps called with direction: ${direction}`); // LOG Nav
        const section = allData[currentSectionIndex];
         if (!section || !section.problems || section.problems.length === 0) { console.error("Cannot navigate, invalid section data."); return; }
         const problem = section.problems[currentProblemIndex];
          if (!problem || !problem.questions || problem.questions.length === 0) { console.error("Cannot navigate, invalid problem data."); return; }

        if (direction === 'next') {
            if (currentQuestionIndex < problem.questions.length - 1) { currentQuestionIndex++; }
            else if (currentProblemIndex < section.problems.length - 1) { currentProblemIndex++; currentQuestionIndex = 0; }
            else if (currentSectionIndex < allData.length - 1) { currentSectionIndex++; currentProblemIndex = 0; currentQuestionIndex = 0; }
            else { return; }
        } else if (direction === 'prev') {
             if (currentQuestionIndex > 0) { currentQuestionIndex--; }
             else if (currentProblemIndex > 0) {
                currentProblemIndex--;
                 if (allData[currentSectionIndex]?.problems?.[currentProblemIndex]?.questions) {
                     currentQuestionIndex = allData[currentSectionIndex].problems[currentProblemIndex].questions.length - 1;
                 } else { currentQuestionIndex = 0; console.error("Previous problem has no questions array."); }
            } else if (currentSectionIndex > 0) {
                currentSectionIndex--;
                 if (allData[currentSectionIndex]?.problems) {
                      currentProblemIndex = allData[currentSectionIndex].problems.length - 1;
                      if (allData[currentSectionIndex]?.problems?.[currentProblemIndex]?.questions) {
                          currentQuestionIndex = allData[currentSectionIndex].problems[currentProblemIndex].questions.length - 1;
                      } else { currentQuestionIndex = 0; console.error("Previous problem in previous section has no questions array."); }
                 } else { currentProblemIndex = 0; currentQuestionIndex = 0; console.error("Previous section has no problems array."); }
            } else { return; }
        }
        loadQuestion();
    }

    function showError(message) {
        console.error("showError called with message:", message);
        sectionTitleEl.textContent = "Error";
        problemTitleEl.textContent = "";
        questionTextEl.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
        hintsContainerEl.innerHTML = '';
        showHintBtn.disabled = true;
        nextBtn.disabled = true;
        prevBtn.disabled = true;
    }

    // --- Event Listeners ---
    showHintBtn.addEventListener('click', showHint);
    nextBtn.addEventListener('click', () => navigate('next'));
    prevBtn.addEventListener('click', () => navigate('prev'));
    console.log("Event listeners added."); // LOG 19

}); // End DOMContentLoaded