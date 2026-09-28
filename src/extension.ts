import { execFile } from 'node:child_process';
import * as vscode from 'vscode';

interface ScheduledMessage {
	id: string;
	fireAt: number;
	text: string;
	provider: ProviderId;
}

export type ProviderId = 'codex' | 'claude' | 'gemini' | 'copilot' | 'cline';

interface Provider {
	id: ProviderId;
	label: string;
	extensionId: string;
	focusCommand: string;
}

const providers: Provider[] = [
	{ id: 'codex', label: 'OpenAI Codex', extensionId: 'openai.chatgpt', focusCommand: 'chatgpt.openSidebar' },
	{ id: 'claude', label: 'Claude Code', extensionId: 'anthropic.claude-code', focusCommand: 'claude-vscode.focus' },
	{ id: 'gemini', label: 'Gemini Code Assist', extensionId: 'google.geminicodeassist', focusCommand: 'cloudcode.duetAI.chatView.focus' },
	{ id: 'copilot', label: 'GitHub Copilot Chat', extensionId: 'github.copilot-chat', focusCommand: 'workbench.action.chat.open' },
	{ id: 'cline', label: 'Cline', extensionId: 'saoudrizwan.claude-dev', focusCommand: 'cline.focusChatInput' }
];

const storageKey = 'scheduledMessages';
const namespace = 'ai-prompt-schedule';
const sendKeysScript = "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v'); Start-Sleep -Milliseconds 350; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')";
const macSendScript = [
	'tell application "Visual Studio Code" to activate',
	'delay 0.6',
	'tell application "System Events"',
	'keystroke "v" using {command down}',
	'delay 0.35',
	'key code 36',
	'end tell'
].join('\n');

