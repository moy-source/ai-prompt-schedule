# AI Prompt Schedule

Licensed under the MIT License. See [LICENSE](LICENSE).

Schedule prompts for AI coding agents and have them submitted to the selected chat at a chosen time. AI Prompt Schedule keeps multiple one-time messages in your VS Code profile and provides a compact dashboard to manage them.

## Features

- Schedule multiple prompts, each with its own agent and local date/time.
- Automatically focus, paste, and submit prompts on Windows and macOS.
- Manage pending prompts, enabled agents, default agent, and auto-send from the Activity Bar dashboard.
- Keep schedules across VS Code window reloads.
- Use Codex, Claude Code, Gemini Code Assist, GitHub Copilot Chat, or Cline.

## Requirements

- VS Code 1.138.0 or newer.
- Install the agent extension you want to target. Agents that are not installed are marked in the dashboard.
- VS Code must be running when a prompt is due.

## Getting Started

1. Open **AI Schedule** from the Activity Bar.
2. Choose an enabled agent, set a local date and time, and enter the prompt.
3. Leave VS Code running. When the schedule is due, the extension focuses the agent chat, pastes the prompt, and presses Enter.

You can also run `AI Prompt Schedule: Schedule AI Message` from the Command Palette. Use `AI Prompt Schedule: Show Scheduled AI Messages` to select and cancel individual entries, or `AI Prompt Schedule: Cancel Scheduled AI Messages` to clear all entries.

## Automatic Sending

Automatic sending is enabled by default on Windows and macOS and uses operating-system keyboard automation because agent extensions do not provide a shared API for submitting prompts to an existing conversation.

- On Windows, VS Code must be the foreground application and the desktop must be unlocked. If the selected chat cannot be focused, the prompt remains queued.
- On macOS, grant VS Code Accessibility and Automation permissions in System Settings. The first automation request may show a system permission prompt.
- Disable **AI Prompt Schedule: Automatic Send** in Settings to use clipboard reminders instead.

Keyboard automation submits the prompt to the focused chat. Confirm that the selected agent and conversation are correct before enabling it for unattended use.

## Privacy

Scheduled prompts are stored in VS Code profile storage. The extension does not read agent credentials or transmit prompts to a separate service. At send time, the prompt is placed on the system clipboard and submitted through the selected chat's UI.

## Development

```sh
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host. Package a local VSIX with `npx @vscode/vsce package`.

## Sidebar

Open **AI Schedule** from the Activity Bar to add a prompt, choose an agent and time, toggle supported agents, change the default agent, and cancel scheduled prompts. The schedule list updates immediately when messages are added, removed, or sent.

## Commands

- `AI Prompt Schedule: Schedule AI Message` chooses an enabled agent, then asks for a local date/time and message.
- `AI Prompt Schedule: Show Scheduled AI Messages` lists pending messages; select entries to cancel them.
- `AI Prompt Schedule: Cancel Scheduled AI Messages` cancels all pending messages.

Enable or disable agents and choose the default under `AI Prompt Schedule` in Settings. Scheduled messages for disabled agents remain queued until that agent is enabled again. Existing Codex schedules are preserved after upgrading.