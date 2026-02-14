# AP IDE CLI Commands

The `ap` command is the built-in CLI for the AP AI IDE, offering tools for system management, installations, and help.

## General Commands

| Command | Description |
|---------|-------------|
| `ap -v` | Show the current version of the IDE and AP CLI. |
| `ap -help` | Display this help menu. |
| `ap status` | Check if PHP, Node, and Git are correctly installed. |
| `ap clear` | Clear the terminal screen. |
| `ap list` | List installed tools and their status. |

## Installation Commands

Use `ap install` to quickly set up environments or tools.

| Command | Description |
|---------|-------------|
| `ap install php` | Guides or automates PHP installation (XAMPP search). |
| `ap install node` | Displays guide for Node.js/NVM installation. |
| `ap install git` | Displays guide for Git installation. |
| `ap install composer` | Setup guide for PHP Composer. |

## Interactive Tooling

When using tools that require inputs (like `npx create-next-app`), the IDE attempts to use non-interactive defaults. If direct interaction is needed, please ensure you are using the WebSocket-enabled terminal (coming soon).

---
*AP IDE CLI v1.0.0*
