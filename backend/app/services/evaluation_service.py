"""
Evaluation Service
Business logic for model evaluation and metrics
"""

import json
from pathlib import Path
from typing import Dict
from datetime import datetime


class EvaluationService:
    """Service for model evaluation metrics"""
    
    def __init__(self):
        self.metrics_path = self._get_metrics_path()
    
    @staticmethod
    def _get_metrics_path() -> Path:
        """Get path to evaluation metrics file"""
        base_dir = Path(__file__).parent.parent.parent.parent
        return base_dir / 'ml_training' / 'models' / 'evaluation_metrics.json'
    
    def get_metrics(self) -> Dict:
        """
        Load and return evaluation metrics
        
        Returns:
            Dictionary of evaluation metrics
            
        Raises:
            FileNotFoundError: If metrics file doesn't exist
        """
        if not self.metrics_path.exists():
            raise FileNotFoundError(
                f"Metrics file not found: {self.metrics_path}\n"
                "Please run evaluation: python -m ml_training.dataset.evaluate"
            )
        
        with open(self.metrics_path, 'r') as f:
            metrics = json.load(f)
        
        # Format for frontend display
        formatted_metrics = {
            'overall': {
                'accuracy': round(metrics.get('accuracy', 0) * 100, 2),
                'precision': round(metrics.get('precision', 0) * 100, 2),
                'recall': round(metrics.get('recall', 0) * 100, 2),
                'f1Score': round(metrics.get('f1_score', 0) * 100, 2)
            },
            'trainingInfo': {
                'modelType': metrics.get('model_type', 'random_forest'),
                'nFeatures': metrics.get('n_features', 0),
                'nTestSamples': metrics.get('n_test_samples', 0),
                'trainAccuracy': round(metrics.get('train_accuracy', 0) * 100, 2) if 'train_accuracy' in metrics else None
            },
            'confusionMatrix': metrics.get('confusion_matrix', [[0, 0], [0, 0]]),
            'lastUpdated': self._get_file_modified_time()
        }
        
        if 'auc' in metrics:
            formatted_metrics['overall']['auc'] = round(metrics['auc'] * 100, 2)
        
        return formatted_metrics
    
    def _get_file_modified_time(self) -> str:
        """Get last modified time of metrics file"""
        if self.metrics_path.exists():
            timestamp = self.metrics_path.stat().st_mtime
            return datetime.fromtimestamp(timestamp).isoformat()
        return datetime.utcnow().isoformat()
    
    def get_model_status(self) -> Dict:
        """
        Get model status information
        
        Returns:
            Dictionary with model status
        """
        from backend.app.models.prediction_model import prediction_model
        
        model_path = Path(__file__).parent.parent.parent.parent / 'ml_training' / 'models' / 'parkinson_voice_model.pkl'
        scaler_path = Path(__file__).parent.parent.parent.parent / 'ml_training' / 'models' / 'scaler.pkl'
        
        status = {
            'modelLoaded': prediction_model.is_loaded,
            'modelExists': model_path.exists(),
            'scalerExists': scaler_path.exists(),
            'metricsAvailable': self.metrics_path.exists(),
            'ready': prediction_model.is_loaded and self.metrics_path.exists()
        }
        
        if model_path.exists():
            status['modelPath'] = str(model_path)
            status['modelSize'] = model_path.stat().st_size
        
        if self.metrics_path.exists():
            try:
                metrics = self.get_metrics()
                status['modelAccuracy'] = metrics['overall']['accuracy']
            except:
                pass
        
        return status


# Singleton instance
evaluation_service = EvaluationService()
