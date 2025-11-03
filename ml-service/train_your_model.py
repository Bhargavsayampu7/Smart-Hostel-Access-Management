"""
Train ML models for risk prediction
Based on your existing training code - adapted for this project
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, 
    f1_score, average_precision_score, brier_score_loss, roc_curve
)
import joblib
import matplotlib.pyplot as plt
import os
import warnings

warnings.filterwarnings("ignore")

# Configuration
DATA_PATH = "data/synthetic_outpass_dataset.csv"  # Will be converted from Excel
OUTPUT_DIR = "models"
PLOT_DIR = "plots"

def load_and_prepare_data(filepath):
    """Load data from CSV"""
    print("Loading data...")
    df = pd.read_csv(filepath)
    print(f"✅ Loaded {len(df)} samples")
    return df

def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models and compare"""
    results = {}
    
    # 1) Logistic Regression
    print("\n" + "="*60)
    print("Training Logistic Regression...")
    lr = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    res_lr = evaluate_model(lr, X_test, y_test, "LogisticRegression")
    results['lr'] = {'model': lr, 'results': res_lr}
    joblib.dump(lr, f"{OUTPUT_DIR}/logreg.joblib")
    print(f"✅ Saved: {OUTPUT_DIR}/logreg.joblib")
    
    # 2) Random Forest
    print("\n" + "="*60)
    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=200, class_weight='balanced', n_jobs=-1, random_state=42)
    rf.fit(X_train, y_train)
    res_rf = evaluate_model(rf, X_test, y_test, "RandomForest")
    results['rf'] = {'model': rf, 'results': res_rf}
    joblib.dump(rf, f"{OUTPUT_DIR}/rf.joblib")
    print(f"✅ Saved: {OUTPUT_DIR}/rf.joblib")
    
    # 3) XGBoost or HistGradientBoosting
    print("\n" + "="*60)
    try:
        import xgboost as xgb
        print("Training XGBoost...")
        xgb_clf = xgb.XGBClassifier(
            n_estimators=200, 
            use_label_encoder=False, 
            eval_metric='logloss', 
            random_state=42, 
            n_jobs=2
        )
        xgb_clf.fit(X_train, y_train, early_stopping_rounds=10, eval_set=[(X_test, y_test)], verbose=False)
        res_xgb = evaluate_model(xgb_clf, X_test, y_test, "XGBoost")
        results['xgb'] = {'model': xgb_clf, 'results': res_xgb}
        joblib.dump(xgb_clf, f"{OUTPUT_DIR}/xgb.joblib")
        print(f"✅ Saved: {OUTPUT_DIR}/xgb.joblib")
        main_model = xgb_clf
        main_model_name = "XGBoost"
    except Exception as e:
        print(f"XGBoost not available: {e}")
        print("Falling back to HistGradientBoosting...")
        hgb = HistGradientBoostingClassifier(max_iter=200, random_state=42)
        hgb.fit(X_train, y_train)
        res_hgb = evaluate_model(hgb, X_test, y_test, "HistGradientBoosting")
        results['hgb'] = {'model': hgb, 'results': res_hgb}
        joblib.dump(hgb, f"{OUTPUT_DIR}/hgb.joblib")
        print(f"✅ Saved: {OUTPUT_DIR}/hgb.joblib")
        main_model = hgb
        main_model_name = "HistGradientBoosting"
    
    # Find best model
    best_model_name = max(results.keys(), key=lambda k: results[k]['results']['auc'])
    best_model = results[best_model_name]['model']
    
    print("\n" + "="*60)
    print(f"🏆 Best Model: {best_model_name.upper()} (AUC: {results[best_model_name]['results']['auc']:.4f})")
    print("="*60)
    
    return results, best_model, main_model

def evaluate_model(clf, X_test, y_test, name="model"):
    """Evaluate model and return metrics"""
    if hasattr(clf, "predict_proba"):
        y_prob = clf.predict_proba(X_test)[:,1]
    else:
        y_prob = clf.decision_function(X_test)
    
    y_pred = (y_prob >= 0.5).astype(int)
    
    metrics = {
        'name': name,
        'auc': roc_auc_score(y_test, y_prob),
        'ap': average_precision_score(y_test, y_prob),
        'acc': accuracy_score(y_test, y_pred),
        'prec': precision_score(y_test, y_pred, zero_division=0),
        'rec': recall_score(y_test, y_pred, zero_division=0),
        'f1': f1_score(y_test, y_pred, zero_division=0),
        'brier': brier_score_loss(y_test, y_prob)
    }
    
    print("=== %s ===" % name)
    for k, v in metrics.items():
        if k != 'name':
            print(f"  {k}: {v:.4f}")
    
    return metrics

