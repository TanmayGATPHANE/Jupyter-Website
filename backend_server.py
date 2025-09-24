"""
Flask Backend Server for Jupyter Web Interface
Provides real Python code execution via REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import io
import traceback
import contextlib
import threading
import time
import subprocess
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global namespace for code execution with common imports
# Common package mappings: variable name -> pip package name
PACKAGE_MAPPINGS = {
    'np': 'numpy',
    'numpy': 'numpy',
    'pd': 'pandas',
    'pandas': 'pandas',
    'plt': 'matplotlib',
    'matplotlib': 'matplotlib',
    'sns': 'seaborn',
    'seaborn': 'seaborn',
    'scipy': 'scipy',
    'sklearn': 'scikit-learn',
    'cv2': 'opencv-python',
    'PIL': 'Pillow',
    'requests': 'requests',
    'bs4': 'beautifulsoup4',
    'tf': 'tensorflow',
    'tensorflow': 'tensorflow',
    'torch': 'torch',
    'plotly': 'plotly',
    'dash': 'dash',
    'streamlit': 'streamlit',
    'flask': 'flask',
    'django': 'django',
    'fastapi': 'fastapi',
    'sqlalchemy': 'SQLAlchemy',
    'psycopg2': 'psycopg2-binary',
    'pymongo': 'pymongo',
    'redis': 'redis',
    'celery': 'celery'
}

def detect_missing_package(error_message):
    """Detect missing package from error message and suggest installation"""
    missing_packages = []
    
    # Extract variable name from NameError
    if "NameError: name" in error_message and "is not defined" in error_message:
        import re
        match = re.search(r"name '(\w+)' is not defined", error_message)
        if match:
            var_name = match.group(1)
            if var_name in PACKAGE_MAPPINGS:
                missing_packages.append({
                    'variable': var_name,
                    'package': PACKAGE_MAPPINGS[var_name],
                    'install_command': f'pip install {PACKAGE_MAPPINGS[var_name]}'
                })
    
    # Extract module name from ImportError/ModuleNotFoundError
    elif "No module named" in error_message:
        import re
        match = re.search(r"No module named '(\w+)'", error_message)
        if match:
            module_name = match.group(1)
            package_name = PACKAGE_MAPPINGS.get(module_name, module_name)
            missing_packages.append({
                'variable': module_name,
                'package': package_name,
                'install_command': f'pip install {package_name}'
            })
    
    return missing_packages

def initialize_namespace():
    """Initialize execution namespace with common scientific computing libraries"""
    namespace = {
        '__builtins__': __builtins__,
        '__name__': '__main__',
        '__doc__': None
    }
    
    # Try to import common libraries
    try:
        import numpy as np
        namespace['np'] = np
        namespace['numpy'] = np
    except ImportError:
        pass
    
    try:
        import pandas as pd
        namespace['pd'] = pd
        namespace['pandas'] = pd
    except ImportError:
        pass
    
    try:
        import matplotlib
        # Set non-interactive backend before importing pyplot
        matplotlib.use('Agg')  # Use Anti-Grain Geometry backend (no GUI)
        import matplotlib.pyplot as plt
        
        # Suppress matplotlib warnings for web environment
        import warnings
        warnings.filterwarnings('ignore', message='FigureCanvasAgg is non-interactive')
        warnings.filterwarnings('ignore', message='.*cannot be shown.*')
        warnings.filterwarnings('ignore', category=UserWarning, module='matplotlib')
        
        # Override plt.show() to be a no-op since we capture plots automatically
        def show_override():
            """No-op replacement for plt.show() in web environment"""
            pass
        
        plt.show = show_override
        
        namespace['plt'] = plt
        namespace['matplotlib'] = matplotlib
        print("✓ Successfully imported matplotlib with Agg backend")
    except ImportError as e:
        print(f"✗ Failed to import matplotlib: {e}")
        pass
    
    try:
        import seaborn as sns
        namespace['sns'] = sns
        namespace['seaborn'] = sns
    except ImportError:
        pass
    
    try:
        import scipy
        namespace['scipy'] = scipy
    except ImportError:
        pass
    
    print(f"📦 Initialized namespace with {len(namespace)} items:")
    for key in sorted(namespace.keys()):
        if not key.startswith('__'):
            print(f"   - {key}")
    
    return namespace

execution_namespace = initialize_namespace()

class CodeExecutionResult:
    def __init__(self, success=True, output="", error="", execution_time=0, missing_packages=None, plots=None):
        self.success = success
        self.output = output
        self.error = error
        self.execution_time = execution_time
        self.missing_packages = missing_packages or []
        self.plots = plots or []
        self.timestamp = datetime.now().isoformat()

def capture_matplotlib_plots():
    """Capture any matplotlib plots and return as base64 images"""
    try:
        import matplotlib.pyplot as plt
        import base64
        from io import BytesIO
        
        # Get all figure numbers
        figs = plt.get_fignums()
        plots = []
        
        for fig_num in figs:
            fig = plt.figure(fig_num)
            
            # Save plot to BytesIO
            img_buffer = BytesIO()
            fig.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100)
            img_buffer.seek(0)
            
            # Convert to base64
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            plots.append(f'data:image/png;base64,{img_base64}')
            
            # Close the figure to free memory
            plt.close(fig)
            
        return plots
    except:
        return []

def execute_python_code(code, timeout=30):
    """
    Execute Python code safely with output capture
    """
    # Capture stdout and stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    start_time = time.time()
    
    try:
        # Redirect output streams
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture
        
        # Execute the code in the global namespace
        exec(code, execution_namespace)
        
        execution_time = time.time() - start_time
        
        # Debug: Print current namespace variables
        user_vars = {k: str(type(v).__name__) for k, v in execution_namespace.items() 
                    if not k.startswith('__') and not callable(v)}
        print(f"🔍 Current namespace variables: {user_vars}")
        
        # Capture any matplotlib plots
        plots = capture_matplotlib_plots()
        
        # Get captured output
        output = stdout_capture.getvalue()
        error_output = stderr_capture.getvalue()
        
        if error_output:
            return CodeExecutionResult(
                success=False,
                output=output,
                error=error_output,
                execution_time=execution_time,
                plots=plots
            )
        
        return CodeExecutionResult(
            success=True,
            output=output,
            error="",
            execution_time=execution_time,
            plots=plots
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = f"{type(e).__name__}: {str(e)}"
        traceback_msg = traceback.format_exc()
        
        # Detect missing packages
        missing_packages = detect_missing_package(traceback_msg)
        
        # Add helpful hint for undefined variables
        if "NameError: name" in error_msg and "is not defined" in error_msg:
            import re
            match = re.search(r"name '(\w+)' is not defined", error_msg)
            if match:
                var_name = match.group(1)
                error_msg += f"\n\nHint: Variable '{var_name}' is not defined. Make sure to run the cell that creates this variable first."
        
        return CodeExecutionResult(
            success=False,
            output=stdout_capture.getvalue(),
            error=f"{error_msg}\n\n{traceback_msg}",
            execution_time=execution_time,
            missing_packages=missing_packages,
            plots=[]
        )
    
    finally:
        # Restore original streams
        sys.stdout = old_stdout
        sys.stderr = old_stderr

@app.route('/api/execute', methods=['POST'])
def execute_code():
    """
    Execute Python code endpoint
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                'success': False,
                'error': 'No code provided'
            }), 400
        
        code = data['code']
        cell_id = data.get('cell_id', 'unknown')
        
        # Execute the code
        result = execute_python_code(code)
        
        response = {
            'success': result.success,
            'output': result.output,
            'error': result.error,
            'execution_time': result.execution_time,
            'timestamp': result.timestamp,
            'cell_id': cell_id,
            'missing_packages': result.missing_packages,
            'plots': result.plots
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/reset', methods=['POST'])
def reset_namespace():
    """
    Reset the execution namespace (like restarting kernel)
    """
    global execution_namespace
    
    # Reset to fresh namespace with common imports
    execution_namespace = initialize_namespace()
    
    return jsonify({
        'success': True,
        'message': 'Execution namespace reset successfully'
    })

@app.route('/api/variables', methods=['GET'])
def get_variables():
    """
    Get current variables in the namespace
    """
    # Filter out built-in variables
    user_vars = {
        k: str(v) for k, v in execution_namespace.items() 
        if not k.startswith('__') and k != '__builtins__'
    }
    
    return jsonify({
        'success': True,
        'variables': user_vars
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """
    Get server status
    """
    return jsonify({
        'success': True,
        'status': 'running',
        'python_version': sys.version,
        'available_modules': list(sys.modules.keys())[:20]  # First 20 modules
    })

@app.route('/api/install', methods=['POST'])
def install_package():
    """
    Install Python package using pip
    """
    try:
        data = request.get_json()
        package = data.get('package', '')
        
        if not package:
            return jsonify({
                'success': False,
                'error': 'No package name provided'
            }), 400
        
        # Use subprocess to install package
        result = subprocess.run([
            sys.executable, '-m', 'pip', 'install', package
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': f'Package "{package}" installed successfully',
                'output': result.stdout
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Failed to install package "{package}"',
                'output': result.stderr
            }), 400
            
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Package installation timed out'
        }), 408
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Installation error: {str(e)}'
        }), 500

