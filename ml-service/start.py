#!/usr/bin/env python3
"""
ML Service Startup Script
Trains model if not exists and starts Flask server
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Main entry point"""
    # Check if model exists
    model_path = './ml-service/models/model.joblib'
    
    if not os.path.exists(model_path):
        logger.info('Model not found. Training...')
        try:
            from train_model import train_model
            train_model()
        except Exception as e:
            logger.error(f'Failed to train model: {str(e)}')
            logger.info('Continuing with untrained model')
    
    # Start Flask app
    logger.info('Starting ML Service...')
    os.system('python app.py')

if __name__ == '__main__':
    main()
