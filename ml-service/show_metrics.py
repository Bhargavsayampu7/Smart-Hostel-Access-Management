"""
Show metrics for all trained models
"""
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score

# Load data
print("Loading data...")
df = pd.read_csv('data/synthetic_outpass_dataset.csv')

# Prepare data
print("Preparing data...")
drop_cols = ['student_id', 'risk_score_continuous']
target = 'label_violation'
X = df.drop(columns=drop_cols + [target])
y = df[target]

# Load preprocessor and prepare
print("Loading preprocessor...")
preprocessor = joblib.load('models/preprocessor.joblib')
X_prep = preprocessor.transform(X)

# Load models and evaluate
models = {}
for name in ['logreg', 'rf', 'hgb']:
    try:
        print(f"\n===== {name.upper()} MODEL METRICS =====")
        model = joblib.load(f'models/{name}.joblib')
        
        # Make predictions
        y_pred = model.predict(X_prep)
        y_prob = model.predict_proba(X_prep)[:,1]
        
        # Calculate metrics
        accuracy = accuracy_score(y, y_pred)
        auc = roc_auc_score(y, y_prob)
        
        print(f"Accuracy: {accuracy:.4f}")
        print(f"ROC AUC: {auc:.4f}")
        print("\nClassification Report:")
        print(classification_report(y, y_pred))
        
    except Exception as e:
        print(f"Error loading {name} model: {e}")

print("\nROC curves are available in plots/roc_curves_comparison.png")