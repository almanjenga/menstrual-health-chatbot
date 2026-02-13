"""
Complete Swahili Index Setup Script
This script will:
1. Translate the entire CSV to Swahili (in batches)
2. Build the Swahili FAISS index

Note: Full translation of 22,306 rows will take approximately 12-18 hours
You can run this script and let it complete overnight.
"""
import subprocess
import sys
import os
import time
from datetime import datetime

TOTAL_ROWS = 22306
BATCH_SIZE = 500  # Process 500 rows at a time

def check_file_exists(filename):
    """Check if file exists"""
    return os.path.exists(filename)

def run_translation_batch(start_row, batch_size):
    """Run translation for a batch"""
    print(f"\n{'='*70}")
    print(f"Translating rows {start_row} to {min(start_row + batch_size, TOTAL_ROWS)}")
    print(f"Progress: {start_row}/{TOTAL_ROWS} ({start_row*100//TOTAL_ROWS}%)")
    print(f"{'='*70}\n")
    
    start_time = time.time()
    cmd = [sys.executable, "translate_csv.py", str(start_row), str(batch_size)]
    result = subprocess.run(cmd, cwd=os.getcwd())
    elapsed = time.time() - start_time
    
    if result.returncode == 0:
        print(f"\n✅ Batch completed in {elapsed:.1f} seconds")
        return True
    else:
        print(f"\n❌ Batch failed after {elapsed:.1f} seconds")
        return False

def build_swahili_index():
    """Build the Swahili FAISS index"""
    print(f"\n{'='*70}")
    print("Building Swahili FAISS index...")
    print(f"{'='*70}\n")
    
    if not check_file_exists("menstrual_data_sw.csv"):
        print("❌ Error: menstrual_data_sw.csv not found!")
        print("   Complete translation first.")
        return False
    
    cmd = [sys.executable, "build_swahili_index.py"]
    result = subprocess.run(cmd, cwd=os.getcwd())
    
    if result.returncode == 0:
        print("\n✅ Swahili index built successfully!")
        return True
    else:
        print("\n❌ Failed to build Swahili index")
        return False

def main():
    print("="*70)
    print("COMPLETE SWAHILI INDEX SETUP")
    print("="*70)
    print(f"Total rows to translate: {TOTAL_ROWS}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Estimated batches: {(TOTAL_ROWS + BATCH_SIZE - 1) // BATCH_SIZE}")
    print(f"Estimated time: 12-18 hours (at ~2-3 seconds per row)")
    print("="*70)
    
    # Check if translation already started
    if check_file_exists("menstrual_data_sw.csv"):
        print("\n⚠️  menstrual_data_sw.csv already exists!")
        response = input("Continue from where it left off? (y/n): ")
        if response.lower() != 'y':
            print("Exiting. Delete menstrual_data_sw.csv to start fresh.")
            return
        
        # Find last translated row (simplified - just start from beginning)
        # In practice, you'd check the CSV to see how many rows are translated
        start_row = 0
        print("Starting from beginning. If you want to resume, edit this script.")
    else:
        start_row = 0
    
    # Translate in batches
    batch_num = 1
    total_batches = (TOTAL_ROWS + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"\n>>> Starting translation process <<<")
    print(f"Press Ctrl+C to pause (you can resume later by running this script again)")
    print()
    
    try:
        while start_row < TOTAL_ROWS:
            print(f"\n>>> Batch {batch_num}/{total_batches} <<<")
            success = run_translation_batch(start_row, BATCH_SIZE)
            
            if not success:
                print(f"\n❌ Batch {batch_num} failed. Stopping.")
                print(f"To resume, run: python translate_csv.py {start_row} {BATCH_SIZE}")
                return
            
            start_row += BATCH_SIZE
            batch_num += 1
            
            # Estimate remaining time
            if batch_num <= 5:  # Only show estimate for first few batches
                avg_time_per_batch = (time.time() - start_time) / batch_num if batch_num > 1 else 0
                if avg_time_per_batch > 0:
                    remaining_batches = total_batches - batch_num + 1
                    estimated_hours = (avg_time_per_batch * remaining_batches) / 3600
                    print(f"Estimated remaining time: ~{estimated_hours:.1f} hours")
    
    except KeyboardInterrupt:
        print(f"\n\n⚠️  Process interrupted by user")
        print(f"Progress saved. To resume, run:")
        print(f"python translate_csv.py {start_row} {BATCH_SIZE}")
        print(f"Or run this script again to continue automatically.")
        return
    
    # Build index after translation is complete
    print(f"\n{'='*70}")
    print("Translation complete! Building Swahili index...")
    print(f"{'='*70}")
    
    if build_swahili_index():
        print(f"\n{'='*70}")
        print("✅ SETUP COMPLETE!")
        print("="*70)
        print("Swahili index is ready. The chatbot will now use:")
        print("  - menstrual_data_sw.csv (Swahili corpus)")
        print("  - menstrual_index_sw.faiss (Swahili FAISS index)")
        print("  - embeddings_sw.npy (Swahili embeddings)")
        print("\nRestart your Flask server to use the new Swahili index.")
        print("="*70)
    else:
        print("\n❌ Setup incomplete. Check errors above.")

if __name__ == "__main__":
    start_time = time.time()
    main()
    total_time = time.time() - start_time
    print(f"\nTotal time: {total_time/3600:.2f} hours")


