// Main application functionality
class JupyterWebApp {
    constructor() {
        this.currentSection = 'notebook';
        this.kernelStatus = 'idle';
        this.fileLoaded = false; // Track if we loaded from a file
        this.originalFileType = null; // 'python' or 'notebook'
        this.originalFilename = null;
        this.originalFilePath = null; // Store the full path with directory
        this.initializeApp();
    }

    initializeApp() {
        this.setupNavigation();
        this.setupHeaderActions();
        this.setupTerminal();
        this.setupFileSystem();
        this.updateKernelStatus();
        this.startAutoSave();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.content-section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.dataset.section;
                
                // Update active nav button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show target section
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === `${targetSection}-section`) {
                        section.classList.add('active');
                        section.classList.add('fade-in');
                    }
                });
                
                this.currentSection = targetSection;
                this.onSectionChange(targetSection);
            });
        });
    }

    setupHeaderActions() {
        // Save notebook
        document.getElementById('saveNotebook').addEventListener('click', () => {
            this.saveNotebook();
        });

        // Export notebook
        document.getElementById('exportNotebook').addEventListener('click', () => {
            this.exportNotebook();
        });

        // Restart kernel
        document.getElementById('restartKernel').addEventListener('click', () => {
            this.restartKernel();
        });
    }

    setupTerminal() {
        const terminalInput = document.getElementById('terminalInput');
        const terminalContent = document.getElementById('terminalContent');
        const clearTerminal = document.getElementById('clearTerminal');

        terminalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = terminalInput.value.trim();
                if (command) {
                    this.executeTerminalCommand(command);
                    terminalInput.value = '';
                }
            }
        });

        clearTerminal.addEventListener('click', () => {
            terminalContent.innerHTML = `
                <div class="terminal-line">
                    <span class="prompt">$</span>
                    <span class="command">Terminal cleared</span>
                </div>
            `;
        });
    }

    setupFileSystem() {
        const uploadFile = document.getElementById('uploadFile');
        
        if (uploadFile) {
            uploadFile.addEventListener('click', () => {
                this.openFileUpload();
            });
        }

        // Load real file tree on startup
        this.loadFileTree();
    }

    onSectionChange(section) {
        switch (section) {
            case 'notebook':
                // Focus on notebook
                if (notebook.selectedCellIndex >= 0) {
                    const cell = notebook.cells[notebook.selectedCellIndex];
                    if (cell && cell.editor) {
                        setTimeout(() => cell.editor.focus(), 100);
                    }
                }
                break;
            case 'files':
                this.refreshFileTree();
                break;
            case 'terminal':
                setTimeout(() => {
                    document.getElementById('terminalInput').focus();
                }, 100);
                break;
        }
    }

    async saveNotebook() {
        if (!notebook) {
            console.log('No notebook to save');
            return;
        }
        
        try {
            // Determine what format to save in
            let filename = this.getCurrentNotebookName();
            let content;
            
            if (this.originalFileType === 'python' && this.originalFilePath) {
                // Save as Python file - extract code from cells
                filename = this.originalFilePath; // Use full path instead of just filename
                content = this.exportAsPython();
            } else {
                // Save as notebook JSON
                content = notebook.exportNotebook();
                if (!filename.endsWith('.ipynb')) {
                    filename += '.ipynb';
                }
            }
            
            console.log('Saving as:', this.originalFileType === 'python' ? 'Python file' : 'Notebook');
            console.log('Filename:', filename);
            console.log('Content length:', content.length);
            console.log('Content preview:', content.substring(0, 200));
            console.log('Number of cells:', notebook.cells.length);
            
            // Try to save to server first
            try {
                const response = await fetch('http://localhost:5000/api/files/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filename: filename,
                        content: content
                    })
                });
                
                const result = await response.json();
                console.log('Server save response:', result);
                
                if (result.success) {
                    this.showNotification(`Notebook saved as ${filename}`, 'success');
                    
                    // Clear autosave since we have a proper save now
                    localStorage.removeItem('jupyter-web-autosave');
                    
                    // Update notebook info
                    this.updateNotebookInfoAfterSave(filename);
                    // Refresh file tree to show the saved file
                    setTimeout(() => this.refreshFileTree(), 500);
                    return;
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.warn('Server save failed, falling back to local save:', error);
            }
            
            // Fallback to local storage and download
            localStorage.setItem('jupyter-web-notebook', notebookData);
            this.downloadFile(filename, notebookData, 'application/json');
            this.showNotification('Notebook saved locally and downloaded', 'success');
            
        } catch (error) {
            this.showNotification(`Error saving notebook: ${error.message}`, 'error');
        }
    }

    getCurrentNotebookName() {
        const nameElement = document.getElementById('notebookName');
        if (nameElement && nameElement.textContent !== 'Untitled.ipynb') {
            return nameElement.textContent;
        }
        
        // Generate a name based on timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        return `notebook-${timestamp}.ipynb`;
    }

    exportAsPython() {
        // Sync cell contents first
        if (notebook) {
            notebook.syncAllCellContents();
            
            // Extract only code cells and join them with newlines
            const codeCells = notebook.cells.filter(cell => cell.type === 'code');
            const pythonCode = codeCells.map(cell => cell.content).join('\n\n');
            return pythonCode;
        }
        return '';
    }

    exportNotebook() {
        if (notebook) {
            const exportData = notebook.exportNotebook();
            this.downloadFile('notebook.ipynb', exportData, 'application/json');
            this.showNotification('Notebook exported successfully!', 'success');
        }
    }

    restartKernel() {
        this.updateKernelStatus('restarting');
        this.showNotification('Restarting kernel...', 'info');
        
        // Simulate kernel restart
        setTimeout(() => {
            this.updateKernelStatus('idle');
            this.showNotification('Kernel restarted successfully!', 'success');
            
            // Clear all outputs
            if (notebook) {
                notebook.clearAllOutputs();
            }
        }, 2000);
    }

    updateKernelStatus(status = 'idle') {
        this.kernelStatus = status;
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = statusIndicator.nextElementSibling;
        
        statusIndicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'idle':
                statusText.textContent = 'Python 3 (idle)';
                break;
            case 'busy':
                statusText.textContent = 'Python 3 (busy)';
                break;
            case 'restarting':
                statusText.textContent = 'Python 3 (restarting)';
                break;
            case 'disconnected':
                statusText.textContent = 'Python 3 (disconnected)';
                break;
        }
    }

    executeTerminalCommand(command) {
        const terminalContent = document.getElementById('terminalContent');
        
        // Add command to terminal
        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.innerHTML = `
            <span class="prompt">$</span>
            <span class="command">${command}</span>
        `;
        terminalContent.appendChild(commandLine);
        
        // Simulate command execution
        setTimeout(() => {
            const outputLine = document.createElement('div');
            outputLine.className = 'terminal-line';
            outputLine.innerHTML = `<span class="command">${this.simulateCommandOutput(command)}</span>`;
            terminalContent.appendChild(outputLine);
            
            // Scroll to bottom
            terminalContent.scrollTop = terminalContent.scrollHeight;
        }, 500);
    }

    simulateCommandOutput(command) {
        const cmd = command.toLowerCase().trim();
        
        if (cmd === 'ls' || cmd === 'dir') {
            return 'notebooks/  python_scripts/  static/  index.html';
        } else if (cmd === 'pwd') {
            return '/workspace/jupyter-website';
        } else if (cmd.startsWith('cd ')) {
            return `Changed directory to ${cmd.substring(3)}`;
        } else if (cmd === 'python --version') {
            return 'Python 3.9.7';
        } else if (cmd === 'pip list') {
            return 'Package    Version\n---------- -------\nnumpy      1.21.0\npandas     1.3.0\nmatplotlib 3.4.2';
        } else if (cmd.startsWith('echo ')) {
            return cmd.substring(5);
        } else if (cmd === 'clear') {
            document.getElementById('terminalContent').innerHTML = '';
            return '';
        } else {
            return `Command '${command}' executed successfully`;
        }
    }

    async loadFileTree() {
        const fileTree = document.querySelector('.file-tree');
        if (!fileTree) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/files');
            const data = await response.json();
            
            if (data.success) {
                this.renderFileTree(data.files);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error loading file tree:', error);
            // Fallback to local file list
            this.renderLocalFiles();
        }
    }

    renderFileTree(files) {
        const fileTree = document.querySelector('.file-tree');
        fileTree.innerHTML = '';
        
        console.log('Rendering files:', files);
        
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = file.type === 'directory' ? 'folder' : 'file';
            item.dataset.path = file.path;
            item.dataset.type = file.type;
            
            const icon = file.type === 'directory' ? 'fa-folder' : this.getFileIcon(file.name);
            
            item.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${file.name}</span>
            `;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('File item clicked:', file.name, file.path);
                this.handleFileSystemClick(item);
            });
            
            fileTree.appendChild(item);
        });
    }

    renderLocalFiles() {
        const fileTree = document.querySelector('.file-tree');
        const localFiles = [
            { name: 'notebooks/', type: 'directory', path: './notebooks/' },
            { name: 'python_scripts/', type: 'directory', path: './python_scripts/' },
            { name: 'example.py', type: 'file', path: './example.py' }
        ];
        
        fileTree.innerHTML = '';
        localFiles.forEach(file => {
            const item = document.createElement('div');
            item.className = file.type === 'directory' ? 'folder' : 'file';
            item.dataset.path = file.path;
            item.dataset.type = file.type;
            
            const icon = file.type === 'directory' ? 'fa-folder' : this.getFileIcon(file.name);
            
            item.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${file.name}</span>
            `;
            
            item.addEventListener('click', () => {
                this.handleFileSystemClick(item);
            });
            
            fileTree.appendChild(item);
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'py': return 'fa-file-code';
            case 'ipynb': return 'fa-book';
            case 'txt': return 'fa-file-alt';
            case 'md': return 'fa-file-alt';
            case 'json': return 'fa-file-code';
            case 'html': return 'fa-file-code';
            case 'css': return 'fa-file-code';
            case 'js': return 'fa-file-code';
            default: return 'fa-file';
        }
    }

    async handleFileSystemClick(item) {
        const isFolder = item.dataset.type === 'directory';
        const path = item.dataset.path;
        const name = item.querySelector('span').textContent;
        
        console.log('File clicked:', { isFolder, path, name, type: item.dataset.type });
        
        if (isFolder) {
            // Toggle folder expansion
            this.showNotification(`Opening folder: ${name}`, 'info');
            await this.expandFolder(item, path, name);
        } else {
            // Load file content
            this.showNotification(`Loading file: ${name}...`, 'info');
            try {
                await this.loadFileContent(path, name);
            } catch (error) {
                console.error('File loading error:', error);
                this.showNotification(`Error loading file: ${error.message}`, 'error');
            }
        }
    }

    async loadFileContent(path, filename) {
        try {
            let content;
            
            console.log('Loading file content:', { path, filename });
            
            // Try to load from server first
            try {
                const url = `http://localhost:5000/api/files/content?path=${encodeURIComponent(path)}`;
                console.log('Fetching from URL:', url);
                
                const response = await fetch(url);
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    content = await response.text();
                    console.log('Content loaded from server:', content.substring(0, 100) + '...');
                } else {
                    const errorText = await response.text();
                    console.error('Server error:', errorText);
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                console.warn('Server loading failed, using fallback:', error.message);
                // Fallback to sample content
                content = this.getSampleFileContent(filename);
                console.log('Using fallback content:', content.substring(0, 100) + '...');
            }
            
            if (filename.endsWith('.ipynb')) {
                // Load as Jupyter notebook
                const notebookData = JSON.parse(content);
                this.loadNotebook(notebookData);
                this.fileLoaded = true; // Mark that we loaded from a file
                
                // Store the original file type for proper saving
                this.originalFileType = 'notebook';
                this.originalFilename = filename;
                this.originalFilePath = path; // Store the full path
                
                // Update notebook info
                this.updateNotebookInfo(filename, notebookData.cells.length);
                
                this.showNotification(`Loaded notebook: ${filename}`, 'success');
                
                // Clear autosave since we loaded from a real file
                localStorage.removeItem('jupyter-web-autosave');
                
                // Switch to notebook tab
                document.querySelector('[data-section="notebook"]').click();
            } else {
                // Load as code cell - clear existing notebook first
                if (notebook) {
                    // Clear existing cells
                    notebook.cells = [];
                    notebook.container.innerHTML = '';
                    
                    // Add the file content as a single code cell
                    const cell = notebook.addCell('code', content);
                    notebook.hideEmptyNotebook();
                    
                    // Store the original file type for proper saving
                    this.originalFileType = 'python';
                    this.originalFilename = filename;
                    this.originalFilePath = path; // Store the full path
                    this.fileLoaded = true; // Mark that we loaded from a file
                    
                    // Update notebook info
                    this.updateNotebookInfo(filename, 1);
                    
                    this.showNotification(`Loaded ${filename} as a new notebook`, 'success');
                    
                    // Clear autosave since we loaded from a real file
                    localStorage.removeItem('jupyter-web-autosave');
                    
                    // Switch to notebook tab
                    document.querySelector('[data-section="notebook"]').click();
                }
            }
        } catch (error) {
            throw new Error(`Failed to load file: ${error.message}`);
        }
    }

    async expandFolder(folderItem, folderPath, folderName) {
        try {
            // Check if folder is already expanded
            const isExpanded = folderItem.classList.contains('expanded');
            
            if (isExpanded) {
                // Collapse folder
                this.collapseFolder(folderItem);
                return;
            }
            
            // Load folder contents
            console.log('Loading folder contents:', folderPath);
            
            try {
                const response = await fetch(`http://localhost:5000/api/files/folder?path=${encodeURIComponent(folderPath)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.renderFolderContents(folderItem, data.files);
                        folderItem.classList.add('expanded');
                        
                        // Change folder icon to open
                        const icon = folderItem.querySelector('i');
                        icon.className = 'fas fa-folder-open';
                        
                        this.showNotification(`Opened folder: ${folderName}`, 'success');
                    } else {
                        throw new Error(data.error);
                    }
                } else {
                    throw new Error('Failed to load folder contents');
                }
            } catch (error) {
                console.warn('Server folder loading failed, using static contents:', error.message);
                // Fallback to static folder contents
                this.renderStaticFolderContents(folderItem, folderName);
                folderItem.classList.add('expanded');
                
                // Change folder icon to open
                const icon = folderItem.querySelector('i');
                icon.className = 'fas fa-folder-open';
            }
        } catch (error) {
            this.showNotification(`Error opening folder: ${error.message}`, 'error');
        }
    }

    collapseFolder(folderItem) {
        // Remove expanded class
        folderItem.classList.remove('expanded');
        
        // Change icon back to closed folder
        const icon = folderItem.querySelector('i');
        icon.className = 'fas fa-folder';
        
        // Remove folder contents
        const folderContents = folderItem.querySelector('.folder-contents');
        if (folderContents) {
            folderContents.remove();
        }
    }

    renderFolderContents(folderItem, files) {
        // Remove existing contents if any
        const existingContents = folderItem.querySelector('.folder-contents');
        if (existingContents) {
            existingContents.remove();
        }
        
        // Create container for folder contents
        const contentsContainer = document.createElement('div');
        contentsContainer.className = 'folder-contents';
        
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = file.type === 'directory' ? 'folder subfolder' : 'file subfile';
            item.dataset.path = file.path;
            item.dataset.type = file.type;
            
            const icon = file.type === 'directory' ? 'fa-folder' : this.getFileIcon(file.name);
            
            item.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${file.name}</span>
            `;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Subfolder/file item clicked:', file.name, file.path);
                this.handleFileSystemClick(item);
            });
            
            contentsContainer.appendChild(item);
        });
        
        folderItem.appendChild(contentsContainer);
    }

    renderStaticFolderContents(folderItem, folderName) {
        const staticContents = this.getStaticFolderContents(folderName);
        this.renderFolderContents(folderItem, staticContents);
    }

    getStaticFolderContents(folderName) {
        if (folderName === 'notebooks/') {
            return [
                { name: 'sample-notebook.ipynb', type: 'file', path: 'notebooks/sample-notebook.ipynb' }
            ];
        } else if (folderName === 'python_scripts/') {
            return [
                { name: 'data_utils.py', type: 'file', path: 'python_scripts/data_utils.py' }
            ];
        } else if (folderName === 'static/') {
            return [
                { name: 'css/', type: 'directory', path: 'static/css/' },
                { name: 'js/', type: 'directory', path: 'static/js/' }
            ];
        }
        return [];
    }

    getSampleFileContent(filename) {
        if (filename === 'example.py') {
            return `# Example Python Script
print("Hello, World!")

# Import common libraries
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Sample data analysis
data = [1, 2, 3, 4, 5]
print(f"Mean: {np.mean(data)}")
print(f"Sum: {sum(data)}")`;
        }
        return `# Sample content for ${filename}`;
    }

    refreshFileTree() {
        this.loadFileTree();
    }

    openFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ipynb,.py,.txt,.md';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                this.handleFileUpload(file);
            });
        };
        
        input.click();
    }

    handleFileUpload(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                if (file.name.endsWith('.ipynb')) {
                    // Load Jupyter notebook
                    const notebookData = JSON.parse(e.target.result);
                    this.loadNotebook(notebookData);
                } else {
                    // Load as text file
                    this.loadTextFile(file.name, e.target.result);
                }
                
                this.showNotification(`File '${file.name}' uploaded successfully!`, 'success');
            } catch (error) {
                this.showNotification(`Error loading file '${file.name}': ${error.message}`, 'error');
            }
        };
        
        reader.readAsText(file);
    }

    updateNotebookInfo(filename = null, cellCount = null) {
        // Update notebook name
        const nameElement = document.getElementById('notebookName');
        if (nameElement && filename) {
            nameElement.textContent = filename;
        }
        
        // Update cell count
        const cellsElement = document.getElementById('cellCount');
        if (cellsElement) {
            const count = cellCount !== null ? cellCount : (notebook ? notebook.cells.length : 0);
            cellsElement.textContent = count;
        }
        
        // Update last saved time
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            lastSavedElement.textContent = 'Just loaded';
        }
    }

    updateNotebookInfoAfterSave(filename = null) {
        // Update notebook name
        const nameElement = document.getElementById('notebookName');
        if (nameElement && filename) {
            nameElement.textContent = filename;
        }
        
        // Update cell count
        const cellsElement = document.getElementById('cellCount');
        if (cellsElement && notebook) {
            cellsElement.textContent = notebook.cells.length;
        }
        
        // Update last saved time
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            lastSavedElement.textContent = new Date().toLocaleTimeString();
        }
    }

    loadNotebook(notebookData) {
        if (!notebook || !notebookData.cells) return;
        
        // Clear existing cells
        notebook.cells = [];
        notebook.container.innerHTML = '';
        
        // Load cells from notebook data
        notebookData.cells.forEach((cellData, index) => {
            const content = Array.isArray(cellData.source) ? 
                cellData.source.join('') : cellData.source;
            
            const cell = notebook.addCell(cellData.cell_type, content);
            
            // Load outputs if any
            if (cellData.outputs && cellData.outputs.length > 0) {
                const output = cellData.outputs.map(out => out.text || out.data?.['text/plain'] || '').join('\n');
                if (output) {
                    notebook.showCellOutput(cell, output);
                }
            }
        });
        
        notebook.hideEmptyNotebook();
        
        // Update notebook name
        const notebookNameElement = document.getElementById('notebookName');
        if (notebookNameElement) {
            notebookNameElement.textContent = 'Uploaded Notebook.ipynb';
        }
    }

    loadTextFile(filename, content) {
        if (!notebook) return;
        
        // Create a new code cell with the file content
        const cell = notebook.addCell('code', content);
        notebook.hideEmptyNotebook();
        
        this.showNotification(`Loaded ${filename} as a new cell`, 'info');
    }

    downloadFile(filename, content, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#17a2b8';
        }
    }

    startAutoSave() {
        // Auto-save every 5 minutes
        setInterval(() => {
            if (notebook && notebook.cells.length > 0) {
                const notebookData = notebook.exportNotebook();
                localStorage.setItem('jupyter-web-autosave', notebookData);
                
                // Update last saved time
                const lastSavedElement = document.getElementById('lastSaved');
                if (lastSavedElement) {
                    lastSavedElement.textContent = new Date().toLocaleTimeString();
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
}

// Add notification animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        margin-left: auto;
        opacity: 0.8;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JupyterWebApp();
    
    // Try to restore autosaved notebook only if no file is already loaded
    setTimeout(() => {
        // Check if we already loaded a file from URL or file browser
        if (app.fileLoaded || (notebook && notebook.cells && notebook.cells.length > 1)) {
            console.log('File already loaded, skipping autosave restore');
            return;
        }

        const autosaved = localStorage.getItem('jupyter-web-autosave');
        if (autosaved) {
            try {
                const notebookData = JSON.parse(autosaved);
                if (notebookData.cells && notebookData.cells.length > 0) {
                    app.loadNotebook(notebookData);
                    app.showNotification('Restored autosaved notebook', 'info');
                    console.log('Restored autosave with', notebookData.cells.length, 'cells');
                }
            } catch (error) {
                console.warn('Failed to restore autosaved notebook:', error);
            }
        }
    }, 2000); // Increased delay to let file loading complete first
});
