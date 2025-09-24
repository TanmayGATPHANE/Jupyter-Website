# Excel Data Processing Script for Scheduler
# This script demonstrates automated Excel data processing

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
import os

def process_excel_data():
    """
    Process Excel data and generate reports
    This function can be scheduled to run automatically
    """
    print(f"[{datetime.now()}] Starting Excel data processing...")
    
    # Create sample data (in real scenario, you'd read from Excel file)
    # You can replace this with: df = pd.read_excel('your_file.xlsx')
    sample_data = {
        'Date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'Sales': np.random.randint(1000, 5000, 100),
        'Customers': np.random.randint(50, 200, 100),
        'Product': np.random.choice(['A', 'B', 'C'], 100),
        'Region': np.random.choice(['North', 'South', 'East', 'West'], 100)
    }
    
    df = pd.DataFrame(sample_data)
    
    print(f"📊 Loaded {len(df)} records")
    print(f"📅 Date range: {df['Date'].min()} to {df['Date'].max()}")
    
    # Data analysis
    total_sales = df['Sales'].sum()
    avg_daily_sales = df['Sales'].mean()
    top_product = df.groupby('Product')['Sales'].sum().idxmax()
    
    print(f"💰 Total Sales: ${total_sales:,}")
    print(f"📈 Average Daily Sales: ${avg_daily_sales:,.2f}")
    print(f"🏆 Top Product: {top_product}")
    
    # Regional analysis
    regional_sales = df.groupby('Region')['Sales'].sum().sort_values(ascending=False)
    print(f"\n🌍 Sales by Region:")
    for region, sales in regional_sales.items():
        print(f"   {region}: ${sales:,}")
    
    # Generate visualization
    plt.figure(figsize=(12, 8))
    
    # Sales trend
    plt.subplot(2, 2, 1)
    daily_sales = df.groupby('Date')['Sales'].sum()
    plt.plot(daily_sales.index, daily_sales.values)
    plt.title('Daily Sales Trend')
    plt.xlabel('Date')
    plt.ylabel('Sales ($)')
    plt.xticks(rotation=45)
    
    # Product performance
    plt.subplot(2, 2, 2)
    product_sales = df.groupby('Product')['Sales'].sum()
    plt.bar(product_sales.index, product_sales.values)
    plt.title('Sales by Product')
    plt.xlabel('Product')
    plt.ylabel('Sales ($)')
    
    # Regional distribution
    plt.subplot(2, 2, 3)
    plt.pie(regional_sales.values, labels=regional_sales.index, autopct='%1.1f%%')
    plt.title('Sales Distribution by Region')
    
    # Customer trend
    plt.subplot(2, 2, 4)
    daily_customers = df.groupby('Date')['Customers'].sum()
    plt.plot(daily_customers.index, daily_customers.values, color='green')
    plt.title('Daily Customer Count')
    plt.xlabel('Date')
    plt.ylabel('Customers')
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.show()
    
    # Save processed data (example)
    output_file = f"processed_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    # df.to_excel(output_file, index=False)  # Uncomment to save
    print(f"📄 Would save processed data to: {output_file}")
    
    # Database operations (example)
    print(f"💾 Would update database with {len(df)} records")
    print(f"🔄 Processing completed at {datetime.now()}")
    
    return {
        'records_processed': len(df),
        'total_sales': total_sales,
        'avg_daily_sales': avg_daily_sales,
        'top_product': top_product,
        'processing_time': datetime.now().isoformat()
    }

def database_operations():
    """
    Simulate database operations
    In real scenario, you'd connect to your database here
    """
    print("🔌 Connecting to database...")
    print("📥 Inserting processed data...")
    print("🔄 Updating existing records...")
    print("✅ Database operations completed")

def send_report_email():
    """
    Simulate sending email report
    In real scenario, you'd use smtplib or email service
    """
    print("📧 Preparing email report...")
    print("📤 Sending report to stakeholders...")
    print("✅ Email report sent successfully")

def cleanup_old_files():
    """
    Clean up old processed files
    """
    print("🧹 Cleaning up old files...")
    print("🗑️ Removed old temporary files")

if __name__ == "__main__":
    # Main processing pipeline
    try:
        # Process Excel data
        result = process_excel_data()
        
        # Perform database operations
        database_operations()
        
        # Send email report
        send_report_email()
        
        # Cleanup
        cleanup_old_files()
        
        print(f"\n🎉 Scheduled task completed successfully!")
        print(f"📊 Summary: {result}")
        
    except Exception as e:
        print(f"❌ Error in scheduled task: {e}")
        print(f"🚨 Task failed at {datetime.now()}")
