# Snake Game Card for Home Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-%3E%3D%202022.3-green.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)

Jednoduchá a zábavná hra Snake přímo v Home Assistantu!

## 🎮 Features

- **Klasická Snake hra**: Ovládání pomocí šipek
- **Responzivní design**: Funguje na desktopu i mobilu
- **Home Assistant téma**: Automaticky se přizpůsobí vašemu tématu
- **Progresivní obtížnost**: Hra zrychluje s rostoucím skóre
- **Restart funkce**: Snadný restart přes tlačítko

## 🚀 Instalace

### Metoda 1: HACS (Doporučeno)

1. Otevřete **HACS** ve vašem Home Assistantu
2. Přidejte toto repository jako custom repository
3. Vyhledejte **"Snake Game Card"** v HACS
4. Klikněte na **Download**
5. **Restartujte Home Assistant**
6. Přidejte resource do Lovelace (viz níže)

### Metoda 2: Manuální instalace

1. Zkopírujte složku `custom_components/snake_game` do vaší `config/custom_components/` složky
2. Zkopírujte soubor `www/snake-card.js` do vaší `config/www/` složky
3. **Restartujte Home Assistant**
4. Přidejte resource do Lovelace (viz níže)

## ⚙️ Přidání Resource do Lovelace

**DŮLEŽITÉ:** Po instalaci je NUTNÉ přidat resource do Lovelace!

### Přes UI:
1. Jděte do **Nastavení** → **Dashboardy** → **Resources** (pravý horní rog, tři tečky)
2. Klikněte na **+ Přidat resource**
3. URL: `/local/snake-card.js`
4. Resource type: **JavaScript Module**
5. Klikněte **Vytvořit**

### Přes YAML (configuration.yaml):
```yaml
lovelace:
  mode: yaml
  resources:
    - url: /local/snake-card.js
      type: module
```

## 📋 Použití karty

Po přidání resource můžete přidat kartu na dashboard:

**Přes UI:**
1. Editujte váš dashboard
2. Klikněte **Přidat kartu**
3. Zvolte **Custom: Snake Card** (nebo vyhledejte "snake")

**Přes YAML:**
```yaml
type: custom:snake-card
```

## ⌨️ Ovládání
- **Šipky**: Ovládání hada
- **Restart tlačítko**: Reset hry

## 🐛 Řešení problémů

### Karta se nezobrazuje nebo je "Custom element doesn't exist"

1. **Zkontrolujte, že je přidán resource:**
   - Jděte do Nastavení → Dashboardy → Resources
   - Měli byste vidět `/local/snake-card.js`

2. **Vyčistěte cache prohlížeče:**
   - Stiskněte `Ctrl + Shift + R` (Windows/Linux)
   - Nebo `Cmd + Shift + R` (Mac)

3. **Zkontrolujte konzoli prohlížeče:**
   - Stiskněte `F12`
   - Podívejte se do Console na chybové hlášky

4. **Ověřte správnou cestu k souboru:**
   ```bash
   # Soubor by měl být zde:
   /config/www/snake-card.js
   ```

### Integration se nenačítá

1. **Zkontrolujte logy Home Assistantu:**
   ```
   Nastavení → Systém → Logy
   ```

2. **Ověřte strukturu složek:**
   ```
   config/
   ├── custom_components/
   │   └── snake_game/
   │       ├── __init__.py
   │       └── manifest.json
   └── www/
       └── snake-card.js
   ```

3. **Restartujte Home Assistant** po instalaci

## 📄 License
Tento projekt je pod **MIT License**.

Užijte si Snake v Home Assistantu! 🐍✨

## Support

Pokud se vám karta líbí, dejte prosím ⭐ hvězdičku tomuto repository!

Našli jste bug nebo máte nápad na vylepšení? Vytvořte issue.

## http://buymeacoffee.com/jakubhruby
