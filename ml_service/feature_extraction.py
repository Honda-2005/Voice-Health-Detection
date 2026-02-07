"""
Voice Feature Extraction Module
Extracts 22 acoustic features from audio files for Parkinson's Disease detection.

Features extracted:
- Pitch Parameters: MDVP:Fo(Hz), MDVP:Fhi(Hz), MDVP:Flo(Hz)
- Jitter Variants: MDVP:Jitter(%), MDVP:Jitter(Abs), MDVP:RAP, MDVP:PPQ, Jitter:DDP
- Shimmer Variants: MDVP:Shimmer, MDVP:Shimmer(dB), Shimmer:APQ3, Shimmer:APQ5, MDVP:APQ, Shimmer:DDA
- Harmonicity: NHR, HNR
- Non-Linear Features: RPDE, DFA, spread1, spread2, D2, PPE
"""

import parselmouth
from parselmouth.praat import call
import numpy as np
import nolds
from scipy.stats import entropy
import os
import tempfile
from typing import Dict, Optional, Tuple


def convert_to_wav(file_path: str) -> str:
    """
    Converts various audio formats to WAV using pydub.
    Returns the path to the temporary WAV file.
    
    Args:
        file_path: Path to the input audio file
        
    Returns:
        Path to WAV file (original if already WAV, temp file otherwise)
    """
    if file_path.lower().endswith(".wav"):
        return file_path
        
    try:
        from pydub import AudioSegment
        
        audio = AudioSegment.from_file(file_path)
        # Create a temporary file
        fd, temp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        audio.export(temp_path, format="wav")
        return temp_path
    except Exception as e:
        raise ValueError(f"Audio conversion failed for {file_path}: {e}")


def calculate_nonlinear_features(
    sound: parselmouth.Sound, 
    f0min: float = 75, 
    f0max: float = 500
) -> Tuple[float, float, float, float, float, float]:
    """
    Calculates advanced/nonlinear features: RPDE, DFA, PPE, D2, spread1, spread2.
    
    Args:
        sound: Parselmouth Sound object
        f0min: Minimum pitch frequency (Hz)
        f0max: Maximum pitch frequency (Hz)
        
    Returns:
        Tuple of (RPDE, DFA, spread1, spread2, D2, PPE)
    """
    pitch = sound.to_pitch(time_step=0.01, pitch_floor=f0min, pitch_ceiling=f0max)
    f0 = pitch.selected_array['frequency']
    f0 = f0[f0 != 0]  # Remove unvoiced frames
    
    if len(f0) < 100:
        # Signal too short for nonlinear analysis
        return np.nan, np.nan, np.nan, np.nan, np.nan, np.nan
    
    # 1. PPE (Pitch Period Entropy)
    try:
        periods = 1.0 / f0
        log_periods = np.log2(periods)
        rel_changes = np.diff(log_periods)
        hist, bins = np.histogram(rel_changes, bins=50, density=True)
        hist = hist[hist > 0]
        PPE = entropy(hist)
    except:
        PPE = np.nan

    # 2. DFA (Detrended Fluctuation Analysis)
    try:
        DFA = nolds.dfa(f0)
    except:
        DFA = np.nan

    # 3. RPDE (Recurrence Period Density Entropy) - Using Sample Entropy as proxy
    try:
        RPDE = nolds.sampen(f0)
    except:
        RPDE = np.nan

    # 4. D2 (Correlation Dimension)
    try:
        D2 = nolds.corr_dim(f0, emb_dim=5)
    except:
        D2 = np.nan
        
    # 5. spread1 (nonlinear measure of fundamental frequency variation)
    spread1 = np.std(f0)
    
    # 6. spread2 (IQR-based measure)
    q75, q25 = np.percentile(f0, [75, 25])
    spread2 = q75 - q25
    
    return RPDE, DFA, spread1, spread2, D2, PPE


