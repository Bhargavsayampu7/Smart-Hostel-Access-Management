"""Quick ROC curve generation"""
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, roc_curve
import matplotlib.pyplot as plt
import os

# Load data
df = pd.read_csv('data/synthetic_outpass_dataset.csv')

# Prepare data same way as training
drop_cols = ['student_id', 'risk_score_continuous']
target = 'label_violation'
X = df.drop(columns=drop_cols + [target])
y = df[target]

# Load preprocessor and prepare
preprocessor = joblib.load('models/preprocessor.joblib')
X_prep = preprocessor.transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_prep, y, test_size=0.2, random_state=42, stratify=y)

# Load models
models = {}
for name in ['logreg', 'rf', 'hgb']:
    try:
        models[name] = joblib.load(f'models/{name}.joblib')
        print(f"Loaded: {name}")
    except:
        pass

# Generate ROC
plt.figure(figsize=(10, 8))
for name, m in models.items():
    if hasattr(m, "predict_proba"):
        y_prob = m.predict_proba(X_test)[:,1]
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        auc = roc_auc_score(y_test, y_prob)
        plt.plot(fpr, tpr, label=f"{name.upper()} (AUC={auc:.3f})")

plt.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.500)")
plt.xlabel("False Positive Rate", fontsize=12)
plt.ylabel("True Positive Rate", fontsize=12)
plt.title("ROC Curves - Risk Prediction Models", fontsize=14, fontweight='bold')
plt.legend(loc="lower right", fontsize=10)
plt.grid(alpha=0.3)
plt.tight_layout()

os.makedirs('plots', exist_ok=True)
plt.savefig('plots/roc_curves_comparison.png', dpi=300, bbox_inches='tight')
plt.close()
print("✅ ROC curves saved to plots/roc_curves_comparison.png")
