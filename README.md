# Blinded MRI Validation Tool

A specialized web application designed for expert validation of MRI image synthesis. This tool facilitates a double-blind study where experts evaluate the authenticity of synthetic MRI images against real ground truth data.

## Features

- **Blinded Evaluation**: Randomly presents Real vs. Synthetic image pairs to experts.
- **Modality Support**: Automatically detects and displays image modalities (T1, T2, PD) from filenames.
- **Admin Portal**: 
    -   Generates "Blinded Packages" from raw datasets.
    -   Creates `master_key.csv` for ground truth validation.
- **Expert Workflow**:
    -   **Warm-up Phase**: Known cases with immediate feedback to calibrate the expert.
    -   **Test Phase**: Fully blinded cases (Input vs. Target).
- **Data Export**: Generates CSV results containing user choices, response times, and confidence levels.
- **Privacy First**: Runs entirely in the browser. No data is uploaded to any external server during the session.

## Technology Stack

- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Premium Dark Theme)
- **Data Handling**: Client-side parsing of Folder/ZIP structures.

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)

### Installation
1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd blinded-mri-validator
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally
To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Expected Folder Structure

The application requires a specific folder structure for loading local datasets. The dataset folder should contain `warmup` and `test` subdirectories.

```text
MyDataset/
  ├── warmup/
  │   ├── Case1/
  │   │   ├── input.png
  │   │   ├── real.png
  │   │   └── synthetic.png
  │   └── Case2/ ...
  └── test/
      ├── CaseA/ ...
      └── CaseB/ ...
```

*Note: Filenames should contain "input"/"source", "real", and "synthetic"/"gen" to be recognized by the app.*

## Deployment & Distribution

This tool can be deployed via Netlify or similar services. You have two main options for distributing the tool and data to experts.

### Option A: Hybrid (Recommended for Large MRI Sets)
Host the app application online, but distribute the heavy image data separately.

1.  **Host the App**:
    -   Run `npm run build` to create a `dist` folder.
    -   Upload the `dist` folder to [Netlify Drop](https://app.netlify.com/drop).
    -   You get a public link (e.g., `https://mri-validator.netlify.app`).

2.  **Distribute Data**:
    -   Zip your `warmup` and `test` image folders.
    -   Send the Zip file to your experts (Email, Drive, Dropbox).

3.  **Expert Workflow**:
    -   Expert opens your App URL.
    -   Expert extracts the images on their local machine.
    -   Expert clicks **"Load Image Folder"** in the app and selects their folder.
   
    *Pros: Zero storage costs, faster loading for huge files, data privacy.*

### Option B: Fully Bundled (Small Sets Only)
Embed the images directly into the application.

1.  Place all images inside the `public/` directory of this project.
2.  Create a `manifest.json` file pointing to them (relative paths).
3.  Edit `src/App.jsx` to load this new manifest by default instead of the Demo one.
4.  Deploy the app. Experts access everything via just the link.
   
    *Pros: Easiest for experts. Cons: App becomes large/slow if you have GBs of images.*

### Netlify Deployment Notes
-   **Routing**: A `netlify.toml` file is included to handle client-side routing.
-   **Security**: Since the app runs entirely in the browser, there are no server-side secrets or databases to configure.

## User Guide

### For Administrators
1.  Ideally, run the app locally or access via the hidden "Admin Access" button on the landing page.
2.  Select **Generation Mode** to create a package for experts.
3.  Upload your raw dataset (folders containing triplets: `input`, `real`, `synth`).
4.  The tool will generate a zip file containing:
    -   `warmup/` folder
    -   `test/` folder
    -   `master_key.csv` (Keep this safe!)

### For Experts
1.  Open the deployed application.
2.  Click **"Load Image Folder"** and select the folder provided by the administrator (unzipped).
3.  Enter your Name/ID to start.
### Session Flow for Experts
1.  **Warm-up**: 
    -   Observe the Left Input.
    -   Judge if the Right Target is Real or Synthetic.
    -   Click Submit.
    -   **Feedback**: A pop-up tells you if you were right.
2.  **Transition**: Automatically moves to Test phase after warm-up cases are done.
3.  **Test Phase**:
    -   No feedback is provided.
    -   Progress bar updates.
4.  **Completion**:
    -   "Session Complete" screen.
    -   Click **Download Results** to get the CSV.

## File Naming Convention
To ensure the app correctly detects image types and modalities, use the following conventions in your filenames:
-   **Type**: `input`, `real`, `synth` (or `fake`)
-   **Modality**: Append as the last part after an underscore (e.g., `_T1.png`, `_PD.jpg`)
    -   Example: `input_T1.png` -> Displays as **T1**
