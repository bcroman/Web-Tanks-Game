# Web Tanks Game
Web Programming Assessment - Multiplayer Game

# Requirment 
npm init - Node Server  
npm install express - Web Server  
npm install socket.io - Websockets for Multiplayer  
npm install nodemon - Server Restart  
npm install box2dweb-commonjs  Game Engine

# Setup Game Server
In Terminal, run the command 'npm run setup' which will install the needed libraries  

## Powershell Issues  
If there is an error when running this command, you need go into powershell (admin) and, enter the command 'Set-ExecutionPolicy RemoteSigned' which allow scripts to run locally on machine like Node.  
Enter the command 'Get-ExecutionPolicy' to check that policy is updated then try to run the node command again.  
You can enter 'Set-ExecutionPolicy Restricted' to undo the machine policy changes.  
