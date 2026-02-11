"""
Train ML model for risk prediction
Usage: python train_model.py
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
from xgboost import XGBClassifier
import joblib
import pickle
import matplotlib.pyplot as plt
import os

# Configuration
MODEL_VERSION = "v1.0"
DATA_PATH = "../synthetic_outpass_dataset.csv"  # Update this to your dataset path
OUTPUT_DIR = "models"

def load_data(filepath):
    """Load training data from CSV"""
    print(f"Loading data from {filepath}...")
    df = pd.read_csv(filepath)
    print(f"✅ Loaded {len(df)} samples")
    return df

def prepare_features(df):
    """
    Prepare features for training
    Customize this based on your actual dataset columns
    """
    print("Preparing features...")
    
    # TODO: Update these column names based on your actual dataset
    feature_columns = [
       "age",
       "year",
       "gpa",
       "hostel_block",
       "parent_contact_reliable",
       "past_violations_30d",
       "past_violations_365d",
       "request_time_hour",
       "requested_duration_hours",
       "actual_return_delay_minutes",
       "parent_response_time_minutes",
       "parent_action",
       "destination_risk",
       "emergency_flag",
       "group_request",
       "weekend_request",
       "previous_no_show",
       "requests_last_7days",
   ]
    
    # Check which features exist in the data
    available_features = [col for col in feature_columns if col in df.columns]
    print(f"Available features: {available_features}")
    
    X = df[available_features]
    
    # Separate target variable
    # TODO: Update this based on your target column name
    y = df['label_violation']
    
    print(f"✅ Features: {X.shape[1]}, Target distribution: {y.value_counts().to_dict()}")
    return X, y

def encode_categorical_features(X, fit=True):
    print("Encoding categorical features...")

    label_encoders = {}
    # Use your actual string columns
    categorical_cols = [col for col in ['hostel_block', 'destination_risk'] if col in X.columns]

    if fit:
        # Fit encoders
        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
            print(f"  Encoded {col}: {len(le.classes_)} categories")
    
    else:
        # Load existing encoders
        with open(f'{OUTPUT_DIR}/label_encoders.pkl', 'rb') as f:
            saved_encoders = pickle.load(f)
        for col in categorical_cols:
            if col in saved_encoders:
                le = saved_encoders[col]
                X[col] = X[col].astype(str).map(
                    dict(zip(le.classes_, range(len(le.classes_))))
                ).fillna(0)
    
    return X, label_encoders if fit else X

def train_model(X_train, y_train, X_test, y_test):
    """Train XGBoost model"""
    print("\nTraining XGBoost model...")
    
    model = XGBClassifier(
        max_depth=5,
        n_estimators=100,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss'
    )
    
    model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=True,
)
    
    print("✅ Model training complete")
    return model

def evaluate_model(model, X_test, y_test, save_plots=True):
    """Evaluate model and generate metrics"""
    print("\nEvaluating model...")
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Classification report
    print("\n" + "="*50)
    print("Classification Report")
    print("="*50)
    print(classification_report(y_test, y_pred))
    
    # Confusion matrix
    print("\n" + "="*50)
    print("Confusion Matrix")
    print("="*50)
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    print(f"\nTrue Negatives: {cm[0][0]}")
    print(f"False Positives: {cm[0][1]}")
    print(f"False Negatives: {cm[1][0]}")
    print(f"True Positives: {cm[1][1]}")
    
    # ROC Curve
    fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
    roc_auc = auc(fpr, tpr)
    
    print("\n" + "="*50)
    print("ROC-AUC Score")
    print("="*50)
    print(f"ROC-AUC: {roc_auc:.3f}")
    
    if save_plots:
        plot_roc_curve(fpr, tpr, roc_auc)
    
    return {
        'roc_auc': roc_auc,
        'y_pred': y_pred,
        'y_pred_proba': y_pred_proba,
        'fpr': fpr,
        'tpr': tpr
    }

def plot_roc_curve(fpr, tpr, roc_auc):
    """Plot ROC curve"""
    print("\nGenerating ROC curve...")
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, 
             label=f'ROC curve (AUC = {roc_auc:.3f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', 
             label='Random Classifier')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=12)
    plt.ylabel('True Positive Rate', fontsize=12)
    plt.title('Receiver Operating Characteristic (ROC) Curve', fontsize=14)
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    # Save plot
    os.makedirs('plots', exist_ok=True)
    plt.savefig('plots/roc_curve.png', dpi=300)
    print("✅ ROC curve saved to plots/roc_curve.png")
    plt.close()

def save_model(model, scaler, label_encoders, feature_names):
    """Save trained model and preprocessing objects"""
    print(f"\nSaving model to {OUTPUT_DIR}/...")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Save model
    model_path = f'{OUTPUT_DIR}/risk_model_{MODEL_VERSION}.joblib'
    joblib.dump(model, model_path)
    print(f"✅ Model saved: {model_path}")
    
    # Save model as JSON (for XGBoost)
    json_path = f'{OUTPUT_DIR}/risk_model_{MODEL_VERSION}.json'
    model.get_booster().save_model(json_path)
    print(f"✅ Model JSON saved: {json_path}")
    
    # Save scaler
    scaler_path = f'{OUTPUT_DIR}/scaler_{MODEL_VERSION}.joblib'
    joblib.dump(scaler, scaler_path)
    print(f"✅ Scaler saved: {scaler_path}")
    
    # Save label encoders
    if label_encoders:
        encoders_path = f'{OUTPUT_DIR}/label_encoders_{MODEL_VERSION}.pkl'
        with open(encoders_path, 'wb') as f:
            pickle.dump(label_encoders, f)
        print(f"✅ Label encoders saved: {encoders_path}")
    
    # Save feature names
    features_path = f'{OUTPUT_DIR}/feature_names_{MODEL_VERSION}.txt'
    with open(features_path, 'w') as f:
        for name in feature_names:
            f.write(f"{name}\n")
    print(f"✅ Feature names saved: {features_path}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    importance_path = f'{OUTPUT_DIR}/feature_importance_{MODEL_VERSION}.csv'
    feature_importance.to_csv(importance_path, index=False)
    print(f"✅ Feature importance saved: {importance_path}")
    
    print("\n" + "="*50)
    print("Top 10 Most Important Features")
    print("="*50)
    print(feature_importance.head(10).to_string(index=False))

def main():
    """Main training pipeline"""
    print("="*60)
    print("Risk Prediction Model Training")
    print(f"Model Version: {MODEL_VERSION}")
    print("="*60)
    
    try:
        # Load data
        df = load_data(DATA_PATH)
        
        # Prepare features
        X, y = prepare_features(df)
        
        # Encode categorical features
        X, label_encoders = encode_categorical_features(X, fit=True)
        
        # Split data
        print("\nSplitting data...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        print(f"✅ Train: {len(X_train)}, Test: {len(X_test)}")
        
        # Scale numerical features
        print("\nScaling features...")
        scaler = StandardScaler()
        numerical_cols = X.select_dtypes(include=[np.number]).columns
        X_train[numerical_cols] = scaler.fit_transform(X_train[numerical_cols])
        X_test[numerical_cols] = scaler.transform(X_test[numerical_cols])
        print(f"✅ Scaled {len(numerical_cols)} numerical features")
        
        # Train model
        model = train_model(X_train, y_train, X_test, y_test)
        
        # Evaluate
        results = evaluate_model(model, X_test, y_test, save_plots=True)
        
        # Save everything
        save_model(model, scaler, label_encoders, X.columns.tolist())
        
        print("\n" + "="*60)
        print("✅ TRAINING COMPLETE!")
        print("="*60)
        print(f"Model Version: {MODEL_VERSION}")
        print(f"Test ROC-AUC: {results['roc_auc']:.3f}")
        print(f"Model files saved to: {OUTPUT_DIR}/")
        print("\nNext step: Update ml-service/app.py to load this model")
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: Data file not found: {DATA_PATH}")
        print("\nPlease:")
        print(f"1. Place your CSV data at: {DATA_PATH}")
        print("2. Or update DATA_PATH in this file")
        print("\nExpected CSV columns:")
        print("- past_violations_30d, late_returns_30d, rejection_rate")
        print("- request_type, destination, request_frequency_30d")
        print("- had_violation (or had_issue or risk_label) as target")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
