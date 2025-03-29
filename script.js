document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Script starting."); // LOG 1

    let mathJaxManualResolve;
    const mathJaxFullyReadyPromise = new Promise(resolve => {
        mathJaxManualResolve = resolve;
    });
    console.log("Manual MathJax readiness promise created."); // LOG ManualPromise

    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        macros: { adj: "\\operatorname{adj}", vect: ["\\boldsymbol{#1}", 1], detm: "\\operatorname{det}", rank: "\\operatorname{rank}" }
      },
      svg: { fontCache: 'global' },
      startup: {
          ready: () => {
            console.log('MathJax is ready via config.'); // LOG ReadyCallback
            console.log('Detected MathJax Version:', MathJax.version); // Log version
            MathJax.startup.defaultReady();
            mathJaxManualResolve(); // Resolve OUR promise
          }
      }
    };
    console.log("MathJax configuration object defined."); // LOG Config

    const citationRegex = /\[cite:\s*\d+(\s*,\s*\d+)*\s*\]/g;
    const sectionTitleEl = document.getElementById('section-title');
    const problemTitleEl = document.getElementById('problem-title');
    const questionTextEl = document.getElementById('question-text');
    const hintsContainerEl = document.getElementById('hints-container');
    const showHintBtn = document.getElementById('show-hint-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const progressIndicatorEl = document.getElementById('progress-indicator');
    let allData = [];
    let currentSectionIndex = 0;
    let currentProblemIndex = 0;
    let currentQuestionIndex = 0;
    let currentHintIndex = -1;

    console.log("Setting up fetch promise."); // LOG 3
    const fetchData = fetch('database.json')
        .then(response => { /* ... fetch logic ... */
            console.log("Fetch response received. Status:", response.status);
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
        })
        .then(data => { /* ... parse logic ... */
             console.log("JSON data parsed successfully.");
             if (!data || data.length === 0) { throw new Error("database.json seems empty or invalid."); }
            allData = data;
            console.log("Data assigned to allData.");
            return data;
        })
        .catch(err => { /* ... fetch error handling ... */
            console.error("Error during fetch or JSON parsing:", err);
            throw err;
        });

    console.log("Setting up Promise.all, waiting for fetch and MANUAL MathJax readiness."); // LOG 7
    Promise.all([fetchData, mathJaxFullyReadyPromise])
        .then(() => {
            console.log("Promise.all resolved (fetchData & MathJax FULLY ready)."); // LOG 8
            // **** ADDING DELAY before calling loadQuestion ****
            console.log("Adding 150ms delay before first loadQuestion...");
            setTimeout(() => {
                 console.log("Delay finished. Calling loadQuestion..."); // LOG DelayEnd
                 loadQuestion();
            }, 150); // 150 millisecond delay - adjust if needed
            // **** END OF DELAY ****
        })
        .catch(error => { /* ... Promise.all error handling ... */
            console.error('Initialization failed (Promise.all rejected):', error);
            let specificError = error instanceof Error ? error.message : String(error);
             showError(`Initialization failed. Check console. ${specificError}`);
        });


    // --- Functions ---
    // Use the simplified typesetElement from the previous attempt
     function typesetElement(element) {
        console.log("typesetElement called for:", element);
        if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
            console.log("MathJax.typesetPromise function found, calling it.");
            return MathJax.typesetPromise([element]).catch((err) => {
                console.error('MathJax typesetting execution error:', err);
                return Promise.resolve();
            });
        } else {
            console.error("MathJax.typesetPromise function not available when typesetElement was called (unexpected).");
            return Promise.resolve();
        }
    }

    function loadQuestion() {
        console.log("loadQuestion called."); // LOG 10
        try {
             // Data structure validation (same)
             if (!allData || allData.length === 0 || !allData[currentSectionIndex] || /* ... more checks ... */ !allData[currentSectionIndex].problems[currentProblemIndex].questions[currentQuestionIndex]) {
                console.error("Data structure validation failed in loadQuestion.");
                showError("Error: Cannot find the specified question in the data structure.");
                return;
            }
            console.log("Data structure validation passed.");
            const section = allData[currentSectionIndex];
            const problem = section.problems[currentProblemIndex];
            const question = problem.questions[currentQuestionIndex];
            console.log("Current Question ID:", question.questionId);

            sectionTitleEl.textContent = section.sectionTitle || 'Unnamed Section';
            problemTitleEl.textContent = problem.problemTitle || 'Unnamed Problem';
            const cleanedQuestionText = (question.questionText || 'No question text provided.').replace(citationRegex, '');
            questionTextEl.textContent = cleanedQuestionText;
            hintsContainerEl.innerHTML = '<p>Hints will appear here when requested.</p>';
            currentHintIndex = -1;
            showHintBtn.disabled = !question.hints || question.hints.length === 0;
            showHintBtn.textContent = "Show Hint";
            console.log("DOM elements updated with text content.");

            console.log("Calling typesetElement for question text.");
            typesetElement(questionTextEl)
                .then(() => console.log("Question text typesetting completed or skipped."))
                .catch(err => console.error("Error during question typesetting:", err));

            updateNavigation();
            console.log("loadQuestion finished.");

        } catch (error) {
            console.error("Error inside loadQuestion function:", error);
            showError(`Error loading question content. ${error.message}`);
        }
    }

    // (Keep other functions: showHint, updateNavigation, navigate, showError the same as last version)
     function showHint() {
        const hints = allData[currentSectionIndex]?.problems?.[currentProblemIndex]?.questions?.[currentQuestionIndex]?.hints;
        if (!hints || hints.length === 0) { return; }
        currentHintIndex++;
        if (currentHintIndex === 0) { hintsContainerEl.innerHTML = ''; }
        if (currentHintIndex < hints.length) {
            const hint = hints[currentHintIndex];
            const hintElement = document.createElement('div');
            hintElement.classList.add('hint');
            const cleanedHintText = (hint.hintText || 'Hint text missing.').replace(citationRegex, '');
            hintElement.textContent = cleanedHintText;
            hintsContainerEl.appendChild(hintElement);
            console.log("Calling typesetElement for hint text.");
            typesetElement(hintElement)
                .then(() => console.log("Hint text typesetting completed or skipped."))
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
         console.log(`Maps called with direction: ${direction}`);
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