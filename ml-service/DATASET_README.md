# 📥 DATASET DOWNLOAD INSTRUCTIONS

## Required Dataset Files

Your Voice Health Detection system requires the **UCI Parkinson's Disease Dataset** for training a real medical-grade model.

### Dataset 1: Parkinson's Binary Classification (REQUIRED)

**File:** `parkinsons.data`  
**Source:** UCI Machine Learning Repository  
**URL:** https://archive.ics.uci.edu/ml/datasets/parkinsons

**Download Steps:**
1. Visit: https://archive.ics.uci.edu/ml/datasets/parkinsons
2. Click "Data Folder"
3. Download `parkinsons.data`
4. Place in: `./ml-service/data/parkinsons.data`

**Dataset Info:**
- **Samples:** 195
- **Features:** 22 biomedical voice measurements
- **Target:** Status (0 = healthy, 1 = Parkinson's)
- **Source:** Max Little, Oxford University

---

### Dataset 2: Parkinson's Telemonitoring (OPTIONAL - Enhanced)

**File:** `parkinsons_updrs.data`  
**Source:** UCI Machine Learning Repository  
**URL:** https://archive.ics.uci.edu/ml/datasets/Parkinsons+Telemonitoring

**Download Steps:**
1. Visit: https://archive.ics.uci.edu/ml/datasets/Parkinsons+Telemonitoring
2. Click "Data Folder"
3. Download `parkinsons_updrs.data`
4. Place in: `./ml-service/data/parkinsons_updrs.data`

**Dataset Info:**
- **Samples:** 5,875
- **Features:** 16 biomedical voice measurements
- **Targets:** motor_UPDRS, total_UPDRS (severity scores)
- **Source:** Athanasios Tsanas, Oxford University

---

## Features in UCI Parkinson's Dataset

The dataset contains the following voice measurements:

| Feature | Description |
|---------|-------------|
| MDVP:Fo(Hz) | Average vocal fundamental frequency |
| MDVP:Fhi(Hz) | Maximum vocal fundamental frequency |
| MDVP:Flo(Hz) | Minimum vocal fundamental frequency |
| MDVP:Jitter(%) | Jitter percentage |
| MDVP:Jitter(Abs) | Absolute jitter |
| MDVP:RAP | Relative amplitude perturbation |
| MDVP:PPQ | Five-point period perturbation quotient |
| Jitter:DDP | Average absolute difference of differences |
| MDVP:Shimmer | Shimmer (variation in amplitude) |
| MDVP:Shimmer(dB) | Shimmer in decibels |
| Shimmer:APQ3 | Three-point amplitude perturbation quotient |
| Shimmer:APQ5 | Five-point amplitude perturbation quotient |
| MDVP:APQ | Amplitude perturbation quotient |
| Shimmer:DDA | Average absolute difference of differences |
| NHR | Noise-to-harmonics ratio |
| HNR | Harmonics-to-noise ratio |
| RPDE | Recurrence period density entropy |
| DFA | Detrended fluctuation analysis |
| spread1 | Nonlinear measure of fundamental frequency |
| spread2 | Nonlinear measure of fundamental frequency |
| D2 | Correlation dimension |
| PPE | Pitch period entropy |

**Target Variable:**
- `status` - Health status (0 = healthy, 1 = Parkinson's disease)

---

## Quick Setup Commands

```bash
# Create data directory
mkdir -p ml-service/data

# Download using curl (Linux/Mac)
cd ml-service/data
curl -O https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data

# Or download using wget
wget https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data

# Verify file exists
ls -la parkinsons.data
```

Or manually download from browser and place in `ml-service/data/`

---

## After Downloading

Once you have `parkinsons.data` in place:

```bash
# Train the model
python ml-service/train_model.py

# Expected output:
# ✅ Dataset loaded: 195 samples
# ✅ Model trained with 85%+ accuracy
# ✅ Model saved to ml-service/models/model.joblib
```

---

## ⚠️ Important Notes

1. **Real Medical Data:** This dataset contains real voice recordings from Parkinson's patients, published in peer-reviewed medical research.

2. **Research Only:** Your application should include disclaimers that this is for research/educational purposes only.

3. **No Medical Diagnosis:** Make it clear to users that this is NOT a substitute for professional medical diagnosis.

4. **Citation:** If you publish results, cite the original research:
   ```
   'Exploiting Nonlinear Recurrence and Fractal Scaling Properties for Voice Disorder Detection', 
   Little MA, McSharry PE, Roberts SJ, Costello DAE, Moroz IM. 
   BioMedical Engineering OnLine 2007, 6:23 (26 June 2007)
   ```

---

## Alternative: Use Pre-Processed Dataset

If you cannot download the dataset, I can help you create a synthetic version for testing purposes (though real data is always better for accuracy).

---

**Once the dataset is in place, run the training script to create your REAL model!**
