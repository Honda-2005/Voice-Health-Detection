const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

const log = (color, tag, message) => {
    console.log(`${color}[${tag}]${colors.reset} ${message}`);
};

// Check if model exists
const modelPath = path.join(__dirname, 'ml-service', 'models', 'model.joblib');
const needsTraining = !fs.existsSync(modelPath);

const startProcess = (command, args, name, color, cwd = process.cwd()) => {
    const proc = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    proc.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`${color}[${name}]${colors.reset} ${line}`);
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.error(`${colors.red}[${name}:ERR]${colors.reset} ${line}`);
        });
    });

    proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
            log(colors.red, name, `Exited with code ${code}`);
        }
    });

    return proc;
};

const main = async () => {
    log(colors.green, "SYSTEM", "🚀 Starting Voice Health Detection System...");

    // Step 1: Install Python Dependencies (if needed)
    if (process.argv.includes('--install')) {
        log(colors.yellow, "SETUP", "Installing Python dependencies...");
        const install = spawn('python -m pip install -r ml-service/requirements.txt', { shell: true, stdio: 'inherit' });
        await new Promise(resolve => install.on('close', resolve));
    }

    // Step 2: Train Model (if missing or forced)
    if (needsTraining || process.argv.includes('--train')) {
        log(colors.yellow, "ML-TRAIN", "🧠 Training ML Model (this may take a minute)...");
        const train = spawn('python ml-service/train_model_optimized.py', { shell: true, stdio: 'inherit' });

        // Wait for training to finish before starting services
        await new Promise((resolve, reject) => {
            train.on('close', (code) => {
                if (code === 0) {
                    log(colors.green, "ML-TRAIN", "✅ Training Complete!");
                    resolve();
                } else {
                    log(colors.red, "ML-TRAIN", "❌ Training Failed!");
                    // Don't stop, let manual fix happen
                    resolve();
                }
            });
        });
    } else {
        log(colors.green, "ML-TRAIN", "✅ Model already exists, skipping training.");
    }

    // Step 3: Start Services
    log(colors.cyan, "SYSTEM", "⚡ Starting Services...");

    // Start ML Service
    const mlService = startProcess('python', ['ml-service/app.py'], 'ML-SERVICE', colors.blue);

    // Wait a bit for ML service to warm up
    setTimeout(() => {
        // Start Backend
        const backend = startProcess('npm', ['run', 'dev'], 'BACKEND', colors.green);
    }, 2000);

};

main().catch(console.error);