def extract_voice_features(file_path: str) -> Optional[Dict[str, float]]:
    """
    Extracts all 22 acoustic features from an audio file.
    
    Args:
        file_path: Path to the audio file (supports wav, mp3, m4a, flac, ogg)
        
    Returns:
        Dictionary containing 22 features, or None if extraction fails
    """
    wav_path = None
    try:
        # Convert to WAV if needed
        wav_path = convert_to_wav(file_path)
        
        # Load audio
        sound = parselmouth.Sound(wav_path)
        
        # Pitch parameters
        f0min = 75
        f0max = 500
        
        # Create pitch object
        pitch = sound.to_pitch(time_step=None, pitch_floor=f0min, pitch_ceiling=f0max)
        
        # Extract scalar pitch values
        fo_mean = call(pitch, "Get mean", 0, 0, "Hertz")  # MDVP:Fo(Hz)
        fhi = call(pitch, "Get maximum", 0, 0, "Hertz", "Parabolic")  # MDVP:Fhi(Hz)
        flo = call(pitch, "Get minimum", 0, 0, "Hertz", "Parabolic")  # MDVP:Flo(Hz)
        
        # Harmonicity
        harmonicity = sound.to_harmonicity_cc(
            time_step=0.01, 
            minimum_pitch=f0min, 
            silence_threshold=0.1, 
            periods_per_window=1.0
        )
        hnr = call(harmonicity, "Get mean", 0, 0)  # HNR
        nhr = 1 / hnr if hnr != 0 else 0  # NHR approximation
        
        # Jitter & Shimmer via PointProcess
        point_process = call(sound, "To PointProcess (periodic, cc)", f0min, f0max)
        
        # Jitter measurements
        jitter_percent = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3) * 100
        jitter_abs = call(point_process, "Get jitter (local, absolute)", 0, 0, 0.0001, 0.02, 1.3)
        jitter_rap = call(point_process, "Get jitter (rap)", 0, 0, 0.0001, 0.02, 1.3)
        jitter_ppq = call(point_process, "Get jitter (ppq5)", 0, 0, 0.0001, 0.02, 1.3)
        jitter_ddp = call(point_process, "Get jitter (ddp)", 0, 0, 0.0001, 0.02, 1.3)
        
        # Shimmer measurements
        shimmer_local = call([sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_db = call([sound, point_process], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_apq3 = call([sound, point_process], "Get shimmer (apq3)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_apq5 = call([sound, point_process], "Get shimmer (apq5)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_apq = call([sound, point_process], "Get shimmer (apq11)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_dda = call([sound, point_process], "Get shimmer (dda)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
        
        # Advanced features
        rpde, dfa, spread1, spread2, d2, ppe = calculate_nonlinear_features(sound, f0min, f0max)
        
        return {
            "name": os.path.basename(file_path),
            "MDVP:Fo(Hz)": fo_mean,
            "MDVP:Fhi(Hz)": fhi,
            "MDVP:Flo(Hz)": flo,
            "MDVP:Jitter(%)": jitter_percent,
            "MDVP:Jitter(Abs)": jitter_abs,
            "MDVP:RAP": jitter_rap,
            "MDVP:PPQ": jitter_ppq,
            "Jitter:DDP": jitter_ddp,
            "MDVP:Shimmer": shimmer_local,
            "MDVP:Shimmer(dB)": shimmer_db,
            "Shimmer:APQ3": shimmer_apq3,
            "Shimmer:APQ5": shimmer_apq5,
            "MDVP:APQ": shimmer_apq,
            "Shimmer:DDA": shimmer_dda,
            "NHR": nhr,
            "HNR": hnr,
            "RPDE": rpde,
            "DFA": dfa,
            "spread1": spread1,
            "spread2": spread2,
            "D2": d2,
            "PPE": ppe
        }
        
    except Exception as e:
        print(f"Feature extraction failed: {e}")
        return None
        
    finally:
        # Clean up temp file if we created one
        if wav_path and wav_path != file_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except:
                pass


if __name__ == "__main__":
    # Test the feature extraction
    import sys
    
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        print(f"Extracting features from: {test_file}")
        features = extract_voice_features(test_file)
        
        if features:
            print("\nExtracted Features:")
            for key, value in features.items():
                print(f"  {key}: {value}")
        else:
            print("Feature extraction failed!")
    else:
        print("Usage: python feature_extraction.py <audio_file_path>")
