# Example Python Script for Jupyter Web Interface
# This file demonstrates basic Python functionality

print("Hello from example.py!")

# Import common data science libraries
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Sample data analysis
def analyze_data():
    """
    Sample data analysis function
    """
    # Create sample data
    data = np.random.randn(100)
    
    # Basic statistics
    print(f"Mean: {np.mean(data):.2f}")
    print(f"Standard deviation: {np.std(data):.2f}")
    print(f"Min: {np.min(data):.2f}")
    print(f"Max: {np.max(data):.2f}")
    
    return data

# Create a simple plot
def create_plot():
    """
    Create a simple matplotlib plot
    """
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    
    plt.figure(figsize=(10, 6))
    plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
    plt.title('Simple Sine Wave')
    plt.xlabel('x')
    plt.ylabel('sin(x)')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.show()

# Run the functions
if __name__ == "__main__":
    print("Running example analysis...")
    data = analyze_data()
    create_plot()
    print("Analysis complete!")
