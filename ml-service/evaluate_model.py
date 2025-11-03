"""
Evaluate trained model and generate ROC curve
Usage: python evaluate_model.py
"""

import pandas as pd
import numpy as np
from sklearn.metrics import (
    classification_report, confusion_matrix, 
    roc_curve, auc, precision_recall_curve
)
import joblib
import pickle
import matplotlib.pyplot as plt
import os
import sys

# Configuration
MODEL_VERSION = "v1.0"
MODEL_PATH = f"models/risk_model_{MODEL_VERSION}.joblib"
SCALER_PATH = f"models/scaler_{MODEL_VERSION}.joblib"
ENCODERS_PATH = f"models/label_encoders_{MODEL_VERSION}.pkl"
TEST_DATA_PATH = "data/test_data.csv"  # Separate test set if available
PLOT_DIR = "plots"

def load_model_and_preprocessors():
    """Load trained model and preprocessing objects"""
    print("Loading model and preprocessors...")
    
    try:
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded: {MODEL_PATH}")
    except FileNotFoundError:
        print(f"❌ Model not found: {MODEL_PATH}")
        return None, None, None, None
    
    try:
        scaler = joblib.load(SCALER_PATH)
        print(f"✅ Scaler loaded: {SCALER_PATH}")
    except FileNotFoundError:
        print("⚠️  Scaler not found, skipping preprocessing")
        scaler = None
    
    try:
        with open(ENCODERS_PATH, 'rb') as f:
            label_encoders = pickle.load(f)
        print(f"✅ Label encoders loaded: {ENCODERS_PATH}")
    except FileNotFoundError:
        print("⚠️  Label encoders not found")
        label_encoders = None
    
    return model, scaler, label_encoders, MODEL_VERSION

def load_test_data(filepath):
    """Load test data"""
    print(f"Loading test data from {filepath}...")
    df = pd.read_csv(filepath)
    return df

def prepare_features(df, label_encoders=None, fit=False):
    """Prepare features (same as training)"""
    feature_columns = [
        'past_violations_30d',
        'past_violations_365d',
        'late_returns_30d',
        'rejection_rate',
        'request_frequency_7d',
        'request_frequency_30d',
        'request_type',
        'destination',
        'request_time_hour',
        'request_day_of_week',
        'request_duration_hours'
    ]
    
    available_features = [col for col in feature_columns if col in df.columns]
    X = df[available_features]
    
    # Get target
    if 'had_violation' in df.columns:
        y = df['had_violation']
    elif 'had_issue' in df.columns:
        y = df['had_issue']
    elif 'risk_label' in df.columns:
        y = df['risk_label']
    else:
        y = None
    
    # Encode categorical
    if label_encoders:
        categorical_cols = ['request_type', 'destination']
        for col in categorical_cols:
            if col in label_encoders and col in X.columns:
                le = label_encoders[col]
                X[col] = X[col].astype(str).map(
                    dict(zip(le.classes_, range(len(le.classes_))))
                ).fillna(0)
    
    return X, y

def evaluate_model(model, X_test, y_test, scaler=None):
    """Evaluate model performance"""
    print("\nEvaluating model...")
    
    # Scale if scaler provided
    if scaler:
        numerical_cols = X_test.select_dtypes(include=[np.number]).columns
        X_test_scaled = X_test.copy()
        X_test_scaled[numerical_cols] = scaler.transform(X_test_scaled[numerical_cols])
    else:
        X_test_scaled = X_test
    
    # Predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    # Classification report
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(y_test, y_pred, target_names=['No Issue', 'Issue']))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\n" + "="*60)
    print("CONFUSION MATRIX")
    print("="*60)
    print(f"\n{'':15} Predicted")
    print(f"{'':15} No Issue  Issue")
    print(f"{'Actual':15} {'─'*20}")
    print(f"{'No Issue':15} {cm[0][0]:6} {cm[0][1]:6}")
    print(f"{'Issue':15} {cm[1][0]:6} {cm[1][1]:6}")
    
    # Metrics
    tn, fp, fn, tp = cm.ravel()
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    print("\n" + "="*60)
    print("METRICS SUMMARY")
    print("="*60)
    print(f"Accuracy:  {accuracy:.3f}")
    print(f"Precision: {precision:.3f}")
    print(f"Recall:    {recall:.3f}")
    print(f"F1-Score:  {f1:.3f}")
    
    return {
        'y_pred': y_pred,
        'y_pred_proba': y_pred_proba,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'cm': cm
    }

