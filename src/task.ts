export var task = `{
\t"version": "2.0.0",
\t"tasks": [
\t\t{
\t\t\t"label": "build-normal",
\t\t\t"type": "shell",
\t\t\t"command": "pawncc", // pawncc compiler location, we suggest to add pawncc path into your environment
\t\t\t"args": [
\t\t\t\t"grandlarc.pwn", // source file of gamemode
\t\t\t\t"-Dgamemodes", // Additional compiler arguments  
\t\t\t\t"-;+",
\t\t\t\t"-(+",
\t\t\t\t"-d3"
\t\t\t],
\t\t\t"group": {
\t\t\t\t"kind": "build",
\t\t\t\t"isDefault": true
\t\t\t},
\t\t\t"isBackground": false,
\t\t\t"presentation": {
\t\t\t\t"reveal": "silent",
\t\t\t\t"panel": "dedicated"
\t\t\t},
\t\t\t"problemMatcher": "$pawncc"
\t\t}
\t]
}`;