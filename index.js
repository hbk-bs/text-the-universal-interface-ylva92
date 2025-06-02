//@ts-check
// [x]. get the content from the input element
// [x]. send the content to the val town endpoint using fetch POST request
// [x]. await the response
// [x]. get the json from the response
// [x]. Add the user message to the .chat-history

// How to control the behaviour of the chat bot?

// Bonus:
// What happens if the context gets to long?
// What happens if the chat-history window get s to full (scolling)

let messageHistory = {
	// messages: [{role: user | assistant | system; content: string}]
	response_format: { type: 'json_object' },
	messages: [
		{
			role: 'system',
			content: `
			Du bist ein kreativer Zungenbrecher-Generator mit perfekter deutscher Rechtschreibung. 
            Nimm die Wörter aus der Nutzereingabe und kreiere daraus einen neuen Zungenbrecher.
            
            Antworte in folgendem JSON Format:
            {
                "zungenbrecher": "Dein generierter Zungenbrecher hier"
            }
            
            Wichtige Regeln:
            - Achte auf korrekte deutsche Rechtschreibung und Grammatik
            - Setze Satzzeichen und Großschreibung regelkonform ein
            - Greife mindestens ein Wort oder Thema aus der Nutzereingabe auf
            - Baue dieses in einen neuen Zungenbrecher mit passenden Alliterationen ein
            - Der Zungenbrecher muss das Thema/Wort der Nutzereingabe enthalten
            - Antworte NUR mit dem JSON-Objekt
            - Keine Erklärungen oder sonstigen Texte
            - Beispiel bei Eingabe "Katze": {"zungenbrecher": "Kluge Katzen kichern kraftvoll, wenn kecke Kater kommen."}`,
		},
	],
};

// TODO: use your own val.town endpoint
// remix: https://val.town/remix/ff6347-openai-api
const apiEndpoint = 'https://ylva-openai-api.val.run/';
if (!apiEndpoint.includes('run')) {
	throw new Error('Please use your own val.town endpoint!!!');
}

const MAX_HISTORY_LENGTH = 15;

document.addEventListener('DOMContentLoaded', () => {
	const chatHistoryElement = document.querySelector('.chat-history');
	const formElement = document.querySelector('form');

	if (!chatHistoryElement) {
		throw new Error('Could not find element .chat-history');
	}
	if (!formElement) {
		throw new Error('Form element does not exists');
	}

	// Create letter buttons programmatically
	const letterButtonsContainer = document.querySelector('.letter-buttons');
	if (!letterButtonsContainer) {
		throw new Error('Could not find letter-buttons container');
	}

	// Create buttons for A-Z
	for (let i = 65; i <= 90; i++) {
		const letter = String.fromCharCode(i);
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'letter-btn';
		button.textContent = letter;

		button.addEventListener('click', async () => {
			// Add letter directly to message history
			messageHistory.messages.push({ role: 'user', content: letter });
			messageHistory = truncateHistory(messageHistory);
			chatHistoryElement.innerHTML = addToChatHistoryElement(messageHistory);
			scrollToBottom(chatHistoryElement);

			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify(messageHistory),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText);
			}

			const json = await response.json();
			// @ts-ignore
			messageHistory.messages.push(json.completion.choices[0].message);
			messageHistory = truncateHistory(messageHistory);

			chatHistoryElement.innerHTML = addToChatHistoryElement(messageHistory);
			scrollToBottom(chatHistoryElement);
		});

		letterButtonsContainer.appendChild(button);
	}
});

// Update the addToChatHistoryElement function to handle JSON responses
function addToChatHistoryElement(mhistory) {
	const htmlStrings = mhistory.messages.map((message) => {
		if (message.role === 'system') return '';

		if (message.role === 'assistant') {
			try {
				const response = JSON.parse(message.content);
				return `<div class="message ${message.role}">${response.zungenbrecher}</div>`;
			} catch (e) {
				return `<div class="message ${message.role}">${message.content}</div>`;
			}
		}

		return `<div class="message ${message.role}">${message.content}</div>`;
	});
	return htmlStrings.join('');
}

function scrollToBottom(conainer) {
	conainer.scrollTop = conainer.scrollHeight;
}

function truncateHistory(h) {
	if (!h || !h.messages || h.messages.length <= 1) {
		return h; // No truncation needed or possible
	}
	const { messages } = h;
	const [system, ...rest] = messages;
	if (rest.length - 1 > MAX_HISTORY_LENGTH) {
		return { messages: [system, ...rest.slice(-MAX_HISTORY_LENGTH)] };
	} else {
		return h;
	}
}