@app.route('/api/install-and-retry', methods=['POST'])
def install_and_retry():
    """Install missing packages and retry code execution"""
    try:
        data = request.get_json()
        packages = data.get('packages', [])
        code = data.get('code', '')
        cell_id = data.get('cell_id', 'unknown')
        
        if not packages or not code:
            return jsonify({
                'success': False,
                'error': 'Missing packages or code'
            }), 400
        
        installation_results = []
        
        # Install each package
        for package_info in packages:
            package_name = package_info.get('package')
            if not package_name:
                continue
                
            print(f"🔄 Installing package: {package_name}")
            print(f"   Command: pip install {package_name}")
            
            try:
                result = subprocess.run([
                    sys.executable, '-m', 'pip', 'install', package_name, '--verbose'
                ], capture_output=True, text=True, timeout=300)
                
                print(f"   Return code: {result.returncode}")
                if result.stdout:
                    print(f"   STDOUT: {result.stdout[:500]}...")
                if result.stderr:
                    print(f"   STDERR: {result.stderr[:500]}...")
                    
            except subprocess.TimeoutExpired:
                print(f"   ❌ Installation timeout for {package_name}")
                installation_results.append({
                    'package': package_name,
                    'success': False,
                    'message': f'Installation timeout for {package_name}'
                })
                continue
            except Exception as e:
                print(f"   ❌ Installation error for {package_name}: {e}")
                installation_results.append({
                    'package': package_name,
                    'success': False,
                    'message': f'Installation error: {str(e)}'
                })
                continue
            
            if result.returncode == 0:
                installation_results.append({
                    'package': package_name,
                    'success': True,
                    'message': f'Successfully installed {package_name}'
                })
                
                # Try to import the newly installed package
                try:
                    if package_name == 'matplotlib':
                        import matplotlib.pyplot as plt
                        execution_namespace['plt'] = plt
                        execution_namespace['matplotlib'] = plt.matplotlib
                    elif package_name == 'numpy':
                        import numpy as np
                        execution_namespace['np'] = np
                        execution_namespace['numpy'] = np
                    elif package_name == 'pandas':
                        import pandas as pd
                        execution_namespace['pd'] = pd
                        execution_namespace['pandas'] = pd
                    elif package_name == 'seaborn':
                        import seaborn as sns
                        execution_namespace['sns'] = sns
                        execution_namespace['seaborn'] = sns
                except ImportError as e:
                    print(f"Warning: Could not import {package_name}: {e}")
            else:
                installation_results.append({
                    'package': package_name,
                    'success': False,
                    'message': f'Failed to install {package_name}: {result.stderr}'
                })
        
        # Retry code execution
        execution_result = execute_python_code(code)
        
        return jsonify({
            'success': execution_result.success,
            'output': execution_result.output,
            'error': execution_result.error,
            'execution_time': execution_result.execution_time,
            'timestamp': execution_result.timestamp,
            'cell_id': cell_id,
            'missing_packages': execution_result.missing_packages,
            'plots': execution_result.plots,
            'installation_results': installation_results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Installation and retry error: {str(e)}'
        }), 500

