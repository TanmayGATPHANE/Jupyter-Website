# Example Python Script - Data Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_data():
    """
    Sample data analysis function
    """
    # Create sample data
    data = {
        'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
        'Age': [25, 30, 35, 28, 32],
        'Salary': [50000, 60000, 70000, 55000, 65000],
        'Department': ['IT', 'HR', 'Finance', 'IT', 'Finance']
    }
    
    df = pd.DataFrame(data)
    
    print("Data Analysis Results:")
    print("=" * 30)
    print(f"Total employees: {len(df)}")
    print(f"Average age: {df['Age'].mean():.1f}")
    print(f"Average salary: ${df['Salary'].mean():,.0f}")
    print("\nDepartment distribution:")
    print(df['Department'].value_counts())
    
    return df

def create_visualization(df):
    """
    Create a simple visualization
    """
    plt.figure(figsize=(10, 6))
    
    # Salary by department
    plt.subplot(1, 2, 1)
    dept_salary = df.groupby('Department')['Salary'].mean()
    plt.bar(dept_salary.index, dept_salary.values)
    plt.title('Average Salary by Department')
    plt.ylabel('Salary ($)')
    plt.xticks(rotation=45)
    
    # Age distribution
    plt.subplot(1, 2, 2)
    plt.hist(df['Age'], bins=5, alpha=0.7, color='skyblue')
    plt.title('Age Distribution')
    plt.xlabel('Age')
    plt.ylabel('Frequency')
    
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    df = analyze_data()
    create_visualization(df)
