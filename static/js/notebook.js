// Notebook functionality
class NotebookManager {
    constructor() {
        this.cells = [];
        this.selectedCellIndex = -1;
        this.cellCounter = 0;
        this.container = document.getElementById('notebookContainer');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Cell management buttons
        document.getElementById('addCodeCell').addEventListener('click', () => {
            this.addCell('code');
        });

        document.getElementById('addMarkdownCell').addEventListener('click', () => {
            this.addCell('markdown');
        });

        document.getElementById('addFirstCell').addEventListener('click', () => {
            this.addCell('code');
            this.hideEmptyNotebook();
        });

        document.getElementById('runAllCells').addEventListener('click', () => {
            this.runAllCells();
        });

        document.getElementById('clearAllOutputs').addEventListener('click', () => {
            this.clearAllOutputs();
        });

        // Toolbar buttons
        document.getElementById('insertCellAbove').addEventListener('click', () => {
            this.insertCellAbove();
        });

        document.getElementById('insertCellBelow').addEventListener('click', () => {
            this.insertCellBelow();
        });

        document.getElementById('deleteCell').addEventListener('click', () => {
            this.deleteSelectedCell();
        });

        document.getElementById('runCell').addEventListener('click', () => {
            this.runSelectedCell();
        });

        document.getElementById('cellType').addEventListener('change', (e) => {
            this.changeCellType(e.target.value);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    addCell(type = 'code', content = '', index = -1) {
        const cellId = `cell-${++this.cellCounter}`;
        const cell = {
            id: cellId,
            type: type,
            content: content,
            output: '',
            editor: null
        };

        if (index === -1) {
            this.cells.push(cell);
            index = this.cells.length - 1;
        } else {
            this.cells.splice(index, 0, cell);
        }

        this.renderCell(cell, index);
        this.updateCellNumbers();
        this.updateCellCount();
        this.selectCell(index);

        return cell;
    }

    renderCell(cell, index) {
        const cellElement = document.createElement('div');
        cellElement.className = `notebook-cell ${cell.type}-cell`;
        cellElement.id = cell.id;
        cellElement.dataset.index = index;

        cellElement.innerHTML = `
            <div class="cell-header">
                <span class="cell-number">${cell.type === 'code' ? `[${index + 1}]:` : `Markdown ${index + 1}:`}</span>
                <div class="cell-actions">
                    <button class="cell-action-btn" onclick="notebook.runCell(${index})" title="Run cell">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="cell-action-btn" onclick="notebook.moveCell(${index}, -1)" title="Move up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="cell-action-btn" onclick="notebook.moveCell(${index}, 1)" title="Move down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="cell-action-btn" onclick="notebook.deleteCell(${index})" title="Delete cell">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="cell-input ${cell.content.trim() ? 'expanded' : ''}">
                <textarea id="${cell.id}-input">${cell.content}</textarea>
            </div>
            ${cell.output ? `<div class="cell-output" id="${cell.id}-output">${cell.output}</div>` : ''}
        `;

        // Insert cell at the correct position
        if (index === 0) {
            this.container.insertBefore(cellElement, this.container.firstChild);
        } else {
            const previousCell = this.container.querySelector(`[data-index="${index - 1}"]`);
            if (previousCell && previousCell.nextSibling) {
                this.container.insertBefore(cellElement, previousCell.nextSibling);
            } else {
                this.container.appendChild(cellElement);
            }
        }

        // Initialize CodeMirror editor
        setTimeout(() => {
            this.initializeCellEditor(cell, index);
        }, 10);

        // Add click event to select cell
        cellElement.addEventListener('click', () => {
            this.selectCell(index);
        });
    }

    initializeCellEditor(cell, index) {
        const textarea = document.getElementById(`${cell.id}-input`);
        if (!textarea) return;

        const mode = cell.type === 'code' ? 'python' : 'markdown';
        
        cell.editor = CodeMirror.fromTextArea(textarea, {
            mode: mode,
            theme: 'default',
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true,
            viewportMargin: 0,
            scrollbarStyle: 'null',
            extraKeys: {
                'Shift-Enter': () => {
                    this.runCell(index);
                    this.selectCell(index + 1) || this.addCell('code');
                },
                'Ctrl-Enter': () => {
                    this.runCell(index);
                },
                'Alt-Enter': () => {
                    this.runCell(index);
                    this.insertCellBelow();
                },
                'Escape': () => {
                    this.selectCell(index);
                }
            }
        });

        // Set initial state based on content
        this.updateCellSize(cell, index);

        cell.editor.on('change', () => {
            cell.content = cell.editor.getValue();
            this.updateCellSize(cell, index);
        });

        cell.editor.on('focus', () => {
            this.selectCell(index);
            this.expandCell(cell, index);
        });

        cell.editor.on('blur', () => {
            this.updateCellSize(cell, index);
        });
    }

    updateCellSize(cell, index) {
        const content = cell.editor.getValue();
        const cellElement = document.getElementById(cell.id);
        const cellInput = cellElement.querySelector('.cell-input');
        const codeMirror = cellElement.querySelector('.CodeMirror');
        
        if (content.trim().length === 0) {
            // Empty cell - compact size
            codeMirror.classList.remove('has-content');
            cellInput.classList.remove('expanded');
            // Force compact height
            cell.editor.setSize(null, 28);
        } else {
            // Has content - expanded size
            codeMirror.classList.add('has-content');
            cellInput.classList.add('expanded');
            // Allow auto height
            cell.editor.setSize(null, 'auto');
        }
        
        // Refresh CodeMirror to update display
        setTimeout(() => {
            cell.editor.refresh();
        }, 10);
    }

    expandCell(cell, index) {
        const cellElement = document.getElementById(cell.id);
        const cellInput = cellElement.querySelector('.cell-input');
        const codeMirror = cellElement.querySelector('.CodeMirror');
        
        // Temporarily expand on focus even if empty
        cellInput.classList.add('expanded');
        codeMirror.classList.remove('empty-cell');
        
        setTimeout(() => {
            cell.editor.refresh();
            cell.editor.focus();
        }, 10);
    }

    selectCell(index) {
        if (index < 0 || index >= this.cells.length) return false;

        // Remove previous selection
        document.querySelectorAll('.notebook-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });

        // Select new cell
        const cellElement = document.querySelector(`[data-index="${index}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
            this.selectedCellIndex = index;
            
            // Update cell type selector
            const cellTypeSelector = document.getElementById('cellType');
            cellTypeSelector.value = this.cells[index].type;
            
            return true;
        }
        return false;
    }

    runCell(index) {
        if (index < 0 || index >= this.cells.length) return;

        const cell = this.cells[index];
        const cellElement = document.getElementById(cell.id);
        
        // Show loading state
        cellElement.classList.add('loading');

        if (cell.type === 'code') {
            this.executePythonCode(cell, index);
        } else if (cell.type === 'markdown') {
            this.renderMarkdown(cell, index);
        }

        // Remove loading state after a short delay
        setTimeout(() => {
            cellElement.classList.remove('loading');
        }, 500);
    }

    async executePythonCode(cell, index) {
        const code = cell.content.trim();
        
        if (!code) {
            this.showCellOutput(cell, '', 'success');
            return;
        }

        try {
            // Update kernel status to busy
            if (window.app) {
                window.app.updateKernelStatus('busy');
            }

            // Call the backend API to execute Python code
            const response = await fetch('http://localhost:5000/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    cell_id: cell.id
                })
            });

            const result = await response.json();

            if (result.success) {
                // Show successful output
                let output = result.output ? result.output.trim() : '';
                
                // Add execution time if available
                if (result.execution_time) {
                    const timeInfo = `[Executed in ${(result.execution_time * 1000).toFixed(1)}ms]`;
                    if (output) {
                        output = output + '\n\n' + timeInfo;
                    } else {
                        output = timeInfo;
                    }
                }
                
                // Always show something for successful execution
                if (!output) {
                    output = '[Code executed successfully]';
                }
                
                // Handle plots if available
                if (result.plots && result.plots.length > 0) {
                    this.showCellOutputWithPlots(cell, output, result.plots);
                } else {
                    this.showCellOutput(cell, output, 'success');
                }
            } else {
                // Check for missing packages
                if (result.missing_packages && result.missing_packages.length > 0) {
                    this.showMissingPackagesDialog(result.missing_packages, code, cell, index);
                } else {
                    // Show regular error output
                    const errorOutput = result.error || 'Unknown error occurred';
                    this.showCellOutput(cell, errorOutput, 'error');
                }
            }

        } catch (error) {
            // Handle network or other errors
            let errorMessage = 'Failed to execute code. ';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Backend server not running. Please start the Python server:\n\n';
                errorMessage += 'cd to your project directory and run:\n';
                errorMessage += 'python backend_server.py';
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            this.showCellOutput(cell, errorMessage, 'error');
        } finally {
            // Update kernel status back to idle
            if (window.app) {
                window.app.updateKernelStatus('idle');
            }
        }
    }

    renderMarkdown(cell, index) {
        const markdown = cell.content;
        let html = '';

        try {
            // Check if marked is available
            if (typeof marked === 'undefined') {
                throw new Error('marked library is not loaded');
            }

            // Handle different versions of marked library
            if (typeof marked.parse === 'function') {
                // marked v4+ API
                html = marked.parse(markdown);
            } else if (typeof marked === 'function') {
                // marked v3 and earlier API
                html = marked(markdown);
            } else {
                throw new Error('marked library API not recognized');
            }
        } catch (error) {
            console.error('Markdown rendering error:', error);
            // Fallback to basic HTML conversion for simple markdown
            html = this.basicMarkdownToHtml(markdown);
        }

        this.showCellOutput(cell, html, 'markdown', true);
    }

    basicMarkdownToHtml(markdown) {
        // Simple fallback markdown conversion
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return html;
    }

    showMissingPackagesDialog(missingPackages, code, cell, index) {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'missing-packages-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Missing Packages Detected</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>The following packages are required but not installed:</p>
                    <ul class="missing-packages-list">
                        ${missingPackages.map(pkg => `
                            <li>
                                <strong>${pkg.variable}</strong> → 
                                <code>${pkg.package}</code>
                                <br>
                                <small>Install command: ${pkg.install_command}</small>
                            </li>
                        `).join('')}
                    </ul>
                    <p>Would you like to install these packages automatically?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancelInstall">Cancel</button>
                    <button class="btn-primary" id="installPackages">Install & Retry</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle modal actions
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#cancelInstall').addEventListener('click', closeModal);
        
        modal.querySelector('#installPackages').addEventListener('click', async () => {
            try {
                // Show loading state with progress
                const installButton = modal.querySelector('#installPackages');
                installButton.textContent = 'Installing...';
                installButton.disabled = true;
                
                // Add progress indicator
                const progressDiv = document.createElement('div');
                progressDiv.className = 'installation-progress';
                progressDiv.innerHTML = `
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">Installing packages, please wait...</div>
                `;
                modal.querySelector('.modal-body').appendChild(progressDiv);

                // Call install-and-retry endpoint with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
                
                const response = await fetch('http://localhost:5000/api/install-and-retry', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        packages: missingPackages,
                        code: code,
                        cell_id: cell.id
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();

                // Close modal
                closeModal();

                // Show results
                if (result.success) {
                    // Show successful output
                    let output = result.output ? result.output.trim() : '';
                    
                    // Add installation info
                    const installInfo = result.installation_results
                        .map(r => `✓ ${r.package}: ${r.message}`)
                        .join('\n');
                    
                    if (output) {
                        output = `${installInfo}\n\n${output}`;
                    } else {
                        output = installInfo;
                    }
                    
                    // Add execution time
                    if (result.execution_time) {
                        output += `\n\n[Executed in ${(result.execution_time * 1000).toFixed(1)}ms]`;
                    }
                    
                    this.showCellOutput(cell, output, 'success');
                } else {
                    // Show installation results and any remaining errors
                    let errorOutput = '';
                    
                    if (result.installation_results) {
                        const installInfo = result.installation_results
                            .map(r => `${r.success ? '✓' : '✗'} ${r.package}: ${r.message}`)
                            .join('\n');
                        errorOutput += `Installation Results:\n${installInfo}\n\n`;
                    }
                    
                    errorOutput += result.error || 'Installation failed';
                    this.showCellOutput(cell, errorOutput, 'error');
                }

            } catch (error) {
                closeModal();
                
                let errorMessage = 'Installation failed: ';
                
                if (error.name === 'AbortError') {
                    errorMessage += 'Installation timed out (3 minutes). The package might be too large or there may be network issues.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Cannot connect to backend server. Please ensure the Python server is running.';
                } else if (error.message.includes('HTTP 500')) {
                    errorMessage += 'Server error during installation. Check server logs for details.';  
                } else if (error.message.includes('HTTP 400')) {
                    errorMessage += 'Invalid installation request. Please try again.';
                } else {
                    errorMessage += error.message;
                }
                
                console.error('Installation error details:', error);
                this.showCellOutput(cell, errorMessage, 'error');
            }
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    showCellOutputWithPlots(cell, output, plots) {
        const cellElement = document.getElementById(cell.id);
        cellElement.classList.remove('loading');

        let outputElement = cellElement.querySelector('.cell-output');
        if (!outputElement) {
            outputElement = document.createElement('div');
            outputElement.className = 'cell-output';
            cellElement.appendChild(outputElement);
        }

        // Clear previous output
        outputElement.innerHTML = '';

        // Add text output if any
        if (output && output.trim()) {
            const textOutput = document.createElement('pre');
            textOutput.className = 'output-text success';
            textOutput.textContent = output;
            outputElement.appendChild(textOutput);
        }

        // Add plots
        plots.forEach((plotData, index) => {
            const plotContainer = document.createElement('div');
            plotContainer.className = 'plot-container';
            
            const plotImage = document.createElement('img');
            plotImage.src = plotData;
            plotImage.className = 'plot-image';
            plotImage.alt = `Plot ${index + 1}`;
            
            plotContainer.appendChild(plotImage);
            outputElement.appendChild(plotContainer);
        });

        // Show the output
        outputElement.style.display = 'block';
    }

    showCellOutput(cell, output, type = 'success', isHtml = false) {
        const cellElement = document.getElementById(cell.id);
        if (!cellElement) {
            console.error(`Cell element not found: ${cell.id}`);
            return;
        }
        
        let outputElement = document.getElementById(`${cell.id}-output`);

        if (!outputElement) {
            outputElement = document.createElement('div');
            outputElement.className = 'cell-output';
            outputElement.id = `${cell.id}-output`;
            
            // Insert the output element after the cell-input div
            const cellInput = cellElement.querySelector('.cell-input');
            if (cellInput) {
                cellInput.insertAdjacentElement('afterend', outputElement);
            } else {
                cellElement.appendChild(outputElement);
            }
        }

        outputElement.className = `cell-output ${type}`;
        
        if (isHtml) {
            outputElement.innerHTML = output;
        } else {
            // Ensure the output is properly formatted and visible
            if (output.trim()) {
                outputElement.innerHTML = `<pre style="margin: 0; font-family: inherit; color: inherit;">${output}</pre>`;
            } else {
                outputElement.textContent = output;
            }
        }

        // Make sure the output element is visible and properly styled
        outputElement.style.display = 'block';
        outputElement.style.padding = '12px 16px';
        outputElement.style.background = type === 'success' ? '#f0fff4' : '#fff5f5';
        outputElement.style.borderLeft = type === 'success' ? '3px solid #68d391' : '3px solid #feb2b2';
        outputElement.style.color = type === 'success' ? '#22543d' : '#e53e3e';
        outputElement.style.fontFamily = "'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace";
        outputElement.style.fontSize = '13px';
        outputElement.style.lineHeight = '1.4';
        outputElement.style.marginTop = '12px';
        outputElement.style.marginBottom = '12px';
        outputElement.style.borderRadius = '0 4px 4px 0';
        outputElement.style.whiteSpace = 'pre-wrap';
        outputElement.style.clear = 'both';
        outputElement.style.position = 'relative';
        outputElement.style.zIndex = '1';
        
        cell.output = output;
        
        console.log(`Output displayed for cell ${cell.id}:`, output);
    }

    runAllCells() {
        this.cells.forEach((cell, index) => {
            setTimeout(() => {
                this.runCell(index);
            }, index * 100); // Stagger execution
        });
    }

    clearAllOutputs() {
        this.cells.forEach(cell => {
            const outputElement = document.getElementById(`${cell.id}-output`);
            if (outputElement) {
                outputElement.remove();
            }
            cell.output = '';
        });
    }

    insertCellAbove() {
        if (this.selectedCellIndex >= 0) {
            this.addCell('code', '', this.selectedCellIndex);
        } else {
            this.addCell('code');
        }
    }

    insertCellBelow() {
        if (this.selectedCellIndex >= 0) {
            this.addCell('code', '', this.selectedCellIndex + 1);
        } else {
            this.addCell('code');
        }
    }

    deleteCell(index) {
        if (index < 0 || index >= this.cells.length) return;

        const cell = this.cells[index];
        const cellElement = document.getElementById(cell.id);
        
        // Remove from DOM
        cellElement.remove();
        
        // Remove from array
        this.cells.splice(index, 1);
        
        // Update cell numbers and indices
        this.updateCellNumbers();
        this.updateCellCount();
        
        // Adjust selection
        if (this.selectedCellIndex >= index) {
            this.selectedCellIndex = Math.max(0, this.selectedCellIndex - 1);
        }
        
        // Select a cell if any exist
        if (this.cells.length > 0) {
            this.selectCell(Math.min(this.selectedCellIndex, this.cells.length - 1));
        } else {
            this.showEmptyNotebook();
        }
    }

    deleteSelectedCell() {
        if (this.selectedCellIndex >= 0) {
            this.deleteCell(this.selectedCellIndex);
        }
    }

    moveCell(index, direction) {
        if (index < 0 || index >= this.cells.length) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.cells.length) return;

        // Swap cells in array
        [this.cells[index], this.cells[newIndex]] = [this.cells[newIndex], this.cells[index]];
        
        // Re-render cells
        this.rerenderAllCells();
        
        // Update selection
        this.selectCell(newIndex);
    }

    changeCellType(newType) {
        if (this.selectedCellIndex >= 0) {
            const cell = this.cells[this.selectedCellIndex];
            if (cell.type !== newType) {
                cell.type = newType;
                
                // Re-render the cell
                const cellElement = document.getElementById(cell.id);
                cellElement.remove();
                this.renderCell(cell, this.selectedCellIndex);
                this.selectCell(this.selectedCellIndex);
            }
        }
    }

    runSelectedCell() {
        if (this.selectedCellIndex >= 0) {
            this.runCell(this.selectedCellIndex);
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.target.closest('.CodeMirror')) return; // Don't interfere with CodeMirror

        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            this.runSelectedCell();
        } else if (e.key === 'a' && e.ctrlKey) {
            e.preventDefault();
            this.insertCellAbove();
        } else if (e.key === 'b' && e.ctrlKey) {
            e.preventDefault();
            this.insertCellBelow();
        } else if (e.key === 'Delete' && e.ctrlKey) {
            e.preventDefault();
            this.deleteSelectedCell();
        } else if (e.key === 'ArrowUp' && e.ctrlKey) {
            e.preventDefault();
            this.selectCell(this.selectedCellIndex - 1);
        } else if (e.key === 'ArrowDown' && e.ctrlKey) {
            e.preventDefault();
            this.selectCell(this.selectedCellIndex + 1);
        }
    }

    updateCellNumbers() {
        this.cells.forEach((cell, index) => {
            const cellElement = document.getElementById(cell.id);
            if (cellElement) {
                cellElement.dataset.index = index;
                const cellNumber = cellElement.querySelector('.cell-number');
                if (cellNumber) {
                    cellNumber.textContent = cell.type === 'code' ? `[${index + 1}]:` : `Markdown ${index + 1}:`;
                }
                
                // Update action buttons
                const actions = cellElement.querySelector('.cell-actions');
                if (actions) {
                    actions.innerHTML = `
                        <button class="cell-action-btn" onclick="notebook.runCell(${index})" title="Run cell">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="cell-action-btn" onclick="notebook.moveCell(${index}, -1)" title="Move up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="cell-action-btn" onclick="notebook.moveCell(${index}, 1)" title="Move down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="cell-action-btn" onclick="notebook.deleteCell(${index})" title="Delete cell">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        });
    }

    updateCellCount() {
        const cellCountElement = document.getElementById('cellCount');
        if (cellCountElement) {
            cellCountElement.textContent = this.cells.length;
        }
    }

    rerenderAllCells() {
        // Clear container
        this.container.innerHTML = '';
        
        // Re-render all cells
        this.cells.forEach((cell, index) => {
            this.renderCell(cell, index);
        });
    }

    hideEmptyNotebook() {
        const emptyNotebook = this.container.querySelector('.empty-notebook');
        if (emptyNotebook) {
            emptyNotebook.style.display = 'none';
        }
    }

    showEmptyNotebook() {
        const emptyNotebook = this.container.querySelector('.empty-notebook');
        if (emptyNotebook) {
            emptyNotebook.style.display = 'flex';
        } else {
            this.container.innerHTML = `
                <div class="empty-notebook">
                    <i class="fas fa-book-open"></i>
                    <h3>Welcome to Jupyter Web</h3>
                    <p>Start by adding your first cell</p>
                    <button class="btn-primary" id="addFirstCell">
                        <i class="fas fa-plus"></i>
                        Add Code Cell
                    </button>
                </div>
            `;
            
            // Re-attach event listener
            document.getElementById('addFirstCell').addEventListener('click', () => {
                this.addCell('code');
                this.hideEmptyNotebook();
            });
        }
    }

    // Export notebook as JSON
    exportNotebook() {
        // Sync all cell contents from editors before export
        this.syncAllCellContents();
        
        const notebook = {
            cells: this.cells.map(cell => ({
                cell_type: cell.type,
                source: cell.content.split('\n'),
                outputs: cell.output ? [{ text: cell.output }] : []
            })),
            metadata: {
                kernelspec: {
                    display_name: "Python 3",
                    language: "python",
                    name: "python3"
                }
            },
            nbformat: 4,
            nbformat_minor: 4
        };

        return JSON.stringify(notebook, null, 2);
    }

    // Sync all cell contents from their editors
    syncAllCellContents() {
        this.cells.forEach(cell => {
            if (cell.editor && cell.editor.getValue) {
                cell.content = cell.editor.getValue();
            }
        });
    }

    // Save notebook
    saveNotebook() {
        // Delegate to the main app's save functionality
        if (window.app) {
            window.app.saveNotebook();
        } else {
            // Fallback to direct download
            const notebookData = this.exportNotebook();
            const blob = new Blob([notebookData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notebook.ipynb';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Update last saved time
            const lastSavedElement = document.getElementById('lastSaved');
            if (lastSavedElement) {
                lastSavedElement.textContent = new Date().toLocaleTimeString();
            }
        }
    }
}

// Initialize notebook manager
const notebook = new NotebookManager();