@app.route('/api/pip-check', methods=['GET'])
def pip_check():
    """Check if pip is working and accessible"""
    try:
        # Test pip version
        result = subprocess.run([
            sys.executable, '-m', 'pip', '--version'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'pip_version': result.stdout.strip(),
                'python_executable': sys.executable
            })
        else:
            return jsonify({
                'success': False,
                'error': 'pip not accessible',
                'stderr': result.stderr
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'pip check failed: {str(e)}'
        })

@app.route('/api/files', methods=['GET'])
def list_files():
    """List files in the current directory"""
    import os
    try:
        files = []
        current_dir = os.getcwd()
        
        for item in os.listdir(current_dir):
            item_path = os.path.join(current_dir, item)
            if os.path.isfile(item_path):
                # Only include relevant file types
                if item.endswith(('.py', '.ipynb', '.txt', '.md', '.json', '.html', '.css', '.js')):
                    files.append({
                        'name': item,
                        'type': 'file',
                        'path': item,
                        'size': os.path.getsize(item_path)
                    })
            elif os.path.isdir(item_path) and not item.startswith('.') and item not in ['__pycache__', 'venv']:
                # Include directories (except hidden ones and common ignore patterns)
                files.append({
                    'name': item + '/',
                    'type': 'directory',
                    'path': item + '/'
                })
        
        # Sort: directories first, then files alphabetically
        files.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/content', methods=['GET'])