def plot_roc_curve(y_test, y_pred_proba, model_version):
    """Generate and save ROC curve"""
    print("\nGenerating ROC curve...")
    
    fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(10, 8))
    plt.plot(fpr, tpr, color='darkorange', lw=2, 
             label=f'ROC curve (AUC = {roc_auc:.3f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', 
             label='Random Classifier (AUC = 0.500)')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=14)
    plt.ylabel('True Positive Rate', fontsize=14)
    plt.title(f'ROC Curve - Risk Prediction Model v{model_version}', fontsize=16, fontweight='bold')
    plt.legend(loc="lower right", fontsize=12)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    os.makedirs(PLOT_DIR, exist_ok=True)
    plot_path = f'{PLOT_DIR}/roc_curve.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"✅ ROC curve saved: {plot_path}")
    plt.close()
    
    return roc_auc, fpr, tpr

def plot_precision_recall_curve(y_test, y_pred_proba, model_version):
    """Generate and save Precision-Recall curve"""
    print("Generating Precision-Recall curve...")
    
    precision, recall, thresholds = precision_recall_curve(y_test, y_pred_proba)
    pr_auc = auc(recall, precision)
    
    plt.figure(figsize=(10, 8))
    plt.plot(recall, precision, color='blue', lw=2,
             label=f'PR curve (AUC = {pr_auc:.3f})')
    baseline = len(y_test[y_test==1]) / len(y_test)
    plt.axhline(y=baseline, color='navy', lw=2, linestyle='--',
                label=f'Baseline (AUC = {baseline:.3f})')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Recall', fontsize=14)
    plt.ylabel('Precision', fontsize=14)
    plt.title(f'Precision-Recall Curve - Risk Prediction Model v{model_version}', 
              fontsize=16, fontweight='bold')
    plt.legend(loc="upper right", fontsize=12)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    plot_path = f'{PLOT_DIR}/pr_curve.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"✅ PR curve saved: {plot_path}")
    plt.close()
    
    return pr_auc

def main():
    """Main evaluation pipeline"""
    print("="*60)
    print("Model Evaluation & ROC Curve Generation")
    print("="*60)
    
    # Load model
    model, scaler, label_encoders, model_version = load_model_and_preprocessors()
    if model is None:
        print("\n❌ Cannot proceed without trained model")
        print("Please run: python train_model.py")
        sys.exit(1)
    
    # Load test data
    if os.path.exists(TEST_DATA_PATH):
        df_test = load_test_data(TEST_DATA_PATH)
        X_test, y_test = prepare_features(df_test, label_encoders)
        print(f"✅ Loaded {len(X_test)} test samples")
    else:
        print(f"⚠️  Test data not found: {TEST_DATA_PATH}")
        print("Using training data for evaluation instead...")
        
        # You can modify this to use your training data
        print("Please provide test data or modify this script to load training data")
        sys.exit(1)
    
    # Evaluate
    results = evaluate_model(model, X_test, y_test, scaler)
    
    # Generate curves
    roc_auc, fpr, tpr = plot_roc_curve(y_test, results['y_pred_proba'], model_version)
    pr_auc = plot_precision_recall_curve(y_test, results['y_pred_proba'], model_version)
    
    # Final summary
    print("\n" + "="*60)
    print("EVALUATION SUMMARY")
    print("="*60)
    print(f"Model Version:    {model_version}")
    print(f"ROC-AUC Score:    {roc_auc:.3f}")
    print(f"PR-AUC Score:     {pr_auc:.3f}")
    print(f"Accuracy:         {results['accuracy']:.3f}")
    print(f"Precision:        {results['precision']:.3f}")
    print(f"Recall:           {results['recall']:.3f}")
    print(f"F1-Score:         {results['f1']:.3f}")
    print("\nPlots saved to:", PLOT_DIR)
    print("="*60)

if __name__ == "__main__":
    main()
