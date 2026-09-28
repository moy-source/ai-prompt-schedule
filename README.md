# AI Prompt Schedule

Schedule prompts for AI desktop apps and VS Code chat extensions. Each scheduled message has its own target, local date and time, and prompt. The extension stores schedules in your VS Code profile and manages them from the **AI Schedule** Activity Bar view.

Licensed under the MIT License. See [LICENSE](LICENSE).

## Features

- Schedule multiple prompts independently for Codex Desktop, ChatGPT Desktop, Codex in VS Code, Claude Code, Gemini Code Assist, GitHub Copilot Chat, or Cline.
- Choose the target app or IDE chat separately for every scheduled message.
- Edit or delete scheduled messages, including changing the prompt, time, and target.
- Set a default target, disable individual targets, or switch between automatic sending and clipboard reminders.
- Keep schedules across VS Code window reloads.

## Requirements

- VS Code 1.138.0 or newer.
- Keep VS Code running while scheduled prompts are waiting.
- Install and sign in to the app or extension you plan to use.
- Automatic keyboard sending is supported on Windows and macOS. Linux can use clipboard reminders.

## Installation

This extension is distributed as a VSIX from [GitHub Releases](https://github.com/moy-source/ai-prompt-schedule/releases).

1. Download the latest `ai-prompt-schedule-<version>.vsix` file from the release assets.
2. In VS Code, open the Command Palette with `Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS.
3. Run **Extensions: Install from VSIX...** and select the downloaded file.
4. Reload VS Code if prompted. Open **AI Schedule** in the Activity Bar.

Command-line installation is also available:

```powershell
code --install-extension .\ai-prompt-schedule-0.0.6.vsix
```

```sh
code --install-extension ./ai-prompt-schedule-0.0.6.vsix
```

The extension is currently distributed through GitHub Releases; it may not appear in the VS Code Extensions Marketplace search.

## Usage

1. Open **AI Schedule** from the Activity Bar and select a target in the **Agent** list. The list distinguishes **OpenAI Codex (VS Code extension)** from **Codex Desktop (active window)**; ChatGPT Desktop is also listed separately.
2. Choose the date and time in your local timezone, enter the prompt, and schedule it.
3. To revise a pending message, choose **Edit** to change its prompt, time, or target. Use **Delete** to remove it.
4. Use `AI Prompt Schedule: Show Scheduled AI Messages` from the Command Palette to manage pending messages, or `AI Prompt Schedule: Cancel Scheduled AI Messages` to clear all of them.

Choose a default target under **Settings > Extensions > AI Prompt Schedule > Default Provider**. The dashboard also lets you enable or disable supported targets. A disabled target's scheduled messages remain queued until it is enabled again.

## Operating System Setup

### Windows

- For VS Code chat extensions, keep VS Code in the foreground when a prompt is due. The desktop must be unlocked.
- For Codex Desktop or ChatGPT Desktop, keep the selected app in the foreground with the intended conversation open and the message composer focused. The extension does not open a new conversation or switch apps.
- Automatic sending uses PowerShell keyboard automation. No extra accessibility permission is required.
- If the target app is not active when its prompt is due, the message remains queued. The extension can only detect the active app, not verify which control inside that app has focus.

### macOS

- Keep VS Code running. For desktop-app targets, the selected app must be frontmost with the intended conversation open and its message composer focused at send time.
- Allow VS Code to control the computer when macOS requests Automation access. If keyboard automation is blocked, open **System Settings > Privacy & Security > Accessibility** and allow VS Code (or the VS Code build hosting the extension).
- The macOS automation uses `System Events` to paste and submit the prompt. Permission names and prompts can vary by macOS version.
- If the selected app is not frontmost when its prompt is due, the message remains queued. The extension does not inspect the chat UI or confirm the focused control.

### Linux

- Automatic keyboard submission is not supported. Disable **AI Prompt Schedule: Automatic Send** to receive clipboard reminders and send the prompt manually.

## Sending and Privacy

Automatic sending is controlled by **AI Prompt Schedule: Automatic Send** in VS Code Settings. Desktop targets are sent only to the matching foreground app. For both desktop apps and IDE chats, keyboard automation types into whichever composer currently has focus; check the target and conversation before enabling unattended sends.

The extension does not read AI credentials or transmit prompts to a separate service. Schedules are stored in VS Code profile storage. At send time, the prompt is copied to the system clipboard and submitted through the selected app's user interface. Clipboard contents are therefore replaced by the scheduled prompt.

## Commands

- `AI Prompt Schedule: Schedule AI Message` creates a message for a selected target.
- `AI Prompt Schedule: Show Scheduled AI Messages` opens pending entries for editing or deletion.
- `AI Prompt Schedule: Cancel Scheduled AI Messages` deletes all pending entries.

## Development

```sh
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host. Package a local VSIX with `npx @vscode/vsce package`.