def get_file_content():
    """Get content of a specific file"""
    import os
    try:
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({
                'success': False,
                'error': 'No file path provided'
            }), 400
        
        # Security check: prevent directory traversal
        if '..' in file_path or file_path.startswith('/'):
            return jsonify({
                'success': False,
                'error': 'Invalid file path'
            }), 400
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'File not found'
            }), 404
        
        if not os.path.isfile(file_path):
            return jsonify({
                'success': False,
                'error': 'Path is not a file'
            }), 400
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        
    except UnicodeDecodeError:
        return jsonify({
            'success': False,
            'error': 'File contains binary data or unsupported encoding'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/save', methods=['POST'])
def save_file():
    """Save a file to the server"""
    import os
    try:
        data = request.get_json()
        if not data or 'filename' not in data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing filename or content'
            }), 400
        
        filename = data['filename']
        content = data['content']
        
        # Security check: prevent directory traversal with '..'
        if '..' in filename:
            return jsonify({
                'success': False,
                'error': 'Invalid filename - directory traversal not allowed'
            }), 400
        
        # Handle file paths properly
        if filename.endswith('.ipynb'):
            # For notebooks, save to notebooks directory if it's just a filename
            if '/' not in filename and '\\' not in filename:
                notebooks_dir = 'notebooks'
                if not os.path.exists(notebooks_dir):
                    os.makedirs(notebooks_dir)
                file_path = os.path.join(notebooks_dir, filename)
            else:
                file_path = filename
        else:
            # For other files, use the provided path
            file_path = filename
            
        # Ensure the directory exists
        dir_path = os.path.dirname(file_path)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({
            'success': True,
            'message': f'File saved as {file_path}',
            'path': file_path
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/folder', methods=['GET'])
def list_folder_contents():
    """List contents of a specific folder"""
    import os
    try:
        folder_path = request.args.get('path', '')
        
        # Security check: prevent directory traversal
        if '..' in folder_path:
            return jsonify({
                'success': False,
                'error': 'Invalid folder path'
            }), 400
        
        # Get the full path
        if folder_path:
            # Remove trailing slash for consistency
            folder_path = folder_path.rstrip('/')
            full_path = os.path.join(os.getcwd(), folder_path)
        else:
            full_path = os.getcwd()
        
        if not os.path.exists(full_path) or not os.path.isdir(full_path):
            return jsonify({
                'success': False,
                'error': 'Folder not found'
            }), 404
        
        files = []
        
        for item in os.listdir(full_path):
            item_path = os.path.join(full_path, item)
            relative_path = os.path.join(folder_path, item) if folder_path else item
            
            if os.path.isfile(item_path):
                # Only include relevant file types
                if item.endswith(('.py', '.ipynb', '.txt', '.md', '.json', '.html', '.css', '.js')):
                    files.append({
                        'name': item,
                        'type': 'file',
                        'path': relative_path,
                        'size': os.path.getsize(item_path)
                    })
            elif os.path.isdir(item_path) and not item.startswith('.') and item not in ['__pycache__', 'venv']:
                # Include directories (except hidden ones and common ignore patterns)
                files.append({
                    'name': item + '/',
                    'type': 'directory',
                    'path': relative_path + '/'
                })
        
        # Sort: directories first, then files alphabetically
        files.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))
        
        return jsonify({
            'success': True,
            'files': files,
            'folder': folder_path
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Jupyter Web Backend Server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔗 API endpoints:")
    print("   - POST /api/execute - Execute Python code")
    print("   - POST /api/reset - Reset execution namespace")
    print("   - GET /api/variables - Get current variables")
    print("   - GET /api/status - Get server status")
    print("   - POST /api/install - Install Python packages")
    print("   - POST /api/install-and-retry - Auto-install missing packages")
    print("   - GET /api/files - List files in directory")
    print("   - GET /api/files/folder - List folder contents")
    print("   - GET /api/files/content - Get file content")
    print("   - POST /api/files/save - Save files to server")
    print("\n✨ Ready to execute Python code and manage files!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
