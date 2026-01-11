# AP Web IDE API

## Overview
A robust PHP-based backend service designed to power a web-integrated development environment. It manages user authentication via GitHub OAuth, handles hierarchical project structures in MySQL, and provides a secure filesystem abstraction layer for remote code editing and management.

## Features
- PHP: Core server-side logic and API routing
- MySQL: Relational data storage for users, projects, and session persistence
- GitHub OAuth: Secure third-party authentication and identity management
- Filesystem API: Real-time file CRUD operations with workspace isolation
- Session Management: Database-backed session handling for stateless environments

## Getting Started
### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/apreezofficial/ap-web-ide.git
   ```
2. Import the database schema:
   ```bash
   mysql -u root -p ap_ide < server/database.sql
   ```
3. Configure your web server (Apache/Nginx) to point to the `server/` directory.
4. Ensure the `server/storage` directory has write permissions:
   ```bash
   chmod -R 777 server/storage
   ```

### Environment Variables
Configure these constants in `server/config/config.php`:
- `DB_HOST`: localhost
- `DB_NAME`: ap_ide
- `DB_USER`: root
- `DB_PASS`: (your password)
- `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret
- `GITHUB_REDIRECT_URI`: http://localhost:3000/api/auth/callback

## API Documentation
### Base URL
`http://localhost/ap-web-ide/server/api`

### Endpoints

#### GET /auth/login.php
Initiates the GitHub OAuth handshake by redirecting the user to the GitHub authorization page.
**Response**:
302 Redirect to GitHub.

---

#### GET /auth/callback.php
Handles the code returned from GitHub to exchange it for an access token and establish a user session.
**Request**:
Query Parameters: `code` (string), `state` (string)
**Response**:
302 Redirect to dashboard.

---

#### GET /auth/user.php
Retrieves the currently authenticated user session data.
**Response**:
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/u/123",
    "created_at": "2023-10-27 10:00:00"
  }
}
```

---

#### POST /projects/create.php
Creates a new project workspace for the authenticated user.
**Request**:
```json
{
  "name": "My New Project",
  "template": "blank"
}
```
**Response**:
```json
{
  "success": true,
  "id": 5
}
```
**Errors**:
- 401: Unauthorized
- 400: Project name is required

---

#### GET /projects/list.php
Lists all projects belonging to the authenticated user.
**Response**:
```json
{
  "projects": [
    {
      "id": 5,
      "name": "My New Project",
      "repo_url": null,
      "path": "project_hash_id",
      "last_accessed": "2023-10-27 10:05:00"
    }
  ]
}
```

---

#### GET /projects/get.php
Fetches detailed information for a specific project.
**Request**:
Query Parameters: `id` (integer)
**Response**:
```json
{
  "project": {
    "id": 5,
    "name": "My New Project",
    "path": "project_hash_id",
    "web_url": "http://localhost/server/storage/workspaces/1/project_hash_id"
  }
}
```
**Errors**:
- 404: Project not found

---

#### POST /projects/delete.php
Permanently removes a project and its associated files.
**Request**:
```json
{
  "id": 5
}
```
**Response**:
```json
{
  "success": true
}
```

---

#### GET /files/list.php
Lists files and directories within a specific project path.
**Request**:
Query Parameters: `project_id` (integer), `path` (string)
**Response**:
```json
{
  "files": [
    {
      "name": "index.php",
      "type": "file",
      "size": 1024
    },
    {
      "name": "css",
      "type": "dir"
    }
  ]
}
```

---

#### GET /files/read.php
Retrieves the raw text content of a file.
**Request**:
Query Parameters: `project_id` (integer), `path` (string)
**Response**:
```json
{
  "content": "<?php echo 'hello world'; ?>"
}
```

---

#### POST /files/write.php
Updates or creates a file with the provided content.
**Request**:
```json
{
  "project_id": 5,
  "path": "index.php",
  "content": "<?php echo 'updated content'; ?>"
}
```
**Response**:
```json
{
  "success": true
}
```

---

#### POST /files/delete.php
Deletes a specific file or directory within a project.
**Request**:
```json
{
  "project_id": 5,
  "path": "old_file.php"
}
```
**Response**:
```json
{
  "success": true
}
```

## Technologies Used
| Technology | Purpose |
| :--- | :--- |
| [PHP](https://www.php.net/) | Server-side environment |
| [MySQL](https://www.mysql.com/) | Relational database management |
| [GitHub API](https://docs.github.com/en/rest) | Authentication and repository data |
| [XAMPP](https://www.apachefriends.org/) | Local development stack |

## Author Info
Developed with a focus on scalable architecture and secure file handling.
- **GitHub**: [apreezofficial](https://github.com/apreezofficial)
- **LinkedIn**: [Your Name]
- **Twitter**: [@YourHandle]

![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)