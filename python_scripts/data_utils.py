# Data Analysis Utilities
# Collection of utility functions for data analysis

import pandas as pd
import numpy as np
from typing import List, Dict, Any

def load_csv_data(file_path: str) -> pd.DataFrame:
    """
    Load CSV data with error handling
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        pandas DataFrame with the loaded data
    """
    try:
        df = pd.read_csv(file_path)
        print(f"Successfully loaded {len(df)} rows and {len(df.columns)} columns")
        return df
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return pd.DataFrame()

def basic_stats(df: pd.DataFrame, column: str) -> Dict[str, float]:
    """
    Calculate basic statistics for a column
    
    Args:
        df: pandas DataFrame
        column: Column name to analyze
        
    Returns:
        Dictionary with basic statistics
    """
    if column not in df.columns:
        print(f"Column '{column}' not found in DataFrame")
        return {}
    
    stats = {
        'mean': df[column].mean(),
        'median': df[column].median(),
        'std': df[column].std(),
        'min': df[column].min(),
        'max': df[column].max(),
        'count': len(df[column])
    }
    
    return stats

def detect_outliers(data: List[float], method: str = 'iqr') -> List[int]:
    """
    Detect outliers in numerical data
    
    Args:
        data: List of numerical values
        method: Method to use ('iqr' or 'zscore')
        
    Returns:
        List of indices where outliers are found
    """
    outliers = []
    
    if method == 'iqr':
        q1 = np.percentile(data, 25)
        q3 = np.percentile(data, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = [i for i, x in enumerate(data) 
                   if x < lower_bound or x > upper_bound]
    
    elif method == 'zscore':
        mean = np.mean(data)
        std = np.std(data)
        z_scores = [(x - mean) / std for x in data]
        outliers = [i for i, z in enumerate(z_scores) if abs(z) > 3]
    
    return outliers

# Example usage
if __name__ == "__main__":
    # Generate sample data
    sample_data = np.random.normal(0, 1, 1000).tolist()
    
    # Add some outliers
    sample_data.extend([10, -8, 12, -9])
    
    # Detect outliers
    outlier_indices = detect_outliers(sample_data, method='iqr')
    print(f"Found {len(outlier_indices)} outliers using IQR method")
    
    outlier_indices_z = detect_outliers(sample_data, method='zscore')
    print(f"Found {len(outlier_indices_z)} outliers using Z-score method")