def plot_roc_curves(models, X_test, y_test):
    """Generate ROC curve comparison plot"""
    print("\n" + "="*60)
    print("Generating ROC curves...")
    
    plt.figure(figsize=(10, 8))
    
    for name, model in models.items():
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:,1]
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            auc = roc_auc_score(y_test, y_prob)
            plt.plot(fpr, tpr, label=f"{name} (AUC={auc:.3f})")
        elif hasattr(model, "decision_function"):
            y_prob = model.decision_function(X_test)
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            auc = roc_auc_score(y_test, y_prob)
            plt.plot(fpr, tpr, label=f"{name} (AUC={auc:.3f})")
    
    plt.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.500)")
    plt.xlabel("False Positive Rate", fontsize=12)
    plt.ylabel("True Positive Rate", fontsize=12)
    plt.title("ROC Curves - Risk Prediction Models", fontsize=14, fontweight='bold')
    plt.legend(loc="lower right", fontsize=10)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    # Save plot
    os.makedirs(PLOT_DIR, exist_ok=True)
    plot_path = f'{PLOT_DIR}/roc_curves_comparison.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"✅ ROC curves saved: {plot_path}")
    plt.close()

def main():
    """Main training pipeline"""
    import os
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PLOT_DIR, exist_ok=True)
    
    print("="*60)
    print("Risk Prediction Model Training")
    print("="*60)
    
    try:
        # Load data
        df = load_and_prepare_data(DATA_PATH)
        
        # Prepare features (based on your code)
        drop_cols = ['student_id', 'risk_score_continuous']
        target = 'label_violation'
        
        X = df.drop(columns=drop_cols + [target])
        y = df[target]
        
        print(f"\nFeatures: {X.shape[1]} columns")
        print(f"Target distribution: {y.value_counts().to_dict()}")
        
        # Feature types (based on your code)
        numeric_features = [
            'age', 'year', 'gpa', 'past_violations_30d', 'past_violations_365d',
            'request_time_hour', 'requested_duration_hours', 'actual_return_delay_minutes',
            'parent_response_time_minutes', 'requests_last_7days'
        ]
        binary_features = [
            'parent_contact_reliable', 'parent_action', 'emergency_flag',
            'group_request', 'weekend_request', 'previous_no_show'
        ]
        categorical_features = ['hostel_block', 'destination_risk']
        
        # Preprocessing (based on your code)
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        preprocessor = ColumnTransformer([
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ], remainder='passthrough')  # keep binary cols
        
        print("\nPreprocessing features...")
        X_prep = preprocessor.fit_transform(X)
        
        # Split data
        print("\nSplitting data...")
        X_train, X_test, y_train, y_test = train_test_split(
            X_prep, y, test_size=0.2, random_state=42, stratify=y
        )
        print(f"✅ Train: {len(X_train)}, Test: {len(X_test)}")
        
        # Save preprocessor
        joblib.dump(preprocessor, f"{OUTPUT_DIR}/preprocessor.joblib")
        print(f"✅ Saved: {OUTPUT_DIR}/preprocessor.joblib")
        
        # Train models
        results, best_model, main_model = train_models(X_train, X_test, y_train, y_test)
        
        # Plot ROC curves
        models_to_plot = {}
        for key, result in results.items():
            models_to_plot[key.upper()] = result['model']
        
        plot_roc_curves(models_to_plot, X_test, y_test)
        
        # Summary
        print("\n" + "="*60)
        print("TRAINING COMPLETE!")
        print("="*60)
        print(f"\nModels saved to: {OUTPUT_DIR}/")
        print("Plots saved to: {PLOT_DIR}/")
        print("\nBest performing model summary:")
        best_key = max(results.keys(), key=lambda k: results[k]['results']['auc'])
        for k, v in results[best_key]['results'].items():
            if k != 'name':
                print(f"  {k}: {v:.4f}")
        
        print("\n" + "="*60)
        print("Next steps:")
        print("1. Review ROC curves in plots/")
        print("2. Update ml-service/app.py to load best model")
        print("3. Test predictions")
        print("="*60)
        
    except FileNotFoundError:
        print(f"\n❌ Error: Data file not found: {DATA_PATH}")
        print("\nPlease:")
        print("1. Convert Excel to CSV:")
        print("   python convert_excel.py")
        print("2. Or update DATA_PATH in this file")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
