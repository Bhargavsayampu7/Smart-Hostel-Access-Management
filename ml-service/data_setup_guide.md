# Dataset Setup Guide

## Quick Start

### Step 1: Place Your Dataset
Put your CSV file in the `ml-service/data/` directory:

```bash
mkdir -p ml-service/data
# Copy your dataset here
cp /path/to/your/dataset.csv ml-service/data/historical_requests.csv
```

### Step 2: Check Your Data Format

Your CSV should have these columns (or similar):

#### Required Features:
- `past_violations_30d` - Number of violations in last 30 days (int)
- `past_violations_365d` - Number of violations in last year (int)
- `late_returns_30d` - Number of late returns in last 30 days (int)
- `rejection_rate` - Historical rejection rate (float, 0-1)
- `request_frequency_7d` - Requests in last 7 days (int)
- `request_frequency_30d` - Requests in last 30 days (int)
- `request_type` - Type of request (outpass/homepass/emergency)
- `destination` - Where student is going
- `request_time_hour` - Hour of request (0-23)
- `request_day_of_week` - Day of week (0=Monday, 6=Sunday)
- `request_duration_hours` - Duration in hours (float)

#### Required Target:
- `had_violation` OR `had_issue` OR `risk_label` (0 or 1)

### Step 3: Update Configuration

If your column names are different, edit `train_model.py`:

```python
# In prepare_features() function, update:
feature_columns = [
    'your_violation_column',  # Rename as needed
    'your_late_return_column',
    # ... etc
]

# And target:
if 'your_target_column' in df.columns:
    y = df['your_target_column']
```

### Step 4: Train!

```bash
cd ml-service
python train_model.py
```

---

## Example Data Structure

```csv
past_violations_30d,past_violations_365d,late_returns_30d,rejection_rate,request_frequency_7d,request_frequency_30d,request_type,destination,request_time_hour,request_day_of_week,request_duration_hours,had_violation
0,0,0,0.0,0,2,outpass,Movie,14,5,8.0,0
1,2,0,0.1,1,5,outpass,Friend's Place,20,2,6.0,1
0,1,1,0.0,0,1,homepass,Home Town,10,6,72.0,0
...
```

---

## If You Don't Have Historical Data

Use the synthetic data generator:

```bash
cd ml-service
python generate_synthetic_data.py
```

This will create `data/historical_requests.csv` with realistic training data.

---

## Data Quality Checklist

Before training:
- [ ] At least 100 samples (more is better)
- [ ] Target variable is balanced (not 99% one class)
- [ ] No missing values in required columns
- [ ] Numerical columns are actually numeric
- [ ] Categorical columns are strings
- [ ] Target is 0 or 1

---

## Next Steps

1. Train: `python train_model.py`
2. Evaluate: `python evaluate_model.py`
3. Integrate: Update `app.py` to load real model

See `../QUICK_START_ML.md` for full integration steps.
