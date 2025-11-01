"""Snake Game integration for Home Assistant"""
from homeassistant.core import HomeAssistant

DOMAIN = "snake_game"

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up Snake Game."""
    
    async def restart_game_service(call):
        """Service to restart the game (frontend handles actual reset)."""
        hass.bus.async_fire("snake_game_restart", {})
    
    hass.services.async_register(DOMAIN, "restart", restart_game_service)
    return True
