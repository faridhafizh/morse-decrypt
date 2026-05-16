![MORSE PRO Banner](public/banner.png)

**Morse Pro** is a high-performance, real-time Morse code decryption application built with Next.js. It leverages computer vision techniques to decode Morse code signals from light sources captured via the device camera. Featuring a premium glassmorphic UI and secure Passkey (WebAuthn) authentication, it offers a state-of-the-art experience for Morse code communication.

## ✨ Key Features

-   **📸 Real-time Light-based Decoding**: Uses the camera to detect and decode Morse code from flashing light sources (e.g., flashlights, signal lamps).
-   **🔐 Passkey Authentication**: Secure, passwordless login using WebAuthn/Passkeys for a modern and frictionless user experience.
-   **💎 Premium Glassmorphic UI**: Beautifully designed interface with smooth animations powered by Framer Motion.
-   **📊 Adaptive Signal Analysis**: Intelligent luminance thresholding to ensure accurate decoding across various lighting conditions.
-   **⚡ High Performance**: Optimized Next.js architecture with real-time feedback and signal metering.

## 🛠 Tech Stack

-   **Frontend**: Next.js 14, React, TypeScript
-   **Styling**: CSS Modules / Glassmorphism
-   **Animations**: Framer Motion
-   **Icons**: Lucide React
-   **Authentication**: WebAuthn API (Passkeys)
-   **Decoding Logic**: Custom adaptive luminance processing

## 🚀 Getting Started

### Prerequisites

-   Node.js (LTS version)
-   npm or yarn
-   A modern browser with Camera and WebAuthn support.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/faridhafizh/morse-decrypt.git
    cd morse-decrypt
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Navigate to `https://localhost:3000`.

> [!IMPORTANT]
> **WebAuthn requires HTTPS.** To test Passkey authentication locally, you must run the app over HTTPS. You can use tools like `mkcert` to generate local certificates or deploy to a platform with automatic SSL like Vercel.

## 📖 Usage

1.  **Login**: Use the Passkey authentication to securely sign in.
2.  **Grant Permissions**: Allow camera access when prompted.
3.  **Scan**: Point your camera at a flashing light source. Ensure the light source is within the center target frame.
4.  **Monitor**: The signal meter at the bottom will indicate the detected luminance levels.
5.  **Decode**: The application will automatically translate dots and dashes into text in real-time.
6.  **Capture**: Click "Stop & Capture" to save the decoded message to the display.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## 🛡 Security

For information on how to report security vulnerabilities, please see our [Security Policy](SECURITY.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ by [Farid Hafizh](https://github.com/faridhafizh)
