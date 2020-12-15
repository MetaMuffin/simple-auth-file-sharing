# simple-auth-file-sharing

A simple Node.js server to server files protected with a password and username.

## Usage

Create a folder named `files` in the project root.

In it, you can place files or folders in the format `<username>:<password>` 
which can then be accessed by logging in with this user.
This also limits usernames and passwords to every character except `/ . :`
If the file is a folder a directory listing is generated.
