const WebSocket = require('ws');
const os = require('os');
const pty = require('node-pty');

const wss = new WebSocket.Server({ port: 4000 });

console.log('Terminal Server running on port 4000');

wss.on('connection', (ws) => {
    console.log('Client connected');

    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.CWD || process.cwd(),
        env: process.env
    });

    // Send output to client
    ptyProcess.on('data', (data) => {
        ws.send(data);
    });

    // Receive input from client
    ws.on('message', (message) => {
        ptyProcess.write(message);
    });

    // Cleanup
    ws.on('close', () => {
        console.log('Client disconnected');
        ptyProcess.kill();
    });

    ptyProcess.on('exit', () => {
        console.log('Shell exited');
        ws.close();
    });
});
