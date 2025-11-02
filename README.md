# Snake Game Card for Home Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-%3E%3D%202022.3-green.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)

A fun and interactive Snake game card for Home Assistant with portal mechanics and multiple game modes.
![start](https://github.com/user-attachments/assets/76fb6bfd-8b7a-4978-917c-6adddd3db34d)

![end](https://github.com/user-attachments/assets/69eee880-4eda-4a43-9498-ed78a2b8c5ad)

## 🎮 Features

- **Two Game Modes**: Classic Snake and Portal Mode  
- **Portal Mechanics**: Teleport through portals for strategic gameplay  
- **Responsive Design**: Works on desktop and mobile devices  
- **Home Assistant Theming**: Automatically adapts to your HA theme  
- **Progressive Difficulty**: Game speeds up as you score points  
- **Visual Effects**: Beautiful portal animations and effects  

## 🚀 Installation

### Method 1: HACS (Recommended)

1. Open **HACS** in your Home Assistant  
1. Add this repository to HACS as a custom repository
2. Search for **"Snake Card"**   in HACS
3. Click **Download this repository with HACS**  
4. Restart Home Assistant 

### Method 2: Manual Installation

1. Download the [`snake-card.js`](snake-card.js) file  
2. Place it in your `config/www/` directory  
3. Add the following to your Lovelace resources:

```yaml
resources:
  - url: /local/snake-card.js
    type: module
```

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
mode: portals  # options: "classic" or "portals"
```

## 🎯 Game Modes

### 🐍 Classic Mode
- Traditional Snake gameplay  
- Collide with walls → Game Over  

### 🌀 Portal Mode
- Teleport through portals  
- Wrap-around screen edges  
- 4 portal pairs on the map  

## ⌨️ Controls
- **Arrow Keys**: Control snake direction  
- **Restart Button**: Reset the game  
- **Mode Buttons**: Switch between Classic and Portal modes  

## 📄 License
This project is licensed under the **MIT License**.  

Enjoy playing Snake in Home Assistant! 🐍✨

## Support

If you like this card, please ⭐ star this repository!

Found a bug or have a feature request? Please open an issue.



## http://buymeacoffee.com/jakubhruby


<img width="150" height="150" alt="qr-code" src="https://github.com/user-attachments/assets/2581bf36-7f7d-4745-b792-d1abaca6e57d" />

