# Tanks Game 
Tanks Game is a real-time multiplayer browser game where players control tanks in a 2D physics-based arena and battle each other until only one tank remains.  
The objective is to outlast and destroy opponents using strategic movement, turret aiming, and projectile physics.

This project was created as part of an assignment for the module “Web Programming”.

## How to Play
- Enter a nickname on the login screen
- Select your tank colour
- Wait in the lobby for all players to join
- When the match starts:
- Use movement controls to position your tank
- Aim your turret and fire shells at opponents
- Reduce enemy tanks to 0 HP to eliminate them
- The last surviving tank wins the match

## Game/Webite Features
- Real-time multiplayer gameplay using Socket.IO
- Server-authoritative physics engine (Box2D)
- Lobby system that waits for required players
- Multiple randomly selected maps
- Tank health system with damage
- Player-selectable preset tank colours
- Turret aiming and projectile shooting
- Game Over screen with winner announcement
- Cinematic camera zoom onto the winning tank
- Clean separation between client and server logic

## Controls
- A / Left Arrow - Move Left
- D / Right Arrow - Move Right
- W / Up Arrow - Aim Turret Up
- S / Down Arrow Aim Turret Down
- Space Bar - Fire Bullet

## Installation
### Requirements
- Node.js (v18+ recommended)
- npm (comes with Node.js)
- Modern Web Browser

### Steps
1. Clone the repository:  `git clone https://github.com/bcroman/Web-Tanks-Game.git`
2. Navigate into the project directory:  `cd tanks-game`
3. Install dependencies:  `npm run setup`
4. Start the Server:  `npm start`
5. Open a browser and visit:  `http://localhost:8000`

## Graphics
All tank graphics, UI elements, and maps were created specifically for this project.  
Rendering is handled using the HTML5 Canvas API.

## Credits
Author: Ben Collins  
Project: Tanks Game  
Module: Web Programming  
Version: 1.0.0  
Date: 12/12/2025  