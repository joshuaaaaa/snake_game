# Snake Game Card for Home Assistant
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-%3E%3D%202022.3-green.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)

A fun and interactive Snake game card for Home Assistant.

![start](https://github.com/user-attachments/assets/76fb6bfd-8b7a-4978-917c-6adddd3db34d)
![end](https://github.com/user-attachments/assets/69eee880-4eda-4a43-9498-ed78a2b8c5ad)

## 🎮 Features
- **Classic Snake Gameplay**: Guide the snake to eat food and grow
- **Responsive Design**: Works on desktop and mobile devices
- **Home Assistant Theming**: Automatically adapts to your HA theme
- **Progressive Difficulty**: Game speeds up as you score points
- **Visual Effects**: Smooth animations and flashing food

## 🚀 Installation

### Method 1: HACS (Recommended)
1. Open **HACS** in your Home Assistant
2. Click on the **three dots** in the top right corner
3. Select **Custom repositories**
4. Add this repository URL: `https://github.com/joshuaaaaa/snake_game`
5. Select category: **Dashboard**
6. Click **Add**
7. Find **Snake Card** in HACS and click **Download**
8. Restart Home Assistant
9. Add the following to your Lovelace resources:

```yaml
resources:
  - url: /hacsfiles/snake_game/snake_game.js
    type: module
```

### Method 2: Manual Installation
1. Download the [`snake_game.js`](dist/snake_game.js) file
2. Create a `snake_game` folder in your `config/www/` directory
3. Place the `snake_game.js` file in `config/www/snake_game/`
4. Add the following to your Lovelace resources:

```yaml
resources:
  - url: /local/snake_game/snake_game.js
    type: module
```

5. Restart Home Assistant

## 📋 Configuration

Add the card to your Lovelace dashboard:

**Via UI:**
1. Edit your dashboard
2. Click **Add Card**
3. Scroll down to **Custom Cards**
4. Select **Snake Card**

**Via YAML:**
```yaml
type: custom:snake-card
```

## ⌨️ Controls
- **Arrow Keys**: Control snake direction (↑ ↓ ← →)
- **Restart Button**: Reset the game

## 🎯 How to Play
1. Use arrow keys to control the snake
2. Eat the food (flashing squares) to grow
3. Avoid hitting yourself
4. Try to beat your high score!

## 📄 License
This project is licensed under the **MIT License**.

Enjoy playing Snake in Home Assistant! 🐍✨

## Support
If you like this card, please ⭐ star this repository!

Found a bug or have a feature request? Please open an issue.

## ☕ Buy me a coffee
<a href="https://buymeacoffee.com/jakubhruby">
  <img width="150" height="150" alt="qr-code" src="https://github.com/user-attachments/assets/2581bf36-7f7d-4745-b792-d1abaca6e57d" />
</a>
