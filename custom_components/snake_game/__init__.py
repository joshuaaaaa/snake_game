"""Snake Game integration for Home Assistant"""
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import add_extra_js_url

DOMAIN = "snake_game"

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up Snake Game."""

    # Registrace služby pro restart
    async def restart_game_service(call):
        """Service to restart the game (frontend handles actual reset)."""
        hass.bus.async_fire("snake_game_restart", {})

    hass.services.async_register(DOMAIN, "restart", restart_game_service)

    # Registrace frontendového JS (hra)
    add_extra_js_url(hass, "/hacsfiles/snake_game/snake-card.js")

    return True
