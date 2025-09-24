# Jupyter Web Interface

A modern web-based Jupyter notebook interface built with HTML, CSS, and JavaScript. This application provides a clean, user-friendly environment for running Python code and creating interactive notebooks.

## 🚀 Features

### Core Functionality
- **Interactive Notebook Interface**: Create, edit, and run code cells
- **Markdown Support**: Rich text formatting with live preview
- **Code Execution**: Python code execution simulation
- **Cell Management**: Add, delete, move, and organize cells
- **Multiple Cell Types**: Code, Markdown, and Raw cells
- **Syntax Highlighting**: CodeMirror integration for syntax highlighting

### User Interface
- **Modern Design**: Clean, responsive interface inspired by Jupyter Lab
- **Navigation Tabs**: Switch between Notebook, Files, and Terminal views
- **Sidebar Controls**: Quick access to kernel status and notebook info
- **Toolbar**: Essential editing tools and shortcuts
- **Responsive Layout**: Works on desktop and mobile devices

### File Operations
- **Save/Export**: Download notebooks in JSON format
- **Import**: Load existing Jupyter notebook files
- **Auto-save**: Automatic saving every 5 minutes
- **File Browser**: Navigate project directories

### Additional Features
- **Terminal Interface**: Simulated command-line interface
- **Keyboard Shortcuts**: Efficient navigation and editing
- **Notifications**: User feedback for actions and status
- **Kernel Management**: Restart and monitor kernel status

## 📁 Project Structure

```
Jupyter-Website/
├── index.html              # Main application file
├── static/
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── app.js          # Main application logic
│       └── notebook.js     # Notebook management
├── notebooks/
│   └── sample_notebook.ipynb  # Example notebook
├── python_scripts/
│   ├── data_analysis.py    # Data analysis example
│   ├── ml_example.py       # Machine learning example
│   └── web_api_example.py  # Web API examples
└── README.md               # This file
```

## 🛠️ Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.7+ (for real code execution)
- Web server (for optimal experience)

### 🚀 Quick Start (Real Python Execution)

**Option 1: Automatic Setup (Recommended)**
1. **Double-click** `start_server.bat`
2. **Choose option 1** for full setup with real Python execution
3. **Wait** for both servers to start automatically
4. **Start coding** with real Python execution!

**Option 2: Manual Setup**
1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend server** (Terminal 1):
   ```bash
   python backend_server.py
   ```

3. **Start the frontend server** (Terminal 2):
   ```bash
   python -m http.server 8000
   ```

4. **Open** `http://localhost:8000` in your browser

### 🎯 Simple Start (Simulated Execution)

For basic testing without real Python execution:

1. **Double-click** `index.html` OR
2. **Use the startup script:** Double-click `start_server.bat` and choose option 2

### 🔧 Backend API Server

The backend server (`backend_server.py`) provides:
- **Real Python code execution** via REST API
- **Variable persistence** across cells
- **Error handling** and traceback display
- **Package installation** capabilities
- **Execution timing** information

**API Endpoints:**
- `POST /api/execute` - Execute Python code
- `POST /api/reset` - Reset Python namespace (restart kernel)
- `GET /api/variables` - View current variables
- `GET /api/status` - Server health check
- `POST /api/install` - Install Python packages

## 📚 Usage Guide

### Creating Cells
- Click **"Add Code Cell"** or **"Add Markdown Cell"** in the sidebar
- Use the **"+"** button in the toolbar
- Press **Alt+Enter** to run current cell and create a new one below

### Running Code
- **Shift+Enter**: Run cell and select next cell
- **Ctrl+Enter**: Run cell and stay on current cell
- **Alt+Enter**: Run cell and insert new cell below
- Click the **▶️ Run** button in the toolbar

### Cell Operations
- **Select cells** by clicking on them
- **Delete cells** using the 🗑️ button or Ctrl+Delete
- **Move cells** using the arrow buttons
- **Change cell type** using the dropdown in toolbar

### Keyboard Shortcuts
- **Esc**: Enter command mode
- **Enter**: Enter edit mode
- **A**: Insert cell above (command mode)
- **B**: Insert cell below (command mode)
- **DD**: Delete selected cell (command mode)
- **M**: Change to Markdown cell (command mode)
- **Y**: Change to Code cell (command mode)

### File Operations
- **Save**: Ctrl+S or click Save button
- **Export**: Download notebook as .ipynb file
- **Import**: Upload existing notebook files
- **Auto-save**: Enabled by default every 5 minutes

## 🎨 Customization

### Themes and Styling
The interface uses CSS custom properties for easy theming. Key color variables:

```css
:root {
  --primary-color: #2196F3;
  --secondary-color: #667eea;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --error-color: #dc3545;
}
```

### Adding New Features
The modular JavaScript architecture makes it easy to extend:

- **Notebook functionality**: Extend `NotebookManager` class
- **UI components**: Add methods to `JupyterWebApp` class
- **Cell types**: Implement new cell renderers

## 🔧 Configuration

### CodeMirror Settings
Customize the code editor by modifying the CodeMirror configuration in `notebook.js`:

```javascript
cell.editor = CodeMirror.fromTextArea(textarea, {
    mode: 'python',
    theme: 'default',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 4,
    // Add more options here
});
```

### Auto-save Interval
Change the auto-save frequency in `app.js`:

```javascript
// Change 5 * 60 * 1000 to desired milliseconds
setInterval(() => {
    // Auto-save logic
}, 5 * 60 * 1000); // Currently 5 minutes
```

## 🌐 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 60+            | Full support |
| Firefox | 55+            | Full support |
| Safari  | 12+            | Full support |
| Edge    | 79+            | Full support |

## 📝 Sample Code Examples

### Basic Python Operations
```python
# Variables and calculations
name = "Jupyter Web"
version = 1.0
print(f"Welcome to {name} v{version}")

# Lists and loops
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
print("Squares:", squares)
```

### Data Analysis
```python
# Simulated data analysis
data = [10, 20, 30, 40, 50]
mean = sum(data) / len(data)
print(f"Mean: {mean}")
print(f"Min: {min(data)}, Max: {max(data)}")
```

### Markdown Examples
```markdown
# Headers
## Sub-headers
**Bold text** and *italic text*
- Bullet points
- More items
1. Numbered lists
2. Sequential items

`Inline code` and code blocks:
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Real Python kernel integration
- [ ] Plot visualization support
- [ ] Multiple language support
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] Dark mode theme
- [ ] Advanced cell outputs
- [ ] Git integration
- [ ] Variable inspector
- [ ] Debugger interface

### Backend Integration
To connect with a real Python kernel:

1. Set up a Python server (Flask/FastAPI)
2. Implement WebSocket communication
3. Add Jupyter kernel management
4. Enable real code execution

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test in multiple browsers
- Update documentation

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

### Common Issues
- **Cells not responding**: Refresh the page and check console for errors
- **Styles not loading**: Ensure all CSS files are accessible
- **JavaScript errors**: Check browser console for detailed error messages

### Getting Help
- Check the browser developer console for errors
- Ensure all files are served from the same domain
- Verify that JavaScript is enabled in your browser

---

**Made with ❤️ for the coding community**

Happy coding with Jupyter Web! 🎉
