"""
Convert Excel dataset to CSV
Usage: python convert_excel.py
"""

import pandas as pd
import os
import sys

def convert_excel_to_csv():
    """Convert Excel file to CSV"""
    # Allow passing a custom Excel path via CLI arg or env var, fallback to default
    excel_file = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('EXCEL_INPUT_PATH', "../synthetic_outpass_dataset.xlsx")
    csv_file = "data/synthetic_outpass_dataset.csv"
    
    print("Converting Excel to CSV...")
    print(f"Input: {excel_file}")
    print(f"Output: {csv_file}")
    
    try:
        # Read Excel file
        print("\nReading Excel file...")
        df = pd.read_excel(excel_file)
        print(f"✅ Read {len(df)} rows, {len(df.columns)} columns")
        
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Save to CSV
        print("\nSaving to CSV...")
        df.to_csv(csv_file, index=False)
        print(f"✅ Saved to {csv_file}")
        
        # Display basic info
        print("\n" + "="*60)
        print("Dataset Info:")
        print("="*60)
        print(f"Shape: {df.shape}")
        print(f"\nColumns ({len(df.columns)}):")
        for col in df.columns:
            print(f"  - {col}")
        
        print("\n" + "="*60)
        print("First few rows:")
        print(df.head())
        
        print("\n" + "="*60)
        print("Data types:")
        print(df.dtypes)
        
        # Check for target variable
        if 'label_violation' in df.columns:
            print("\n" + "="*60)
            print("Target distribution:")
            print(df['label_violation'].value_counts())
            print("\n✅ Target variable 'label_violation' found")
        
        print("\n" + "="*60)
        print("✅ Conversion complete!")
        print("="*60)
        print(f"\nNext step: Train models")
        print("Run: python train_your_model.py")
        
        return True
        
    except FileNotFoundError:
        print(f"\n❌ Error: Excel file not found: {excel_file}")
        print("\nPlease check:")
        print("1. Is synthetic_outpass_dataset.xlsx in the parent directory?")
        print("2. Current directory:", os.getcwd())
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    convert_excel_to_csv()
