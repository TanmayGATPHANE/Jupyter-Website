# Machine Learning Example
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import numpy as np

class SimpleMLModel:
    def __init__(self, n_samples=1000, n_features=20, n_classes=2):
        self.n_samples = n_samples
        self.n_features = n_features
        self.n_classes = n_classes
        self.model = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
    
    def generate_data(self):
        """Generate synthetic dataset"""
        print(f"Generating {self.n_samples} samples with {self.n_features} features...")
        
        X, y = make_classification(
            n_samples=self.n_samples,
            n_features=self.n_features,
            n_classes=self.n_classes,
            n_redundant=5,
            n_informative=15,
            random_state=42
        )
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set size: {len(self.X_train)}")
        print(f"Test set size: {len(self.X_test)}")
    
    def train_model(self):
        """Train Random Forest model"""
        print("Training Random Forest model...")
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        
        self.model.fit(self.X_train, self.y_train)
        print("Model training completed!")
    
    def evaluate_model(self):
        """Evaluate model performance"""
        if self.model is None:
            print("Model not trained yet!")
            return
        
        # Predictions
        y_pred = self.model.predict(self.X_test)
        
        # Accuracy
        accuracy = accuracy_score(self.y_test, y_pred)
        print(f"Model Accuracy: {accuracy:.4f}")
        
        # Classification report
        print("\nClassification Report:")
        print(classification_report(self.y_test, y_pred))
        
        # Feature importance
        feature_importance = self.model.feature_importances_
        top_features = np.argsort(feature_importance)[-5:][::-1]
        
        print(f"\nTop 5 Most Important Features:")
        for i, feature_idx in enumerate(top_features):
            print(f"{i+1}. Feature {feature_idx}: {feature_importance[feature_idx]:.4f}")
    
    def predict_sample(self, sample_data=None):
        """Make prediction on a sample"""
        if self.model is None:
            print("Model not trained yet!")
            return
        
        if sample_data is None:
            # Use first test sample
            sample_data = self.X_test[0].reshape(1, -1)
        
        prediction = self.model.predict(sample_data)
        probability = self.model.predict_proba(sample_data)
        
        print(f"Prediction: Class {prediction[0]}")
        print(f"Probability: {probability[0]}")

def main():
    """Main execution function"""
    print("Machine Learning Pipeline Demo")
    print("=" * 40)
    
    # Initialize model
    ml_model = SimpleMLModel(n_samples=1000, n_features=20)
    
    # Generate data
    ml_model.generate_data()
    
    # Train model
    ml_model.train_model()
    
    # Evaluate model
    ml_model.evaluate_model()
    
    # Make sample prediction
    print("\nSample Prediction:")
    print("-" * 20)
    ml_model.predict_sample()

if __name__ == "__main__":
    main()