function pasteAndSubmit(): Promise<void> {
	return new Promise((resolve, reject) => {
		const command = process.platform === 'darwin' ? 'osascript' : 'powershell.exe';
		const args = process.platform === 'darwin'
			? ['-e', macSendScript]
			: ['-NoProfile', '-NonInteractive', '-STA', '-Command', sendKeysScript];
		execFile(command, args, { windowsHide: process.platform === 'win32', timeout: 10_000 }, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

export function parseLocalDateTime(value: string): Date | undefined {
	const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(value.trim());
	if (!match) {
		return undefined;
	}

	const [, yearText, monthText, dayText, hourText, minuteText] = match;
	const date = new Date(
		Number(yearText),
		Number(monthText) - 1,
		Number(dayText),
		Number(hourText),
		Number(minuteText)
	);
	if (
		date.getFullYear() !== Number(yearText) ||
		date.getMonth() !== Number(monthText) - 1 ||
		date.getDate() !== Number(dayText) ||
		date.getHours() !== Number(hourText) ||
		date.getMinutes() !== Number(minuteText)
	) {
		return undefined;
	}
	return date;
}

function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function toInputDateTime(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseScheduledMessage(value: unknown): ScheduledMessage | undefined {
	if (!value || typeof value !== 'object') {
		return undefined;
	}
	const message = value as Partial<ScheduledMessage>;
	if (typeof message.id !== 'string' || typeof message.fireAt !== 'number' || typeof message.text !== 'string') {
		return undefined;
	}
	const provider = providers.some((item) => item.id === message.provider) ? message.provider as ProviderId : 'codex';
	return { id: message.id, fireAt: message.fireAt, text: message.text, provider };
}

function dashboardHtml(nonce: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>AI Prompt Schedule</title>
<style nonce="${nonce}">
:root { color-scheme: light dark; }
body { padding: 0 14px 20px; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
header { padding: 14px 0 10px; border-bottom: 1px solid var(--vscode-panel-border); }
h1 { margin: 0; font-size: 16px; font-weight: 600; }
h2 { margin: 0 0 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); }
section { padding: 14px 0; border-bottom: 1px solid var(--vscode-panel-border); }
.field { display: grid; gap: 5px; margin-bottom: 11px; }
label, .field-label { color: var(--vscode-foreground); }
input, select, textarea { box-sizing: border-box; width: 100%; min-width: 0; padding: 6px 8px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); border-radius: 2px; font: inherit; }
textarea { min-height: 82px; resize: vertical; }
input:focus, select:focus, textarea:focus, button:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 1px; }
button { min-height: 28px; padding: 4px 10px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; border-radius: 2px; font: inherit; cursor: pointer; }
button:hover { background: var(--vscode-button-hoverBackground); }
button:disabled { opacity: .55; cursor: default; }
.secondary { color: var(--vscode-foreground); background: var(--vscode-button-secondaryBackground); }
.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
.toggle { display: flex; align-items: flex-start; gap: 8px; margin: 10px 0; line-height: 1.4; }
.toggle input { width: auto; margin: 2px 0 0; accent-color: var(--vscode-focusBorder); }
.muted { color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.4; }
#notice { min-height: 1em; margin-top: 8px; color: var(--vscode-testing-iconPassed); }
.schedule { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--vscode-panel-border); }
.schedule-main { min-width: 0; }
.schedule-title { font-weight: 600; }
.schedule-time { color: var(--vscode-textLink-foreground); margin-top: 3px; }
.schedule-text { margin-top: 5px; color: var(--vscode-descriptionForeground); white-space: pre-wrap; overflow-wrap: anywhere; }
.cancel { align-self: start; color: var(--vscode-foreground); background: transparent; border: 1px solid var(--vscode-panel-border); }
.agent-row { display: flex; align-items: center; gap: 8px; margin: 9px 0; }
.agent-row input { width: auto; accent-color: var(--vscode-focusBorder); }
.agent-label { flex: 1; }
.badge { color: var(--vscode-descriptionForeground); font-size: 10px; }
</style>
</head>
<body>
<header><h1>AI Prompt Schedule</h1><div class="muted">Timed prompts for your coding chats</div></header>
<section>
<h2>New message</h2>
<form id="schedule-form">
<div class="field"><label for="agent">Agent</label><select id="agent" name="agent"></select></div>
<div class="field"><label for="when">Send at</label><input id="when" name="when" type="datetime-local" required></div>
<div class="field"><label for="prompt">Prompt</label><textarea id="prompt" name="prompt" placeholder="Write the prompt to send…" required></textarea></div>
<button id="schedule-button" type="submit">Schedule message</button>
</form>
<div id="notice" role="status" aria-live="polite"></div>
</section>
<section>
<h2>Agents</h2>
<div class="field"><label for="default-agent">Default agent</label><select id="default-agent"></select></div>
<div id="agents"></div>
<label class="toggle"><input id="automatic-send" type="checkbox"><span>Automatically paste and send when due<br><span class="muted">Requires an unlocked, active desktop on Windows or Accessibility permission on macOS.</span></span></label>
</section>
<section>
<h2>Scheduled <span id="count"></span></h2>
<div id="schedule-list"></div>
</section>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const agentSelect = document.getElementById('agent');
const defaultSelect = document.getElementById('default-agent');
const agentsRoot = document.getElementById('agents');
const scheduleList = document.getElementById('schedule-list');
const notice = document.getElementById('notice');
let currentState;

function send(message) { vscode.postMessage(message); }
function fillSelect(select, agents, selected) {
	const previous = select.value;
	select.replaceChildren();
	for (const agent of agents) {
		const option = document.createElement('option');
		option.value = agent.id;
		option.textContent = agent.label;
		select.append(option);
	}
	if (agents.some((agent) => agent.id === selected)) select.value = selected;
	else if (agents.some((agent) => agent.id === previous)) select.value = previous;
}
function localDateTimeValue(date) {
	const pad = (number) => String(number).padStart(2, '0');
	return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}
function render(state) {
	currentState = state;
	const enabled = state.providers.filter((agent) => agent.enabled);
	fillSelect(agentSelect, enabled, state.defaultProvider);
	fillSelect(defaultSelect, enabled, state.defaultProvider);
	document.getElementById('schedule-button').disabled = enabled.length === 0;
	document.getElementById('automatic-send').checked = state.automaticSend;

	agentsRoot.replaceChildren();
	for (const agent of state.providers) {
		const row = document.createElement('label');
		row.className = 'agent-row';
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = agent.enabled;
		checkbox.dataset.provider = agent.id;
		const name = document.createElement('span');
		name.className = 'agent-label';
		name.textContent = agent.label;
		row.append(checkbox, name);
		if (!agent.installed) {
			const badge = document.createElement('span');
			badge.className = 'badge';
			badge.textContent = 'not installed';
			row.append(badge);
		}
		agentsRoot.append(row);
	}

	scheduleList.replaceChildren();
	document.getElementById('count').textContent = state.messages.length ? '(' + state.messages.length + ')' : '';
	if (state.messages.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'muted';
		empty.textContent = 'No scheduled messages.';
		scheduleList.append(empty);
	}
	for (const message of state.messages) {
		const row = document.createElement('div');
		row.className = 'schedule';
		const main = document.createElement('div');
		main.className = 'schedule-main';
		const title = document.createElement('div');
		title.className = 'schedule-title';
		title.textContent = message.providerLabel;
		const time = document.createElement('div');
		time.className = 'schedule-time';
		time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(message.fireAt));
		const text = document.createElement('div');
		text.className = 'schedule-text';
		text.textContent = message.text;
		const cancel = document.createElement('button');
		cancel.className = 'cancel';
		cancel.type = 'button';
		cancel.textContent = 'Cancel';
		cancel.setAttribute('aria-label', 'Cancel scheduled message');
		cancel.addEventListener('click', () => send({ type: 'cancel', id: message.id }));
		main.append(title, time, text);
		row.append(main, cancel);
		scheduleList.append(row);
	}
}

document.getElementById('schedule-form').addEventListener('submit', (event) => {
	event.preventDefault();
	const when = document.getElementById('when');
	const prompt = document.getElementById('prompt');
	if (!when.value || !prompt.value.trim()) return;
	send({ type: 'schedule', provider: agentSelect.value, dateTime: when.value, text: prompt.value.trim() });
});
defaultSelect.addEventListener('change', () => send({ type: 'defaultProvider', provider: defaultSelect.value }));
document.getElementById('automatic-send').addEventListener('change', (event) => send({ type: 'automaticSend', enabled: event.target.checked }));
agentsRoot.addEventListener('change', (event) => {
	const input = event.target;
	if (input instanceof HTMLInputElement && input.dataset.provider) send({ type: 'providerEnabled', provider: input.dataset.provider, enabled: input.checked });
});
window.addEventListener('message', (event) => {
	if (event.data.type === 'state') render(event.data.state);
	if (event.data.type === 'notice') {
		notice.textContent = event.data.text;
		if (event.data.ok) {
			document.getElementById('prompt').value = '';
			document.getElementById('when').value = '';
		}
	}
});
const suggested = new Date(Date.now() + 5 * 60 * 1000);
document.getElementById('when').value = localDateTimeValue(suggested);
send({ type: 'ready' });
</script>
</body>
</html>`;
}

export function activate(context: vscode.ExtensionContext): void {
	const stored = context.globalState.get<unknown>(storageKey, []);
	let messages = Array.isArray(stored)
		? stored.map(parseScheduledMessage).filter((message): message is ScheduledMessage => message !== undefined)
		: [];
	const getConfiguration = () => vscode.workspace.getConfiguration(namespace);
	const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	status.command = `${namespace}.addMessage`;
	let checkingDueMessages = false;
	let dashboardView: vscode.WebviewView | undefined;
	const focusWarnings = new Set<string>();
	const getProvider = (providerId: ProviderId) => providers.find((provider) => provider.id === providerId)!;
	const isProviderEnabled = (providerId: ProviderId) => getConfiguration().get<boolean>(`providers.${providerId}.enabled`, true);
	const getDashboardState = () => ({
		messages: [...messages].sort((left, right) => left.fireAt - right.fireAt).map((message) => ({
			...message,
			providerLabel: getProvider(message.provider).label
		})),
		providers: providers.map((provider) => ({
			id: provider.id,
			label: provider.label,
			enabled: isProviderEnabled(provider.id),
			installed: Boolean(vscode.extensions.getExtension(provider.extensionId))
		})),
		defaultProvider: getConfiguration().get<ProviderId>('defaultProvider', 'codex'),
		automaticSend: getConfiguration().get<boolean>('automaticSend', true)
	});
	const refreshDashboard = () => {
		if (dashboardView) {
			void dashboardView.webview.postMessage({ type: 'state', state: getDashboardState() });
		}
	};

	const updateStatus = () => {
		const next = [...messages].sort((left, right) => left.fireAt - right.fireAt)[0];
		if (!next) {
			status.text = '$(clock) AI: schedule';
			status.tooltip = 'Schedule a message for an AI chat';
		} else {
			const remaining = messages.length > 1 ? ` (+${messages.length - 1})` : '';
			status.text = `$(clock) ${getProvider(next.provider).label}: ${new Date(next.fireAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${remaining}`;
			status.tooltip = new vscode.MarkdownString(
				`**Next ${getProvider(next.provider).label} message**\n\n${formatDateTime(new Date(next.fireAt))}\n\n${next.text}\n\n${messages.length} scheduled message${messages.length === 1 ? '' : 's'}.`
			);
		}
		status.show();
	};

	const persist = async () => {
		await context.globalState.update(storageKey, messages);
		updateStatus();
		refreshDashboard();
	};

	const focusProviderChat = async (providerId: ProviderId): Promise<boolean> => {
		if (!getConfiguration().get<boolean>('focusChatOnReminder', true)) {
			return false;
		}
		const provider = getProvider(providerId);
		const focusCommand = getConfiguration().get<string>(`providers.${providerId}.focusCommand`, provider.focusCommand);
		try {
			const commands = await vscode.commands.getCommands(true);
			if (!vscode.extensions.getExtension(provider.extensionId) || !commands.includes(focusCommand)) {
				return false;
			}
			await vscode.commands.executeCommand(focusCommand);
			return true;
		} catch (error) {
			console.error(`Could not focus ${provider.label} chat`, error);
			return false;
		}
	};

	const checkDueMessages = async () => {
		if (checkingDueMessages) {
			return;
		}
		const due = messages
			.filter((message) => message.fireAt <= Date.now() && isProviderEnabled(message.provider))
			.sort((left, right) => left.fireAt - right.fireAt);
		if (due.length === 0) {
			return;
		}

		checkingDueMessages = true;
		try {
			const supportsAutomaticSend = process.platform === 'win32' || process.platform === 'darwin';
			const automaticSend = getConfiguration().get<boolean>('automaticSend', true) && supportsAutomaticSend;
			if (!automaticSend) {
				const dueIds = new Set(due.map((message) => message.id));
				messages = messages.filter((message) => !dueIds.has(message.id));
				await persist();

				for (const message of due) {
					await vscode.env.clipboard.writeText(message.text);
					const focused = await focusProviderChat(message.provider);
					const provider = getProvider(message.provider);
					const fallback = supportsAutomaticSend ? '' : ' Automatic sending is only available on Windows and macOS.';
					const action = await vscode.window.showInformationMessage(
						`${provider.label} message is copied. ${focused ? 'Paste it into the current chat and send manually.' : 'Open the chat, then paste and send manually.'}${fallback}\n\n${message.text}`,
						'Copy Again'
					);
					if (action === 'Copy Again') {
						await vscode.env.clipboard.writeText(message.text);
					}
				}
				return;
			}

			for (const message of due) {
				if (process.platform === 'win32' && !vscode.window.state.focused) {
					continue;
				}
				const focused = await focusProviderChat(message.provider);
				await new Promise((resolve) => setTimeout(resolve, 350));
				if (!focused || (process.platform === 'win32' && !vscode.window.state.focused)) {
					if ((process.platform === 'darwin' || vscode.window.state.focused) && !focusWarnings.has(message.provider)) {
						focusWarnings.add(message.provider);
						void vscode.window.showWarningMessage(`Could not focus ${getProvider(message.provider).label} input; the scheduled message remains queued.`);
					}
					continue;
				}

				await vscode.env.clipboard.writeText(message.text);
				try {
					await pasteAndSubmit();
					messages = messages.filter((item) => item.id !== message.id);
					await persist();
					void vscode.window.showInformationMessage(`Automatically sent scheduled message to ${getProvider(message.provider).label}.`);
				} catch (error) {
					messages = messages.filter((item) => item.id !== message.id);
					await persist();
					void vscode.window.showErrorMessage(`Could not automatically send to ${getProvider(message.provider).label}. The prompt remains on the clipboard.`);
					console.error('Scheduled prompt keyboard submission failed', error);
				}
			}
		} finally {
			checkingDueMessages = false;
		}
	};

	const dashboardProvider: vscode.WebviewViewProvider = {
		resolveWebviewView: (view) => {
			dashboardView = view;
			view.webview.options = { enableScripts: true };
			const nonce = [...Array(32)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
			view.webview.html = dashboardHtml(nonce);
			view.onDidDispose(() => {
				if (dashboardView === view) {
					dashboardView = undefined;
				}
			}, null, context.subscriptions);
			view.webview.onDidReceiveMessage(async (data: { type?: string; id?: string; provider?: string; dateTime?: string; text?: string; enabled?: boolean }) => {
				try {
					switch (data.type) {
						case 'ready':
							refreshDashboard();
							break;
						case 'schedule': {
							const provider = providers.find((candidate) => candidate.id === data.provider);
							const fireAt = data.dateTime ? parseLocalDateTime(data.dateTime) : undefined;
							const text = data.text?.trim();
							if (!provider || !isProviderEnabled(provider.id) || !fireAt || fireAt.getTime() <= Date.now() || !text) {
								throw new Error('Choose an enabled agent, a future time, and a prompt.');
							}
							messages.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, fireAt: fireAt.getTime(), text, provider: provider.id });
							await persist();
							void vscode.window.showInformationMessage(`${provider.label} message scheduled for ${formatDateTime(fireAt)}.`);
							dashboardView?.webview.postMessage({ type: 'notice', ok: true, text: `Scheduled for ${formatDateTime(fireAt)}.` });
							break;
						}
						case 'cancel':
							messages = messages.filter((message) => message.id !== data.id);
							await persist();
							break;
						case 'providerEnabled':
							if (providers.some((provider) => provider.id === data.provider) && typeof data.enabled === 'boolean') {
								const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
								await getConfiguration().update(`providers.${data.provider}.enabled`, data.enabled, target);
								refreshDashboard();
							}
							break;
						case 'defaultProvider':
							if (providers.some((provider) => provider.id === data.provider) && isProviderEnabled(data.provider as ProviderId)) {
								const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
								await getConfiguration().update('defaultProvider', data.provider, target);
								refreshDashboard();
							}
							break;
						case 'automaticSend':
							if (typeof data.enabled === 'boolean') {
								const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
								await getConfiguration().update('automaticSend', data.enabled, target);
								refreshDashboard();
							}
							break;
					}
				} catch (error) {
					const text = error instanceof Error ? error.message : String(error);
					dashboardView?.webview.postMessage({ type: 'notice', ok: false, text });
				}
			});
		}
	};
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('ai-prompt-schedule.dashboard', dashboardProvider));
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration(namespace)) {
			refreshDashboard();
		}
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand(`${namespace}.addMessage`, async () => {
			const enabledProviders = providers.filter((provider) => isProviderEnabled(provider.id));
			if (enabledProviders.length === 0) {
				void vscode.window.showWarningMessage('Enable at least one agent in AI Prompt Schedule settings.');
				return;
			}
			const defaultProvider = getConfiguration().get<ProviderId>('defaultProvider', 'codex');
			const orderedProviders = [
				...enabledProviders.filter((provider) => provider.id === defaultProvider),
				...enabledProviders.filter((provider) => provider.id !== defaultProvider)
			];
			const providerChoice = await vscode.window.showQuickPick(
				orderedProviders.map((provider) => ({
					label: provider.label,
					description: vscode.extensions.getExtension(provider.extensionId) ? undefined : 'Extension not installed',
					id: provider.id
				})),
				{ placeHolder: 'Choose the agent chat for this message', ignoreFocusOut: true }
			);
			if (!providerChoice) {
				return;
			}

			const suggestedTime = new Date(Date.now() + 60_000);
			suggestedTime.setSeconds(0, 0);
			const timeText = await vscode.window.showInputBox({
				prompt: 'Enter the local date and time (YYYY-MM-DD HH:mm)',
				placeHolder: '2026-09-28 14:30',
				value: toInputDateTime(suggestedTime),
				ignoreFocusOut: true,
				validateInput: (value) => {
					const date = parseLocalDateTime(value);
					if (!date) {
						return 'Use a valid local date and time in YYYY-MM-DD HH:mm format.';
					}
					return date.getTime() <= Date.now() ? 'Choose a time in the future.' : undefined;
				}
			});
			if (!timeText) {
				return;
			}

			const fireAt = parseLocalDateTime(timeText);
			if (!fireAt || fireAt.getTime() <= Date.now()) {
				return;
			}
			const text = await vscode.window.showInputBox({
				prompt: `Message to prepare in ${getProvider(providerChoice.id).label} at ${formatDateTime(fireAt)}`,
				placeHolder: 'Enter the message to send',
				ignoreFocusOut: true
			});
			if (!text?.trim()) {
				return;
			}

			messages.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, fireAt: fireAt.getTime(), text: text.trim(), provider: providerChoice.id });
			await persist();
			void vscode.window.showInformationMessage(`${getProvider(providerChoice.id).label} message scheduled for ${formatDateTime(fireAt)}.`);
		}),
		vscode.commands.registerCommand(`${namespace}.listMessages`, async () => {
			const sorted = [...messages].sort((left, right) => left.fireAt - right.fireAt);
			if (sorted.length === 0) {
				void vscode.window.showInformationMessage('No Codex messages are scheduled.');
				return;
			}
			const selected = await vscode.window.showQuickPick(
				sorted.map((message) => ({ label: `${getProvider(message.provider).label} · ${formatDateTime(new Date(message.fireAt))}`, description: message.text, id: message.id })),
				{ placeHolder: 'Select scheduled messages to cancel', canPickMany: true }
			);
			if (!selected || selected.length === 0) {
				return;
			}
			const ids = new Set(selected.map((item) => item.id));
			messages = messages.filter((message) => !ids.has(message.id));
			await persist();
		}),
		vscode.commands.registerCommand(`${namespace}.cancelMessages`, async () => {
			if (messages.length === 0) {
				void vscode.window.showInformationMessage('No Codex messages are scheduled.');
				return;
			}
			const confirmation = await vscode.window.showWarningMessage(
				`Cancel all ${messages.length} scheduled Codex message${messages.length === 1 ? '' : 's'}?`,
				{ modal: true },
				'Cancel All'
			);
			if (confirmation === 'Cancel All') {
				messages = [];
				await persist();
			}
		})
	);

	updateStatus();
	const timer = setInterval(() => void checkDueMessages(), 15_000);
	context.subscriptions.push(status, { dispose: () => clearInterval(timer) });
	void checkDueMessages();
}

export function deactivate(): void {}
