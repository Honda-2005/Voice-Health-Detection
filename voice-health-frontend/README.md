# Voice Health Detection

## Overview
Voice Health Detection is a web application designed to monitor and analyze voice health. This project aims to provide users with insights into their vocal health through a user-friendly interface and robust functionality.

## Project Structure
```
voice-health-frontend
├── public
│   └── index.html          # Main HTML document
├── src
│   ├── css
│   │   └── styles.css      # Main styles for the application
│   ├── js
│   │   ├── app.js          # Main JavaScript file
│   │   ├── auth.js         # Authentication-related functionality
│   │   └── ui.js           # User interface interactions
│   ├── components
│   │   ├── header.js       # Header component
│   │   └── modal.js        # Modal dialog component
│   └── pages
│       ├── login.html      # Login page
│       └── profile.html     # User profile page
├── package.json            # npm configuration file
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/Honda-2005/Voice-Health-Detection.git
   ```
2. Navigate to the project directory:
   ```
   cd Voice-Health-Detection/voice-health-frontend
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the application, you can use a local server. You can use tools like `live-server` or `http-server` to serve the `public` directory.

1. Install `live-server` globally (if not already installed):
   ```
   npm install -g live-server
   ```
2. Run the server:
   ```
   live-server public
   ```

### Usage
- Open your browser and navigate to `http://localhost:8080` (or the port specified by your server).
- You can log in using the login page and access your profile.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.